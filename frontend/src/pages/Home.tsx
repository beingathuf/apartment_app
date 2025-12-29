// src/pages/Home.tsx - UPDATED (Resident bookings loading)
import React, { useEffect, useRef, useState } from "react";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  IonToast,
  IonBadge,
  IonChip,
  IonGrid,
  IonRow,
  IonCol,
  IonItemSliding,
  IonItemOptions,
  IonItemOption,
  IonIcon,
  IonButton,
} from "@ionic/react";
import {
  trashOutline,
  alertCircleOutline,
  timeOutline,
  qrCodeOutline,
  personOutline,
  fitnessOutline,
  eyeOutline,
  calendarOutline,
  megaphoneOutline,
} from "ionicons/icons";
import VisitorPassModal from "../components/VisitorPassModal";
import AmenitiesBookingModal from "../components/AmenitiesBookingModal";
import ComplaintModal from "../components/ComplaintModal";
import PassViewerModal from "../components/PassViewerModal";
import api from "../api";

/* ---------------- helpers ---------------- */
// Fixed: Always use UTC for calculations
function isExpired(expiryISO: string | null): boolean {
  if (!expiryISO) return false;

  const now = new Date();
  const expiry = new Date(expiryISO);

  // Compare in UTC - this is the key fix
  return expiry.getTime() <= now.getTime();
}

function getTimeRemaining(expiryISO: string | null) {
  if (!expiryISO) return { expired: true, minutes: 0, seconds: 0 };
  const now = Date.now(); // UTC timestamp
  const expiry = new Date(expiryISO).getTime(); // UTC timestamp
  const diff = expiry - now;
  if (diff <= 0) return { expired: true, minutes: 0, seconds: 0 };
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);
  return { expired: false, minutes, seconds };
}

function formatCountdown(expiresAt: string | null) {
  if (!expiresAt) return "00:00";
  const { expired, minutes, seconds } = getTimeRemaining(expiresAt);
  if (expired) return "Expired";
  return `${minutes.toString().padStart(2, "0")}:${seconds
    .toString()
    .padStart(2, "0")}`;
}

function getCountdownColor(expiresAt: string | null) {
  if (!expiresAt) return "medium";
  const { expired, minutes } = getTimeRemaining(expiresAt);
  if (expired) return "danger";
  if (minutes < 5) return "danger";
  if (minutes < 10) return "warning";
  return "success";
}

// Format IST time for display only (not for calculations)
function formatIST(dateString: string | null): string {
  if (!dateString) return "-";
  try {
    const date = new Date(dateString);
    return date.toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      hour12: true,
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
    });
  } catch {
    return "-";
  }
}

interface ToastState {
  show: boolean;
  msg: string;
}

interface VisitorPass {
  id: string | number;
  buildingId?: number | null;
  apartmentId?: number | null;
  code: string | null;
  visitorName: string;
  qrDataUrl: string | null;
  createdAt: string;
  expiresAt: string | null;
  status: string;
  raw?: any;
}

interface Booking {
  id: string | number;
  date: string | null;
  slot: string;
  amenity: string;
  createdAt: string;
  status?: string; // Add status field
  start_time?: string; // Add start_time field
  end_time?: string; // Add end_time field
  guests?: number; // Add guests field
  unit_number?: string; // Add unit_number field
}

interface Complaint {
  id: string | number;
  type: string;
  description: string;
  createdAt: string;
}

interface HomePageProps {
  history?: any;
}

