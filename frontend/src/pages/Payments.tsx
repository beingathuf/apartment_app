// src/pages/Payments.jsx - UPDATED
import React, { useMemo, useState, useEffect } from "react";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  IonButton,
  IonCheckbox,
  IonToast,
  IonBadge,
  IonIcon,
  IonSpinner,
  IonCard,
  IonCardContent,
  IonGrid,
  IonRow,
  IonCol,
  IonNote,
} from "@ionic/react";
import {
  walletOutline,
  cashOutline,
  calendarOutline,
  checkmarkCircleOutline,
} from "ionicons/icons";
import api from "../api";

export default function PaymentsPage() {
  const [bills, setBills] = useState([]);
  const [selected, setSelected] = useState(() => new Set());
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, msg: "" });
  const [stats, setStats] = useState({
    total: 0,
    paid: 0,
    unpaid: 0,
    total_due: 0,
    total_paid: 0,
  });

  useEffect(() => {
    loadPayments();
  }, []);

  const loadPayments = async () => {
    try {
      setLoading(true);

      // Get building ID from user info
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const buildingId = user.buildingId || user.building_id;

      if (!buildingId) {
        setToast({ show: true, msg: "Could not determine building" });
        return;
      }

      // Load payments
      const paymentsRes = await api.get(`/buildings/${buildingId}/payments`);
      const paymentsData = paymentsRes?.data || paymentsRes;

      // Load stats
      const statsRes = await api.get(`/buildings/${buildingId}/payments/stats`);
      const statsData = statsRes?.data || statsRes;

      // Format bills for display
      const formattedBills = (paymentsData.payments || []).map((payment) => ({
        id: payment.id,
        name: payment.display_name || payment.bill_name,
        amount: `₹${Number(payment.amount).toLocaleString("en-IN")}`,
        amountRaw: payment.amount,
        status: payment.status === "paid" ? "Paid" : "Unpaid",
        date: new Date(payment.due_date).toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
          year: "numeric",
        }),
        due_date: payment.due_date,
        bill_type: payment.bill_type,
        description: payment.extra_description || "",
      }));

      setBills(formattedBills);
      setStats(statsData.stats || stats);
    } catch (error) {
      console.error("Failed to load payments:", error);
      setToast({ show: true, msg: "Failed to load payments" });
    } finally {
      setLoading(false);
    }
  };

  function parseAmount(str) {
    if (!str) return 0;
    const digits = str.replace(/[^\d.-]/g, "");
    return Number(digits) || 0;
  }

  const formatter = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  });

  const total = useMemo(() => {
    let t = 0;
    for (const bill of bills) {
      if (selected.has(bill.id) && bill.status !== "Paid") {
        t += parseAmount(bill.amount);
      }
    }
    return t;
  }, [bills, selected]);

  function toggleSelect(id, checked) {
    setSelected((prev) => {
      const s = new Set(prev);
      if (checked) s.add(id);
      else s.delete(id);
      return s;
    });
  }

  function toggleSelectAll() {
    const unpaid = bills.filter((b) => b.status !== "Paid").map((b) => b.id);
    const allSelected = unpaid.every((id) => selected.has(id));
    if (allSelected) {
      setSelected((prev) => {
        const s = new Set(prev);
        unpaid.forEach((id) => s.delete(id));
        return s;
      });
    } else {
      setSelected((prev) => {
        const s = new Set(prev);
        unpaid.forEach((id) => s.add(id));
        return s;
      });
    }
  }

  async function handlePay() {
    const idsToPay = bills
      .filter((b) => selected.has(b.id) && b.status !== "Paid")
      .map((b) => b.id);

    if (idsToPay.length === 0) {
      setToast({ show: true, msg: "Select at least one unpaid bill to pay" });
      return;
    }

    setLoading(true);
    try {
      // Process each payment
      for (const id of idsToPay) {
        await api.post(`/payments/${id}/pay`);
      }

      // Reload payments
      await loadPayments();

      // Clear selection
      setSelected(new Set());

      setToast({
        show: true,
        msg: `Payment successful — ${formatter.format(total)}`,
      });
    } catch (e) {
      console.error(e);
      setToast({ show: true, msg: "Payment failed. Please try again." });
    } finally {
      setLoading(false);
    }
  }

  const cardStyle = {
    borderRadius: 14,
    padding: 12,
    background: "linear-gradient(180deg,#ffffff,#fbfdff)",
    boxShadow: "0 12px 30px rgba(2,6,23,0.04)",
    border: "1px solid rgba(17,24,39,0.04)",
    marginBottom: 14,
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar
          style={{
            "--background": "linear-gradient(135deg, #c9d6ff 0%, #e2e2e2 100%)",
            "--color": "#1f2937",
            "--min-height": "70px",
          }}
        >
          <IonTitle
            style={{
              width: "100%",
              textAlign: "center",
              fontWeight: 700,
              color: "#1f2937",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <IonIcon
                icon={walletOutline}
                style={{ fontSize: "20px", color: "#1f2937" }}
              />
              Payments
            </div>
          </IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent
        fullscreen
        style={{
          "--background": `linear-gradient(
            180deg,
            #f5f7ff 0%,
            #f3f4f6 40%,
            #f9fafb 100%
          )`,
        }}
      >
        <div style={{ padding: 16, paddingBottom: 120 }}>
          {/* Stats Summary */}
          <IonCard style={cardStyle}>
            <IonCardContent>
              <IonGrid style={{ padding: 0 }}>
                <IonRow>
                  <IonCol size="6">
                    <div style={{ textAlign: "center" }}>
                      <div
                        style={{
                          fontSize: "12px",
                          color: "#6b7280",
                          marginBottom: "4px",
                        }}
                      >
                        Total Due
                      </div>
                      <div
                        style={{
                          fontWeight: 800,
                          fontSize: "18px",
                          color: "#dc2626",
                        }}
                      >
                        {formatter.format(stats.total_due || 0)}
                      </div>
                    </div>
                  </IonCol>
                  <IonCol size="6">
                    <div style={{ textAlign: "center" }}>
                      <div
                        style={{
                          fontSize: "12px",
                          color: "#6b7280",
                          marginBottom: "4px",
                        }}
                      >
                        Total Paid
                      </div>
                      <div
                        style={{
                          fontWeight: 800,
                          fontSize: "18px",
                          color: "#059669",
                        }}
                      >
                        {formatter.format(stats.total_paid || 0)}
                      </div>
                    </div>
                  </IonCol>
                </IonRow>
                <IonRow>
                  <IonCol size="6">
                    <div style={{ textAlign: "center" }}>
                      <div
                        style={{
                          fontSize: "12px",
                          color: "#6b7280",
                          marginBottom: "4px",
                        }}
                      >
                        Unpaid Bills
                      </div>
                      <div
                        style={{
                          fontWeight: 800,
                          fontSize: "18px",
                          color: "#d97706",
                        }}
                      >
                        {stats.unpaid || 0}
                      </div>
                    </div>
                  </IonCol>
                  <IonCol size="6">
                    <div style={{ textAlign: "center" }}>
                      <div
                        style={{
                          fontSize: "12px",
                          color: "#6b7280",
                          marginBottom: "4px",
                        }}
                      >
                        Paid Bills
                      </div>
                      <div
                        style={{
                          fontWeight: 800,
                          fontSize: "18px",
                          color: "#2563eb",
                        }}
                      >
                        {stats.paid || 0}
                      </div>
                    </div>
                  </IonCol>
                </IonRow>
              </IonGrid>
            </IonCardContent>
          </IonCard>

          {/* Bill Selection */}
          <IonCard style={cardStyle}>
            <IonCardContent>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 12,
                }}
              >
                <div style={{ fontWeight: 700 }}>Select bills to pay</div>
                <div>
                  <IonButton
                    size="small"
                    fill="clear"
                    onClick={toggleSelectAll}
                  >
                    {bills
                      .filter((b) => b.status !== "Paid")
                      .every((b) => selected.has(b.id))
                      ? "Unselect all"
                      : "Select all"}
                  </IonButton>
                </div>
              </div>

              {loading ? (
                <div style={{ textAlign: "center", padding: "20px" }}>
                  <IonSpinner name="crescent" />
                  <div style={{ marginTop: "12px", color: "#6b7280" }}>
                    Loading bills...
                  </div>
                </div>
              ) : bills.length === 0 ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: "40px 20px",
                    color: "#94a3b8",
                  }}
                >
                  <IonIcon
                    icon={checkmarkCircleOutline}
                    style={{ fontSize: "48px", marginBottom: "16px" }}
                  />
                  <div style={{ fontWeight: 600 }}>No pending bills</div>
                  <div style={{ fontSize: "14px", marginTop: "4px" }}>
                    All your payments are up to date
                  </div>
                </div>
              ) : (
                <IonList lines="none">
                  {bills.map((b) => {
                    const isPaid = b.status === "Paid";
                    const checked = selected.has(b.id);
                    return (
                      <IonItem
                        key={b.id}
                        style={{
                          borderRadius: 10,
                          marginBottom: 10,
                          background: "rgba(255,255,255,0.85)",
                        }}
                      >
                        <IonCheckbox
                          slot="start"
                          checked={checked}
                          disabled={isPaid}
                          color="medium"
                          onIonChange={(e) =>
                            toggleSelect(b.id, e.detail.checked)
                          }
                        />

                        <IonLabel>
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              gap: 12,
                            }}
                          >
                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: 800 }}>{b.name}</div>
                              {b.description && (
                                <div
                                  style={{
                                    color: "#6b7280",
                                    fontSize: 12,
                                    marginTop: 2,
                                  }}
                                >
                                  {b.description}
                                </div>
                              )}
                              <div
                                style={{
                                  color: "#6b7280",
                                  fontSize: 12,
                                  marginTop: 4,
                                }}
                              >
                                <IonIcon
                                  icon={calendarOutline}
                                  style={{ fontSize: "12px", marginRight: 4 }}
                                />
                                Due: {b.date}
                              </div>
                            </div>
                            <div style={{ textAlign: "right" }}>
                              <div style={{ fontWeight: 900 }}>{b.amount}</div>
                              <div style={{ marginTop: 6 }}>
                                <IonBadge
                                  color={isPaid ? "success" : "warning"}
                                >
                                  {b.status}
                                </IonBadge>
                              </div>
                            </div>
                          </div>
                        </IonLabel>
                      </IonItem>
                    );
                  })}
                </IonList>
              )}
            </IonCardContent>
          </IonCard>

          {/* Payment Summary */}
          {bills.filter((b) => b.status !== "Paid").length > 0 && (
            <IonCard style={cardStyle}>
              <IonCardContent>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700 }}>Selected total</div>
                    <div style={{ color: "#6b7280", fontSize: 13 }}>
                      {selected.size} bill(s) selected
                    </div>
                  </div>

                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontWeight: 900, fontSize: 18 }}>
                      {formatter.format(total)}
                    </div>
                  </div>
                </div>
                <div style={{ marginTop: 12 }}>
                  <IonButton
                    expand="block"
                    onClick={handlePay}
                    disabled={loading || total <= 0}
                    style={{
                      "--background":
                        "linear-gradient(135deg, #b6c6ffff 0%, #d1d5db 100%)",
                      "--background-activated":
                        "linear-gradient(135deg, #aab8f55d 0%, #c7cdd665 100%)",
                      "--border-radius": "10px",
                      color: "#1f2937",
                      fontWeight: 600,
                    }}
                  >
                    {loading ? (
                      <>
                        <IonSpinner name="crescent" />
                        &nbsp;&nbsp;Processing...
                      </>
                    ) : (
                      "Pay Selected"
                    )}
                  </IonButton>
                  <IonNote
                    style={{
                      display: "block",
                      marginTop: "8px",
                      fontSize: "11px",
                      color: "#6b7280",
                    }}
                  >
                    * Note: This is a simulation. Integrate with a payment
                    gateway for real transactions.
                  </IonNote>
                </div>
              </IonCardContent>
            </IonCard>
          )}

          {/* Payment Information */}
          <IonCard style={cardStyle}>
            <IonCardContent>
              <div style={{ fontWeight: 700, marginBottom: 8 }}>
                Payment Information
              </div>
              <div style={{ color: "#6b7280", fontSize: 13 }}>
                <p style={{ marginBottom: 8 }}>
                  • Monthly maintenance is automatically generated on the 1st of
                  every month
                </p>
                <p style={{ marginBottom: 8 }}>
                  • Extra payments are added by your building administrator
                </p>
                <p>• Payments are due on the date specified for each bill</p>
              </div>
            </IonCardContent>
          </IonCard>
        </div>

        <IonToast
          isOpen={toast.show}
          message={toast.msg}
          duration={1800}
          onDidDismiss={() => setToast({ show: false, msg: "" })}
        />
      </IonContent>
    </IonPage>
  );
}
