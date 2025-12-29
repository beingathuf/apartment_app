// src/components/AdminBookingsTab.tsx - UPDATED for session-based booking
import React, { useState, useEffect } from "react";
import {
  IonCard,
  IonCardContent,
  IonButton,
  IonIcon,
  IonBadge,
  IonGrid,
  IonRow,
  IonCol,
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonItem,
  IonLabel,
  IonTextarea,
  IonSelect,
  IonSelectOption,
  IonNote,
  IonChip,
} from "@ionic/react";
import {
  checkmarkCircleOutline,
  closeCircleOutline,
  timeOutline,
  calendarOutline,
  personOutline,
  homeOutline,
  phonePortraitOutline,
  informationCircleOutline,
} from "ionicons/icons";
import api from "../../api";

interface Booking {
  id: number;
  building_id: number;
  apartment_id: number;
  amenity_id: number;
  session_id: number;
  amenity_name: string;
  session_name: string;
  session_type: string;
  date: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  purpose: string;
  status: "pending" | "approved" | "rejected" | "cancelled";
  rejection_reason: string | null;
  created_by: number;
  created_at: string;
  updated_at: string;
  unit_number: string;
  resident_name: string;
  resident_phone: string;
  approved_by_name: string | null;
}

interface AdminBookingsTabProps {
  buildingId: string;
  onUpdate?: () => void;
}

