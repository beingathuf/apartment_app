// src/pages/Login.jsx
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonItem,
  IonLabel,
  IonInput,
  IonButton,
  IonCard,
  IonCardContent,
  IonText,
  IonLoading,
  IonIcon,
} from "@ionic/react";
import { useState } from "react";
import { useHistory } from "react-router-dom";
import { business, key, logIn, call } from "ionicons/icons";
import api from "../api";

const Login: React.FC = () => {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showLoading, setShowLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const history = useHistory();

  const handleLogin = async () => {
    setErr(null);

    // basic validation
    if (!phone || !password) {
      setErr("Phone and password are required.");
      return;
    }

    setShowLoading(true);

    try {
      // call backend login
      const res = await api.post("/auth/login", {
        phone: phone.trim(),
        password,
      });

      // expected res: { user, token }
      if (!res || !res.user || !res.token) {
        throw new Error("Invalid response from server");
      }

      const user = res.user;

      // only allow resident users (created by admin)
      // adjust this check if you want to allow other roles here
      if (user.role !== "resident") {
        setErr(
          "Only residents may sign in here. Please use the admin login for admin accounts."
        );
        setShowLoading(false);
        return;
      }

      // persist token & user for protected pages
      localStorage.setItem("token", res.token);
      // normalize keys to camelCase if server returned snake_case
      const normalizedUser = {
        id: user.id,
        phone: user.phone,
        name: user.name,
        role: user.role,
        buildingId: user.buildingId ?? user.building_id ?? null,
        apartmentId: user.apartmentId ?? user.apartment_id ?? null,
      };
      localStorage.setItem("user", JSON.stringify(normalizedUser));

      // redirect to resident home
      history.push("/home");
    } catch (e: any) {
      // show friendly error
      if (e && e.message) setErr(e.message);
      else setErr("Login failed. Please try again.");
    } finally {
      setShowLoading(false);
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar
          style={{
            "--background": "linear-gradient(135deg, #c9d6ff 0%, #e2e2e2 100%)",
            "--color": "#000000",
          }}
        >
          <IonTitle>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <IonIcon
                icon={business}
                style={{ marginRight: "8px", fontSize: "20px" }}
              />
              ApartmentCare
            </div>
          </IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent
        fullscreen
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
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            minHeight: "100%",
            maxWidth: "400px",
            margin: "0 auto",
            padding: "1rem 0",
          }}
        >
          {/* Header */}
          <div
            style={{
              textAlign: "center",
              marginBottom: "1.5rem",
              flexShrink: 0,
            }}
          >
            <div
              style={{
                background: "linear-gradient(135deg, #c9d6ff 0%, #e2e2e2 100%)",

                width: "60px",
                height: "60px",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 0.5rem",
                boxShadow: "0 4px 15px rgba(102, 126, 234, 0.3)",
              }}
            >
              <IonIcon
                icon={business}
                style={{ fontSize: "28px", color: "#1f2937" }}
              />
            </div>

            <IonText color="primary">
              <h1
                style={{
                  margin: "0",
                  fontSize: "1.5rem",
                  fontWeight: "bold",
                  background:
                    "linear-gradient(135deg, #94a3ff 0%, #cbd5e1 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                Welcome Back
              </h1>
            </IonText>

            <IonText color="medium">
              <p style={{ margin: "0.25rem 0 0 0", fontSize: "0.9rem" }}>
                Sign in with the phone & password created by your building admin
              </p>
            </IonText>
          </div>

          {/* Login Card */}
          <IonCard
            style={{
              borderRadius: "12px",
              boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
              background: "rgba(255, 255, 255, 0.95)",
              backdropFilter: "blur(10px)",
              marginBottom: "1rem",
            }}
          >
            <IonCardContent style={{ padding: "1.5rem" }}>
              <IonItem
                style={{
                  "--background": "transparent",
                  "--border-color": "rgba(102, 126, 234, 0.2)",
                  "--border-radius": "8px",
                  "--padding-start": "0",
                  "--min-height": "50px",
                  marginBottom: "1rem",
                }}
              >
                <IonIcon
                  icon={call}
                  slot="start"
                  style={{
                    color: "#667eea",
                    marginRight: "10px",
                    fontSize: "18px",
                  }}
                />
                <IonLabel
                  position="stacked"
                  style={{
                    fontWeight: "600",
                    color: "#667eea",
                    marginBottom: "4px",
                    fontSize: "14px",
                  }}
                >
                  Phone Number
                </IonLabel>
                <IonInput
                  type="tel"
                  value={phone}
                  onIonInput={(e) => setPhone(e.detail.value!)}
                  placeholder="Enter your phone number"
                  style={{ "--padding-start": "0", fontSize: "14px" }}
                />
              </IonItem>

              <IonItem
                style={{
                  "--background": "transparent",
                  "--border-color": "rgba(102, 126, 234, 0.2)",
                  "--border-radius": "8px",
                  "--padding-start": "0",
                  "--min-height": "50px",
                  marginBottom: "1.5rem",
                }}
              >
                <IonIcon
                  icon={key}
                  slot="start"
                  style={{
                    color: "#667eea",
                    marginRight: "10px",
                    fontSize: "18px",
                  }}
                />
                <IonLabel
                  position="stacked"
                  style={{
                    fontWeight: "600",
                    color: "#667eea",
                    marginBottom: "4px",
                    fontSize: "14px",
                  }}
                >
                  Password
                </IonLabel>
                <IonInput
                  type="password"
                  value={password}
                  onIonInput={(e) => setPassword(e.detail.value!)}
                  placeholder="Enter your password"
                  style={{ "--padding-start": "0", fontSize: "14px" }}
                />
              </IonItem>

              {err && (
                <div style={{ marginBottom: 12 }}>
                  <IonText color="danger" style={{ display: "block" }}>
                    {err}
                  </IonText>
                </div>
              )}

              <IonButton
                expand="block"
                onClick={handleLogin}
                disabled={showLoading}
                style={{
                  "--background":
                    "linear-gradient(135deg, #b6c6ff 0%, #d1d5db 100%)",
                  "--border-radius": "10px",
                  "--box-shadow": "0 6px 18px rgba(80, 100, 180, 0.3)",
                  color: "#000000",
                  height: "44px",
                  fontWeight: "600",
                  fontSize: "14px",
                  marginBottom: "1rem",
                }}
              >
                <IonIcon
                  icon={logIn}
                  slot="start"
                  style={{ fontSize: "16px" }}
                />
                Sign In
              </IonButton>

              <IonText className="ion-text-center" style={{ display: "block" }}>
                <p style={{ margin: 0, color: "#666", fontSize: "14px" }}>
                  Accounts are created by your building admin. If you don't have
                  one, contact your building administrator.
                </p>
              </IonText>
            </IonCardContent>
          </IonCard>

          {/* Footer */}
          <div style={{ textAlign: "center", flexShrink: 0 }}>
            <IonText color="medium">
              <p
                style={{
                  margin: 0,
                  fontSize: "0.75rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <IonIcon
                  icon={business}
                  style={{ marginRight: "4px", fontSize: "12px" }}
                />
                Your Apartment Maintenance Partner
              </p>
            </IonText>
          </div>
        </div>

        <IonLoading
          isOpen={showLoading}
          message={"Signing in..."}
          spinner="crescent"
        />
      </IonContent>
    </IonPage>
  );
};

export default Login;
