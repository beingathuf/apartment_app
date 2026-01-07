import React, { useState } from "react";
import {
  IonCard,
  IonCardContent,
  IonButton,
  IonItem,
  IonLabel,
  IonSelect,
  IonSelectOption,
  IonToast,
  IonIcon,
  IonNote,
} from "@ionic/react";
import { cashOutline, refreshOutline } from "ionicons/icons";
import { Apartment } from "./types";
import api from "../../api";

interface GeneratePaymentsTabProps {
  buildingId: string | null;
  apartments: Apartment[];
}

const GeneratePaymentsTab: React.FC<GeneratePaymentsTabProps> = ({
  buildingId,
  apartments,
}) => {
  const [selectedMonth, setSelectedMonth] = useState(
    String(new Date().getMonth() + 1).padStart(2, "0")
  );
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [generating, setGenerating] = useState(false);
  const [toast, setToast] = useState({ 
    show: false, 
    message: "", 
    color: "success" as "success" | "danger" | "warning" 
  });

  const months = [
    { value: "01", name: "January" },
    { value: "02", name: "February" },
    { value: "03", name: "March" },
    { value: "04", name: "April" },
    { value: "05", name: "May" },
    { value: "06", name: "June" },
    { value: "07", name: "July" },
    { value: "08", name: "August" },
    { value: "09", name: "September" },
    { value: "10", name: "October" },
    { value: "11", name: "November" },
    { value: "12", name: "December" },
  ];

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() + i - 2);

  const handleGeneratePayments = async () => {
    if (!buildingId || !selectedMonth) {
      setToast({
        show: true,
        message: "Please select a month and year",
        color: "warning",
      });
      return;
    }

    setGenerating(true);
    try {
      const dueDate = `${selectedYear}-${selectedMonth}-01`;
      
      const res = await api.post(
        `/admin/buildings/${buildingId}/generate-monthly-payments`,
        { due_date: dueDate }
      );

      const data = res?.data || res;
      setToast({
        show: true,
        message: data.message || `Payments generated for ${selectedYear}-${selectedMonth}`,
        color: "success",
      });
    } catch (error: any) {
      console.error("Failed to generate payments:", error);
      setToast({
        show: true,
        message: error.response?.data?.error || "Failed to generate payments",
        color: "danger",
      });
    } finally {
      setGenerating(false);
    }
  };

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
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <IonIcon icon={refreshOutline} />
            Generate Monthly Payments
          </h2>

          <IonItem style={{ marginBottom: "16px" }}>
            <IonLabel>Select Month</IonLabel>
            <IonSelect
              value={selectedMonth}
              onIonChange={(e) => setSelectedMonth(e.detail.value)}
              interface="action-sheet"
            >
              {months.map((month) => (
                <IonSelectOption key={month.value} value={month.value}>
                  {month.name}
                </IonSelectOption>
              ))}
            </IonSelect>
          </IonItem>

          <IonItem style={{ marginBottom: "16px" }}>
            <IonLabel>Select Year</IonLabel>
            <IonSelect
              value={selectedYear}
              onIonChange={(e) => setSelectedYear(e.detail.value)}
              interface="action-sheet"
            >
              {years.map((year) => (
                <IonSelectOption key={year} value={year}>
                  {year}
                </IonSelectOption>
              ))}
            </IonSelect>
          </IonItem>

          <IonButton
            expand="block"
            onClick={handleGeneratePayments}
            disabled={generating || !selectedMonth}
            style={{
              "--background": "linear-gradient(135deg, #10b981 0%, #059669 100%)",
              "--border-radius": "10px",
              height: "44px",
            }}
          >
            <IonIcon icon={cashOutline} slot="start" />
            {generating ? "Generating..." : "Generate Payments"}
          </IonButton>

          <IonNote style={{ display: "block", marginTop: "12px", color: "#64748b", fontSize: "12px" }}>
            This will create maintenance payments for all apartments with active maintenance plans.
            Payments will be due on the 1st of the selected month.
          </IonNote>
        </IonCardContent>
      </IonCard>

      <IonToast
        isOpen={toast.show}
        message={toast.message}
        duration={3000}
        color={toast.color}
        onDidDismiss={() => setToast({ ...toast, show: false })}
      />
    </div>
  );
};

export default GeneratePaymentsTab;