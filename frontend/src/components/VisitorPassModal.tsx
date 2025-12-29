// src/components/VisitorPassModal.jsx
import React, { useEffect, useRef, useState } from "react";
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonInput,
  IonItem,
  IonLabel,
  IonIcon,
  IonCard,
  IonCardContent,
  IonSpinner,
  IonNote,
} from "@ionic/react";
import {
  closeOutline,
  copyOutline,
  downloadOutline,
  timeOutline,
  personCircleOutline,
} from "ionicons/icons";
import QRCode from "qrcode";

export default function VisitorPassModal({ isOpen, onClose, onCreated }) {
  const [visitorName, setVisitorName] = useState("");
  const [code, setCode] = useState("");
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [countdown, setCountdown] = useState(1800); // 30 minutes in seconds

  const inputRef = useRef(null);
  const countdownRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        try {
          inputRef.current?.setFocus?.();
        } catch (e) {}
      }, 200);

      // Reset countdown when modal opens
      setCountdown(1800);

      return () => {
        if (countdownRef.current) {
          clearInterval(countdownRef.current);
        }
      };
    }
  }, [isOpen]);

  // Countdown timer
  useEffect(() => {
    if (code && countdown > 0) {
      countdownRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(countdownRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
      }
    };
  }, [code]);

  function generateShortCode(length = 6) {
    const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
    let out = "";
    for (let i = 0; i < length; i++)
      out += chars[Math.floor(Math.random() * chars.length)];
    return out;
  }

  // Generate 30 minutes expiry in UTC - FIXED
  function generateExpiry() {
    // Always use UTC for consistency with backend
    const now = new Date();
    
    // Calculate expiry in UTC
    const expiry = new Date(now.getTime() + 30 * 60 * 1000);
    
    // Ensure it's in UTC ISO string format
    const expiryUTC = expiry.toISOString();

    console.log("Generating expiry:", {
      nowUTC: now.toISOString(),
      nowLocal: now.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
      expiryUTC: expiryUTC,
      expiryLocal: expiry.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
      duration: "30 minutes",
    });

    return expiryUTC;
  }

  function formatCountdown(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  }

  async function generate() {
    setError("");
    setLoading(true);
    try {
      const newCode = generateShortCode(6);
      const expiry = generateExpiry();
      
      // Create payload for QR code
      const payload = {
        code: newCode,
        visitorName: visitorName.trim() || "Visitor",
        expiresAt: expiry, // Use UTC ISO string
        createdAt: new Date().toISOString(),
        validFor: "30 minutes",
        type: "visitor_pass"
      };

      // Generate QR code
      const opts = {
        errorCorrectionLevel: "H",
        type: "image/png",
        margin: 2,
        width: 300,
        color: {
          dark: "#667eea",
          light: "#ffffff",
        },
      };

      const dataUrl = await QRCode.toDataURL(JSON.stringify(payload), opts);

      setCode(newCode);
      setQrDataUrl(dataUrl);
      setCountdown(1800);

      // Notify parent with UTC expiry
      onCreated?.({
        code: newCode,
        visitorName: payload.visitorName,
        expiresAt: expiry, // UTC ISO string
        qrDataUrl: dataUrl,
        createdAt: payload.createdAt,
      });
    } catch (e) {
      console.error("Generate error:", e);
      setError("Could not generate pass. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function copyToClipboard() {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      alert("✅ Code copied to clipboard!");
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = code;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      alert("✅ Code copied!");
    }
  }

  async function saveQrImage() {
    if (!qrDataUrl) return;
    try {
      const link = document.createElement("a");
      link.href = qrDataUrl;
      link.download = `visitor-pass-${code}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      alert("✅ QR code downloaded!");
    } catch {
      alert("Failed to download QR code");
    }
  }

  function handleClose() {
    setVisitorName("");
    setCode("");
    setQrDataUrl("");
    setError("");
    setLoading(false);
    setCountdown(1800);
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
    }
    onClose?.();
  }

  return (
    <IonModal
      isOpen={isOpen}
      onDidDismiss={handleClose}
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
            style={{
              color: "white",
              fontWeight: 700,
              fontSize: "20px",
              textAlign: "center",
            }}
          >
            Create Visitor Pass
          </IonTitle>
          <IonButton
            slot="end"
            fill="clear"
            onClick={handleClose}
            style={{ "--color": "white", marginRight: "8px" }}
          >
            <IonIcon icon={closeOutline} size="large" />
          </IonButton>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding" scrollY>
        <div style={{ maxWidth: "500px", margin: "0 auto", padding: "8px" }}>
          <div
            style={{
              background: "rgba(255, 255, 255, 0.95)",
              borderRadius: "20px",
              padding: "24px",
              backdropFilter: "blur(20px)",
              border: "1px solid rgba(255, 255, 255, 0.3)",
              boxShadow: "0 10px 40px rgba(0,0,0,0.08)",
              marginBottom: "20px",
            }}
          >
            <div style={{ marginBottom: "24px" }}>
              <IonItem
                lines="none"
                style={{ "--background": "transparent", marginBottom: "20px" }}
              >
                <IonIcon
                  icon={personCircleOutline}
                  slot="start"
                  style={{ color: "#667eea", fontSize: "24px" }}
                />
                <IonLabel
                  position="floating"
                  style={{ fontWeight: 600, color: "#4b5563" }}
                >
                  Visitor Name (Optional)
                </IonLabel>
                <IonInput
                  ref={inputRef}
                  value={visitorName}
                  placeholder="e.g., Delivery / Mr. Sharma"
                  onIonInput={(e) => setVisitorName(e.detail.value || "")}
                  style={{ "--padding-start": "0" }}
                  clearInput
                />
              </IonItem>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  background: "rgba(102, 126, 234, 0.1)",
                  padding: "12px 16px",
                  borderRadius: "12px",
                  marginBottom: "20px",
                }}
              >
                <IonIcon
                  icon={timeOutline}
                  style={{ color: "#667eea", fontSize: "20px" }}
                />
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontWeight: 600,
                      color: "#374151",
                      fontSize: "14px",
                    }}
                  >
                    ⏰ Valid for 30 minutes (UTC Time)
                  </div>
                  <div
                    style={{
                      color: "#6b7280",
                      fontSize: "12px",
                      marginTop: "2px",
                    }}
                  >
                    Pass will auto-expire and be deleted after 30 minutes
                  </div>
                </div>
              </div>

              <IonButton
                expand="block"
                onClick={generate}
                disabled={loading}
                style={{
                  "--background":
                    "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  "--border-radius": "12px",
                  "--padding-top": "18px",
                  "--padding-bottom": "18px",
                  fontWeight: 700,
                  fontSize: "16px",
                  marginBottom: "12px",
                }}
              >
                {loading ? (
                  <>
                    <IonSpinner
                      name="crescent"
                      style={{ marginRight: "8px" }}
                    />
                    Generating...
                  </>
                ) : (
                  "🎫 Generate Pass"
                )}
              </IonButton>

              {error && (
                <div
                  style={{
                    color: "#ef4444",
                    background: "#fef2f2",
                    padding: "12px 16px",
                    borderRadius: "12px",
                    fontSize: "14px",
                    fontWeight: 500,
                    marginTop: "12px",
                  }}
                >
                  ⚠️ {error}
                </div>
              )}
            </div>

            {/* Generated Pass Preview */}
            {code && (
              <div
                style={{
                  borderTop: "2px dashed #e5e7eb",
                  paddingTop: "24px",
                }}
              >
                <div
                  style={{
                    textAlign: "center",
                    marginBottom: "24px",
                  }}
                >
                  <div
                    style={{
                      fontWeight: 800,
                      fontSize: "24px",
                      color: "#1f2937",
                      letterSpacing: "4px",
                      marginBottom: "8px",
                    }}
                  >
                    {code}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px",
                      color: "#667eea",
                      fontWeight: 600,
                      fontSize: "14px",
                    }}
                  >
                    <IonIcon icon={timeOutline} />
                    <span>Valid for: {formatCountdown(countdown)}</span>
                  </div>
                </div>

                {qrDataUrl && (
                  <div
                    style={{
                      textAlign: "center",
                      marginBottom: "24px",
                      padding: "20px",
                      background: "white",
                      borderRadius: "16px",
                      border: "1px solid #e5e7eb",
                    }}
                  >
                    <img
                      src={qrDataUrl}
                      alt="Visitor Pass QR Code"
                      style={{
                        width: "200px",
                        height: "200px",
                        margin: "0 auto",
                        display: "block",
                        borderRadius: "8px",
                      }}
                    />
                    <IonNote
                      style={{
                        display: "block",
                        marginTop: "12px",
                        color: "#6b7280",
                        fontSize: "12px",
                      }}
                    >
                      Scan this QR code at the entrance
                    </IonNote>
                  </div>
                )}

                {/* Action Buttons */}
                <div
                  style={{
                    display: "flex",
                    gap: "12px",
                  }}
                >
                  <IonButton
                    expand="block"
                    onClick={copyToClipboard}
                    style={{
                      flex: 1,
                      "--background":
                        "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                      "--border-radius": "12px",
                      "--padding-top": "16px",
                      "--padding-bottom": "16px",
                      fontWeight: 600,
                    }}
                  >
                    <IonIcon icon={copyOutline} slot="start" />
                    Copy Code
                  </IonButton>

                  <IonButton
                    expand="block"
                    onClick={saveQrImage}
                    style={{
                      flex: 1,
                      "--background":
                        "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
                      "--border-radius": "12px",
                      "--padding-top": "16px",
                      "--padding-bottom": "16px",
                      fontWeight: 600,
                    }}
                  >
                    <IonIcon icon={downloadOutline} slot="start" />
                    Save QR
                  </IonButton>
                </div>
              </div>
            )}
          </div>
        </div>
      </IonContent>
    </IonModal>
  );
}