// src/pages/BuildingAdmin/ApartmentsTab.tsx - UPDATED
import React, { useState } from "react";
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
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonList,
  IonNote,
  IonBadge,
} from "@ionic/react";
import { trashOutline, homeOutline, settingsOutline } from "ionicons/icons";
import { Apartment } from "./types";
import api from "../../api";

interface ApartmentsTabProps {
  apartments: Apartment[];
  unitNumber: string;
  ownerName: string;
  busy: boolean;
  onUnitNumberChange: (value: string) => void;
  onOwnerNameChange: (value: string) => void;
  onCreateApartment: () => void;
  onDeleteApartment: (apartmentId: number) => void;
  buildingId?: string | null;
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
  buildingId,
}) => {
  const [selectedApartment, setSelectedApartment] = useState<Apartment | null>(
    null
  );
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
  const [maintenanceAmount, setMaintenanceAmount] = useState("");
  const [effectiveFrom, setEffectiveFrom] = useState("");
  const [settingMaintenance, setSettingMaintenance] = useState(false);
  const [apartmentMaintenance, setApartmentMaintenance] = useState<
    Record<number, any>
  >({});

  const openMaintenanceModal = async (apartment: Apartment) => {
    setSelectedApartment(apartment);
    setMaintenanceAmount("");
    setEffectiveFrom(new Date().toISOString().split("T")[0]);

    // Load existing maintenance settings
    if (buildingId) {
      try {
        const res = await api.get(
          `/admin/buildings/${buildingId}/apartments/${apartment.id}/maintenance`
        );
        const data = res?.data || res;
        if (data.maintenance && data.maintenance.length > 0) {
          const activeMaintenance =
            data.maintenance.find((m: any) => m.is_active) ||
            data.maintenance[0];
          setMaintenanceAmount(activeMaintenance.monthly_amount || "");

          // Store maintenance info
          setApartmentMaintenance((prev) => ({
            ...prev,
            [apartment.id]: {
              currentAmount: activeMaintenance.monthly_amount,
              effectiveFrom: activeMaintenance.effective_from,
              history: data.maintenance,
            },
          }));
        }
      } catch (err) {
        console.error("Failed to load maintenance data:", err);
      }
    }

    setShowMaintenanceModal(true);
  };

  // In ApartmentsTab.tsx, update the handleSetMaintenance function:
  const handleSetMaintenance = async () => {
    if (
      !selectedApartment ||
      !buildingId ||
      !maintenanceAmount ||
      isNaN(parseFloat(maintenanceAmount))
    ) {
      return;
    }

    setSettingMaintenance(true);
    try {
      const res = await api.post(
        `/admin/buildings/${buildingId}/apartments/${selectedApartment.id}/maintenance`,
        {
          monthly_amount: parseFloat(maintenanceAmount),
          effective_from:
            effectiveFrom || new Date().toISOString().split("T")[0],
        }
      );

      const data = res?.data || res;
      if (data.maintenance) {
        // Update local state
        setApartmentMaintenance((prev) => ({
          ...prev,
          [selectedApartment.id]: {
            currentAmount: data.maintenance.monthly_amount,
            effectiveFrom: data.maintenance.effective_from,
            history: [
              ...(prev[selectedApartment.id]?.history || []),
              data.maintenance,
            ],
          },
        }));

        // Generate payment for current month
        await generateMonthlyPaymentForApartment(
          buildingId,
          selectedApartment.id,
          data.maintenance
        );

        setShowMaintenanceModal(false);
        setSelectedApartment(null);
      }
    } catch (err: any) {
      console.error("Failed to set maintenance:", err);
    } finally {
      setSettingMaintenance(false);
    }
  };

  // Add this helper function after the handleSetMaintenance function
  const generateMonthlyPaymentForApartment = async (
    buildingId: string,
    apartmentId: number,
    maintenance: any
  ) => {
    try {
      const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
      const firstDayOfMonth = `${currentMonth}-01`;

      const res = await api.post(
        `/admin/buildings/${buildingId}/generate-monthly-payment`,
        {
          apartment_id: apartmentId,
          monthly_amount: maintenance.monthly_amount,
          due_date: firstDayOfMonth,
          apartment_maintenance_id: maintenance.id,
        }
      );

      console.log("Payment generated:", res?.data || res);
    } catch (error: any) {
      // If error is "Payment already exists", that's fine
      if (error.response?.data?.error?.includes("already exists")) {
        console.log("Payment already exists for this month");
        return;
      }
      console.error("Failed to generate payment:", error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <div>
      {/* Create Apartment Card */}
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
                  <IonLabel position="floating">Owner Name</IonLabel>
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
                      "linear-gradient(135deg, #9eaadcff 0%, #8a73a0ff 100%)",
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

      {/* Apartments List Card */}
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
                  alignItems: "center",
                }}
              >
                <IonCol size="3">Unit Number</IonCol>
                <IonCol size="3">Owner</IonCol>
                <IonCol size="3">Monthly Maintenance</IonCol>
                <IonCol size="3" style={{ textAlign: "right" }}>
                  Actions
                </IonCol>
              </IonRow>

              {apartments.map((apt) => {
                const maintenance = apartmentMaintenance[apt.id];
                const currentAmount = maintenance?.currentAmount || 0;

                return (
                  <IonRow
                    key={apt.id}
                    style={{
                      borderBottom: "1px solid #f1f5f9",
                      padding: "16px 0",
                      alignItems: "center",
                    }}
                  >
                    <IonCol size="3">
                      <div style={{ fontWeight: "600", color: "#334155" }}>
                        {apt.unit_number}
                      </div>
                      <div style={{ fontSize: "12px", color: "#94a3b8" }}>
                        Created: {new Date(apt.created_at).toLocaleDateString()}
                      </div>
                    </IonCol>

                    <IonCol size="3">
                      <div style={{ color: "#64748b" }}>
                        {apt.owner_name || "—"}
                      </div>
                    </IonCol>

                    <IonCol size="3">
                      <div
                        style={{
                          fontWeight: "600",
                          color: currentAmount > 0 ? "#059669" : "#94a3b8",
                        }}
                      >
                        {currentAmount > 0
                          ? formatCurrency(currentAmount)
                          : "Not set"}
                      </div>
                      {maintenance?.effectiveFrom && (
                        <div style={{ fontSize: "12px", color: "#64748b" }}>
                          From:{" "}
                          {new Date(
                            maintenance.effectiveFrom
                          ).toLocaleDateString()}
                        </div>
                      )}
                    </IonCol>

                    <IonCol size="3" style={{ textAlign: "right" }}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "flex-end",
                          gap: "8px",
                        }}
                      >
                        <IonButton
                          fill="clear"
                          color="primary"
                          onClick={() => openMaintenanceModal(apt)}
                          size="small"
                          style={{
                            "--padding-start": "4px",
                            "--padding-end": "4px",
                          }}
                        >
                          <IonIcon icon={settingsOutline} slot="icon-only" />
                        </IonButton>

                        <IonButton
                          fill="clear"
                          color="danger"
                          onClick={() => onDeleteApartment(apt.id)}
                          size="small"
                          style={{
                            "--padding-start": "4px",
                            "--padding-end": "4px",
                          }}
                        >
                          <IonIcon icon={trashOutline} slot="icon-only" />
                        </IonButton>
                      </div>
                    </IonCol>
                  </IonRow>
                );
              })}
            </IonGrid>
          )}
        </IonCardContent>
      </IonCard>

      {/* Maintenance Modal */}
      <IonModal
        isOpen={showMaintenanceModal}
        onDidDismiss={() => setShowMaintenanceModal(false)}
      >
        <IonHeader>
          <IonToolbar>
            <IonTitle>Set Monthly Maintenance</IonTitle>
            <IonButton
              slot="end"
              fill="clear"
              onClick={() => setShowMaintenanceModal(false)}
            >
              Close
            </IonButton>
          </IonToolbar>
        </IonHeader>

        <IonContent>
          {selectedApartment && (
            <div style={{ padding: "20px" }}>
              <IonCard style={{ borderRadius: "12px", marginBottom: "20px" }}>
                <IonCardContent>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      marginBottom: "16px",
                    }}
                  >
                    <div
                      style={{
                        width: "48px",
                        height: "48px",
                        borderRadius: "12px",
                        background:
                          "linear-gradient(135deg, #9eaadcff 0%, #8a73a0ff 100%)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "white",
                      }}
                    >
                      <IonIcon
                        icon={homeOutline}
                        style={{ fontSize: "24px" }}
                      />
                    </div>
                    <div>
                      <div
                        style={{
                          fontWeight: "700",
                          fontSize: "16px",
                          color: "#1e293b",
                        }}
                      >
                        {selectedApartment.unit_number}
                      </div>
                      <div style={{ color: "#64748b", fontSize: "14px" }}>
                        {selectedApartment.owner_name || "No owner assigned"}
                      </div>
                    </div>
                  </div>
                </IonCardContent>
              </IonCard>

              <IonList>
                <IonItem style={{ marginBottom: "16px" }}>
                  <IonLabel position="floating">
                    Monthly Maintenance Amount (₹) *
                  </IonLabel>
                  <IonInput
                    type="number"
                    value={maintenanceAmount}
                    onIonChange={(e) => setMaintenanceAmount(e.detail.value!)}
                    placeholder="5000"
                  />
                  <IonNote slot="helper">
                    Amount due on 1st of every month
                  </IonNote>
                </IonItem>

                <IonItem style={{ marginBottom: "16px" }}>
                  <IonLabel position="floating">Effective From</IonLabel>
                  <IonInput
                    type="date"
                    value={effectiveFrom}
                    onIonChange={(e) => setEffectiveFrom(e.detail.value!)}
                  />
                  <IonNote slot="helper">
                    Date from which this amount applies
                  </IonNote>
                </IonItem>

                {apartmentMaintenance[selectedApartment.id]?.history &&
                  apartmentMaintenance[selectedApartment.id].history.length >
                    0 && (
                    <div style={{ marginBottom: "20px" }}>
                      <h3
                        style={{
                          fontSize: "14px",
                          fontWeight: "600",
                          color: "#64748b",
                          marginBottom: "12px",
                        }}
                      >
                        Maintenance History
                      </h3>
                      <div
                        style={{
                          background: "#f8fafc",
                          borderRadius: "8px",
                          padding: "12px",
                        }}
                      >
                        {apartmentMaintenance[selectedApartment.id].history.map(
                          (record: any, index: number) => (
                            <div
                              key={index}
                              style={{
                                padding: "8px 0",
                                borderBottom:
                                  index <
                                  apartmentMaintenance[selectedApartment.id]
                                    .history.length -
                                    1
                                    ? "1px solid #e2e8f0"
                                    : "none",
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                              }}
                            >
                              <div>
                                <div
                                  style={{
                                    fontWeight: "600",
                                    color: "#334155",
                                  }}
                                >
                                  {formatCurrency(record.monthly_amount)}
                                </div>
                                <div
                                  style={{ fontSize: "12px", color: "#94a3b8" }}
                                >
                                  {new Date(
                                    record.effective_from
                                  ).toLocaleDateString()}
                                  {record.effective_to &&
                                    ` - ${new Date(
                                      record.effective_to
                                    ).toLocaleDateString()}`}
                                </div>
                              </div>
                              {record.is_active && (
                                <IonBadge
                                  color="success"
                                  style={{ fontSize: "10px" }}
                                >
                                  Active
                                </IonBadge>
                              )}
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )}

                <IonButton
                  expand="block"
                  onClick={handleSetMaintenance}
                  disabled={
                    settingMaintenance ||
                    !maintenanceAmount ||
                    isNaN(parseFloat(maintenanceAmount))
                  }
                  style={{
                    "--background":
                      "linear-gradient(135deg, #9eaadcff 0%, #8a73a0ff 100%)",
                    "--border-radius": "10px",
                    marginTop: "20px",
                  }}
                >
                  {settingMaintenance ? "Saving..." : "Set Maintenance"}
                </IonButton>
              </IonList>
            </div>
          )}
        </IonContent>
      </IonModal>
    </div>
  );
};

export default ApartmentsTab;
