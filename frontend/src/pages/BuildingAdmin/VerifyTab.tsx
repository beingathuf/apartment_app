// src/pages/BuildingAdmin/VerifyTab.tsx
import React from "react";
import {
  IonCard,
  IonCardContent,
  IonItem,
  IonLabel,
  IonInput,
  IonButton,
  IonIcon,
  IonBadge,
  IonGrid,
  IonRow,
  IonCol,
} from "@ionic/react";
import {
  qrCodeOutline,
  searchOutline,
  cameraOutline,
  checkmarkCircleOutline,
  closeCircleOutline,
  timeOutline,
} from "ionicons/icons";
import { VerificationResult } from "./types";
import { formatTimeRemaining } from "./utils";

interface VerifyTabProps {
  verificationCode: string;
  verificationResult: VerificationResult | null;
  busy: boolean;
  onVerificationCodeChange: (value: string) => void;
  onVerifyPass: () => void;
  onStartScanner: () => void;
}

const VerifyTab: React.FC<VerifyTabProps> = ({
  verificationCode,
  verificationResult,
  busy,
  onVerificationCodeChange,
  onVerifyPass,
  onStartScanner,
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
            }}
          >
            Verify Visitor Pass
          </h2>
          <div
            style={{
              background: "linear-gradient(135deg, #c9d6ff 0%, #eef2f7 50%, #e2e2e2 100%)",
              borderRadius: "12px",
              padding: "24px",
              marginBottom: "24px",
              color: "black",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                marginBottom: "12px",
              }}
            >
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  background: "rgba(255,255,255,0.2)",
                  borderRadius: "12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <IonIcon icon={qrCodeOutline} style={{ fontSize: "24px" }} />
              </div>
              <div>
                <div style={{ fontSize: "16px", fontWeight: "600" }}>
                  Scan or Enter Pass Code
                </div>
                <div style={{ fontSize: "14px", opacity: 0.9 }}>
                  Verify visitor access in real-time
                </div>
              </div>
            </div>

            <IonItem
              style={{
                "--background": "rgba(255, 255, 255, 0.5)",
                "--border-color": "rgba(255, 255, 255, 0.5)",
                marginTop: "16px",
              }}
            >
              <IonLabel position="floating" style={{ color: "black" }}>
                Enter Pass Code
              </IonLabel>
              <IonInput
                value={verificationCode}
                onIonChange={(e) => onVerificationCodeChange(e.detail.value!)}
                placeholder="e.g., ABC123"
                style={{
                  color: "black",
                  "--placeholder-color": "#000000",
                }}
                clearInput
              />
            </IonItem>

            <div style={{ display: "flex", gap: "12px", marginTop: "20px" }}>
              <IonButton
                expand="block"
                onClick={onVerifyPass}
                disabled={busy || !verificationCode.trim()}
                style={{
                  "--background": "white",
                  "--color": "black",
                  "--border-radius": "10px",
                  height: "44px",
                  fontWeight: "600",
                  flex: 1,
                }}
              >
                <IonIcon icon={searchOutline} slot="start" />
                {busy ? "Verifying..." : "Verify Pass"}
              </IonButton>

              <IonButton
                expand="block"
                onClick={onStartScanner}
                disabled={busy}
                style={{
                  "--background": "rgba(255,255,255,0.2)",
                  "--color": "black",
                  "--border-radius": "10px",
                  height: "44px",
                  fontWeight: "600",
                  flex: 1,
                  border: "1px solid rgba(255,255,255,0.3)",
                }}
              >
                <IonIcon icon={cameraOutline} slot="start" />
                Scan QR
              </IonButton>
            </div>
          </div>
        </IonCardContent>
      </IonCard>

      {verificationResult && (
        <IonCard style={{ borderRadius: "16px" }}>
          <IonCardContent>
            <h2
              style={{
                fontSize: "18px",
                fontWeight: "700",
                marginBottom: "16px",
                color: "#1e293b",
              }}
            >
              Verification Result
            </h2>

            <div
              style={{
                padding: "24px",
                background: verificationResult.valid
                  ? "linear-gradient(135deg, #10b981 0%, #059669 100%)"
                  : "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
                borderRadius: "12px",
                color: "white",
                marginBottom: "20px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "16px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                  }}
                >
                  <div
                    style={{
                      width: "48px",
                      height: "48px",
                      background: "rgba(255,255,255,0.2)",
                      borderRadius: "12px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {verificationResult.valid ? (
                      <IonIcon
                        icon={checkmarkCircleOutline}
                        style={{ fontSize: "24px" }}
                      />
                    ) : (
                      <IonIcon
                        icon={closeCircleOutline}
                        style={{ fontSize: "24px" }}
                      />
                    )}
                  </div>
                  <div>
                    <div style={{ fontSize: "20px", fontWeight: "700" }}>
                      {verificationResult.valid
                        ? "ACCESS GRANTED"
                        : "ACCESS DENIED"}
                    </div>
                    <div style={{ fontSize: "14px", opacity: 0.9 }}>
                      {verificationResult.message}
                    </div>
                  </div>
                </div>
                <IonBadge
                  color="light"
                  style={{ fontSize: "14px", fontWeight: "700" }}
                >
                  {verificationResult.pass.code}
                </IonBadge>
              </div>
            </div>

            <div
              style={{
                background: "white",
                borderRadius: "12px",
                padding: "20px",
                border: "1px solid #e2e8f0",
              }}
            >
              <h3
                style={{
                  fontSize: "16px",
                  fontWeight: "600",
                  marginBottom: "16px",
                  color: "#334155",
                }}
              >
                Pass Details
              </h3>

              <IonGrid style={{ padding: 0 }}>
                <IonRow>
                  <IonCol size="6" sizeMd="4">
                    <div style={{ marginBottom: "12px" }}>
                      <div
                        style={{
                          fontSize: "12px",
                          color: "#64748b",
                          marginBottom: "4px",
                        }}
                      >
                        Visitor Name
                      </div>
                      <div style={{ fontWeight: "600", color: "#334155" }}>
                        {verificationResult.pass.visitor_name || "Not specified"}
                      </div>
                    </div>
                  </IonCol>
                  <IonCol size="6" sizeMd="4">
                    <div style={{ marginBottom: "12px" }}>
                      <div
                        style={{
                          fontSize: "12px",
                          color: "#64748b",
                          marginBottom: "4px",
                        }}
                      >
                        Created By
                      </div>
                      <div style={{ fontWeight: "600", color: "#334155" }}>
                        {verificationResult.pass.resident_name || "Unknown"}
                      </div>
                      <div style={{ fontSize: "12px", color: "#94a3b8" }}>
                        {verificationResult.pass.resident_phone || ""}
                      </div>
                    </div>
                  </IonCol>
                  <IonCol size="6" sizeMd="4">
                    <div style={{ marginBottom: "12px" }}>
                      <div
                        style={{
                          fontSize: "12px",
                          color: "#64748b",
                          marginBottom: "4px",
                        }}
                      >
                        Apartment
                      </div>
                      <div style={{ fontWeight: "600", color: "#334155" }}>
                        {verificationResult.pass.unit_number || "Not assigned"}
                      </div>
                    </div>
                  </IonCol>
                  <IonCol size="6" sizeMd="4">
                    <div style={{ marginBottom: "12px" }}>
                      <div
                        style={{
                          fontSize: "12px",
                          color: "#64748b",
                          marginBottom: "4px",
                        }}
                      >
                        Created At
                      </div>
                      <div style={{ fontWeight: "600", color: "#334155" }}>
                        {verificationResult.pass.created_at}
                      </div>
                    </div>
                  </IonCol>
                  <IonCol size="6" sizeMd="4">
                    <div style={{ marginBottom: "12px" }}>
                      <div
                        style={{
                          fontSize: "12px",
                          color: "#64748b",
                          marginBottom: "4px",
                        }}
                      >
                        Expires At
                      </div>
                      <div style={{ fontWeight: "600", color: "#334155" }}>
                        {verificationResult.pass.expires_at}
                      </div>
                    </div>
                  </IonCol>
                  <IonCol size="6" sizeMd="4">
                    <div style={{ marginBottom: "12px" }}>
                      <div
                        style={{
                          fontSize: "12px",
                          color: "#64748b",
                          marginBottom: "4px",
                        }}
                      >
                        Time Remaining
                      </div>
                      <div
                        style={{
                          fontWeight: "600",
                          color: verificationResult.valid ? "#10b981" : "#ef4444",
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                        }}
                      >
                        <IonIcon icon={timeOutline} />
                        <span>
                          {formatTimeRemaining(
                            verificationResult.pass.timeRemaining || 0
                          )}
                        </span>
                      </div>
                    </div>
                  </IonCol>
                </IonRow>
              </IonGrid>
            </div>
          </IonCardContent>
        </IonCard>
      )}
    </div>
  );
};

export default VerifyTab;