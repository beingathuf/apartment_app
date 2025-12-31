import React from "react";
import {
  IonGrid,
  IonRow,
  IonCol,
  IonIcon,
  IonRippleEffect,
} from "@ionic/react";
import {
  homeOutline,
  peopleOutline,
  megaphoneOutline,
  calendarOutline,
  checkmarkCircleOutline,
  notificationsOutline,
  arrowForwardOutline,
} from "ionicons/icons";

interface DashboardTabProps {
  stats: {
    totalApartments: number;
    totalResidents: number;
    pendingBookings: number;
    pendingComplaints: number;
  };
  onTabChange: (tab: string) => void;
}

const DashboardTab: React.FC<DashboardTabProps> = ({
  stats,
  onTabChange,
}) => {
  return (
    <IonGrid style={{ padding: "10px" }}>
      {/* 🔥 HERO CARDS */}
      <IonRow>
        <IonCol size="12">
          <HeroCard
            title="Pending Complaints"
            value={stats.pendingComplaints}
            subtitle="Requires immediate attention"
            icon={megaphoneOutline}
            gradient="linear-gradient(135deg, #ef4444, #f97316)"
            onClick={() => onTabChange("complaints")}
          />
        </IonCol>

        <IonCol size="12">
          <HeroCard
            title="Pending Bookings"
            value={stats.pendingBookings}
            subtitle="Appointments awaiting action"
            icon={calendarOutline}
            gradient="linear-gradient(135deg, #3b82f6, #6366f1)"
            onClick={() => onTabChange("bookings")}
          />
        </IonCol>
      </IonRow>

      {/* 📊 STATS */}
      <IonRow>
        <IonCol size="6">
          <StatCard
            title="Apartments"
            value={stats.totalApartments}
            icon={homeOutline}
            onClick={() => onTabChange("apartments")}
          />
        </IonCol>

        <IonCol size="6">
          <StatCard
            title="Residents"
            value={stats.totalResidents}
            icon={peopleOutline}
            onClick={() => onTabChange("residents")}
          />
        </IonCol>
      </IonRow>

      {/* ⚡ QUICK ACTIONS */}
      <IonRow>
        <IonCol size="6">
          <ActionCard
            title="Verify Pass"
            icon={checkmarkCircleOutline}
            onClick={() => onTabChange("verify")}
          />
        </IonCol>

        <IonCol size="6">
          <ActionCard
            title="Notices"
            icon={notificationsOutline}
            onClick={() => onTabChange("notices")}
          />
        </IonCol>
      </IonRow>
    </IonGrid>
  );
};

export default DashboardTab;

/* ================= COMPONENTS ================= */

const HeroCard = ({
  title,
  value,
  subtitle,
  icon,
  gradient,
  onClick,
}: any) => (
  <div
    className="ion-activatable ripple-parent"
    onClick={onClick}
    style={{
      background: gradient,
      borderRadius: "22px",
      padding: "26px",
      marginBottom: "18px",
      color: "#fff",
      boxShadow: "0 18px 40px rgba(0,0,0,0.18)",
      position: "relative",
      overflow: "hidden",
    }}
  >
    <IonRippleEffect />

    {/* Background icon */}
    <IonIcon
      icon={icon}
      style={{
        position: "absolute",
        right: "-14px",
        top: "-14px",
        fontSize: "130px",
        opacity: 0.18,
      }}
    />

    {/* Arrow */}
    <div
      style={{
        position: "absolute",
        right: "18px",
        bottom: "18px",
        width: "44px",
        height: "44px",
        borderRadius: "50%",
        background: "rgba(255,255,255,0.25)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backdropFilter: "blur(6px)",
      }}
    >
      <IonIcon
        icon={arrowForwardOutline}
        style={{ fontSize: "20px", color: "#fff" }}
      />
    </div>

    <div style={{ fontSize: "14px", opacity: 0.9 }}>{subtitle}</div>
    <div style={{ fontSize: "46px", fontWeight: 900 }}>{value}</div>
    <div style={{ fontSize: "18px", fontWeight: 700 }}>{title}</div>
  </div>
);

const StatCard = ({ title, value, icon, onClick }: any) => (
  <div
    className="ion-activatable ripple-parent"
    onClick={onClick}
    style={{
      background: "#ffffff",
      borderRadius: "18px",
      padding: "18px",
      marginBottom: "14px",
      border: "1px solid #e5e7eb",
      boxShadow: "0 8px 20px rgba(0,0,0,0.06)",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
    }}
  >
    <IonRippleEffect />

    <div>
      <IonIcon
        icon={icon}
        style={{ fontSize: "26px", color: "#6366f1" }}
      />
      <div style={{ fontSize: "32px", fontWeight: 800 }}>{value}</div>
      <div style={{ fontSize: "14px", color: "#6b7280" }}>{title}</div>
    </div>

    <IonIcon
      icon={arrowForwardOutline}
      style={{
        fontSize: "22px",
        color: "#9ca3af",
      }}
    />
  </div>
);

const ActionCard = ({ title, icon, onClick }: any) => (
  <div
    className="ion-activatable ripple-parent"
    onClick={onClick}
    style={{
      background: "linear-gradient(135deg, #f9fafb, #eef2ff)",
      borderRadius: "18px",
      padding: "22px",
      marginBottom: "14px",
      textAlign: "center",
      boxShadow: "0 6px 16px rgba(0,0,0,0.06)",
      position: "relative",
    }}
  >
    <IonRippleEffect />

    <IonIcon
      icon={icon}
      style={{
        fontSize: "34px",
        color: "#4f46e5",
        marginBottom: "8px",
      }}
    />

    <div style={{ fontSize: "15px", fontWeight: 700 }}>{title}</div>

    <IonIcon
      icon={arrowForwardOutline}
      style={{
        fontSize: "18px",
        color: "#6b7280",
        marginTop: "10px",
      }}
    />
  </div>
);
