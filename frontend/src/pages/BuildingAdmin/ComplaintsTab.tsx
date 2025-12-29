// src/pages/BuildingAdmin/ComplaintsTab.tsx
import React, { useState, useEffect } from "react";
import {
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonList,
  IonItem,
  IonLabel,
  IonBadge,
  IonButton,
  IonIcon,
  IonSelect,
  IonSelectOption,
  IonTextarea,
  IonChip,
  IonAlert,
  IonToast,
  IonLoading,
  IonNote,
} from "@ionic/react";
import {
  megaphoneOutline,
  timeOutline,
  checkmarkCircleOutline,
  closeCircleOutline,
  constructOutline,
  trashOutline,
  refreshOutline,
  eyeOutline,
} from "ionicons/icons";
import api from "../../api";
import { formatDateTime } from "./utils";

interface Complaint {
  id: number;
  building_id: number;
  apartment_id: number;
  unit_number: string;
  resident_name: string;
  resident_phone: string;
  type: string;
  description: string;
  status: "submitted" | "in_progress" | "resolved" | "rejected";
  admin_response: string | null;
  created_by: number;
  resolved_by: number | null;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
}

interface ComplaintsTabProps {
  buildingId: string;
}

const ComplaintsTab: React.FC<ComplaintsTabProps> = ({ buildingId }) => {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [showResponseAlert, setShowResponseAlert] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(
    null
  );
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [adminResponse, setAdminResponse] = useState("");
  const [toast, setToast] = useState({
    show: false,
    message: "",
    color: "success" as "success" | "danger" | "warning",
  });
  const [stats, setStats] = useState({
    total: 0,
    submitted: 0,
    in_progress: 0,
    resolved: 0,
    rejected: 0,
    today: 0,
  });

  useEffect(() => {
    loadComplaints();
  }, [buildingId, statusFilter]);

  const loadComplaints = async () => {
    setLoading(true);
    try {
      const [complaintsRes, statsRes] = await Promise.all([
        api.get(`/buildings/${buildingId}/complaints`),
        api.get(`/buildings/${buildingId}/complaints/stats`),
      ]);

      const complaintsData = complaintsRes.data || complaintsRes;
      const statsData = statsRes.data || statsRes;

      setComplaints(complaintsData.complaints || complaintsData || []);
      setStats(
        statsData.stats || {
          total: 0,
          submitted: 0,
          in_progress: 0,
          resolved: 0,
          rejected: 0,
          today: 0,
        }
      );
    } catch (error) {
      console.error("Failed to load complaints:", error);
      showToast("Failed to load complaints", "danger");
    } finally {
      setLoading(false);
    }
  };

  const showToast = (
    message: string,
    color: "success" | "danger" | "warning" = "success"
  ) => {
    setToast({ show: true, message, color });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "submitted":
        return "warning";
      case "in_progress":
        return "primary";
      case "resolved":
        return "success";
      case "rejected":
        return "danger";
      default:
        return "medium";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "submitted":
        return timeOutline;
      case "in_progress":
        return constructOutline;
      case "resolved":
        return checkmarkCircleOutline;
      case "rejected":
        return closeCircleOutline;
      default:
        return megaphoneOutline;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "maintenance":
        return constructOutline;
      case "security":
        return "🛡️";
      case "cleanliness":
        return "🧹";
      case "noise":
        return "🔊";
      case "parking":
        return "🚗";
      default:
        return megaphoneOutline;
    }
  };

  const handleStatusUpdate = async (
    complaintId: number,
    status: string,
    response?: string
  ) => {
    setUpdating(true);
    try {
      await api.patch(`/complaints/${complaintId}/status`, {
        status,
        admin_response: response || null,
      });

      showToast(`Complaint status updated to ${status}`, "success");
      loadComplaints();
      setShowResponseAlert(false);
      setAdminResponse("");
    } catch (error) {
      console.error("Failed to update complaint status:", error);
      showToast("Failed to update complaint status", "danger");
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteComplaint = async () => {
    if (!selectedComplaint) return;

    try {
      await api.del(`/complaints/${selectedComplaint.id}`);
      showToast("Complaint deleted successfully", "success");
      loadComplaints();
    } catch (error) {
      console.error("Failed to delete complaint:", error);
      showToast("Failed to delete complaint", "danger");
    } finally {
      setShowDeleteAlert(false);
      setSelectedComplaint(null);
    }
  };

  const handleAddResponse = (complaint: Complaint) => {
    setSelectedComplaint(complaint);
    setAdminResponse(complaint.admin_response || "");
    setShowResponseAlert(true);
  };

  const filteredComplaints = complaints.filter((complaint) => {
    if (statusFilter === "all") return true;
    return complaint.status === statusFilter;
  });

  const formatDate = (dateString: string) => {
    return formatDateTime(dateString);
  };

  return (
    <div>
      {/* Stats Overview */}
      <div style={{ marginBottom: "24px" }}>
        <IonCard>
          <IonCardContent>
            <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
              <div style={{ textAlign: "center", flex: 1, minWidth: "120px" }}>
                <div
                  style={{
                    fontSize: "32px",
                    fontWeight: "800",
                    color: "#667eea",
                  }}
                >
                  {stats.total}
                </div>
                <div style={{ fontSize: "12px", color: "#6b7280" }}>
                  Total Complaints
                </div>
              </div>
              <div style={{ textAlign: "center", flex: 1, minWidth: "120px" }}>
                <div
                  style={{
                    fontSize: "32px",
                    fontWeight: "800",
                    color: "#f59e0b",
                  }}
                >
                  {stats.submitted}
                </div>
                <div style={{ fontSize: "12px", color: "#6b7280" }}>
                  Submitted
                </div>
              </div>
              <div style={{ textAlign: "center", flex: 1, minWidth: "120px" }}>
                <div
                  style={{
                    fontSize: "32px",
                    fontWeight: "800",
                    color: "#3b82f6",
                  }}
                >
                  {stats.in_progress}
                </div>
                <div style={{ fontSize: "12px", color: "#6b7280" }}>
                  In Progress
                </div>
              </div>
              <div style={{ textAlign: "center", flex: 1, minWidth: "120px" }}>
                <div
                  style={{
                    fontSize: "32px",
                    fontWeight: "800",
                    color: "#10b981",
                  }}
                >
                  {stats.resolved}
                </div>
                <div style={{ fontSize: "12px", color: "#6b7280" }}>
                  Resolved
                </div>
              </div>
              <div style={{ textAlign: "center", flex: 1, minWidth: "120px" }}>
                <div
                  style={{
                    fontSize: "32px",
                    fontWeight: "800",
                    color: "#ef4444",
                  }}
                >
                  {stats.today}
                </div>
                <div style={{ fontSize: "12px", color: "#6b7280" }}>Today</div>
              </div>
            </div>
          </IonCardContent>
        </IonCard>
      </div>

      {/* Filter Controls */}
      <div
        style={{
          marginBottom: "20px",
          display: "flex",
          gap: "16px",
          alignItems: "center",
        }}
      >
        <div style={{ flex: 1 }}>
          <IonSelect
            value={statusFilter}
            onIonChange={(e) => setStatusFilter(e.detail.value)}
            style={{ width: "100%" }}
          >
            <IonSelectOption value="all">All Complaints</IonSelectOption>
            <IonSelectOption value="submitted">Submitted</IonSelectOption>
            <IonSelectOption value="in_progress">In Progress</IonSelectOption>
            <IonSelectOption value="resolved">Resolved</IonSelectOption>
            <IonSelectOption value="rejected">Rejected</IonSelectOption>
          </IonSelect>
        </div>
        <IonButton onClick={loadComplaints}>
          <IonIcon icon={refreshOutline} slot="start" />
          Refresh
        </IonButton>
      </div>

      {/* Complaints List */}
      <IonLoading isOpen={loading} message="Loading complaints..." />

      {filteredComplaints.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 20px" }}>
          <IonIcon
            icon={megaphoneOutline}
            style={{ fontSize: "64px", color: "#d1d5db", marginBottom: "16px" }}
          />
          <div
            style={{
              fontSize: "18px",
              fontWeight: "600",
              color: "#4b5563",
              marginBottom: "8px",
            }}
          >
            No complaints found
          </div>
          <div style={{ color: "#6b7280" }}>
            {statusFilter === "all"
              ? "No complaints have been submitted yet."
              : `No ${statusFilter.replace("_", " ")} complaints.`}
          </div>
        </div>
      ) : (
        <IonList style={{ background: "transparent" }}>
          {filteredComplaints.map((complaint) => (
            <IonCard
              key={complaint.id}
              style={{ borderRadius: "16px", marginBottom: "16px" }}
            >
              <IonCardHeader>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                  }}
                >
                  <div>
                    <IonCardTitle
                      style={{ fontSize: "16px", fontWeight: "700" }}
                    >
                      <span style={{ marginRight: "8px" }}>
                        
                      </span>
                      {complaint.type}
                    </IonCardTitle>
                    <div style={{ marginTop: "4px" }}>
                      <IonChip color="medium" style={{ fontSize: "11px" }}>
                        Apt {complaint.unit_number}
                      </IonChip>
                      <IonChip
                        color="medium"
                        style={{ fontSize: "11px", marginLeft: "4px" }}
                      >
                        {complaint.resident_name || "Unknown"}
                      </IonChip>
                    </div>
                  </div>
                  <IonBadge
                    color={getStatusColor(complaint.status)}
                    style={{ fontSize: "12px", fontWeight: "600" }}
                  >
                    <IonIcon
                      icon={getStatusIcon(complaint.status)}
                      style={{ marginRight: "4px" }}
                    />
                    {complaint.status.replace("_", " ").toUpperCase()}
                  </IonBadge>
                </div>
              </IonCardHeader>

              <IonCardContent>
                {/* Complaint Description */}
                <div style={{ marginBottom: "16px" }}>
                  <div
                    style={{
                      fontSize: "14px",
                      color: "#374151",
                      fontWeight: "500",
                      marginBottom: "8px",
                    }}
                  >
                    Description:
                  </div>
                  <div
                    style={{
                      background: "#f9fafb",
                      padding: "12px",
                      borderRadius: "8px",
                      fontSize: "14px",
                      color: "#4b5563",
                      lineHeight: "1.5",
                    }}
                  >
                    {complaint.description}
                  </div>
                </div>

                {/* Admin Response (if exists) */}
                {complaint.admin_response && (
                  <div style={{ marginBottom: "16px" }}>
                    <div
                      style={{
                        fontSize: "14px",
                        color: "#374151",
                        fontWeight: "500",
                        marginBottom: "8px",
                      }}
                    >
                      Admin Response:
                    </div>
                    <div
                      style={{
                        background: "#ecfdf5",
                        padding: "12px",
                        borderRadius: "8px",
                        fontSize: "14px",
                        color: "#065f46",
                        lineHeight: "1.5",
                      }}
                    >
                      {complaint.admin_response}
                    </div>
                  </div>
                )}

                {/* Metadata */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    fontSize: "12px",
                    color: "#6b7280",
                    borderTop: "1px solid #e5e7eb",
                    paddingTop: "12px",
                    marginTop: "12px",
                  }}
                >
                  <div>
                    <IonNote>
                      Submitted: {formatDate(complaint.created_at)}
                    </IonNote>
                  </div>
                  {complaint.resolved_at && (
                    <div>
                      <IonNote>
                        Resolved: {formatDate(complaint.resolved_at)}
                      </IonNote>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div
                  style={{
                    display: "flex",
                    gap: "8px",
                    marginTop: "16px",
                    flexWrap: "wrap",
                  }}
                >
                  {complaint.status === "submitted" && (
                    <>
                      <IonButton
                        size="small"
                        color="primary"
                        onClick={() =>
                          handleStatusUpdate(complaint.id, "in_progress")
                        }
                        disabled={updating}
                      >
                        <IonIcon icon={constructOutline} slot="start" />
                        Start Progress
                      </IonButton>
                      <IonButton
                        size="small"
                        color="success"
                        onClick={() =>
                          handleStatusUpdate(complaint.id, "resolved")
                        }
                        disabled={updating}
                      >
                        <IonIcon icon={checkmarkCircleOutline} slot="start" />
                        Mark Resolved
                      </IonButton>
                    </>
                  )}

                  {complaint.status === "in_progress" && (
                    <>
                      <IonButton
                        size="small"
                        color="success"
                        onClick={() =>
                          handleStatusUpdate(complaint.id, "resolved")
                        }
                        disabled={updating}
                      >
                        <IonIcon icon={checkmarkCircleOutline} slot="start" />
                        Mark Resolved
                      </IonButton>
                      <IonButton
                        size="small"
                        color="danger"
                        onClick={() =>
                          handleStatusUpdate(complaint.id, "rejected")
                        }
                        disabled={updating}
                      >
                        <IonIcon icon={closeCircleOutline} slot="start" />
                        Reject
                      </IonButton>
                    </>
                  )}

                  <IonButton
                    size="small"
                    color="medium"
                    fill="outline"
                    onClick={() => handleAddResponse(complaint)}
                  >
                    <IonIcon icon={eyeOutline} slot="start" />
                    {complaint.admin_response
                      ? "Update Response"
                      : "Add Response"}
                  </IonButton>

                  <IonButton
                    size="small"
                    color="danger"
                    fill="outline"
                    onClick={() => {
                      setSelectedComplaint(complaint);
                      setShowDeleteAlert(true);
                    }}
                  >
                    <IonIcon icon={trashOutline} slot="start" />
                    Delete
                  </IonButton>
                </div>
              </IonCardContent>
            </IonCard>
          ))}
        </IonList>
      )}

      {/* Alerts */}
      <IonAlert
        isOpen={showDeleteAlert}
        onDidDismiss={() => setShowDeleteAlert(false)}
        header="Delete Complaint"
        message="Are you sure you want to delete this complaint? This action cannot be undone."
        buttons={[
          { text: "Cancel", role: "cancel" },
          { text: "Delete", handler: handleDeleteComplaint },
        ]}
      />

      <IonAlert
        isOpen={showResponseAlert}
        onDidDismiss={() => setShowResponseAlert(false)}
        header="Add Admin Response"
        inputs={[
          {
            name: "response",
            type: "textarea",
            placeholder: "Enter your response...",
            value: adminResponse,
          },
        ]}
        buttons={[
          { text: "Cancel", role: "cancel" },
          {
            text: "Submit",
            handler: (data) => {
              if (selectedComplaint) {
                handleStatusUpdate(
                  selectedComplaint.id,
                  selectedComplaint.status,
                  data.response
                );
              }
            },
          },
        ]}
      />

      <IonToast
        isOpen={toast.show}
        message={toast.message}
        duration={3000}
        color={toast.color}
        onDidDismiss={() => setToast({ ...toast, show: false })}
        position="top"
      />
    </div>
  );
};

export default ComplaintsTab;
