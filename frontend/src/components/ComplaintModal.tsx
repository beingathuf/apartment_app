// src/components/ComplaintModal.jsx
import React, { useState } from "react";
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonItem,
  IonLabel,
  IonSelect,
  IonSelectOption,
  IonTextarea,
} from "@ionic/react";

export default function ComplaintModal({ isOpen, onClose, onCreated }) {
  const [complaintType, setComplaintType] = useState("Maintenance");
  const [complaintDescription, setComplaintDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      if (!complaintType || !complaintDescription.trim()) {
        alert("Please fill all complaint details");
        return;
      }

      const complaint = {
        id: `c_${Date.now()}`,
        type: complaintType,
        description: complaintDescription.trim(),
        status: "submitted",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      onCreated(complaint);
      resetForm();
      onClose();
    } catch (error) {
      console.error("Complaint submission failed:", error);
      alert("Failed to submit complaint. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setComplaintType("Maintenance");
    setComplaintDescription("");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <IonModal 
      isOpen={isOpen} 
      onDidDismiss={handleClose}
      style={{ 
        '--border-radius': '16px',
        '--background': 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)'
      }}
    >
      <IonHeader style={{
        '--background': 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
      }}>
        <IonToolbar>
          <IonTitle style={{ color: 'white', fontWeight: '700' }}>Report Issue to Admin</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding" style={{
        '--background': 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)'
      }}>
        <div style={{ 
          background: 'rgba(255, 255, 255, 0.95)', 
          borderRadius: '16px', 
          padding: '20px', 
          marginBottom: '16px',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.2)'
        }}>
          <IonItem style={{ 
            '--background': 'transparent',
            '--border-radius': '12px',
            marginBottom: '16px'
          }}>
            <IonLabel position="stacked" style={{ fontWeight: '600', color: '#2d3748' }}>
              Issue Type
            </IonLabel>
            <IonSelect 
              value={complaintType} 
              onIonChange={(e) => setComplaintType(e.detail.value)}
              style={{ 
                '--border-radius': '8px',
                marginTop: '8px'
              }}
            >
              <IonSelectOption value="Maintenance">Maintenance</IonSelectOption>
              <IonSelectOption value="Security">Security</IonSelectOption>
              <IonSelectOption value="Cleanliness">Cleanliness</IonSelectOption>
              <IonSelectOption value="Noise">Noise</IonSelectOption>
              <IonSelectOption value="Parking">Parking</IonSelectOption>
              <IonSelectOption value="Other">Other</IonSelectOption>
            </IonSelect>
          </IonItem>

          <IonItem style={{ 
            '--background': 'transparent',
            '--border-radius': '12px',
            marginBottom: '24px'
          }}>
            <IonLabel position="stacked" style={{ fontWeight: '600', color: '#2d3748' }}>
              Description
            </IonLabel>
            <IonTextarea
              value={complaintDescription}
              onIonInput={(e) => setComplaintDescription(e.detail.value)}
              placeholder="Please describe the issue in detail..."
              rows={6}
              style={{
                '--background': 'white',
                '--border-radius': '8px',
                '--padding-start': '12px',
                '--padding-end': '12px',
                border: '1px solid #e2e8f0',
                marginTop: '8px'
              }}
            />
          </IonItem>

          <div style={{ display: "flex", gap: "12px" }}>
            <IonButton 
              expand="block" 
              color="medium" 
              fill="outline"
              onClick={handleClose}
              style={{ 
                '--border-radius': '12px',
                fontWeight: '600'
              }}
            >
              Cancel
            </IonButton>
            <IonButton 
              expand="block" 
              onClick={handleSubmit} 
              disabled={loading}
              style={{ 
                '--border-radius': '12px',
                '--background': 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                fontWeight: '600'
              }}
            >
              {loading ? "Submitting..." : "Submit to Admin"}
            </IonButton>
          </div>
        </div>
      </IonContent>
    </IonModal>
  );
}