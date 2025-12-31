// src/pages/Payments.jsx
import React, { useMemo, useState } from "react";
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
} from "@ionic/react";
import { walletOutline } from "ionicons/icons";

/**
 * Payments page
 * - Select bills to pay
 * - Shows total
 * - Mock "Pay" flow which marks selected bills as Paid
 *
 * Replace mock payment code with real integration when ready.
 */

export default function PaymentsPage() {
  // sample bills (in production fetch from API)
  const [bills, setBills] = useState([
    {
      id: 1,
      name: "Maintenance — Oct",
      amount: "₹5,200",
      status: "Unpaid",
      date: "10 Oct 2025",
    },
    {
      id: 2,
      name: "Water Bill",
      amount: "₹1,250",
      status: "Unpaid",
      date: "24 Sep 2025",
    },
    {
      id: 3,
      name: "Parking Fee",
      amount: "₹800",
      status: "Paid",
      date: "15 Sep 2025",
    },
  ]);

  // selected bill ids
  const [selected, setSelected] = useState(() => new Set());
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, msg: "" });

  // parse currency strings like "₹5,200" to number 5200
  function parseAmount(str) {
    if (!str) return 0;
    const digits = str.replace(/[^\d.-]/g, "");
    return Number(digits) || 0;
  }

  // format number to INR
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
      // unselect all unpaid
      setSelected((prev) => {
        const s = new Set(prev);
        unpaid.forEach((id) => s.delete(id));
        return s;
      });
    } else {
      // select all unpaid
      setSelected((prev) => {
        const s = new Set(prev);
        unpaid.forEach((id) => s.add(id));
        return s;
      });
    }
  }

  async function handlePay() {
    // guard
    const idsToPay = bills
      .filter((b) => selected.has(b.id) && b.status !== "Paid")
      .map((b) => b.id);
    if (idsToPay.length === 0) {
      setToast({ show: true, msg: "Select at least one unpaid bill to pay" });
      return;
    }

    // mock payment flow
    setLoading(true);
    try {
      // simulate network/payment delay
      await new Promise((resolve) => setTimeout(resolve, 1200));

      // mark bills as Paid locally
      const updated = bills.map((b) => {
        if (idsToPay.includes(b.id)) {
          return { ...b, status: "Paid" };
        }
        return b;
      });
      setBills(updated);

      // remove paid ids from selection
      setSelected((prev) => {
        const s = new Set(prev);
        idsToPay.forEach((id) => s.delete(id));
        return s;
      });

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

  const sectionTitle = {
    fontWeight: 900,
    fontSize: 18,
    marginBottom: 12,
    color: "#1f2937",
  };

  const cardStyle = {
    borderRadius: 14,
    padding: 12,
    background: "linear-gradient(180deg,#ffffff,#fbfdff)",
    boxShadow: "0 12px 30px rgba(2,6,23,0.04)",
    border: "1px solid rgba(17,24,39,0.04)",
    marginBottom: 14,
  };
  const payBarStyle = {
    position: "sticky",
    bottom: 12,
    left: 16,
    right: 16,
    padding: 12,
    borderRadius: 12,
    background: "rgba(255,255,255,0.95)",
    boxShadow: "0 10px 30px rgba(2,6,23,0.06)",
    display: "flex",
    gap: 12,
    alignItems: "center",
    justifyContent: "space-between",
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
          <div style={cardStyle}>
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
                <IonButton size="small" fill="clear" onClick={toggleSelectAll}>
                  {bills
                    .filter((b) => b.status !== "Paid")
                    .every((b) => selected.has(b.id))
                    ? "Unselect all"
                    : "Select all"}
                </IonButton>
              </div>
            </div>

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
                      onIonChange={(e) => toggleSelect(b.id, e.detail.checked)}
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
                        <div>
                          <div style={{ fontWeight: 800 }}>{b.name}</div>
                          <div style={{ color: "#6b7280", fontSize: 12 }}>
                            {b.date}
                          </div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontWeight: 900 }}>{b.amount}</div>
                          <div style={{ marginTop: 6 }}>
                            <IonBadge color={isPaid ? "success" : "warning"}>
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
          </div>

          {/* quick summary card */}
          <div style={cardStyle}>
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
                  Pay only what you choose
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
            </div>
          </div>
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
