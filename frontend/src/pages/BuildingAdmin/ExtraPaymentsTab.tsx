// src/pages/BuildingAdmin/ExtraPaymentsTab.tsx
import React, { useState, useEffect } from "react";
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
  IonSelect,
  IonSelectOption,
  IonTextarea,
  IonBadge,
  IonNote,
} from "@ionic/react";
import {
  addOutline,
  cashOutline,
  calendarOutline,
  businessOutline,
  receiptOutline,
} from "ionicons/icons";
import { Apartment } from "./types";
import api from "../../api";

interface ExtraPaymentsTabProps {
  buildingId: string | null;
  apartments: Apartment[];
}

interface ExtraPayment {
  id: number;
  bill_name: string;
  description: string;
  amount: number;
  due_date: string;
  apartment_id: number | null;
  applied_to_all: boolean;
  status: string;
  created_at: string;
  apartment_unit?: string;
}

const ExtraPaymentsTab: React.FC<ExtraPaymentsTabProps> = ({ buildingId, apartments }) => {
  const [extraPayments, setExtraPayments] = useState<ExtraPayment[]>([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  
  // Form state
  const [billName, setBillName] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [selectedApartmentId, setSelectedApartmentId] = useState<string>("");
  const [applyToAll, setApplyToAll] = useState(false);

  useEffect(() => {
    if (buildingId) {
      loadExtraPayments();
    }
  }, [buildingId]);

  const loadExtraPayments = async () => {
    if (!buildingId) return;
    
    setLoading(true);
    try {
      const res = await api.get(`/admin/buildings/${buildingId}/extra-payments`);
      const data = res?.data || res;
      setExtraPayments(data.extra_payments || []);
    } catch (err) {
      console.error('Failed to load extra payments:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateExtraPayment = async () => {
    if (!buildingId || !billName.trim() || !amount || !dueDate) {
      return;
    }

    if (!applyToAll && !selectedApartmentId) {
      return;
    }

    setBusy(true);
    try {
      const res = await api.post(`/admin/buildings/${buildingId}/extra-payments`, {
        bill_name: billName.trim(),
        description: description.trim(),
        amount: parseFloat(amount),
        due_date: dueDate,
        apartment_id: applyToAll ? null : parseInt(selectedApartmentId),
        apply_to_all: applyToAll,
      });

      const data = res?.data || res;
      if (data.extra_payment) {
        // Reset form
        setBillName("");
        setDescription("");
        setAmount("");
        setDueDate("");
        setSelectedApartmentId("");
        setApplyToAll(false);
        
        // Reload payments
        await loadExtraPayments();
      }
    } catch (err: any) {
      console.error('Failed to create extra payment:', err);
    } finally {
      setBusy(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div>
      {/* Create Extra Payment Card */}
      <IonCard style={{ borderRadius: "16px", marginBottom: "20px" }}>
        <IonCardContent>
          <h2 style={{ fontSize: "18px", fontWeight: "700", marginBottom: "16px", color: "#1e293b" }}>
            <IonIcon icon={addOutline} style={{ marginRight: "8px", verticalAlign: "middle" }} />
            Add Extra Payment
          </h2>
          
          <IonGrid style={{ padding: 0 }}>
            <IonRow>
              <IonCol size="12" sizeMd="6">
                <IonItem style={{ "--background": "transparent", "--border-color": "#e2e8f0", marginBottom: "16px" }}>
                  <IonLabel position="floating">Bill Name *</IonLabel>
                  <IonInput
                    value={billName}
                    onIonChange={(e) => setBillName(e.detail.value!)}
                    placeholder="Water Bill, Parking Fee, etc."
                    clearInput
                  />
                </IonItem>
              </IonCol>
              
              <IonCol size="12" sizeMd="6">
                <IonItem style={{ "--background": "transparent", "--border-color": "#e2e8f0", marginBottom: "16px" }}>
                  <IonLabel position="floating">Amount (₹) *</IonLabel>
                  <IonInput
                    type="number"
                    value={amount}
                    onIonChange={(e) => setAmount(e.detail.value!)}
                    placeholder="1500"
                    clearInput
                  />
                </IonItem>
              </IonCol>
            </IonRow>

            <IonRow>
              <IonCol size="12" sizeMd="6">
                <IonItem style={{ "--background": "transparent", "--border-color": "#e2e8f0", marginBottom: "16px" }}>
                  <IonLabel position="floating">Due Date *</IonLabel>
                  <IonInput
                    type="date"
                    value={dueDate}
                    onIonChange={(e) => setDueDate(e.detail.value!)}
                  />
                </IonItem>
              </IonCol>
              
              <IonCol size="12" sizeMd="6">
                <IonItem style={{ "--background": "transparent", "--border-color": "#e2e8f0", marginBottom: "16px" }}>
                  <IonLabel>Apply To</IonLabel>
                  <IonSelect
                    value={applyToAll ? "all" : "single"}
                    onIonChange={(e) => setApplyToAll(e.detail.value === "all")}
                    interface="action-sheet"
                  >
                    <IonSelectOption value="single">Specific Apartment</IonSelectOption>
                    <IonSelectOption value="all">All Apartments</IonSelectOption>
                  </IonSelect>
                </IonItem>
              </IonCol>
            </IonRow>

            {!applyToAll && (
              <IonRow>
                <IonCol size="12">
                  <IonItem style={{ "--background": "transparent", "--border-color": "#e2e8f0", marginBottom: "16px" }}>
                    <IonLabel>Select Apartment</IonLabel>
                    <IonSelect
                      value={selectedApartmentId}
                      onIonChange={(e) => setSelectedApartmentId(e.detail.value)}
                      interface="action-sheet"
                    >
                      {apartments.map((apt) => (
                        <IonSelectOption key={apt.id} value={apt.id}>
                          {apt.unit_number} {apt.owner_name && `(${apt.owner_name})`}
                        </IonSelectOption>
                      ))}
                    </IonSelect>
                  </IonItem>
                </IonCol>
              </IonRow>
            )}

            <IonRow>
              <IonCol size="12">
                <IonItem style={{ "--background": "transparent", "--border-color": "#e2e8f0", marginBottom: "16px" }}>
                  <IonLabel position="floating">Description</IonLabel>
                  <IonTextarea
                    value={description}
                    onIonChange={(e) => setDescription(e.detail.value!)}
                    placeholder="Additional details about this payment..."
                    rows={3}
                    autoGrow
                  />
                </IonItem>
              </IonCol>
            </IonRow>

            <IonRow>
              <IonCol>
                <IonButton
                  expand="block"
                  onClick={handleCreateExtraPayment}
                  disabled={busy || !billName.trim() || !amount || !dueDate || (!applyToAll && !selectedApartmentId)}
                  style={{
                    "--background": "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                    "--border-radius": "10px",
                    height: "44px",
                  }}
                >
                  <IonIcon icon={cashOutline} slot="start" />
                  {busy ? "Creating..." : "Create Payment"}
                </IonButton>
                <IonNote style={{ display: "block", marginTop: "8px", color: "#64748b", fontSize: "12px" }}>
                  * Payments will be automatically added to resident's dashboard
                </IonNote>
              </IonCol>
            </IonRow>
          </IonGrid>
        </IonCardContent>
      </IonCard>

      {/* Extra Payments List Card */}
      <IonCard style={{ borderRadius: "16px" }}>
        <IonCardContent>
          <h2 style={{ fontSize: "18px", fontWeight: "700", marginBottom: "16px", color: "#1e293b" }}>
            <IonIcon icon={receiptOutline} style={{ marginRight: "8px", verticalAlign: "middle" }} />
            Extra Payments ({extraPayments.length})
          </h2>

          {loading ? (
            <div style={{ textAlign: "center", padding: "40px 20px", color: "#94a3b8" }}>
              Loading extra payments...
            </div>
          ) : extraPayments.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 20px", color: "#94a3b8" }}>
              <IonIcon icon={cashOutline} style={{ fontSize: "48px", marginBottom: "16px" }} />
              <div style={{ fontWeight: "600" }}>No extra payments yet</div>
              <div style={{ fontSize: "14px", marginTop: "4px" }}>Create your first extra payment above</div>
            </div>
          ) : (
            <IonGrid style={{ padding: 0 }}>
              <IonRow style={{
                borderBottom: "1px solid #e2e8f0",
                padding: "12px 0",
                fontWeight: "600",
                color: "#64748b",
                alignItems: "center",
              }}>
                <IonCol size="3">Bill Name</IonCol>
                <IonCol size="2">Amount</IonCol>
                <IonCol size="2">Due Date</IonCol>
                <IonCol size="3">Applied To</IonCol>
                <IonCol size="2">Status</IonCol>
              </IonRow>
              
              {extraPayments.map((payment) => (
                <IonRow
                  key={payment.id}
                  style={{
                    borderBottom: "1px solid #f1f5f9",
                    padding: "16px 0",
                    alignItems: "center",
                  }}
                >
                  <IonCol size="3">
                    <div style={{ fontWeight: "600", color: "#334155" }}>{payment.bill_name}</div>
                    {payment.description && (
                      <div style={{ fontSize: "12px", color: "#94a3b8", marginTop: "4px" }}>
                        {payment.description}
                      </div>
                    )}
                  </IonCol>
                  
                  <IonCol size="2">
                    <div style={{ fontWeight: "600", color: "#059669" }}>
                      {formatCurrency(payment.amount)}
                    </div>
                  </IonCol>
                  
                  <IonCol size="2">
                    <div style={{ color: "#64748b", display: "flex", alignItems: "center", gap: "4px" }}>
                      <IonIcon icon={calendarOutline} style={{ fontSize: "14px" }} />
                      {formatDate(payment.due_date)}
                    </div>
                    <div style={{ fontSize: "11px", color: "#94a3b8" }}>
                      Created: {new Date(payment.created_at).toLocaleDateString()}
                    </div>
                  </IonCol>
                  
                  <IonCol size="3">
                    <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                      <IonIcon icon={businessOutline} style={{ fontSize: "14px", color: "#64748b" }} />
                      {payment.applied_to_all ? (
                        <span style={{ color: "#334155", fontWeight: "600" }}>All Apartments</span>
                      ) : (
                        <span style={{ color: "#334155" }}>
                          {apartments.find(a => a.id === payment.apartment_id)?.unit_number || 'Unknown'}
                        </span>
                      )}
                    </div>
                  </IonCol>
                  
                  <IonCol size="2">
                    <IonBadge 
                      color={payment.status === 'active' ? 'success' : 'medium'}
                      style={{ fontSize: "11px" }}
                    >
                      {payment.status.toUpperCase()}
                    </IonBadge>
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

export default ExtraPaymentsTab;