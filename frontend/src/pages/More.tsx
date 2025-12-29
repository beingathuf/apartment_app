import React, { useState } from "react";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  IonIcon,
  IonToast,
} from "@ionic/react";
import {
  callOutline,
  settingsOutline,
  logOutOutline,
  shieldCheckmarkOutline,
} from "ionicons/icons";
import { useHistory } from "react-router-dom";

/**
 * More Page — Premium Minimalist Version
 * ✔ Entire row is a clickable button
 * ✔ Uses history.push (as requested)
 * ✔ Call Watchman & Housing Supervisor
 * ✔ Signout → /login
 */

export default function MorePage() {
  const history = useHistory();
  const [toast, setToast] = useState({ show: false, msg: "" });

  // Update numbers for your society
  const WATCHMAN_NUMBER = "+911234567890";
  const SUPERVISOR_NUMBER = "+919876543210";

  function callNumber(num, label) {
    try {
      window.location.href = `tel:${num}`;
      setToast({ show: true, msg: `Calling ${label}...` });
    } catch {
      setToast({ show: true, msg: "Calling not supported on this device" });
    }
  }

  function signOut() {
    localStorage.clear();
    history.push("/login");
  }

  const headerStyle = {
    "--background": "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    "--color": "white",
  };

  const itemStyle = {
    borderRadius: "14px",
    marginBottom: "14px",
    padding: "14px",
    background: "rgba(255,255,255,0.92)",
    backdropFilter: "blur(10px)",
    border: "1px solid rgba(255,255,255,0.5)",
    boxShadow: "0 10px 24px rgba(2,6,23,0.06)",
  };

  const itemLabel = { fontWeight: 800, fontSize: "15px", color: "#1f2937" };
  const itemSub = { fontSize: "12px", color: "#6b7280", marginTop: "4px" };

  return (
    <IonPage>
      <IonContent fullscreen>
        {/* Header Section */}
        <div
          style={{
            padding: 16,
            fontWeight: 900,
            fontSize: 24,
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          Settings & More
        </div>

        <div style={{ padding: "16px", paddingBottom: "120px" }}>
          <IonList lines="none">
            {/* Settings */}
            <IonItem
              button
              onClick={() => history.push("/settings")}
              style={itemStyle}
            >
              <IonIcon
                icon={settingsOutline}
                style={{ fontSize: 20, marginRight: 14, color: "#4f46e5" }}
              />
              <IonLabel>
                <div style={itemLabel}>Settings</div>
                <div style={itemSub}>App & Notifications</div>
              </IonLabel>
            </IonItem>

            {/* Call Watchman */}
            <IonItem
              button
              onClick={() => callNumber(WATCHMAN_NUMBER, "Watchman")}
              style={itemStyle}
            >
              <IonIcon
                icon={callOutline}
                style={{ fontSize: 20, marginRight: 14, color: "#10b981" }}
              />
              <IonLabel>
                <div style={itemLabel}>Call Watchman</div>
                <div style={itemSub}>{WATCHMAN_NUMBER}</div>
              </IonLabel>
            </IonItem>

            {/* Call Housing Supervisor */}
            <IonItem
              button
              onClick={() => callNumber(SUPERVISOR_NUMBER, "Supervisor")}
              style={itemStyle}
            >
              <IonIcon
                icon={callOutline}
                style={{ fontSize: 20, marginRight: 14, color: "#f97316" }}
              />
              <IonLabel>
                <div style={itemLabel}>Call Housing Supervisor</div>
                <div style={itemSub}>{SUPERVISOR_NUMBER}</div>
              </IonLabel>
            </IonItem>

            {/* Sign Out */}
            <IonItem
              button
              onClick={signOut}
              style={{ ...itemStyle, background: "#fee2e2" }}
            >
              <IonIcon
                icon={logOutOutline}
                style={{ fontSize: 20, marginRight: 14, color: "#dc2626" }}
              />
              <IonLabel>
                <div style={{ ...itemLabel, color: "#dc2626" }}>Sign Out</div>
                <div style={{ ...itemSub, color: "#b91c1c" }}>
                  Return to login
                </div>
              </IonLabel>
            </IonItem>
          </IonList>

          <IonToast
            isOpen={toast.show}
            message={toast.msg}
            duration={1400}
            onDidDismiss={() => setToast({ show: false, msg: "" })}
          />
        </div>
      </IonContent>
    </IonPage>
  );
}