const AdminBookingsTab: React.FC<AdminBookingsTabProps> = ({
  buildingId,
  onUpdate,
}) => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [amenities, setAmenities] = useState<{ id: number; name: string }[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [filter, setFilter] = useState("all");
  const [amenityFilter, setAmenityFilter] = useState("all");

  useEffect(() => {
    loadAmenities();
  }, [buildingId]);

  useEffect(() => {
    loadBookings();
  }, [buildingId, filter, amenityFilter]);

  const loadAmenities = async () => {
    try {
      const response = await api.get(`/buildings/${buildingId}/amenities-list`);
      if (response.success) {
        setAmenities(response.amenities);
      }
    } catch (error) {
      console.error("Failed to load amenities:", error);
    }
  };

  const loadBookings = async () => {
    setLoading(true);
    try {
      const response = await api.get(
        `/buildings/${buildingId}/bookings?status=${filter}&amenity_id=${amenityFilter}`
      );
      setBookings(response.bookings || []);
    } catch (error) {
      console.error("Failed to load bookings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (bookingId: number) => {
    if (!confirm("Approve this booking request?")) return;

    try {
      const response = await api.post(`/bookings/${bookingId}/approve`, {});
      if (response.success) {
        setBookings((prev) =>
          prev.map((b) => (b.id === bookingId ? response.booking : b))
        );
        onUpdate && onUpdate();
      }
    } catch (error: any) {
      console.error("Failed to approve booking:", error);
      alert(error.message || "Failed to approve booking");
    }
  };

  const handleReject = async () => {
    if (!selectedBooking || !rejectionReason.trim()) return;

    try {
      const response = await api.post(
        `/bookings/${selectedBooking.id}/reject`,
        {
          rejection_reason: rejectionReason,
        }
      );
      if (response.success) {
        setBookings((prev) =>
          prev.map((b) => (b.id === selectedBooking.id ? response.booking : b))
        );
        setShowRejectModal(false);
        setRejectionReason("");
        setSelectedBooking(null);
        onUpdate && onUpdate();
      }
    } catch (error: any) {
      console.error("Failed to reject booking:", error);
      alert(error.message || "Failed to reject booking");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "warning";
      case "approved":
        return "success";
      case "rejected":
        return "danger";
      case "cancelled":
        return "medium";
      default:
        return "primary";
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  const getSessionDisplayName = (sessionType: string, sessionName?: string) => {
    if (sessionName) return sessionName;

    switch (sessionType) {
      case "full_day":
        return "Full Day";
      case "half_day_morning":
        return "Morning Session";
      case "half_day_evening":
        return "Evening Session";
      default:
        return "Standard Booking";
    }
  };

  return (
    <div>
      {/* Filters */}
      <IonCard style={{ borderRadius: "12px", marginBottom: "16px" }}>
        <IonCardContent>
          <IonGrid style={{ padding: 0 }}>
            <IonRow>
              <IonCol size="6">
                <IonItem style={{ "--background": "transparent" }}>
                  <IonLabel>Status</IonLabel>
                  <IonSelect
                    value={filter}
                    onIonChange={(e) => setFilter(e.detail.value)}
                    interface="popover"
                  >
                    <IonSelectOption value="all">All Status</IonSelectOption>
                    <IonSelectOption value="pending">Pending</IonSelectOption>
                    <IonSelectOption value="approved">Approved</IonSelectOption>
                    <IonSelectOption value="rejected">Rejected</IonSelectOption>
                    <IonSelectOption value="cancelled">
                      Cancelled
                    </IonSelectOption>
                  </IonSelect>
                </IonItem>
              </IonCol>
              <IonCol size="6">
                <IonItem style={{ "--background": "transparent" }}>
                  <IonLabel>Amenity</IonLabel>
                  <IonSelect
                    value={amenityFilter}
                    onIonChange={(e) => setAmenityFilter(e.detail.value)}
                    interface="popover"
                  >
                    <IonSelectOption value="all">All Amenities</IonSelectOption>
                    {amenities.map((amenity) => (
                      <IonSelectOption key={amenity.id} value={amenity.id}>
                        {amenity.name}
                      </IonSelectOption>
                    ))}
                  </IonSelect>
                </IonItem>
              </IonCol>
            </IonRow>
          </IonGrid>
        </IonCardContent>
      </IonCard>

      {/* Stats */}
      <div style={{ marginBottom: "16px" }}>
        <IonGrid style={{ padding: 0 }}>
          <IonRow>
            <IonCol size="3">
              <div style={{ textAlign: "center" }}>
                <div
                  style={{
                    fontSize: "24px",
                    fontWeight: "bold",
                    color: "#f59e0b",
                  }}
                >
                  {bookings.filter((b) => b.status === "pending").length}
                </div>
                <div style={{ fontSize: "12px", color: "#64748b" }}>
                  Pending
                </div>
              </div>
            </IonCol>
            <IonCol size="3">
              <div style={{ textAlign: "center" }}>
                <div
                  style={{
                    fontSize: "24px",
                    fontWeight: "bold",
                    color: "#10b981",
                  }}
                >
                  {bookings.filter((b) => b.status === "approved").length}
                </div>
                <div style={{ fontSize: "12px", color: "#64748b" }}>
                  Approved
                </div>
              </div>
            </IonCol>
            <IonCol size="3">
              <div style={{ textAlign: "center" }}>
                <div
                  style={{
                    fontSize: "24px",
                    fontWeight: "bold",
                    color: "#ef4444",
                  }}
                >
                  {bookings.filter((b) => b.status === "rejected").length}
                </div>
                <div style={{ fontSize: "12px", color: "#64748b" }}>
                  Rejected
                </div>
              </div>
            </IonCol>
            <IonCol size="3">
              <div style={{ textAlign: "center" }}>
                <div
                  style={{
                    fontSize: "24px",
                    fontWeight: "bold",
                    color: "#6b7280",
                  }}
                >
                  {bookings.filter((b) => b.status === "cancelled").length}
                </div>
                <div style={{ fontSize: "12px", color: "#64748b" }}>
                  Cancelled
                </div>
              </div>
            </IonCol>
          </IonRow>
        </IonGrid>
      </div>

      {/* Bookings List */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "40px" }}>
          <div>Loading bookings...</div>
        </div>
      ) : bookings.length === 0 ? (
        <IonCard style={{ borderRadius: "12px" }}>
          <IonCardContent style={{ textAlign: "center", padding: "40px" }}>
            <IonIcon
              icon={calendarOutline}
              style={{
                fontSize: "48px",
                color: "#94a3b8",
                marginBottom: "16px",
              }}
            />
            <div style={{ fontWeight: "600", color: "#334155" }}>
              No bookings found
            </div>
            <div
              style={{ color: "#64748b", fontSize: "14px", marginTop: "8px" }}
            >
              {filter === "all"
                ? "No bookings have been made yet"
                : `No ${filter} bookings`}
            </div>
          </IonCardContent>
        </IonCard>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {bookings.map((booking) => (
            <IonCard key={booking.id} style={{ borderRadius: "12px" }}>
              <IonCardContent>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        marginBottom: "8px",
                      }}
                    >
                      <div
                        style={{
                          fontWeight: "700",
                          fontSize: "16px",
                          color: "#334155",
                        }}
                      >
                        {booking.amenity_name}
                      </div>
                      <IonBadge color={getStatusColor(booking.status)}>
                        {booking.status.toUpperCase()}
                      </IonBadge>
                    </div>

                    {/* Session Info */}
                    <div style={{ marginBottom: "12px" }}>
                      <IonChip
                        color="primary"
                        style={{
                          height: "24px",
                          fontSize: "12px",
                          marginRight: "8px",
                        }}
                      >
                        {getSessionDisplayName(
                          booking.session_type,
                          booking.session_name
                        )}
                      </IonChip>
                      <IonNote style={{ fontSize: "14px", color: "#64748b" }}>
                        {booking.start_time} - {booking.end_time}
                      </IonNote>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: "12px",
                        marginBottom: "12px",
                        fontSize: "13px",
                        color: "#475569",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                        }}
                      >
                        <IonIcon
                          icon={calendarOutline}
                          style={{ fontSize: "14px" }}
                        />
                        <span>{formatDate(booking.date)}</span>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                        }}
                      >
                        <IonIcon icon={homeOutline} />
                        <span>Unit {booking.unit_number || "N/A"}</span>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                        }}
                      >
                        <IonIcon icon={personOutline} />
                        <span>{booking.resident_name || "Resident"}</span>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                        }}
                      >
                        <IonIcon icon={phonePortraitOutline} />
                        <span>{booking.resident_phone}</span>
                      </div>
                    </div>

                    {booking.purpose && (
                      <div
                        style={{
                          marginTop: "8px",
                          padding: "8px",
                          background: "#f8fafc",
                          borderRadius: "6px",
                          marginBottom: "8px",
                        }}
                      >
                        <div
                          style={{
                            fontSize: "12px",
                            color: "#64748b",
                            marginBottom: "4px",
                          }}
                        >
                          Purpose:
                        </div>
                        <div style={{ fontSize: "13px", color: "#334155" }}>
                          {booking.purpose}
                        </div>
                      </div>
                    )}

                    {booking.rejection_reason && (
                      <div
                        style={{
                          marginTop: "8px",
                          padding: "8px",
                          background: "#fee2e2",
                          borderRadius: "6px",
                        }}
                      >
                        <div
                          style={{
                            fontSize: "12px",
                            color: "#dc2626",
                            marginBottom: "4px",
                          }}
                        >
                          Rejection Reason:
                        </div>
                        <div style={{ fontSize: "13px", color: "#7f1d1d" }}>
                          {booking.rejection_reason}
                        </div>
                      </div>
                    )}
                  </div>

                  {booking.status === "pending" && (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "8px",
                        marginLeft: "16px",
                      }}
                    >
                      <IonButton
                        size="small"
                        color="success"
                        onClick={() => handleApprove(booking.id)}
                      >
                        <IonIcon icon={checkmarkCircleOutline} slot="start" />
                        Approve
                      </IonButton>
                      <IonButton
                        size="small"
                        color="danger"
                        fill="outline"
                        onClick={() => {
                          setSelectedBooking(booking);
                          setShowRejectModal(true);
                        }}
                      >
                        <IonIcon icon={closeCircleOutline} slot="start" />
                        Reject
                      </IonButton>
                    </div>
                  )}
                </div>
              </IonCardContent>
            </IonCard>
          ))}
        </div>
      )}

      {/* Reject Modal */}
      <IonModal
        isOpen={showRejectModal}
        onDidDismiss={() => {
          setShowRejectModal(false);
          setRejectionReason("");
          setSelectedBooking(null);
        }}
      >
        <IonHeader>
          <IonToolbar>
            <IonTitle>Reject Booking</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding">
          <div style={{ marginBottom: "16px" }}>
            <div style={{ fontWeight: "600", marginBottom: "8px" }}>
              Booking Details:
            </div>
            <div
              style={{
                background: "#f8fafc",
                padding: "12px",
                borderRadius: "8px",
                marginBottom: "12px",
              }}
            >
              {selectedBooking && (
                <>
                  <div style={{ marginBottom: "4px" }}>
                    <strong>Amenity:</strong> {selectedBooking.amenity_name}
                  </div>
                  <div style={{ marginBottom: "4px" }}>
                    <strong>Session:</strong>{" "}
                    {getSessionDisplayName(
                      selectedBooking.session_type,
                      selectedBooking.session_name
                    )}
                  </div>
                  <div style={{ marginBottom: "4px" }}>
                    <strong>Date:</strong> {formatDate(selectedBooking.date)}
                  </div>
                  <div style={{ marginBottom: "4px" }}>
                    <strong>Time:</strong> {selectedBooking.start_time} -{" "}
                    {selectedBooking.end_time}
                  </div>
                  <div>
                    <strong>Resident:</strong> {selectedBooking.resident_name}{" "}
                    (Unit {selectedBooking.unit_number})
                  </div>
                </>
              )}
            </div>

            {/* Info Note */}
            <div
              style={{
                padding: "8px",
                background: "#fef3c7",
                borderRadius: "6px",
                borderLeft: "3px solid #f59e0b",
                fontSize: "12px",
                color: "#92400e",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "4px",
                }}
              >
                <IonIcon
                  icon={informationCircleOutline}
                  style={{ fontSize: "16px", flexShrink: 0 }}
                />
                <div>
                  The rejection reason will be sent to the resident. Please
                  provide a clear and respectful explanation.
                </div>
              </div>
            </div>
          </div>

          <IonItem style={{ marginBottom: "20px" }}>
            <IonLabel position="stacked">Rejection Reason *</IonLabel>
            <IonTextarea
              value={rejectionReason}
              onIonChange={(e) => setRejectionReason(e.detail.value!)}
              rows={4}
              placeholder="Please provide a reason for rejection (minimum 5 characters)"
              required
            />
          </IonItem>

          <div style={{ display: "flex", gap: "12px" }}>
            <IonButton
              expand="block"
              color="danger"
              onClick={handleReject}
              disabled={
                !rejectionReason.trim() || rejectionReason.trim().length < 5
              }
            >
              Submit Rejection
            </IonButton>
            <IonButton
              expand="block"
              color="medium"
              fill="outline"
              onClick={() => {
                setShowRejectModal(false);
                setRejectionReason("");
              }}
            >
              Cancel
            </IonButton>
          </div>
        </IonContent>
      </IonModal>
    </div>
  );
};

export default AdminBookingsTab;
