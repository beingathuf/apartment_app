// src/pages/BuildingAdmin/ApartmentsTab.tsx
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
import { trashOutline, homeOutline } from "ionicons/icons";
import { Apartment } from "./types";

interface ApartmentsTabProps {
  apartments: Apartment[];
  unitNumber: string;
  ownerName: string;
  busy: boolean;
  onUnitNumberChange: (value: string) => void;
  onOwnerNameChange: (value: string) => void;
  onCreateApartment: () => void;
  onDeleteApartment: (apartmentId: number) => void;
}

const ApartmentsTab: React.FC<ApartmentsTabProps> = ({
  apartments,
  unitNumber,
  ownerName,
  busy,
  onUnitNumberChange,
  onOwnerNameChange,
  onCreateApartment,
  onDeleteApartment,
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
            Create New Apartment
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
                  <IonLabel position="floating">Unit Number *</IonLabel>
                  <IonInput
                    value={unitNumber}
                    onIonChange={(e) => onUnitNumberChange(e.detail.value!)}
                    placeholder="A-101, B-202, etc."
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
                  <IonLabel position="floating">Owner Name (Optional)</IonLabel>
                  <IonInput
                    value={ownerName}
                    onIonChange={(e) => onOwnerNameChange(e.detail.value!)}
                    placeholder="John Doe"
                    clearInput
                  />
                </IonItem>
              </IonCol>
            </IonRow>
            <IonRow>
              <IonCol>
                <IonButton
                  expand="block"
                  onClick={onCreateApartment}
                  disabled={busy || !unitNumber.trim()}
                  style={{
                    "--background":
                      "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    "--border-radius": "10px",
                    marginTop: "16px",
                    height: "44px",
                  }}
                >
                  {busy ? "Creating..." : "Create Apartment"}
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
            }}
          >
            All Apartments ({apartments.length})
          </h2>

          {apartments.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "40px 20px",
                color: "#94a3b8",
              }}
            >
              <IonIcon
                icon={homeOutline}
                style={{ fontSize: "48px", marginBottom: "16px" }}
              />
              <div style={{ fontWeight: "600" }}>No apartments yet</div>
              <div style={{ fontSize: "14px", marginTop: "4px" }}>
                Create your first apartment above
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
                <IonCol size="4">Unit Number</IonCol>
                <IonCol size="4">Owner</IonCol>
                <IonCol size="4" style={{ textAlign: "right" }}>
                  Actions
                </IonCol>
              </IonRow>
              {apartments.map((apt) => (
                <IonRow
                  key={apt.id}
                  style={{
                    borderBottom: "1px solid #f1f5f9",
                    padding: "16px 0",
                    alignItems: "center",
                  }}
                >
                  <IonCol size="4">
                    <div style={{ fontWeight: "600", color: "#334155" }}>
                      {apt.unit_number}
                    </div>
                    <div style={{ fontSize: "12px", color: "#94a3b8" }}>
                      Created: {new Date(apt.created_at).toLocaleDateString()}
                    </div>
                  </IonCol>
                  <IonCol size="4">
                    <div style={{ color: "#64748b" }}>
                      {apt.owner_name || "—"}
                    </div>
                  </IonCol>
                  <IonCol size="4" style={{ textAlign: "right" }}>
                    <IonButton
                      fill="clear"
                      color="danger"
                      onClick={() => onDeleteApartment(apt.id)}
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

export default ApartmentsTab;