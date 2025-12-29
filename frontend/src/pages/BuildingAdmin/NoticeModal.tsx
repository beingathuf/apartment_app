// src/pages/BuildingAdmin/NoticeModal.tsx
import React from "react";
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonIcon,
  IonItem,
  IonLabel,
  IonInput,
  IonChip,
} from "@ionic/react";
import { closeOutline } from "ionicons/icons";

interface NoticeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: () => void;
  title: string;
  content: string;
  category: string;
  priority: "low" | "medium" | "high";
  expiresAt: string;
  busy: boolean;
  onTitleChange: (value: string) => void;
  onContentChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onPriorityChange: (value: "low" | "medium" | "high") => void;
  onExpiresAtChange: (value: string) => void;
}

const NoticeModal: React.FC<NoticeModalProps> = ({
  isOpen,
  onClose,
  onCreate,
  title,
  content,
  category,
  priority,
  expiresAt,
  busy,
  onTitleChange,
  onContentChange,
  onCategoryChange,
  onPriorityChange,
  onExpiresAtChange,
}) => {
  return (
    <IonModal isOpen={isOpen} onDidDismiss={onClose}>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Create New Notice</IonTitle>
          <IonButton slot="end" fill="clear" onClick={onClose}>
            <IonIcon icon={closeOutline} />
          </IonButton>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <div style={{ padding: "20px", maxWidth: "600px", margin: "0 auto" }}>
          <IonItem style={{ marginBottom: "16px" }}>
            <IonLabel position="floating">Title *</IonLabel>
            <IonInput
              value={title}
              onIonChange={(e) => onTitleChange(e.detail.value!)}
              placeholder="Enter notice title"
            />
          </IonItem>

          <IonItem style={{ marginBottom: "16px" }}>
            <IonLabel position="floating">Content *</IonLabel>
            <IonInput
              value={content}
              onIonChange={(e) => onContentChange(e.detail.value!)}
              placeholder="Enter notice content"
            />
          </IonItem>

          <IonItem style={{ marginBottom: "16px" }}>
            <IonLabel>Category</IonLabel>
            <select
              value={category}
              onChange={(e) => onCategoryChange(e.target.value)}
              style={{
                width: "100%",
                padding: "12px",
                border: "1px solid #e2e8f0",
                borderRadius: "8px",
                background: "white",
              }}
            >
              <option value="general">General</option>
              <option value="maintenance">Maintenance</option>
              <option value="security">Security</option>
              <option value="event">Event</option>
              <option value="payment">Payment</option>
              <option value="other">Other</option>
            </select>
          </IonItem>

          <IonItem style={{ marginBottom: "16px" }}>
            <IonLabel>Priority</IonLabel>
            <div style={{ display: "flex", gap: "12px", marginTop: "8px" }}>
              {(["low", "medium", "high"] as const).map((p) => (
                <IonChip
                  key={p}
                  color={
                    priority === p
                      ? p === "high"
                        ? "danger"
                        : p === "medium"
                        ? "warning"
                        : "success"
                      : "medium"
                  }
                  onClick={() => onPriorityChange(p)}
                  style={{ cursor: "pointer" }}
                >
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </IonChip>
              ))}
            </div>
          </IonItem>

          <IonItem style={{ marginBottom: "24px" }}>
            <IonLabel position="floating">Expiry Date (Optional)</IonLabel>
            <IonInput
              type="date"
              value={expiresAt}
              onIonChange={(e) => onExpiresAtChange(e.detail.value!)}
            />
          </IonItem>

          <IonButton
            expand="block"
            onClick={onCreate}
            disabled={busy || !title.trim() || !content.trim()}
            style={{
              "--background": "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              height: "44px",
            }}
          >
            {busy ? "Creating..." : "Create Notice"}
          </IonButton>
        </div>
      </IonContent>
    </IonModal>
  );
};

export default NoticeModal;