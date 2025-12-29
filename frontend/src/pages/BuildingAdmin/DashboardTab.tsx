// src/pages/BuildingAdmin/DashboardTab.tsx - Updated
import React from "react";
import {
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonGrid,
  IonRow,
  IonCol,
  IonButton,
  IonIcon,
  IonBadge,
} from "@ionic/react";
import {
  homeOutline,
  peopleOutline,
  qrCodeOutline,
  megaphoneOutline,
  calendarOutline,
  checkmarkCircleOutline,
  arrowForwardOutline,
} from "ionicons/icons";
import { VisitorPass, Notice } from "./types";

interface DashboardTabProps {
  stats: {
    totalApartments: number;
    totalResidents: number;
    activePassesCount: number;
    verifiedToday: number;
    unreadNotices: number;
    pendingBookings: number;
    pendingComplaints: number;
  };
  activePasses: VisitorPass[];
  notices: Notice[];
  complaintStats: {
    total: number;
    submitted: number;
    today: number;
  };
  onTabChange: (tab: string) => void;
}

const DashboardTab: React.FC<DashboardTabProps> = ({
  stats,
  activePasses,
  notices,
  complaintStats,
  onTabChange,
}) => {
  const statCards = [
    {
      title: "Apartments",
      value: stats.totalApartments,
      icon: homeOutline,
      color: "#667eea",
      bgColor: "rgba(102, 126, 234, 0.1)",
    },
    {
      title: "Residents",
      value: stats.totalResidents,
      icon: peopleOutline,
      color: "#10b981",
      bgColor: "rgba(16, 185, 129, 0.1)",
    },
    {
      title: "Pending Complaints",
      value: stats.pendingComplaints,
      icon: megaphoneOutline,
      color: "#ef4444",
      bgColor: "rgba(239, 68, 68, 0.1)",
    },
    {
      title: "Pending Bookings",
      value: stats.pendingBookings,
      icon: calendarOutline,
      color: "#3b82f6",
      bgColor: "rgba(59, 130, 246, 0.1)",
    },
  ];

  return (
    <div>
      {/* Stats Grid */}
      <IonGrid style={{ padding: 0, marginBottom: "32px" }}>
        <IonRow>
          {statCards.map((stat, index) => (
            <IonCol size="6" key={index} style={{ padding: "8px" }}>
              <div
                style={{
                  background: "white",
                  borderRadius: "16px",
                  padding: "20px",
                  height: "100%",
                  border: "1px solid #e2e8f0",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", marginBottom: "12px" }}>
                  <div
                    style={{
                      width: "48px",
                      height: "48px",
                      borderRadius: "12px",
                      background: stat.bgColor,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginRight: "12px",
                    }}
                  >
                    <IonIcon icon={stat.icon} style={{ color: stat.color, fontSize: "24px" }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "32px", fontWeight: "800", color: "#1f2937" }}>
                      {stat.value}
                    </div>
                    <div style={{ fontSize: "14px", color: "#6b7280", fontWeight: "500" }}>
                      {stat.title}
                    </div>
                  </div>
                </div>
              </div>
            </IonCol>
          ))}
        </IonRow>
      </IonGrid>

      {/* Quick Actions */}
      <IonCard style={{ borderRadius: "16px", marginBottom: "24px" }}>
        <IonCardHeader>
          <IonCardTitle style={{ fontSize: "18px", fontWeight: "700" }}>
            Quick Actions
          </IonCardTitle>
        </IonCardHeader>
        <IonCardContent>
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <IonButton
              color="primary"
              onClick={() => onTabChange("complaints")}
            >
              <IonIcon icon={megaphoneOutline} slot="start" />
              Manage Complaints
            </IonButton>
            <IonButton
              color="secondary"
              onClick={() => onTabChange("verify")}
            >
              <IonIcon icon={checkmarkCircleOutline} slot="start" />
              Verify Pass
            </IonButton>
            <IonButton
              color="tertiary"
              onClick={() => onTabChange("notices")}
            >
              <IonIcon icon={megaphoneOutline} slot="start" />
              Post Notice
            </IonButton>
            <IonButton
              color="success"
              onClick={() => onTabChange("bookings")}
            >
              <IonIcon icon={calendarOutline} slot="start" />
              Manage Bookings
            </IonButton>
          </div>
        </IonCardContent>
      </IonCard>

      {/* Recent Activity */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
        {/* Recent Visitor Passes */}
        <IonCard style={{ borderRadius: "16px" }}>
          <IonCardHeader>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <IonCardTitle style={{ fontSize: "16px", fontWeight: "700" }}>
                Active Visitor Passes
              </IonCardTitle>
              <IonBadge color="primary">{activePasses.length}</IonBadge>
            </div>
          </IonCardHeader>
          <IonCardContent>
            {activePasses.length === 0 ? (
              <div style={{ textAlign: "center", padding: "20px", color: "#6b7280" }}>
                No active passes
              </div>
            ) : (
              <div>
                {activePasses.slice(0, 3).map((pass) => (
                  <div
                    key={pass.id}
                    style={{
                      padding: "12px",
                      borderBottom: "1px solid #e5e7eb",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: "600", color: "#1f2937" }}>
                        {pass.visitor_name}
                      </div>
                      <div style={{ fontSize: "12px", color: "#6b7280" }}>
                        Code: {pass.code}
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: "12px", color: "#6b7280" }}>
                        Expires: {pass.expires_at}
                      </div>
                    </div>
                  </div>
                ))}
                {activePasses.length > 3 && (
                  <div style={{ textAlign: "center", marginTop: "12px" }}>
                    <IonButton
                      size="small"
                      fill="clear"
                      onClick={() => onTabChange("verify")}
                    >
                      View All
                      <IonIcon icon={arrowForwardOutline} slot="end" />
                    </IonButton>
                  </div>
                )}
              </div>
            )}
          </IonCardContent>
        </IonCard>

        {/* Recent Notices */}
        <IonCard style={{ borderRadius: "16px" }}>
          <IonCardHeader>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <IonCardTitle style={{ fontSize: "16px", fontWeight: "700" }}>
                Recent Notices
              </IonCardTitle>
              <IonBadge color="warning">{notices.length}</IonBadge>
            </div>
          </IonCardHeader>
          <IonCardContent>
            {notices.length === 0 ? (
              <div style={{ textAlign: "center", padding: "20px", color: "#6b7280" }}>
                No notices posted
              </div>
            ) : (
              <div>
                {notices.slice(0, 3).map((notice) => (
                  <div
                    key={notice.id}
                    style={{
                      padding: "12px",
                      borderBottom: "1px solid #e5e7eb",
                    }}
                  >
                    <div style={{ fontWeight: "600", color: "#1f2937", marginBottom: "4px" }}>
                      {notice.title}
                    </div>
                    <div style={{ fontSize: "12px", color: "#6b7280" }}>
                      {notice.content.substring(0, 60)}...
                    </div>
                    <div style={{ fontSize: "11px", color: "#9ca3af", marginTop: "4px" }}>
                      {notice.created_at}
                    </div>
                  </div>
                ))}
                {notices.length > 3 && (
                  <div style={{ textAlign: "center", marginTop: "12px" }}>
                    <IonButton
                      size="small"
                      fill="clear"
                      onClick={() => onTabChange("notices")}
                    >
                      View All
                      <IonIcon icon={arrowForwardOutline} slot="end" />
                    </IonButton>
                  </div>
                )}
              </div>
            )}
          </IonCardContent>
        </IonCard>
      </div>
    </div>
  );
};

export default DashboardTab;