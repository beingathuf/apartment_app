// src/pages/BuildingAdmin/ScannerModal.tsx
import React from "react";
import { IonModal, IonButton, IonIcon } from "@ionic/react";
import { closeOutline } from "ionicons/icons";

interface ScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ScannerModal: React.FC<ScannerModalProps> = ({ isOpen, onClose }) => {
  return (
    <IonModal isOpen={isOpen} onDidDismiss={onClose}>
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          background: "black",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
          textAlign: "center",
          padding: "20px",
        }}
      >
        <h2 style={{ marginBottom: "16px" }}>QR Scanner</h2>
        <p style={{ opacity: 0.8, marginBottom: "24px" }}>
          Scanner functionality requires @capacitor/barcode-scanner package
        </p>
        <p style={{ opacity: 0.8, marginBottom: "24px" }}>
          Install with: npm install @capacitor/barcode-scanner
        </p>
        <IonButton onClick={onClose} color="danger">
          <IonIcon icon={closeOutline} slot="start" />
          Close
        </IonButton>
      </div>
    </IonModal>
  );
};

export default ScannerModal;