export default function HomePage({ history }: HomePageProps) {
  // modals
  const [visitorPassModalOpen, setVisitorPassModalOpen] =
    useState<boolean>(false);
  const [bookingModalOpen, setBookingModalOpen] = useState<boolean>(false);
  const [complaintModalOpen, setComplaintModalOpen] = useState<boolean>(false);
  const [passViewerModalOpen, setPassViewerModalOpen] =
    useState<boolean>(false);

  // data from server
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [visitorPasses, setVisitorPasses] = useState<VisitorPass[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);

  // ui
  const [toast, setToast] = useState<ToastState>({ show: false, msg: "" });
  const [selectedPass, setSelectedPass] = useState<VisitorPass | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Get building ID
  function getBuildingId(): number | null {
    try {
      const rawUser = localStorage.getItem("user");
      if (rawUser) {
        const parsed = JSON.parse(rawUser);
        return parsed.buildingId ?? parsed.building_id ?? null;
      }
      return null;
    } catch (e) {
      return null;
    }
  }

  const buildingId = getBuildingId();

  // Normalize pass data - FIXED to ensure UTC handling (Moved inside component)
  const normalizePass = (p: any): VisitorPass | null => {
    if (!p) return null;

    const id = p.id ?? p.pass_id ?? p.passId ?? `temp_${Date.now()}`;

    // Ensure expiresAt is ISO string in UTC
    let expiresAt =
      p.expires_at ?? p.expiresAt ?? p.expires ?? p.expiry ?? null;
    if (expiresAt) {
      try {
        const date = new Date(expiresAt);
        if (!isNaN(date.getTime())) {
          expiresAt = date.toISOString(); // Ensure UTC ISO string
        } else {
          console.warn("Invalid expiry date:", expiresAt);
          expiresAt = null;
        }
      } catch (e) {
        console.warn("Error parsing expiry date:", e);
        expiresAt = null;
      }
    }

    // Ensure createdAt is also ISO string
    let createdAt = p.created_at ?? p.createdAt ?? new Date().toISOString();
    try {
      const date = new Date(createdAt);
      if (!isNaN(date.getTime())) {
        createdAt = date.toISOString();
      }
    } catch {
      // Keep as is
    }

    return {
      id: id,
      buildingId: p.building_id ?? p.buildingId ?? buildingId,
      apartmentId: p.apartment_id ?? p.apartmentId ?? null,
      code: p.code ?? p.access_code ?? p.accessCode ?? null,
      visitorName:
        p.visitor_name ?? p.visitorName ?? p.name ?? p.visitor ?? "Visitor",
      qrDataUrl: p.qr_data ?? p.qrDataUrl ?? p.qr ?? p.qrcode ?? null,
      createdAt: createdAt,
      expiresAt: expiresAt,
      status: p.status ?? "active",
      raw: p,
    };
  };

  // Load all data
  async function loadAll() {
    if (!buildingId) {
      setToast({
        show: true,
        msg: "Could not determine your building. Please login again.",
      });
      setLoading(false);
      return;
    }

    try {
      const [passesResp, bookingsResp, complaintsResp] =
        await Promise.allSettled([
          api.get(`/buildings/${buildingId}/visitor-passes`),
          api.get(`/bookings/my`), // FIXED: Changed from admin endpoint to resident endpoint
          api.get(`/buildings/${buildingId}/complaints`),
        ]);

      /* ---------------- visitor passes ---------------- */
      if (passesResp.status === "fulfilled") {
        // Extract the real payload (support axios-style response and raw)
        const data = passesResp.value?.data ?? passesResp.value;
        let passesArray: any[] = [];

        if (Array.isArray(data)) {
          passesArray = data;
        } else if (Array.isArray(data?.passes)) {
          passesArray = data.passes;
        } else if (Array.isArray(data?.visitor_passes)) {
          passesArray = data.visitor_passes;
        } else if (Array.isArray(data?.data)) {
          // sometimes nested under data.data
          passesArray = data.data;
        } else if (
          data &&
          typeof data === "object" &&
          Object.keys(data).length === 0
        ) {
          passesArray = [];
        } else if (
          data &&
          typeof data === "object" &&
          data.passes == null &&
          data.data == null
        ) {
          // If the server returned the array directly inside data (but wrapped oddly), try to pick the inner array
          // e.g. response.data = { someKey: [...] } -> look for first array
          const firstArray = Object.values(data).find((v) => Array.isArray(v));
          if (firstArray) passesArray = firstArray as any[];
          else passesArray = [];
        } else {
          passesArray = [];
        }

        const normalized = passesArray
          .map((p: any) => normalizePass(p))
          .filter(Boolean) as VisitorPass[];

        console.log(
          "Loaded passes:",
          normalized.map((p) => ({
            id: p.id,
            code: p.code,
            expiresAt: p.expiresAt,
            status: p.status,
          }))
        );

        // Auto-filter expired passes
        const activePasses = normalized.filter(
          (p) => p.status === "active" && !isExpired(p.expiresAt)
        );

        setVisitorPasses(
          activePasses.sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )
        );
      } else {
        console.warn("Failed to load passes:", passesResp.reason);
      }

      /* ---------------- bookings ---------------- */
      if (bookingsResp.status === "fulfilled") {
        const data = bookingsResp.value?.data ?? bookingsResp.value;
        let bookingsArray: any[] = [];

        if (Array.isArray(data)) {
          bookingsArray = data;
        } else if (Array.isArray(data?.bookings)) {
          bookingsArray = data.bookings;
        } else if (Array.isArray(data?.data)) {
          bookingsArray = data.data;
        } else {
          // attempt to extract first array from response object
          const firstArray =
            data && typeof data === "object"
              ? Object.values(data).find((v) => Array.isArray(v))
              : null;
          bookingsArray = (firstArray as any[]) ?? [];
        }

        const normalized = bookingsArray.map((b: any) => ({
          ...b,
          id: b.id ?? b.booking_id ?? `bk_${Date.now()}`,
          date: b.date ?? b.booking_date ?? b.date_iso ?? null,
          slot: `${b.start_time || ""} - ${b.end_time || ""}`,
          amenity: b.amenity || "",
          createdAt: b.created_at ?? b.createdAt ?? new Date().toISOString(),
          status: b.status || "pending",
          start_time: b.start_time,
          end_time: b.end_time,
          guests: b.guests || 1,
          unit_number: b.unit_number || "",
          rejection_reason: b.rejection_reason || null,
        }));

        setBookings(
          normalized.sort(
            (x: any, y: any) =>
              new Date(x.date).getTime() - new Date(y.date).getTime()
          )
        );
      } else {
        console.warn("Failed to load bookings:", bookingsResp.reason);
      }

      /* ---------------- complaints ---------------- */
      if (complaintsResp.status === "fulfilled") {
        const data = complaintsResp.value?.data ?? complaintsResp.value;
        let complaintsArray: any[] = [];

        if (Array.isArray(data)) complaintsArray = data;
        else if (Array.isArray(data?.complaints))
          complaintsArray = data.complaints;
        else if (Array.isArray(data?.data)) complaintsArray = data.data;
        else {
          const firstArray =
            data && typeof data === "object"
              ? Object.values(data).find((v) => Array.isArray(v))
              : null;
          complaintsArray = (firstArray as any[]) ?? [];
        }

        const normalized = complaintsArray.map((c: any) => ({
          ...c,
          id: c.id ?? `c_${Date.now()}`,
          createdAt: c.created_at ?? c.createdAt ?? new Date().toISOString(),
        }));

        setComplaints(
          normalized.sort(
            (a: any, b: any) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )
        );
      }
    } catch (e) {
      console.error("loadAll error", e);
      setToast({ show: true, msg: "Failed to load data" });
    } finally {
      setLoading(false);
    }
  }

  // Auto-cleanup expired passes
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      setVisitorPasses((prev) => {
        const active = prev.filter(
          (p) => p.status === "active" && !isExpired(p.expiresAt)
        );
        return active;
      });
    }, 30000); // Check every 30 seconds

    return () => clearInterval(cleanupInterval);
  }, []);

  useEffect(() => {
    loadAll();

    // Update countdown every second
    intervalRef.current = setInterval(() => {
      setVisitorPasses((prev) => [...prev]);
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [buildingId]);

  /* ---------------- visitor pass (create) ---------------- */
  const handleVisitorPassCreated = async (visitorPass: any) => {
    if (!buildingId) {
      setToast({ show: true, msg: "No building selected" });
      return;
    }

    try {
      // Use the expiry from modal (should be 30 minutes from now)
      const expiresAt = visitorPass.expiresAt;

      const body = {
        code: visitorPass.code,
        visitorName: visitorPass.visitorName,
        qrData: visitorPass.qrDataUrl,
        expiresAt,
      };

      console.log("Creating pass:", {
        ...body,
        currentTime: new Date().toISOString(),
      });

      const resp = await api.post(
        `/buildings/${buildingId}/visitor-passes`,
        body
      );

      // Handle axios-style and raw responses:
      const respData = resp?.data ?? resp;
      if (respData && respData.pass) {
        const newPass = normalizePass(respData.pass);
        if (newPass) {
          setVisitorPasses((prev) => {
            const exists = prev.some(
              (p) =>
                String(p.id) === String(newPass.id) ||
                String(p.code) === String(newPass.code)
            );

            if (exists) {
              return prev.map((p) =>
                String(p.id) === String(newPass.id) ||
                String(p.code) === String(newPass.code)
                  ? newPass
                  : p
              );
            }

            return [newPass, ...prev].sort(
              (a, b) =>
                new Date(b.createdAt).getTime() -
                new Date(a.createdAt).getTime()
            );
          });

          setToast({
            show: true,
            msg: "✅ Visitor pass created! Valid for 30 minutes.",
          });
        }

        // Refresh data
        setTimeout(() => {
          loadAll();
        }, 1000);
      } else {
        await loadAll();
        setToast({ show: true, msg: "Visitor pass created" });
      }
    } catch (e: any) {
      console.error("create visitor pass error", e);
      const msg = e?.message || "Failed to create visitor pass";
      setToast({ show: true, msg });
    } finally {
      setVisitorPassModalOpen(false);
    }
  };

  const openPassViewer = (pass: VisitorPass) => {
    setSelectedPass(pass);
    setPassViewerModalOpen(true);
  };

  const closePassViewer = () => {
    setSelectedPass(null);
    setPassViewerModalOpen(false);
  };

  const cancelVisitorPass = async (id: string | number) => {
    if (!confirm("Cancel this visitor pass?")) return;
    try {
      await api.post(`/visitor-passes/${id}/cancel`);
      setVisitorPasses((prev) =>
        prev.filter((p) => String(p.id) !== String(id))
      );
      setToast({ show: true, msg: "Visitor pass cancelled" });
    } catch (e) {
      console.warn("Cancel pass failed", e);
      setVisitorPasses((prev) =>
        prev.filter((p) => String(p.id) !== String(id))
      );
      setToast({ show: true, msg: "Visitor pass cancelled" });
    }
  };

  /* ---------------- bookings ---------------- */
  // In Home.tsx, update the handleBookingCreated function:
  const handleBookingCreated = async (booking: any) => {
    console.log("handleBookingCreated called with:", booking);

    if (!buildingId) {
      setToast({ show: true, msg: "No building selected" });
      return false;
    }

    try {
      // Ensure the booking data matches what backend expects
      const bookingData = {
        amenity_id: booking.amenity_id,
        date: booking.date,
        slot_name: booking.slot_name,
        purpose: booking.purpose || "",
      };

      console.log("Sending booking data to API:", bookingData);

      // Call the correct endpoint
      const response = await api.post("/bookings", bookingData);
      console.log("API Response:", response);

      if (response.success) {
        setToast({
          show: true,
          msg:
            response.message ||
            "Booking submitted successfully! Waiting for admin approval.",
        });

        // Refresh bookings list
        await loadAll();
        return true;
      } else {
        setToast({
          show: true,
          msg: response.error || "Failed to create booking",
        });
        return false;
      }
    } catch (e: any) {
      console.error("Create booking error:", e);

      let errorMsg = "Failed to create booking";
      if (e.response?.data?.error) {
        errorMsg = e.response.data.error;
      } else if (e.message) {
        errorMsg = e.message;
      }

      setToast({
        show: true,
        msg: errorMsg,
      });
      return false;
    } finally {
      setBookingModalOpen(false);
    }
  };

  const cancelBooking = async (id: string | number) => {
    if (!confirm("Cancel this booking?")) return;
    try {
      await api.post(`/bookings/${id}/cancel`, {});
      await loadAll();
      setToast({ show: true, msg: "Booking cancelled" });
    } catch (e: any) {
      console.error("cancel booking error", e);
      setToast({
        show: true,
        msg: e?.message || "Failed to cancel booking",
      });
    }
  };

  const handleComplaintCreated = async (complaint: any) => {
    if (!buildingId) {
      setToast({ show: true, msg: "No building selected" });
      return;
    }
    try {
      await api.post(`/buildings/${buildingId}/complaints`, {
        type: complaint.type,
        description: complaint.description,
      });
      await loadAll();
      setToast({ show: true, msg: "Complaint submitted successfully!" });
    } catch (e) {
      console.error("create complaint error", e);
      setToast({ show: true, msg: "Failed to submit complaint" });
    } finally {
      setComplaintModalOpen(false);
    }
  };

  const deleteComplaint = async (id: string | number) => {
    if (!confirm("Delete this complaint?")) return;
    setComplaints((prev) => prev.filter((c) => String(c.id) !== String(id)));
    setToast({ show: true, msg: "Complaint deleted" });
  };

  /* ---------------- derived lists ---------------- */
  const activeBookings = bookings.filter((b) => {
    try {
      if (!b.date) return false;
      const d = new Date(b.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Only show approved or pending bookings for future dates
      const isFutureDate = d >= today;
      const isActiveStatus = b.status === "approved" || b.status === "pending";

      return isFutureDate && isActiveStatus;
    } catch {
      return false;
    }
  });

  // Show only active and non-expired passes
  const activeVisitorPasses = visitorPasses.filter(
    (p) => p.status === "active" && !isExpired(p.expiresAt)
  );

  const getAmenityIcon = (amenityName: string) => {
    if (!amenityName) return fitnessOutline;
    return fitnessOutline;
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

  /* ---------------- render ---------------- */
  return (
    <IonPage>
      <IonHeader className="ion-no-border">
        <IonToolbar
          style={{
            "--background": "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            "--border-width": "0",
            "--min-height": "70px",
          }}
        >
          <div
            style={{
              padding: "0 16px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              height: "100%",
            }}
          >
            <div>
              <div
                style={{
                  fontWeight: 800,
                  fontSize: "20px",
                  color: "white",
                  letterSpacing: "-0.5px",
                }}
              >
                🏠 ApartmentCare
              </div>
              <div
                style={{
                  fontSize: "12px",
                  color: "rgba(255,255,255,0.8)",
                  fontWeight: 500,
                  marginTop: "2px",
                }}
              >
                Secure Visitor Management
              </div>
            </div>
            <IonBadge
              color="light"
              style={{
                fontSize: "12px",
                fontWeight: 700,
                padding: "6px 12px",
                borderRadius: "20px",
                background: "rgba(255,255,255,0.2)",
                backdropFilter: "blur(10px)",
              }}
            >
              {activeVisitorPasses.length} Active
            </IonBadge>
          </div>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen scrollY={true}>
        <div
          style={{
            padding: "20px 16px 32px",
            maxWidth: "600px",
            margin: "0 auto",
            width: "100%",
          }}
        >
          {/* Welcome Header */}
          <div style={{ marginBottom: "28px" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "8px",
              }}
            >
              <div>
                <h1
                  style={{
                    fontWeight: 800,
                    fontSize: "28px",
                    background:
                      "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    margin: "0 0 4px 0",
                    lineHeight: 1.2,
                  }}
                >
                  Welcome Home
                </h1>
                <p
                  style={{
                    color: "#6b7280",
                    fontSize: "14px",
                    fontWeight: 500,
                    margin: 0,
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <span>📍</span>
                  {(() => {
                    try {
                      const u = JSON.parse(
                        localStorage.getItem("user") || "{}"
                      );
                      const b =
                        u.buildingName ||
                        u.building ||
                        `Block ${u.buildingId || "?"}`;
                      const apt = u.apartmentId || u.apartment_id || "—";
                      return `${b} • Apt ${apt}`;
                    } catch {
                      return "Your Residence";
                    }
                  })()}
                </p>
              </div>
              <div
                style={{
                  background:
                    "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  width: "48px",
                  height: "48px",
                  borderRadius: "12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "white",
                  fontWeight: 700,
                  fontSize: "18px",
                  boxShadow: "0 4px 15px rgba(102, 126, 234, 0.3)",
                }}
              >
                {activeVisitorPasses.length}
              </div>
            </div>
          </div>

          {/* Quick Actions Grid */}
          <IonGrid style={{ padding: 0, marginBottom: "32px" }}>
            <IonRow>
              <IonCol size="4">
                <div
                  onClick={() => setVisitorPassModalOpen(true)}
                  style={cardStyle}
                >
                  <div style={cardInnerStyle}>
                    <div
                      style={{
                        width: "52px",
                        height: "52px",
                        borderRadius: "14px",
                        background: "rgba(255,255,255,0.2)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "white",
                        fontSize: "24px",
                        marginBottom: "12px",
                      }}
                    >
                      <IonIcon icon={qrCodeOutline} />
                    </div>
                    <div>
                      <div
                        style={{
                          fontSize: "14px",
                          fontWeight: 700,
                          color: "white",
                          marginBottom: "2px",
                        }}
                      >
                        Visitor Pass
                      </div>
                      <div
                        style={{
                          fontSize: "11px",
                          color: "rgba(255,255,255,0.8)",
                          fontWeight: 500,
                        }}
                      >
                        30-min access
                      </div>
                    </div>
                  </div>
                </div>
              </IonCol>
              <IonCol size="4">
                <div
                  onClick={() => setBookingModalOpen(true)}
                  style={{
                    ...cardStyle,
                    background:
                      "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
                  }}
                >
                  <div style={cardInnerStyle}>
                    <div
                      style={{
                        width: "52px",
                        height: "52px",
                        borderRadius: "14px",
                        background: "rgba(255,255,255,0.2)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "white",
                        fontSize: "24px",
                        marginBottom: "12px",
                      }}
                    >
                      <IonIcon icon={calendarOutline} />
                    </div>
                    <div>
                      <div
                        style={{
                          fontSize: "14px",
                          fontWeight: 700,
                          color: "white",
                          marginBottom: "2px",
                        }}
                      >
                        Book Amenity
                      </div>
                      <div
                        style={{
                          fontSize: "11px",
                          color: "rgba(255,255,255,0.8)",
                          fontWeight: 500,
                        }}
                      >
                        Reserve facility
                      </div>
                    </div>
                  </div>
                </div>
              </IonCol>
              <IonCol size="4">
                <div
                  onClick={() => setComplaintModalOpen(true)}
                  style={{
                    ...cardStyle,
                    background:
                      "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
                  }}
                >
                  <div style={cardInnerStyle}>
                    <div
                      style={{
                        width: "52px",
                        height: "52px",
                        borderRadius: "14px",
                        background: "rgba(255,255,255,0.2)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "white",
                        fontSize: "24px",
                        marginBottom: "12px",
                      }}
                    >
                      <IonIcon icon={megaphoneOutline} />
                    </div>
                    <div>
                      <div
                        style={{
                          fontSize: "14px",
                          fontWeight: 700,
                          color: "white",
                          marginBottom: "2px",
                        }}
                      >
                        Report Issue
                      </div>
                      <div
                        style={{
                          fontSize: "11px",
                          color: "rgba(255,255,255,0.8)",
                          fontWeight: 500,
                        }}
                      >
                        Contact admin
                      </div>
                    </div>
                  </div>
                </div>
              </IonCol>
            </IonRow>
          </IonGrid>

          {/* Active Visitor Passes Section */}
          <div style={{ marginBottom: "32px" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "16px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <div
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "8px",
                    background:
                      "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "white",
                  }}
                >
                  <IonIcon icon={personOutline} style={{ fontSize: "18px" }} />
                </div>
                <div>
                  <h2
                    style={{
                      fontWeight: 700,
                      fontSize: "18px",
                      color: "#1f2937",
                      margin: 0,
                    }}
                  >
                    Active Visitor Passes
                  </h2>
                  <p
                    style={{
                      fontSize: "12px",
                      color: "#6b7280",
                      margin: "2px 0 0 0",
                    }}
                  >
                    Valid for 30 minutes each
                  </p>
                </div>
              </div>
              <IonBadge
                color="primary"
                style={{
                  fontSize: "12px",
                  fontWeight: 700,
                  padding: "6px 12px",
                  borderRadius: "12px",
                }}
              >
                {activeVisitorPasses.length}
              </IonBadge>
            </div>

            {activeVisitorPasses.length > 0 ? (
              <div>
                {activeVisitorPasses.map((pass) => {
                  const countdownColor = getCountdownColor(pass.expiresAt);
                  const timeLeft = formatCountdown(pass.expiresAt);

                  return (
                    <IonItemSliding key={pass.id}>
                      <IonItem
                        style={{
                          ...itemStyle,
                          "--background": "white",
                          "--padding-start": "0",
                          "--inner-padding-end": "0",
                        }}
                        button
                        detail={false}
                        onClick={() => openPassViewer(pass)}
                      >
                        <div
                          style={{
                            width: "100%",
                            padding: "16px",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              gap: "16px",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "14px",
                                flex: 1,
                              }}
                            >
                              <div style={avatarStyle}>
                                <IonIcon
                                  icon={personOutline}
                                  style={{ color: "#667eea", fontSize: "20px" }}
                                />
                              </div>
                              <div style={{ flex: 1 }}>
                                <div
                                  style={{
                                    fontWeight: 700,
                                    fontSize: "15px",
                                    color: "#1f2937",
                                    marginBottom: "4px",
                                  }}
                                >
                                  {pass.visitorName}
                                </div>
                                <div
                                  style={{
                                    color: "#6b7280",
                                    fontSize: "12px",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "4px",
                                  }}
                                >
                                  <span>
                                    Code: <strong>{pass.code}</strong>
                                  </span>
                                  <span style={{ margin: "0 4px" }}>•</span>
                                  <span>
                                    Expires: {formatIST(pass.expiresAt)}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div
                              style={{
                                textAlign: "center",
                                minWidth: "70px",
                              }}
                            >
                              <IonBadge
                                color={countdownColor}
                                style={{
                                  fontSize: "13px",
                                  fontWeight: 800,
                                  padding: "6px 10px",
                                  borderRadius: "8px",
                                  minWidth: "70px",
                                }}
                              >
                                {timeLeft}
                              </IonBadge>
                              <div
                                style={{
                                  fontSize: "10px",
                                  color: "#9ca3af",
                                  marginTop: "4px",
                                  fontWeight: 600,
                                }}
                              >
                                TIME LEFT
                              </div>
                            </div>
                          </div>
                        </div>
                      </IonItem>

                      <IonItemOptions side="end">
                        <IonItemOption
                          color="danger"
                          onClick={(e) => {
                            e.stopPropagation();
                            cancelVisitorPass(pass.id);
                          }}
                          style={{
                            padding: "0 20px",
                            fontWeight: 600,
                          }}
                        >
                          <IonIcon icon={trashOutline} slot="start" />
                          Cancel
                        </IonItemOption>
                        <IonItemOption
                          color="primary"
                          onClick={(e) => {
                            e.stopPropagation();
                            openPassViewer(pass);
                          }}
                          style={{
                            padding: "0 20px",
                            fontWeight: 600,
                          }}
                        >
                          <IonIcon icon={eyeOutline} slot="start" />
                          View
                        </IonItemOption>
                      </IonItemOptions>
                    </IonItemSliding>
                  );
                })}
              </div>
            ) : (
              <div style={emptyStateStyle}>
                <IonIcon
                  icon={timeOutline}
                  style={{
                    fontSize: "48px",
                    marginBottom: "16px",
                    color: "#d1d5db",
                  }}
                />
                <div
                  style={{
                    fontWeight: 700,
                    marginBottom: "8px",
                    color: "#4b5563",
                  }}
                >
                  No active passes
                </div>
                <div
                  style={{
                    fontSize: "14px",
                    color: "#6b7280",
                    textAlign: "center",
                  }}
                >
                  Create a visitor pass to grant temporary access
                </div>
              </div>
            )}
          </div>

          {/* Upcoming Bookings Section */}
          <div style={{ marginBottom: "32px" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "16px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <div
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "8px",
                    background:
                      "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "white",
                  }}
                >
                  <IonIcon
                    icon={calendarOutline}
                    style={{ fontSize: "18px" }}
                  />
                </div>
                <h2
                  style={{
                    fontWeight: 700,
                    fontSize: "18px",
                    color: "#1f2937",
                    margin: 0,
                  }}
                >
                  Upcoming Bookings
                </h2>
              </div>
              <IonBadge color="primary">{activeBookings.length}</IonBadge>
            </div>

            {activeBookings.length > 0 ? (
              <div>
                {activeBookings.slice(0, 3).map((booking: any) => (
                  <div key={booking.id} style={itemStyle}>
                    <div style={{ padding: "16px" }}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "12px",
                          }}
                        >
                          <div
                            style={{
                              ...avatarStyle,
                              background: "rgba(240, 147, 251, 0.1)",
                            }}
                          >
                            <IonIcon
                              icon={getAmenityIcon(booking.amenity)}
                              style={{ color: "#f093fb" }}
                            />
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, color: "#1f2937" }}>
                              {booking.amenity}
                            </div>
                            <div style={{ color: "#6b7280", fontSize: "12px" }}>
                              {booking.date
                                ? new Date(booking.date).toLocaleDateString(
                                    "en-IN",
                                    {
                                      weekday: "short",
                                      day: "numeric",
                                      month: "short",
                                    }
                                  )
                                : "-"}{" "}
                              • {booking.slot}
                            </div>
                            {/* Add status badge */}
                            {booking.status && (
                              <div style={{ marginTop: "4px" }}>
                                <IonBadge
                                  color={getStatusColor(booking.status)}
                                  style={{
                                    fontSize: "10px",
                                    padding: "2px 6px",
                                  }}
                                >
                                  {booking.status.toUpperCase()}
                                </IonBadge>
                                {booking.status === "rejected" &&
                                  booking.rejection_reason && (
                                    <div
                                      style={{
                                        fontSize: "10px",
                                        color: "#dc2626",
                                        marginTop: "2px",
                                        fontStyle: "italic",
                                      }}
                                    >
                                      Reason: {booking.rejection_reason}
                                    </div>
                                  )}
                              </div>
                            )}
                          </div>
                        </div>
                        {booking.status === "pending" && (
                          <IonButton
                            size="small"
                            fill="clear"
                            color="medium"
                            onClick={() => cancelBooking(booking.id)}
                            style={{
                              "--padding-start": "8px",
                              "--padding-end": "8px",
                            }}
                          >
                            Cancel
                          </IonButton>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={emptyStateStyle}>
                <IonIcon
                  icon={calendarOutline}
                  style={{
                    fontSize: "48px",
                    marginBottom: "16px",
                    color: "#d1d5db",
                  }}
                />
                <div style={{ fontSize: "14px", color: "#6b7280" }}>
                  No upcoming bookings
                </div>
              </div>
            )}
          </div>

          {/* Recent Complaints Section */}
          <div style={{ marginBottom: "40px" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "16px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <div
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "8px",
                    background:
                      "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "white",
                  }}
                >
                  <IonIcon
                    icon={megaphoneOutline}
                    style={{ fontSize: "18px" }}
                  />
                </div>
                <h2
                  style={{
                    fontWeight: 700,
                    fontSize: "18px",
                    color: "#1f2937",
                    margin: 0,
                  }}
                >
                  Reported Issues
                </h2>
              </div>
              <IonBadge color="medium">{complaints.length}</IonBadge>
            </div>

            {complaints.length > 0 ? (
              <div>
                {complaints.slice(0, 2).map((c) => (
                  <div key={c.id} style={itemStyle}>
                    <div style={{ padding: "16px" }}>
                      <div
                        style={{
                          display: "flex",
                          gap: "12px",
                          alignItems: "flex-start",
                        }}
                      >
                        <div
                          style={{
                            ...avatarStyle,
                            background: "rgba(79, 172, 254, 0.1)",
                            width: "36px",
                            height: "36px",
                          }}
                        >
                          <IonIcon
                            icon={alertCircleOutline}
                            style={{ color: "#4facfe" }}
                          />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "flex-start",
                              marginBottom: "4px",
                            }}
                          >
                            <div style={{ fontWeight: 700, color: "#1f2937" }}>
                              {c.type}
                            </div>
                            <IonChip
                              color="success"
                              style={{
                                fontSize: "10px",
                                height: "20px",
                                margin: 0,
                              }}
                            >
                              Submitted
                            </IonChip>
                          </div>
                          <div
                            style={{
                              color: "#6b7280",
                              fontSize: "13px",
                              lineHeight: 1.4,
                              marginBottom: "8px",
                            }}
                          >
                            {c.description}
                          </div>
                          <div
                            style={{
                              color: "#9ca3af",
                              fontSize: "11px",
                              fontWeight: 500,
                            }}
                          >
                            {c.createdAt
                              ? new Date(c.createdAt).toLocaleDateString(
                                  "en-IN",
                                  {
                                    day: "numeric",
                                    month: "short",
                                    year: "numeric",
                                  }
                                )
                              : "-"}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={emptyStateStyle}>
                <IonIcon
                  icon={megaphoneOutline}
                  style={{
                    fontSize: "48px",
                    marginBottom: "16px",
                    color: "#d1d5db",
                  }}
                />
                <div style={{ fontSize: "14px", color: "#6b7280" }}>
                  No reported issues
                </div>
              </div>
            )}
          </div>
        </div>
      </IonContent>
      {/* Modals */}
      <VisitorPassModal
        isOpen={visitorPassModalOpen}
        onClose={() => setVisitorPassModalOpen(false)}
        onCreated={handleVisitorPassCreated}
      />
      <AmenitiesBookingModal
        isOpen={bookingModalOpen}
        onClose={() => setBookingModalOpen(false)}
        onConfirm={handleBookingCreated}
        buildingId={buildingId}
      />
      <ComplaintModal
        isOpen={complaintModalOpen}
        onClose={() => setComplaintModalOpen(false)}
        onCreated={handleComplaintCreated}
      />
      <PassViewerModal
        isOpen={passViewerModalOpen}
        onClose={closePassViewer}
        pass={selectedPass}
        onCancelPass={cancelVisitorPass}
      />
      {/* Toast */}
      <IonToast
        isOpen={toast.show}
        message={toast.msg}
        duration={2000}
        position="top"
        style={{ "--background": "#667eea", "--color": "white" }}
        onDidDismiss={() => setToast({ show: false, msg: "" })}
      />
    </IonPage>
  );
}

/* ---------------- styles ---------------- */
const cardStyle = {
  borderRadius: "20px",
  padding: "20px 16px",
  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  boxShadow: "0 10px 40px rgba(0,0,0,0.08)",
  cursor: "pointer",
  transition: "all 0.3s ease",
  height: "100%",
  textAlign: "center",
};

const cardInnerStyle = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: "8px",
  height: "100%",
  justifyContent: "center",
};

const avatarStyle = {
  background: "rgba(102, 126, 234, 0.1)",
  width: "44px",
  height: "44px",
  borderRadius: "12px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
};

const itemStyle = {
  background: "white",
  borderRadius: "16px",
  marginBottom: "12px",
  border: "1px solid rgba(229, 231, 235, 0.8)",
  boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
  transition: "all 0.2s ease",
};

const emptyStateStyle = {
  textAlign: "center",
  padding: "40px 20px",
  color: "#6b7280",
  background: "rgba(249, 250, 251, 0.8)",
  borderRadius: "16px",
  border: "2px dashed #e5e7eb",
};
