// src/pages/Watchman/index.tsx
import React, { useEffect, useState } from "react";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonCard,
  IonCardContent,
  IonItem,
  IonLabel,
  IonInput,
  IonButton,
  IonIcon,
  IonToast,
  IonAlert,
  IonFab,
  IonFabButton,
  IonButtons,
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
  logOutOutline,
  personOutline,
  shieldOutline,
} from "ionicons/icons";
import { useHistory } from "react-router-dom";
import api from "../../api";
import ScannerModal from "./ScannerModal";
import { formatDateTime } from "./utils";
import "./Watchman.css";

interface VerificationResult {
  valid: boolean;
  message: string;
  pass: {
    code: string;
    visitor_name: string | null;
    resident_name: string;
    resident_phone: string;
    unit_number: string;
    created_at: string;
    expires_at: string;
    timeRemaining: number;
  };
}

interface WatchmanData {
  name: string;
  building_id: string;
  building_name: string;
}

export default function Watchman() {
  const history = useHistory();
  const [verificationCode, setVerificationCode] = useState("");
  const [verificationResult, setVerificationResult] =
    useState<VerificationResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showScanner, setShowScanner] = useState(false);
  const [showLogoutAlert, setShowLogoutAlert] = useState(false);

  const [watchmanData, setWatchmanData] = useState<WatchmanData | null>(null);
  const [effectiveBuildingId, setEffectiveBuildingId] = useState<string | null>(
    null
  );

  const [toast, setToast] = useState({
    show: false,
    message: "",
    color: "success" as "success" | "danger" | "warning",
  });

  // Load watchman data on mount
  useEffect(() => {
    loadWatchmanData();
  }, []);

  async function loadWatchmanData() {
    setLoading(true);
    try {
      // Try to get buildingId from URL first
      const params = new URLSearchParams(window.location.search);
      let bid = params.get("buildingId");

      if (!bid) {
        // Try to get from localStorage
        try {
          const u = localStorage.getItem("user");
          if (u) {
            const parsed = JSON.parse(u);
            bid = parsed.buildingId || parsed.building_id || null;

            // Set watchman data if available
            if (parsed.name || parsed.role === "watchman") {
              setWatchmanData({
                name: parsed.name || "Watchman",
                building_id: bid || "",
                building_name: parsed.building_name || "Building",
              });
            }
          }
        } catch (err) {
          console.warn("Failed to read user from localStorage", err);
        }
      }

      if (!bid) {
        setToast({
          show: true,
          message: "No building assigned. Redirecting to login.",
          color: "warning",
        });
        setTimeout(() => history.push("/admin-login"), 2000);
        return;
      }

      setEffectiveBuildingId(String(bid));

      // Update URL if not present
      const currentParams = new URLSearchParams(window.location.search);
      if (!currentParams.get("buildingId")) {
        currentParams.set("buildingId", String(bid));
        history.replace({ search: `?${currentParams.toString()}` });
      }
    } catch (err: any) {
      console.error("loadWatchmanData error:", err);
      showToast("Failed to load watchman data", "danger");
    } finally {
      setLoading(false);
    }
  }

  const showToast = (
    message: string,
    color: "success" | "danger" | "warning" = "success"
  ) => {
    setToast({ show: true, message, color });
  };

  async function handleVerifyPass() {
    if (!effectiveBuildingId) {
      showToast("No building assigned", "warning");
      return;
    }

    if (!verificationCode.trim()) {
      showToast("Enter a pass code to verify", "warning");
      return;
    }

    setBusy(true);
    try {
      const res = await api.post(
        `/watchman/buildings/${effectiveBuildingId}/verify-pass`,
        {
          code: verificationCode.trim().toUpperCase(),
        }
      );

      const resData = res?.data || res;
      setVerificationResult(resData);

      if (resData?.valid) {
        showToast("Valid pass - Access granted", "success");
        // Clear input after successful verification
        setVerificationCode("");
      } else {
        showToast("Invalid or expired pass", "danger");
      }
    } catch (err: any) {
      showToast(err.message || "Verification failed", "danger");
      setVerificationResult(null);
    } finally {
      setBusy(false);
    }
  }

  function handleScannerResult(result: string) {
    setVerificationCode(result);
    // Auto-verify after scanning
    setTimeout(() => {
      if (effectiveBuildingId) {
        handleVerifyPass();
      }
    }, 500);
  }

  function startScanner() {
    if (!effectiveBuildingId) {
      showToast("No building assigned", "warning");
      return;
    }
    setShowScanner(true);
  }

  function formatTimeRemaining(minutes: number): string {
    if (minutes <= 0) return "Expired";
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  }

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    history.push("/admin-login");
  }

  // Handle Enter key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && verificationCode.trim()) {
      handleVerifyPass();
    }
  };

  return (
    <IonPage>
      <IonHeader className="watchman-header">
        <IonToolbar className="watchman-toolbar">
          <IonTitle className="watchman-title">
            <IonIcon icon={shieldOutline} className="title-icon" />
            Watchman Portal
          </IonTitle>
          <IonButtons slot="end">
            <IonButton
              onClick={() => setShowLogoutAlert(true)}
              className="logout-button"
              fill="clear"
            >
              <IonIcon icon={logOutOutline} slot="icon-only" />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent className="watchman-content">
        {/* Scanner Modal */}
        <ScannerModal
          isOpen={showScanner}
          onClose={() => setShowScanner(false)}
          onScan={handleScannerResult}
        />

        <div className="content-wrapper">
          {loading ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <div className="loading-text">Loading...</div>
            </div>
          ) : (
            <>
              {/* Welcome Section */}
              <div className="welcome-section">
                <div className="welcome-icon">
                  <IonIcon icon={personOutline} />
                </div>
                <h2 className="welcome-title">
                  Welcome, {watchmanData?.name || "Watchman"}
                </h2>
                <p className="welcome-subtitle">
                  Verify visitor passes for{" "}
                  {watchmanData?.building_name || "Building"}
                </p>
              </div>

              {/* Verification Card */}
              <IonCard className="verification-card">
                <div className="verification-header">
                  <h2 className="verification-title">Verify Visitor Pass</h2>
                  <p className="verification-subtitle">
                    Scan QR code or enter the pass code below
                  </p>
                </div>

                <div className="input-section">
                  <IonItem className="input-item">
                    <IonLabel position="floating">Pass Code</IonLabel>
                    <IonInput
                      value={verificationCode}
                      onIonChange={(e) =>
                        setVerificationCode(e.detail.value || "")
                      }
                      onKeyPress={handleKeyPress}
                      placeholder="Enter 6-digit code"
                      clearInput
                      className="code-input"
                      autofocus
                    />
                  </IonItem>
                </div>

                <div className="action-buttons">
                  <IonButton
                    expand="block"
                    onClick={handleVerifyPass}
                    disabled={busy || !verificationCode.trim()}
                    className="verify-button"
                  >
                    <IonIcon icon={searchOutline} slot="start" />
                    {busy ? "Verifying..." : "Verify Pass"}
                  </IonButton>

                  <IonButton
                    expand="block"
                    onClick={startScanner}
                    disabled={busy}
                    className="scan-button"
                    fill="outline"
                  >
                    <IonIcon icon={cameraOutline} slot="start" />
                    Scan QR Code
                  </IonButton>
                </div>
              </IonCard>

              {/* Verification Result */}
              {verificationResult && (
                <IonCard className="result-card">
                  <div
                    className={`result-status ${
                      verificationResult.valid ? "valid" : "invalid"
                    }`}
                  >
                    <div className="status-content">
                      <div className="status-icon">
                        {verificationResult.valid ? (
                          <IonIcon icon={checkmarkCircleOutline} />
                        ) : (
                          <IonIcon icon={closeCircleOutline} />
                        )}
                      </div>
                      <div className="status-text">
                        <h3>
                          {verificationResult.valid
                            ? "ACCESS GRANTED"
                            : "ACCESS DENIED"}
                        </h3>
                        <p>{verificationResult.message}</p>
                      </div>
                    </div>
                    <div className="pass-code">
                      {verificationResult.pass.code}
                    </div>
                  </div>

                  {/* Pass Details */}
                  <div className="pass-details">
                    <h3 className="details-title">Pass Details</h3>

                    <IonGrid className="details-grid">
                      <IonRow>
                        <IonCol size="6">
                          <div className="detail-item">
                            <span className="detail-label">Visitor</span>
                            <span className="detail-value">
                              {verificationResult.pass.visitor_name ||
                                "Not specified"}
                            </span>
                          </div>
                        </IonCol>
                        <IonCol size="6">
                          <div className="detail-item">
                            <span className="detail-label">Resident</span>
                            <span className="detail-value">
                              {verificationResult.pass.resident_name}
                            </span>
                          </div>
                        </IonCol>
                        <IonCol size="6">
                          <div className="detail-item">
                            <span className="detail-label">Apartment</span>
                            <span className="detail-value">
                              {verificationResult.pass.unit_number}
                            </span>
                          </div>
                        </IonCol>
                        <IonCol size="6">
                          <div className="detail-item">
                            <span className="detail-label">Contact</span>
                            <span className="detail-value">
                              {verificationResult.pass.resident_phone}
                            </span>
                          </div>
                        </IonCol>
                        <IonCol size="6">
                          <div className="detail-item">
                            <span className="detail-label">Created</span>
                            <span className="detail-value">
                              {verificationResult.pass.created_at}
                            </span>
                          </div>
                        </IonCol>
                        <IonCol size="6">
                          <div className="detail-item">
                            <span className="detail-label">Expires</span>
                            <span className="detail-value">
                              {verificationResult.pass.expires_at}
                            </span>
                          </div>
                        </IonCol>
                        <IonCol size="12">
                          <div className="detail-item">
                            <span className="detail-label">Time Remaining</span>
                            <span
                              className={`detail-value time-remaining ${
                                verificationResult.valid ? "valid" : "invalid"
                              }`}
                            >
                              <IonIcon icon={timeOutline} />
                              {formatTimeRemaining(
                                verificationResult.pass.timeRemaining || 0
                              )}
                            </span>
                          </div>
                        </IonCol>
                      </IonRow>
                    </IonGrid>
                  </div>

                  {/* Clear Button */}
                  <div className="clear-section">
                    <IonButton
                      expand="block"
                      onClick={() => {
                        setVerificationResult(null);
                        setVerificationCode("");
                      }}
                      className="clear-button"
                      fill="clear"
                    >
                      Clear Result
                    </IonButton>
                  </div>
                </IonCard>
              )}
            </>
          )}
        </div>
      </IonContent>

      {/* Floating Action Button for Quick Scan */}
      <IonFab
        vertical="bottom"
        horizontal="end"
        slot="fixed"
        className="scan-fab"
      >
        <IonFabButton onClick={startScanner} className="fab-button">
          <IonIcon icon={cameraOutline} />
        </IonFabButton>
      </IonFab>

      {/* Logout Confirmation Alert */}
      <IonAlert
        isOpen={showLogoutAlert}
        onDidDismiss={() => setShowLogoutAlert(false)}
        header="Logout"
        message="Are you sure you want to logout?"
        buttons={[
          { text: "Cancel", role: "cancel" },
          {
            text: "Logout",
            handler: handleLogout,
            cssClass: "logout",
          },
        ]}
        className="logout-alert"
      />

      {/* Toast */}
      <IonToast
        isOpen={toast.show}
        message={toast.message}
        duration={3000}
        color={toast.color}
        onDidDismiss={() => setToast((prev) => ({ ...prev, show: false }))}
        position="top"
        className="watchman-toast"
      />
    </IonPage>
  );
}
