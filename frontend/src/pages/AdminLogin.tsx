import React, { useState } from "react";
import {
  IonPage,
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonCard,
  IonCardContent,
  IonItem,
  IonLabel,
  IonInput,
  IonButton,
  IonText,
} from "@ionic/react";
import api from "../api";
import { useHistory } from "react-router-dom";

export default function AdminLogin() {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const history = useHistory();

  async function doLogin() {
    setErr("");
    if (!phone || !password) {
      setErr("Phone and password are required");
      return;
    }
    setBusy(true);
    try {
      const res = await api.post("/auth/login", { phone, password });
      const token = res.token || (res && res.token);
      const user = res.user || (res && res.user);
      if (!token || !user) {
        throw new Error("Invalid login response from server");
      }

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));

      // route according to role
      if (user.role === "super_admin") {
        history.push("/super-admin");
        return;
      }

      if (user.role === "building_admin") {
        const bId = user.buildingId || user.building_id || null;
        if (bId) {
          history.push(`/building-admin?buildingId=${bId}`);
        } else {
          history.push("/building-admin");
        }
        return;
      }

      // Add watchman routing
      if (user.role === "watchman") {
        const bId = user.buildingId || user.building_id || null;
        if (bId) {
          history.push(`/watchman?buildingId=${bId}`);
        } else {
          history.push("/watchman");
        }
        return;
      }

      // default resident / other roles
      history.push("/home");
    } catch (e) {
      setErr((e && e.message) || String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar
          style={{
            "--background": "linear-gradient(135deg, #c9d6ff 0%, #e2e2e2 100%)",
            color: "#1f2937",
          }}
        >
          <IonTitle style={{ textAlign: "center" }}>
            ApartmentCare — Admin
          </IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent
        className="ion-padding"
        style={{
          "--background": `linear-gradient(
      180deg,
      #f5f7ff 0%,
      #f3f4f6 40%,
      #f9fafb 100%
    )`,
        }}
      >
        <div style={{ maxWidth: 480, margin: "24px auto" }}>
          <IonCard
            style={{
              borderRadius: 16,
              background: "#ffffff",
              boxShadow:
                "0 12px 36px rgba(17, 24, 39, 0.08), 0 4px 12px rgba(17, 24, 39, 0.04)",
            }}
          >
            <IonCardContent>
              <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>
                Admin sign in
              </div>
              <div style={{ color: "#6b7280", marginBottom: 16 }}>
                Sign in with your admin credentials
              </div>

              <IonItem style={{ marginBottom: 12 }}>
                <IonLabel position="stacked">Phone</IonLabel>
                <IonInput
                  value={phone}
                  placeholder="+91..."
                  onIonInput={(e) => setPhone(e.detail.value)}
                />
              </IonItem>

              <IonItem style={{ marginBottom: 12 }}>
                <IonLabel position="stacked">Password</IonLabel>
                <IonInput
                  type="password"
                  value={password}
                  placeholder="••••••"
                  onIonInput={(e) => setPassword(e.detail.value)}
                />
              </IonItem>

              {err && (
                <IonText
                  color="danger"
                  style={{ display: "block", marginBottom: 8 }}
                >
                  {err}
                </IonText>
              )}

              <IonButton
                expand="block"
                onClick={doLogin}
                disabled={busy}
                style={{
                  "--background":
                    "linear-gradient(135deg, #c9d6ff 0%, #e2e2e2 100%)",
                  "--border-radius": "10px",
                  color: "#000000",
                }}
              >
                {busy ? "Signing in..." : "Sign in"}
              </IonButton>
            </IonCardContent>
          </IonCard>
        </div>
      </IonContent>
    </IonPage>
  );
}
