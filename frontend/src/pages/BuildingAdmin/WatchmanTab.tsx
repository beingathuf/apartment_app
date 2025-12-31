import React from "react";
import {
  IonCard,
  IonCardContent,
  IonGrid,
  IonRow,
  IonCol,
  IonItem,
  IonLabel,
  IonInput,
  IonButton,
  IonIcon,
} from "@ionic/react";
import { trashOutline, shieldOutline, personOutline } from "ionicons/icons";
import { Watchman } from "./types";

interface WatchmenTabProps {
  watchmen: Watchman[];
  watchmanPhone: string;
  watchmanPassword: string;
  watchmanName: string;
  busy: boolean;
  onWatchmanPhoneChange: (value: string) => void;
  onWatchmanPasswordChange: (value: string) => void;
  onWatchmanNameChange: (value: string) => void;
  onCreateWatchman: () => void;
  onDeleteWatchman: (watchmanId: number) => void;
}

const WatchmenTab: React.FC<WatchmenTabProps> = ({
  watchmen,
  watchmanPhone,
  watchmanPassword,
  watchmanName,
  busy,
  onWatchmanPhoneChange,
  onWatchmanPasswordChange,
  onWatchmanNameChange,
  onCreateWatchman,
  onDeleteWatchman,
}) => {
  return (
    <div>
      <IonCard style={{ borderRadius: "16px", marginBottom: "20px" }}>
        <IonCardContent>
          <h2
            style={{
              fontSize: "18px",
              fontWeight: "700",
              marginBottom: "16px",
              color: "#1e293b",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <IonIcon icon={shieldOutline} />
            Create New Watchman
          </h2>
          <IonGrid style={{ padding: 0 }}>
            <IonRow>
              <IonCol size="12" sizeMd="6">
                <IonItem
                  style={{
                    "--background": "transparent",
                    "--border-color": "#e2e8f0",
                  }}
                >
                  <IonLabel position="floating">Watchman Name *</IonLabel>
                  <IonInput
                    value={watchmanName}
                    onIonChange={(e) => onWatchmanNameChange(e.detail.value!)}
                    placeholder="John Watchman"
                    clearInput
                  />
                </IonItem>
              </IonCol>
              <IonCol size="12" sizeMd="6">
                <IonItem
                  style={{
                    "--background": "transparent",
                    "--border-color": "#e2e8f0",
                  }}
                >
                  <IonLabel position="floating">Phone Number *</IonLabel>
                  <IonInput
                    value={watchmanPhone}
                    onIonChange={(e) => onWatchmanPhoneChange(e.detail.value!)}
                    placeholder="+91 98765 43210"
                    type="tel"
                    clearInput
                  />
                </IonItem>
              </IonCol>
            </IonRow>
            <IonRow>
              <IonCol size="12" sizeMd="6">
                <IonItem
                  style={{
                    "--background": "transparent",
                    "--border-color": "#e2e8f0",
                  }}
                >
                  <IonLabel position="floating">Password *</IonLabel>
                  <IonInput
                    value={watchmanPassword}
                    onIonChange={(e) => onWatchmanPasswordChange(e.detail.value!)}
                    type="password"
                    placeholder="••••••••"
                    clearInput
                  />
                </IonItem>
              </IonCol>
              <IonCol size="12" sizeMd="6">
                <div
                  style={{
                    padding: "16px",
                    background: "#f8fafc",
                    borderRadius: "8px",
                    border: "1px dashed #cbd5e1",
                  }}
                >
                  <div style={{ fontSize: "14px", fontWeight: "600", color: "#334155" }}>
                    Login Instructions:
                  </div>
                  <div style={{ fontSize: "13px", color: "#64748b", marginTop: "4px" }}>
                    Watchman will login using the same Admin Login page with:
                  </div>
                  <ul style={{ fontSize: "12px", color: "#475569", margin: "4px 0 0 16px" }}>
                    <li>Phone number and password created here</li>
                    <li>Will be redirected to Watchman Portal</li>
                  </ul>
                </div>
              </IonCol>
            </IonRow>
            <IonRow>
              <IonCol>
                <IonButton
                  expand="block"
                  onClick={onCreateWatchman}
                  disabled={
                    busy ||
                    !watchmanPhone.trim() ||
                    !watchmanPassword.trim() ||
                    !watchmanName.trim()
                  }
                  style={{
                    "--background": "linear-gradient(135deg, #9eaadcff 0%, #8a73a0ff 100%)",
                    "--border-radius": "10px",
                    marginTop: "16px",
                    height: "44px",
                  }}
                >
                  {busy ? "Creating..." : "Create Watchman"}
                </IonButton>
              </IonCol>
            </IonRow>
          </IonGrid>
        </IonCardContent>
      </IonCard>

      <IonCard style={{ borderRadius: "16px" }}>
        <IonCardContent>
          <h2
            style={{
              fontSize: "18px",
              fontWeight: "700",
              marginBottom: "16px",
              color: "#1e293b",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <IonIcon icon={shieldOutline} />
            All Watchmen ({watchmen.length})
          </h2>

          {watchmen.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "40px 20px",
                color: "#94a3b8",
              }}
            >
              <IonIcon
                icon={shieldOutline}
                style={{ fontSize: "48px", marginBottom: "16px", color: "#cbd5e1" }}
              />
              <div style={{ fontWeight: "600" }}>No watchmen yet</div>
              <div style={{ fontSize: "14px", marginTop: "4px" }}>
                Create your first watchman above
              </div>
            </div>
          ) : (
            <IonGrid style={{ padding: 0 }}>
              <IonRow
                style={{
                  borderBottom: "1px solid #e2e8f0",
                  padding: "12px 0",
                  fontWeight: "600",
                  color: "#64748b",
                }}
              >
                <IonCol size="3">Name</IonCol>
                <IonCol size="3">Phone</IonCol>
                <IonCol size="3">Created On</IonCol>
                <IonCol size="3" style={{ textAlign: "right" }}>
                  Actions
                </IonCol>
              </IonRow>
              {watchmen.map((watchman) => (
                <IonRow
                  key={watchman.id}
                  style={{
                    borderBottom: "1px solid #f1f5f9",
                    padding: "16px 0",
                    alignItems: "center",
                  }}
                >
                  <IonCol size="3">
                    <div style={{ fontWeight: "600", color: "#334155", display: "flex", alignItems: "center", gap: "8px" }}>
                      <IonIcon icon={personOutline} style={{ fontSize: "16px" }} />
                      {watchman.name}
                    </div>
                  </IonCol>
                  <IonCol size="3">
                    <div style={{ color: "#64748b" }}>{watchman.phone}</div>
                  </IonCol>
                  <IonCol size="3">
                    <div style={{ color: "#64748b", fontSize: "14px" }}>
                      {new Date(watchman.created_at).toLocaleDateString()}
                    </div>
                  </IonCol>
                  <IonCol size="3" style={{ textAlign: "right" }}>
                    <IonButton
                      fill="clear"
                      color="danger"
                      onClick={() => onDeleteWatchman(watchman.id)}
                      style={{
                        "--padding-start": "8px",
                        "--padding-end": "8px",
                      }}
                    >
                      <IonIcon icon={trashOutline} slot="icon-only" />
                    </IonButton>
                  </IonCol>
                </IonRow>
              ))}
            </IonGrid>
          )}
        </IonCardContent>
      </IonCard>
    </div>
  );
};

export default WatchmenTab;