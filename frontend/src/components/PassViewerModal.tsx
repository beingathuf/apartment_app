// src/components/PassViewerModal.jsx
import React, { useState, useEffect } from "react";
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonIcon,
  IonBadge,
  IonChip,
  IonNote,
} from "@ionic/react";
import {
  qrCodeOutline,
  copyOutline,
  downloadOutline,
  closeOutline,
  timeOutline,
  personOutline,
  checkmarkCircleOutline,
} from "ionicons/icons";

export default function PassViewerModal({
  isOpen,
  onClose,
  pass,
  onCancelPass,
}) {
  const [normalized, setNormalized] = useState(null);
  const [timeLeft, setTimeLeft] = useState("");
  const [countdownActive, setCountdownActive] = useState(true);

  useEffect(() => {
    if (pass) {
      const norm = {
        id: pass.id,
        code: pass.code ?? pass.access_code ?? pass.raw?.code,
        visitorName:
          pass.visitorName ?? pass.name ?? pass.raw?.visitor_name ?? "Visitor",
        qrDataUrl: pass.qrDataUrl ?? pass.raw?.qr_data ?? null,
        createdAt:
          pass.createdAt ?? pass.raw?.created_at ?? new Date().toISOString(),
        expiresAt: pass.expiresAt ?? pass.raw?.expires_at ?? null,
        status: pass.status ?? "active",
      };
      setNormalized(norm);

      if (norm.expiresAt) {
        updateTimeLeft(norm.expiresAt);
        const interval = setInterval(() => {
          updateTimeLeft(norm.expiresAt);
        }, 1000);

        return () => clearInterval(interval);
      }
    } else {
      setNormalized(null);
    }
  }, [pass]);

  const updateTimeLeft = (expiresAt) => {
    if (!expiresAt) {
      setTimeLeft("00:00");
      setCountdownActive(false);
      return;
    }

    // FIXED: Use UTC timestamps for comparison
    const now = Date.now(); // UTC timestamp
    const expiry = new Date(expiresAt).getTime(); // UTC timestamp

    const diff = expiry - now;

    if (diff <= 0) {
      setTimeLeft("Expired");
      setCountdownActive(false);
      return;
    }

    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    setTimeLeft(
      `${minutes.toString().padStart(2, "0")}:${seconds
        .toString()
        .padStart(2, "0")}`
    );
    setCountdownActive(true);
  };

  const getCountdownColor = () => {
    if (!normalized?.expiresAt) return "medium";

    const now = Date.now(); // UTC
    const expiry = new Date(normalized.expiresAt).getTime(); // UTC

    const diff = expiry - now;

    if (diff <= 0) return "danger";
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (minutes < 5) return "danger";
    if (minutes < 10) return "warning";
    return "success";
  };

  const copyToClipboard = async () => {
    if (!normalized?.code) return;
    try {
      await navigator.clipboard.writeText(normalized.code);
      alert("✅ Code copied to clipboard!");
    } catch {
      alert("Failed to copy");
    }
  };

  const saveQrImage = async () => {
    if (!normalized?.qrDataUrl) {
      alert("No QR code available");
      return;
    }

    try {
      const a = document.createElement("a");
      a.href = normalized.qrDataUrl;
      a.download = `visitor-pass-${normalized.code}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      alert("✅ QR code downloaded!");
    } catch {
      alert("Failed to download");
    }
  };

  const handleCancel = () => {
    if (!normalized?.id) return;
    if (window.confirm("Are you sure you want to cancel this visitor pass?")) {
      onCancelPass(normalized.id);
      onClose();
    }
  };

  if (!normalized) return null;

  return (
    <IonModal
      isOpen={isOpen}
      onDidDismiss={onClose}
      style={{
        "--background": "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
        "--border-radius": "24px 24px 0 0",
        "--height": "85%",
      }}
    >
      <IonHeader
        style={{
          "--background": "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          "--border-width": "0",
        }}
        className="ion-no-border"
      >
        <IonToolbar>
          <IonTitle
            style={{ color: "white", fontWeight: "700", fontSize: "20px" }}
          >
            Visitor Pass Details
          </IonTitle>
          <IonButton
            slot="end"
            fill="clear"
            onClick={onClose}
            style={{ "--color": "white" }}
          >
            <IonIcon icon={closeOutline} size="large" />
          </IonButton>
        </IonToolbar>
      </IonHeader>

      <IonContent
        className="ion-padding"
        style={{
          "--background": "transparent",
        }}
      >
        <div
          style={{
            maxWidth: "500px",
            margin: "0 auto",
            padding: "8px",
          }}
        >
          {/* Pass Card */}
          <div
            style={{
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              borderRadius: "24px",
              padding: "32px 24px",
              textAlign: "center",
              color: "white",
              marginBottom: "24px",
              boxShadow: "0 15px 50px rgba(102, 126, 234, 0.3)",
            }}
          >
            {/* QR Code */}
            <div
              style={{
                background: "white",
                width: "200px",
                height: "200px",
                borderRadius: "16px",
                margin: "0 auto 24px",
                padding: "16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {normalized.qrDataUrl ? (
                <img
                  src={normalized.qrDataUrl}
                  alt="QR Code"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "contain",
                  }}
                />
              ) : (
                <IonIcon
                  icon={qrCodeOutline}
                  style={{ fontSize: "64px", color: "#cbd5e0" }}
                />
              )}
            </div>

            {/* Pass Code */}
            <div
              style={{
                fontSize: "32px",
                fontWeight: "900",
                letterSpacing: "6px",
                marginBottom: "8px",
                fontFamily: "monospace",
              }}
            >
              {normalized.code}
            </div>

            {/* Visitor Name */}
            <div
              style={{
                fontSize: "18px",
                fontWeight: "600",
                marginBottom: "16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
              }}
            >
              <IonIcon icon={personOutline} />
              <span>{normalized.visitorName}</span>
            </div>

            {/* Countdown Timer */}
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                background: "rgba(255, 255, 255, 0.2)",
                padding: "12px 24px",
                borderRadius: "50px",
                backdropFilter: "blur(10px)",
              }}
            >
              <IonIcon icon={timeOutline} />
              <span style={{ fontWeight: "700", fontSize: "18px" }}>
                {timeLeft}
              </span>
              <span style={{ fontSize: "12px", opacity: 0.9 }}>TIME LEFT</span>
            </div>
          </div>

          {/* Details Card */}
          <div
            style={{
              background: "rgba(255, 255, 255, 0.95)",
              borderRadius: "20px",
              padding: "24px",
              backdropFilter: "blur(20px)",
              border: "1px solid rgba(255, 255, 255, 0.3)",
              boxShadow: "0 10px 40px rgba(0,0,0,0.08)",
              marginBottom: "24px",
            }}
          >
            <h3
              style={{
                fontWeight: "700",
                fontSize: "18px",
                color: "#1f2937",
                marginTop: "0",
                marginBottom: "20px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <IonIcon
                icon={checkmarkCircleOutline}
                style={{ color: "#10b981" }}
              />
              Pass Details
            </h3>

            <div style={{ display: "grid", gap: "16px" }}>
              <div>
                <div
                  style={{
                    color: "#6b7280",
                    fontSize: "12px",
                    fontWeight: "600",
                    marginBottom: "4px",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}
                >
                  Visitor Name
                </div>
                <div
                  style={{
                    fontSize: "16px",
                    fontWeight: "600",
                    color: "#1f2937",
                  }}
                >
                  {normalized.visitorName}
                </div>
              </div>

              <div>
                <div
                  style={{
                    color: "#6b7280",
                    fontSize: "12px",
                    fontWeight: "600",
                    marginBottom: "4px",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}
                >
                  Created At
                </div>
                <div
                  style={{
                    fontSize: "16px",
                    fontWeight: "600",
                    color: "#1f2937",
                  }}
                >
                  {normalized.createdAt
                    ? new Date(normalized.createdAt).toLocaleString("en-IN", {
                        timeZone: "Asia/Kolkata",
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })
                    : "-"}
                </div>
              </div>

              <div>
                <div
                  style={{
                    color: "#6b7280",
                    fontSize: "12px",
                    fontWeight: "600",
                    marginBottom: "4px",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}
                >
                  Expires At
                </div>
                <div
                  style={{
                    fontSize: "16px",
                    fontWeight: "600",
                    color: "#1f2937",
                  }}
                >
                  {normalized.expiresAt
                    ? new Date(normalized.expiresAt).toLocaleString("en-IN", {
                        timeZone: "Asia/Kolkata",
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                        hour: "numeric",
                        minute: "2-digit",
                      })
                    : "-"}
                </div>
              </div>

              <div>
                <div
                  style={{
                    color: "#6b7280",
                    fontSize: "12px",
                    fontWeight: "600",
                    marginBottom: "4px",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}
                >
                  Status
                </div>
                <IonBadge
                  color={countdownActive ? "success" : "danger"}
                  style={{
                    fontSize: "13px",
                    fontWeight: "700",
                    padding: "6px 12px",
                    borderRadius: "8px",
                  }}
                >
                  {countdownActive ? "🟢 ACTIVE" : "🔴 EXPIRED"}
                </IonBadge>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div
            style={{
              display: "grid",
              gap: "12px",
              marginBottom: "24px",
            }}
          >
            <IonButton
              expand="block"
              onClick={copyToClipboard}
              style={{
                "--background":
                  "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                "--border-radius": "12px",
                "--padding-top": "18px",
                "--padding-bottom": "18px",
                fontWeight: "600",
                fontSize: "16px",
              }}
            >
              <IonIcon icon={copyOutline} slot="start" />
              Copy Access Code
            </IonButton>

            {normalized.qrDataUrl && (
              <IonButton
                expand="block"
                onClick={saveQrImage}
                style={{
                  "--background":
                    "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
                  "--border-radius": "12px",
                  "--padding-top": "18px",
                  "--padding-bottom": "18px",
                  fontWeight: "600",
                  fontSize: "16px",
                }}
              >
                <IonIcon icon={downloadOutline} slot="start" />
                Download QR Code
              </IonButton>
            )}

            <IonButton
              expand="block"
              color="danger"
              fill="outline"
              onClick={handleCancel}
              style={{
                "--border-radius": "12px",
                "--padding-top": "18px",
                "--padding-bottom": "18px",
                fontWeight: "600",
                fontSize: "16px",
                "--border-width": "2px",
              }}
            >
              Cancel This Pass
            </IonButton>
          </div>

          {/* Instructions */}
          <IonNote
            style={{
              display: "block",
              textAlign: "center",
              color: "#6b7280",
              fontSize: "12px",
              lineHeight: 1.6,
            }}
          >
            ⓘ Share the code or QR with your visitor. This pass will
            automatically expire and be deleted after 30 minutes for security.
          </IonNote>
        </div>
      </IonContent>
    </IonModal>
  );
}
