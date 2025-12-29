// src/pages/Amenities.jsx - SIMPLIFIED
import React, { useEffect, useState } from "react";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonCard,
  IonCardContent,
  IonBadge,
  IonChip,
  IonLoading,
  IonIcon,
  IonList,
  IonItem,
  IonLabel,
} from "@ionic/react";
import {
  addOutline,
  trashOutline,
  checkmarkCircleOutline,
  closeCircleOutline,
  timeOutline,
  calendarOutline,
  refreshOutline,
  businessOutline,
} from "ionicons/icons";
import AmenitiesBookingModal from "../components/AmenitiesBookingModal";
import api from "../api";

export default function AmenitiesPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    loadUserInfo();
    loadBookings();
  }, []);

  const loadUserInfo = () => {
    try {
      const userData = localStorage.getItem("user");
      if (userData) {
        setUserInfo(JSON.parse(userData));
      }
    } catch (error) {
      console.error("Failed to load user info:", error);
    }
  };

  const loadBookings = async () => {
    setLoading(true);
    try {
      const response = await api.get("/bookings/my");
      const sortedBookings = (response.bookings || []).sort((a, b) => {
        const statusOrder = {
          pending: 0,
          approved: 1,
          rejected: 2,
          cancelled: 3,
        };
        if (statusOrder[a.status] !== statusOrder[b.status]) {
          return statusOrder[a.status] - statusOrder[b.status];
        }
        return new Date(b.date) - new Date(a.date);
      });
      setBookings(sortedBookings);
    } catch (error) {
      console.error("Failed to load bookings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleModalConfirm = async (bookingData) => {
    try {
      const response = await api.post("/bookings", bookingData);
      if (response.success) {
        loadBookings();
        return true;
      }
      return false;
    } catch (error) {
      console.error("Booking error:", error);
      alert(error.response?.data?.error || "Failed to create booking");
      return false;
    }
  };

  const cancelBooking = async (id) => {
    if (!confirm("Are you sure you want to cancel this booking?")) return;

    try {
      await api.post(`/bookings/${id}/cancel`, {});
      loadBookings();
    } catch (error) {
      console.error("Cancel error:", error);
      alert("Failed to cancel booking");
    }
  };

  const getStatusBadge = (status) => {
    const colors = {
      pending: "warning",
      approved: "success",
      rejected: "danger",
      cancelled: "medium",
    };

    const icons = {
      pending: timeOutline,
      approved: checkmarkCircleOutline,
      rejected: closeCircleOutline,
      cancelled: trashOutline,
    };

    return (
      <IonChip
        color={colors[status] || "primary"}
        style={{ fontSize: "12px", height: 24 }}
      >
        <IonIcon icon={icons[status] || timeOutline} size="small" />
        <IonLabel>{status.charAt(0).toUpperCase() + status.slice(1)}</IonLabel>
      </IonChip>
    );
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      weekday: "short",
    });
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return "";
    const [hours, minutes] = timeStr.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const filteredBookings = bookings.filter(
    (booking) => statusFilter === "all" || booking.status === statusFilter
  );

  return (
    <IonPage>
      <IonHeader translucent>
        <IonToolbar
          style={{
            "--background": "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            "--color": "white",
          }}
        >
          <IonTitle>Amenities Booking</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen>
        <div style={{ padding: 16 }}>
          {/* Welcome Section */}
          {userInfo && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 20, fontWeight: 900, marginBottom: 4 }}>
                Book Amenities, {userInfo.name || "Resident"}!
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ color: "#6b7280", fontSize: 14 }}>
                  {userInfo.unit_number ? `Unit ${userInfo.unit_number}` : ""}
                </div>
                {bookings.filter((b) => b.status === "pending").length > 0 && (
                  <IonBadge color="warning" style={{ fontSize: "10px" }}>
                    {bookings.filter((b) => b.status === "pending").length}{" "}
                    pending
                  </IonBadge>
                )}
              </div>
            </div>
          )}

          {/* Quick Booking Card */}
          <IonCard style={{ marginBottom: 16, borderRadius: 12 }}>
            <IonCardContent
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <div style={{ fontWeight: 900 }}>Book an Amenity</div>
                <div style={{ color: "#6b7280", fontSize: 13, marginTop: 6 }}>
                  Party Hall, Gym, Pool, Courts and more
                </div>
              </div>
              <IonButton
                onClick={() => setModalOpen(true)}
                style={{ fontWeight: 800 }}
              >
                <IonIcon slot="start" icon={addOutline} /> Book Now
              </IonButton>
            </IonCardContent>
          </IonCard>

          {/* My Bookings Section */}
          <div style={{ marginTop: 24 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 12,
              }}
            >
              <div style={{ fontWeight: 900, fontSize: 18 }}>My Bookings</div>
              <IonButton
                size="small"
                fill="clear"
                onClick={loadBookings}
                style={{ "--color": "#667eea", fontSize: "12px" }}
              >
                <IonIcon icon={refreshOutline} slot="start" />
                Refresh
              </IonButton>
            </div>

            {/* Status Filters */}
            <div
              style={{
                display: "flex",
                gap: 8,
                marginBottom: 16,
                overflowX: "auto",
                paddingBottom: 4,
              }}
            >
              {["all", "pending", "approved", "rejected", "cancelled"].map(
                (status) => (
                  <div
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    style={{
                      padding: "6px 12px",
                      background:
                        statusFilter === status ? "#667eea" : "#f1f5f9",
                      color: statusFilter === status ? "white" : "#64748b",
                      borderRadius: "20px",
                      fontSize: "12px",
                      fontWeight: statusFilter === status ? 700 : 500,
                      whiteSpace: "nowrap",
                      cursor: "pointer",
                    }}
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                    {status !== "all" && (
                      <span style={{ marginLeft: 4, opacity: 0.8 }}>
                        ({bookings.filter((b) => b.status === status).length})
                      </span>
                    )}
                  </div>
                )
              )}
            </div>

            {loading ? (
              <div style={{ textAlign: "center", padding: 40 }}>
                <IonLoading isOpen={true} message="Loading bookings..." />
              </div>
            ) : filteredBookings.length === 0 ? (
              <div
                style={{ textAlign: "center", padding: 40, color: "#94a3b8" }}
              >
                <div style={{ marginBottom: 12, fontSize: "32px" }}>
                  {statusFilter === "pending" ? "⏳" : "📅"}
                </div>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>
                  No {statusFilter !== "all" ? statusFilter : ""} bookings
                </div>
                <div style={{ fontSize: 14 }}>
                  {statusFilter === "all"
                    ? "Book your first amenity above"
                    : `No ${statusFilter} bookings found`}
                </div>
                <IonButton
                  fill="outline"
                  size="small"
                  style={{ marginTop: 16 }}
                  onClick={() => setModalOpen(true)}
                >
                  <IonIcon icon={addOutline} slot="start" />
                  Make First Booking
                </IonButton>
              </div>
            ) : (
              <IonList style={{ background: "transparent" }}>
                {filteredBookings.map((booking) => (
                  <IonItem
                    key={booking.id}
                    lines="none"
                    style={{
                      borderRadius: 10,
                      marginBottom: 8,
                      padding: 12,
                      background: "white",
                      border: "1px solid #e2e8f0",
                      borderLeft: `4px solid ${
                        booking.status === "approved"
                          ? "#10b981"
                          : booking.status === "rejected"
                          ? "#ef4444"
                          : booking.status === "pending"
                          ? "#f59e0b"
                          : "#6b7280"
                      }`,
                    }}
                  >
                    <div style={{ width: "100%" }}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                        }}
                      >
                        <div style={{ flex: 1 }}>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                              marginBottom: 4,
                            }}
                          >
                            <div
                              style={{
                                width: 24,
                                height: 24,
                                borderRadius: 6,
                                background: booking.amenity_color || "#3880ff",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                color: "white",
                              }}
                            >
                              <IonIcon
                                icon={booking.amenity_icon || businessOutline}
                                size="small"
                              />
                            </div>
                            <div style={{ fontWeight: 800, fontSize: 16 }}>
                              {booking.amenity_name}
                            </div>
                            {getStatusBadge(booking.status)}
                          </div>

                          <div
                            style={{
                              color: "#64748b",
                              fontSize: 13,
                              marginBottom: 4,
                            }}
                          >
                            <span
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 4,
                              }}
                            >
                              <IonIcon icon={calendarOutline} size="small" />
                              {formatDate(booking.date)}
                            </span>
                            <span
                              style={{
                                marginLeft: 8,
                                display: "flex",
                                alignItems: "center",
                                gap: 4,
                              }}
                            >
                              <IonIcon icon={timeOutline} size="small" />
                              {formatTime(booking.start_time)} -{" "}
                              {formatTime(booking.end_time)}
                            </span>
                          </div>

                          <div
                            style={{
                              fontSize: 12,
                              color: "#94a3b8",
                              marginBottom: 4,
                            }}
                          >
                            Slot: {booking.slot_name}
                            {booking.unit_number && (
                              <span style={{ marginLeft: 8 }}>
                                • Unit {booking.unit_number}
                              </span>
                            )}
                          </div>

                          {booking.purpose && (
                            <div
                              style={{
                                fontSize: 12,
                                color: "#475569",
                                fontStyle: "italic",
                                marginTop: 4,
                              }}
                            >
                              "{booking.purpose}"
                            </div>
                          )}

                          {booking.rejection_reason && (
                            <div
                              style={{
                                marginTop: 8,
                                padding: 8,
                                background: "#fee2e2",
                                borderRadius: 6,
                                borderLeft: "3px solid #dc2626",
                              }}
                            >
                              <div
                                style={{
                                  fontSize: 11,
                                  fontWeight: 600,
                                  color: "#dc2626",
                                }}
                              >
                                REASON: {booking.rejection_reason}
                              </div>
                            </div>
                          )}
                        </div>

                        {booking.status === "pending" && (
                          <IonButton
                            size="small"
                            color="danger"
                            fill="clear"
                            onClick={() => cancelBooking(booking.id)}
                            style={{ minWidth: "80px" }}
                          >
                            <IonIcon icon={trashOutline} /> Cancel
                          </IonButton>
                        )}
                      </div>
                    </div>
                  </IonItem>
                ))}
              </IonList>
            )}
          </div>
        </div>
      </IonContent>

      <AmenitiesBookingModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onConfirm={handleModalConfirm}
        buildingId={userInfo?.buildingId}
      />
    </IonPage>
  );
}
