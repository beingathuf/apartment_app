import React, { useState, useEffect, useRef } from "react";
import {
  IonModal,
  IonButton,
  IonIcon,
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonSpinner,
  IonToast,
} from "@ionic/react";
import {
  closeOutline,
  qrCodeOutline,
  cameraOutline,
  refreshOutline,
} from "ionicons/icons";
import jsQR from "jsqr";

interface ScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (result: string) => void;
}

const ScannerModal: React.FC<ScannerModalProps> = ({
  isOpen,
  onClose,
  onScan,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [facingMode, setFacingMode] = useState<"environment" | "user">(
    "environment"
  );
  const [isInitializing, setIsInitializing] = useState(true);

  const [isModalReady, setIsModalReady] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        setIsModalReady(true);
      }, 100);
    } else {
      setIsModalReady(false);
      stopScanner();
      setErrorMessage("");
    }

    return () => {
      stopScanner();
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && isModalReady) {
      startScanner();
    }
  }, [isOpen, isModalReady]);

  async function startScanner() {
    try {
      // Add null checks and ensure video element exists
      if (!videoRef.current) {
        console.warn("Video element not ready, retrying...");
        // Try again after a short delay
        setTimeout(() => {
          if (videoRef.current) {
            startScanner();
          } else {
            setErrorMessage(
              "Camera element not available. Please close and reopen the scanner."
            );
          }
        }, 500);
        return;
      }

      if (!canvasRef.current) {
        console.error("Canvas element not available");
        return;
      }

      setIsInitializing(true);
      setErrorMessage("");
      setScanResult(null);

      // Stop any existing stream first
      stopScanner();

      // Request camera access
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      // Double-check video element still exists
      if (!videoRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        console.error("Video element disappeared");
        return;
      }

      videoRef.current.srcObject = stream;
      videoRef.current.onloadedmetadata = () => {
        videoRef.current
          ?.play()
          .then(() => {
            setIsScanning(true);
            setIsInitializing(false);
            scanFrame();
          })
          .catch((err) => {
            console.error("Error playing video:", err);
            setIsInitializing(false);
            setErrorMessage("Failed to start camera feed: " + err.message);
          });
      };

      // Fallback in case onloadedmetadata doesn't fire
      setTimeout(() => {
        if (!isScanning && !errorMessage) {
          videoRef.current
            ?.play()
            .then(() => {
              setIsScanning(true);
              setIsInitializing(false);
              scanFrame();
            })
            .catch((err) => {
              console.error("Fallback play error:", err);
              setIsInitializing(false);
              setErrorMessage("Camera timeout. Please try again.");
            });
        }
      }, 2000);
    } catch (error: any) {
      console.error("Failed to start scanner:", error);
      setIsInitializing(false);

      if (error.name === "NotAllowedError") {
        setErrorMessage(
          "Camera access denied. Please enable camera permissions in your browser settings."
        );
      } else if (error.name === "NotFoundError") {
        setErrorMessage("No camera found on this device.");
      } else if (error.name === "NotSupportedError") {
        setErrorMessage(
          "Camera not supported in this browser. Try using Chrome or Firefox."
        );
      } else if (error.name === "OverconstrainedError") {
        setErrorMessage(
          "Camera constraints cannot be satisfied. Try switching cameras."
        );
      } else {
        setErrorMessage(
          "Failed to access camera: " + (error.message || "Unknown error")
        );
      }
    }
  }

  function stopScanner() {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => {
        track.stop();
        stream.removeTrack(track);
      });
      videoRef.current.srcObject = null;
    }
    setIsScanning(false);
    setIsInitializing(false);
  }

  const scanFrame = () => {
    // Check all required elements exist
    if (!videoRef.current || !canvasRef.current || !isScanning) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    // Check video is ready and context is available
    if (video.readyState >= video.HAVE_CURRENT_DATA && context) {
      try {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        const imageData = context.getImageData(
          0,
          0,
          canvas.width,
          canvas.height
        );
        const code = jsQR(imageData.data, imageData.width, imageData.height);

        if (code) {
          const scannedCode = code.data.trim().toUpperCase();
          handleScanSuccess(scannedCode);
        }
      } catch (error) {
        console.error("Error scanning frame:", error);
      }
    }

    if (isScanning) {
      requestAnimationFrame(scanFrame);
    }
  };

  const handleScanSuccess = (scannedCode: string) => {
    setScanResult(scannedCode);
    setIsScanning(false);
    setShowSuccessToast(true);

    // Vibrate on successful scan
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(100);
    }

    // Pass result to parent after a short delay
    setTimeout(() => {
      onScan(scannedCode);
      onClose();
    }, 1500);
  };

  const switchCamera = () => {
    setFacingMode((prev) => (prev === "environment" ? "user" : "environment"));
    stopScanner();
    setTimeout(() => startScanner(), 100);
  };

  const resetScanner = () => {
    setScanResult(null);
    startScanner();
  };

  const retryScanner = () => {
    setErrorMessage("");
    startScanner();
  };

  return (
    <IonModal isOpen={isOpen} onDidDismiss={onClose}>
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle className="ion-text-center">Scan QR Code</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={onClose}>
              <IonIcon icon={closeOutline} slot="icon-only" />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        <div
          style={{
            height: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
            backgroundColor: "#000",
            color: "white",
          }}
        >
          {/* Initializing/Error State */}
          {isInitializing && !scanResult && !errorMessage && (
            <div style={{ textAlign: "center", padding: "40px 20px" }}>
              <IonSpinner
                name="crescent"
                style={{ fontSize: "48px", color: "#4caf50" }}
              />
              <p style={{ marginTop: "20px", color: "#aaa" }}>
                Starting camera...
              </p>
            </div>
          )}

          {/* Error State */}
          {errorMessage && !scanResult && !isInitializing && (
            <div style={{ textAlign: "center", padding: "40px 20px" }}>
              <IonIcon
                icon={cameraOutline}
                style={{
                  fontSize: "64px",
                  color: "#888",
                  marginBottom: "20px",
                }}
              />
              <h3 style={{ marginBottom: "12px", color: "white" }}>
                Camera Error
              </h3>
              <p
                style={{
                  color: "#aaa",
                  marginBottom: "24px",
                  lineHeight: "1.5",
                }}
              >
                {errorMessage}
              </p>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                  maxWidth: "300px",
                  margin: "0 auto",
                }}
              >
                <IonButton
                  onClick={retryScanner}
                  color="primary"
                  expand="block"
                >
                  Try Again
                </IonButton>
                <IonButton onClick={onClose} color="medium" fill="outline">
                  Cancel
                </IonButton>
              </div>
            </div>
          )}

          {/* Scanner Area (when no errors and not initializing) */}
          {!errorMessage && !isInitializing && (
            <>
              <div
                style={{
                  position: "relative",
                  width: "100%",
                  maxWidth: "500px",
                  margin: "0 auto",
                  overflow: "hidden",
                  borderRadius: "12px",
                  backgroundColor: "#000",
                }}
              >
                <div
                  style={{
                    position: "relative",
                    width: "100%",
                    height: "70vh",
                    maxHeight: "500px",
                  }}
                >
                  {/* Video element - always visible when scanner is active */}
                  <video
                    ref={videoRef}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      display: isScanning && !scanResult ? "block" : "none",
                    }}
                    playsInline
                    muted
                  />
                  <canvas ref={canvasRef} style={{ display: "none" }} />

                  {/* Scanner Overlay */}
                  {isScanning && (
                    <div
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        pointerEvents: "none",
                      }}
                    >
                      {/* Scanning frame */}
                      <div
                        style={{
                          position: "absolute",
                          top: "50%",
                          left: "50%",
                          transform: "translate(-50%, -50%)",
                          width: "250px",
                          height: "250px",
                          border: "2px solid rgba(76, 175, 80, 0.8)",
                          borderRadius: "12px",
                          boxShadow: "0 0 0 1000px rgba(0, 0, 0, 0.5)",
                        }}
                      >
                        {/* Corner indicators */}
                        {[
                          {
                            top: 0,
                            left: 0,
                            borderTop: "3px solid #4caf50",
                            borderLeft: "3px solid #4caf50",
                          },
                          {
                            top: 0,
                            right: 0,
                            borderTop: "3px solid #4caf50",
                            borderRight: "3px solid #4caf50",
                          },
                          {
                            bottom: 0,
                            left: 0,
                            borderBottom: "3px solid #4caf50",
                            borderLeft: "3px solid #4caf50",
                          },
                          {
                            bottom: 0,
                            right: 0,
                            borderBottom: "3px solid #4caf50",
                            borderRight: "3px solid #4caf50",
                          },
                        ].map((style, index) => (
                          <div
                            key={index}
                            style={{
                              position: "absolute",
                              ...style,
                              width: "20px",
                              height: "20px",
                            }}
                          />
                        ))}

                        {/* Scanning line */}
                        <div
                          style={{
                            position: "absolute",
                            top: 0,
                            left: "10%",
                            right: "10%",
                            height: "3px",
                            background:
                              "linear-gradient(90deg, transparent, #4caf50, transparent)",
                            animation: "scanLine 2s infinite linear",
                          }}
                        />
                      </div>

                      {/* Instructions */}
                      <div
                        style={{
                          position: "absolute",
                          bottom: "20px",
                          left: 0,
                          right: 0,
                          textAlign: "center",
                          color: "white",
                          textShadow: "0 1px 3px rgba(0,0,0,0.8)",
                          padding: "0 20px",
                          fontSize: "14px",
                          opacity: 0.9,
                        }}
                      >
                        Position QR code within the frame
                      </div>
                    </div>
                  )}

                  {/* Scan Result Overlay */}
                  {scanResult && (
                    <div
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: "rgba(0, 0, 0, 0.9)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexDirection: "column",
                        color: "white",
                        textAlign: "center",
                        padding: "20px",
                        zIndex: 10,
                      }}
                    >
                      <IonIcon
                        icon={qrCodeOutline}
                        style={{
                          fontSize: "48px",
                          color: "#4caf50",
                          marginBottom: "16px",
                        }}
                      />
                      <h3
                        style={{
                          marginBottom: "8px",
                          color: "#4caf50",
                          fontWeight: "600",
                        }}
                      >
                        ✓ QR Code Scanned!
                      </h3>
                      <div
                        style={{
                          background: "rgba(255, 255, 255, 0.1)",
                          border: "1px solid rgba(255, 255, 255, 0.2)",
                          borderRadius: "8px",
                          padding: "12px 16px",
                          margin: "16px 0",
                          display: "flex",
                          flexDirection: "column",
                          gap: "4px",
                        }}
                      >
                        <span
                          style={{
                            fontSize: "12px",
                            color: "#aaa",
                            textTransform: "uppercase",
                          }}
                        >
                          Code:
                        </span>
                        <span
                          style={{
                            fontSize: "18px",
                            fontWeight: "600",
                            fontFamily: "monospace",
                          }}
                        >
                          {scanResult}
                        </span>
                      </div>
                      <p
                        style={{
                          marginTop: "16px",
                          fontSize: "14px",
                          color: "#aaa",
                        }}
                      >
                        Processing verification...
                      </p>
                      <IonSpinner
                        name="crescent"
                        style={{ marginTop: "12px", color: "#4caf50" }}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Controls */}
              <div
                style={{
                  padding: "20px",
                  width: "100%",
                  maxWidth: "500px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    gap: "12px",
                    justifyContent: "center",
                    flexWrap: "wrap",
                  }}
                >
                  {/* Switch Camera Button - Only show when scanning */}
                  {isScanning && (
                    <IonButton
                      onClick={switchCamera}
                      color="medium"
                      fill="outline"
                      size="default"
                    >
                      <IonIcon icon={cameraOutline} slot="start" />
                      Switch Camera
                    </IonButton>
                  )}

                  {/* Scan Again Button - Only show when result is shown */}
                  {scanResult && (
                    <IonButton
                      onClick={resetScanner}
                      color="primary"
                      size="default"
                    >
                      <IonIcon icon={refreshOutline} slot="start" />
                      Scan Again
                    </IonButton>
                  )}

                  {/* Stop Scanner Button - Only show when scanning */}
                  {isScanning && (
                    <IonButton
                      onClick={stopScanner}
                      color="danger"
                      fill="outline"
                      size="default"
                    >
                      Stop Scanner
                    </IonButton>
                  )}

                  {/* Start Scanner Button - Only show when not scanning and no result */}
                  {!isScanning && !scanResult && !errorMessage && (
                    <IonButton
                      onClick={startScanner}
                      color="primary"
                      size="default"
                    >
                      <IonIcon icon={cameraOutline} slot="start" />
                      Start Scanner
                    </IonButton>
                  )}
                </div>
              </div>

              {/* Help Text */}
              <div
                style={{
                  padding: "0 20px 20px",
                  width: "100%",
                  maxWidth: "500px",
                  textAlign: "center",
                }}
              >
                <p
                  style={{
                    fontSize: "14px",
                    color: "#666",
                    margin: "0 0 8px 0",
                  }}
                >
                  <strong>Tip:</strong> Ensure good lighting and hold the QR
                  code steady within the frame
                </p>
              </div>
            </>
          )}
        </div>
      </IonContent>

      {/* Success Toast */}
      <IonToast
        isOpen={showSuccessToast}
        onDidDismiss={() => setShowSuccessToast(false)}
        message="QR Code scanned successfully!"
        duration={2000}
        color="success"
        position="top"
      />

      {/* Add CSS animation */}
      <style>
        {`
          @keyframes scanLine {
            0% { top: 0; }
            100% { top: 100%; }
          }
        `}
      </style>
    </IonModal>
  );
};

export default ScannerModal;
