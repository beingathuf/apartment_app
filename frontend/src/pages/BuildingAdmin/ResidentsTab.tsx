// src/pages/BuildingAdmin/ResidentsTab.tsx
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
import { trashOutline, peopleOutline } from "ionicons/icons";
import { Apartment, User } from "./types";

interface ResidentsTabProps {
  users: User[];
  apartments: Apartment[];
  residentPhone: string;
  residentPassword: string;
  residentName: string;
  selectedApartmentId: string;
  busy: boolean;
  onResidentPhoneChange: (value: string) => void;
  onResidentPasswordChange: (value: string) => void;
  onResidentNameChange: (value: string) => void;
  onSelectedApartmentIdChange: (value: string) => void;
  onCreateResident: () => void;
  onDeleteUser: (userId: number) => void;
}

const ResidentsTab: React.FC<ResidentsTabProps> = ({
  users,
  apartments,
  residentPhone,
  residentPassword,
  residentName,
  selectedApartmentId,
  busy,
  onResidentPhoneChange,
  onResidentPasswordChange,
  onResidentNameChange,
  onSelectedApartmentIdChange,
  onCreateResident,
  onDeleteUser,
}) => {
  const residents = users.filter((u) => u.role === "resident");

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
            Create New Resident
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
                  <IonLabel position="floating">Select Apartment *</IonLabel>
                  <select
                    value={selectedApartmentId}
                    onChange={(e) => onSelectedApartmentIdChange(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "12px",
                      borderRadius: "8px",
                      border: "1px solid #e2e8f0",
                      background: "white",
                      fontSize: "16px",
                      color: "#334155",
                    }}
                  >
                    <option value="">Select an apartment</option>
                    {apartments.map((apt) => (
                      <option key={apt.id} value={String(apt.id)}>
                        {apt.unit_number} {apt.owner_name ? `(${apt.owner_name})` : ""}
                      </option>
                    ))}
                  </select>
                </IonItem>
              </IonCol>
              <IonCol size="12" sizeMd="6">
                <IonItem
                  style={{
                    "--background": "transparent",
                    "--border-color": "#e2e8f0",
                  }}
                >
                  <IonLabel position="floating">Resident Name</IonLabel>
                  <IonInput
                    value={residentName}
                    onIonChange={(e) => onResidentNameChange(e.detail.value!)}
                    placeholder="John Resident"
                    clearInput
                  />
                </IonItem>
              </IonCol>
            </IonRow>
            <IonRow>
              <IonCol size="12" sizeMd="6">
                <IonItem
                  style={{
                    "--background": "transparent",
                    "--border-color": "#e2e8f0",
                  }}
                >
                  <IonLabel position="floating">Phone Number *</IonLabel>
                  <IonInput
                    value={residentPhone}
                    onIonChange={(e) => onResidentPhoneChange(e.detail.value!)}
                    placeholder="+91 98765 43210"
                    type="tel"
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
                  <IonLabel position="floating">Password *</IonLabel>
                  <IonInput
                    value={residentPassword}
                    onIonChange={(e) => onResidentPasswordChange(e.detail.value!)}
                    type="password"
                    placeholder="••••••••"
                    clearInput
                  />
                </IonItem>
              </IonCol>
            </IonRow>
            <IonRow>
              <IonCol>
                <IonButton
                  expand="block"
                  onClick={onCreateResident}
                  disabled={
                    busy ||
                    !selectedApartmentId ||
                    !residentPhone.trim() ||
                    !residentPassword.trim()
                  }
                  style={{
                    "--background": "linear-gradient(135deg, #9eaadcff 0%, #8a73a0ff 100%)",
                    "--border-radius": "10px",
                    marginTop: "16px",
                    height: "44px",
                  }}
                >
                  {busy ? "Creating..." : "Create Resident"}
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
            All Residents ({residents.length})
          </h2>

          {residents.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "40px 20px",
                color: "#94a3b8",
              }}
            >
              <IonIcon
                icon={peopleOutline}
                style={{ fontSize: "48px", marginBottom: "16px" }}
              />
              <div style={{ fontWeight: "600" }}>No residents yet</div>
              <div style={{ fontSize: "14px", marginTop: "4px" }}>
                Create your first resident above
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
                <IonCol size="3">Name</IonCol>
                <IonCol size="3">Phone</IonCol>
                <IonCol size="3">Apartment</IonCol>
                <IonCol size="3" style={{ textAlign: "right" }}>
                  Actions
                </IonCol>
              </IonRow>
              {residents.map((user) => (
                <IonRow
                  key={user.id}
                  style={{
                    borderBottom: "1px solid #f1f5f9",
                    padding: "16px 0",
                    alignItems: "center",
                  }}
                >
                  <IonCol size="3">
                    <div style={{ fontWeight: "600", color: "#334155" }}>
                      {user.name || "—"}
                    </div>
                  </IonCol>
                  <IonCol size="3">
                    <div style={{ color: "#64748b" }}>{user.phone}</div>
                  </IonCol>
                  <IonCol size="3">
                    <div style={{ color: "#64748b" }}>
                      {user.unit_number || "Not assigned"}
                    </div>
                  </IonCol>
                  <IonCol size="3" style={{ textAlign: "right" }}>
                    <IonButton
                      fill="clear"
                      color="danger"
                      onClick={() => onDeleteUser(user.id)}
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

export default ResidentsTab;