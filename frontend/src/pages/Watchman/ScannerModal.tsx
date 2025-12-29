// src/pages/Watchman/ScannerModal.tsx
import React, { useState } from "react";
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonIcon,
} from "@ionic/react";
import { closeOutline, qrCodeOutline } from "ionicons/icons";
import "./ScannerModal.css";

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
  const [scanning, setScanning] = useState(false);

  // Mock scanner function (in real app, use @capacitor/barcode-scanner)
  const startMockScanner = () => {
    setScanning(true);
    
    // Simulate scanning process
    setTimeout(() => {
      // Mock scan result - in real app, this would come from camera
      const mockCodes = ["ABC123", "DEF456", "GHI789", "JKL012", "MNO345"];
      const randomCode = mockCodes[Math.floor(Math.random() * mockCodes.length)];
      
      setScanning(false);
      onScan(randomCode);
      onClose();
    }, 1500);
  };

  const handleClose = () => {
    setScanning(false);
    onClose();
  };

  return (
    <IonModal
      isOpen={isOpen}
      onDidDismiss={handleClose}
      className="scanner-modal"
    >
      <IonHeader>
        <IonToolbar>
          <IonTitle>Scan QR Code</IonTitle>
          <IonButton slot="end" onClick={handleClose} fill="clear">
            <IonIcon icon={closeOutline} />
          </IonButton>
        </IonToolbar>
      </IonHeader>
      
      <IonContent className="scanner-content">
        <div className="scanner-container">
          {scanning ? (
            <div className="scanning-view">
              <div className="scanner-animation">
                <div className="scanner-line"></div>
              </div>
              <div className="scanner-frame">
                <div className="scanner-corner top-left"></div>
                <div className="scanner-corner top-right"></div>
                <div className="scanner-corner bottom-left"></div>
                <div className="scanner-corner bottom-right"></div>
              </div>
              <p className="scanning-text">Scanning QR code...</p>
            </div>
          ) : (
            <div className="scanner-placeholder">
              <div className="placeholder-icon">
                <IonIcon icon={qrCodeOutline} />
              </div>
              <h3 className="placeholder-title">QR Code Scanner</h3>
              <p className="placeholder-description">
                Position the QR code within the frame to scan
              </p>
              
              <div className="mock-scanner-frame">
                <div className="mock-frame">
                  <div className="mock-corner top-left"></div>
                  <div className="mock-corner top-right"></div>
                  <div className="mock-corner bottom-left"></div>
                  <div className="mock-corner bottom-right"></div>
                </div>
              </div>
              
              <p className="scanner-instructions">
                • Hold steady for better detection<br />
                • Ensure good lighting<br />
                • Align QR code with frame
              </p>
            </div>
          )}
          
          <div className="scanner-actions">
            {!scanning && (
              <IonButton
                expand="block"
                onClick={startMockScanner}
                className="start-scan-button"
                size="large"
              >
                <IonIcon icon={qrCodeOutline} slot="start" />
                Start Scanning
              </IonButton>
            )}
            
            <IonButton
              expand="block"
              onClick={handleClose}
              className="cancel-button"
              fill="outline"
            >
              Cancel
            </IonButton>
          </div>
          
          <div className="scanner-tips">
            <p className="tips-title">💡 Quick Tip:</p>
            <p className="tips-text">
              You can also manually enter the 6-digit code from the main screen
            </p>
          </div>
        </div>
      </IonContent>
    </IonModal>
  );
};

export default ScannerModal;