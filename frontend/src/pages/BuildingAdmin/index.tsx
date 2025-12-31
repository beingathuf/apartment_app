// src/pages/BuildingAdmin/index.tsx
import React, { useEffect, useState } from "react";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonLabel,
  IonButton,
  IonIcon,
  IonAlert,
  IonToast,
  IonButtons,
  IonList,
  IonMenu,
  IonItem,
} from "@ionic/react";
import {
  homeOutline,
  logOutOutline,
  menuOutline,
  chevronForwardOutline,
  closeOutline,
  personOutline,
  businessOutline,
  peopleOutline,
  checkmarkCircleOutline,
  notificationsOutline,
  calendarOutline,
  alertCircleOutline,
  qrCodeOutline,
  shieldOutline,
} from "ionicons/icons";
import { useHistory } from "react-router-dom";
import api from "../../api";
import DashboardTab from "./DashboardTab";
import ApartmentsTab from "./ApartmentsTab";
import ResidentsTab from "./ResidentsTab";
import VerifyTab from "./VerifyTab";
import NoticesTab from "./NoticesTab";
import ComplaintsTab from "./ComplaintsTab";
import AdminBookingsTab from "./AdminBookingsTab";
import NoticeModal from "./NoticeModal";
import ScannerModal from "./ScannerModal";
import WatchmenTab from "./WatchmanTab";

import {
  TabType,
  Apartment,
  User,
  VisitorPass,
  Notice,
  Stats,
  ComplaintStats,
} from "./types";
import { formatDateTime } from "./utils";
import "./BuildingAdmin.css"; // Import CSS file

export default function BuildingAdmin() {
  const history = useHistory();

  const [effectiveBuildingId, setEffectiveBuildingId] = useState<string | null>(
    null
  );
  const [activeTab, setActiveTab] = useState<TabType>("dashboard");

  const [showDrawer, setShowDrawer] = useState(false);

  // Form states
  const [unitNumber, setUnitNumber] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [residentPhone, setResidentPhone] = useState("");
  const [residentPassword, setResidentPassword] = useState("");
  const [residentName, setResidentName] = useState("");
  const [selectedApartmentId, setSelectedApartmentId] = useState<string>("");
  const [verificationCode, setVerificationCode] = useState("");

  // Notice states
  const [showNoticeModal, setShowNoticeModal] = useState(false);
  const [noticeTitle, setNoticeTitle] = useState("");
  const [noticeContent, setNoticeContent] = useState("");
  const [noticeCategory, setNoticeCategory] = useState("general");
  const [noticePriority, setNoticePriority] = useState<
    "low" | "medium" | "high"
  >("medium");
  const [noticeExpiresAt, setNoticeExpiresAt] = useState("");

  // Scanner states
  const [showScanner, setShowScanner] = useState(false);

  // Data states
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [activePasses, setActivePasses] = useState<VisitorPass[]>([]);
  const [verificationResult, setVerificationResult] = useState<any>(null);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [pendingBookings, setPendingBookings] = useState<any[]>([]);

  const [complaintStats, setComplaintStats] = useState<ComplaintStats>({
    total: 0,
    submitted: 0,
    in_progress: 0,
    resolved: 0,
    rejected: 0,
    today: 0,
  });
  // Watchman states
  const [watchmen, setWatchmen] = useState<Watchman[]>([]);
  const [watchmanPhone, setWatchmanPhone] = useState("");
  const [watchmanPassword, setWatchmanPassword] = useState("");
  const [watchmanName, setWatchmanName] = useState("");
  // UI states
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{
    type: string;
    id: number;
  } | null>(null);
  const [toast, setToast] = useState({
    show: false,
    message: "",
    color: "success" as "success" | "danger" | "warning",
  });

  // Stats
  const [stats, setStats] = useState<Stats>({
    totalApartments: 0,
    totalResidents: 0,
    activePassesCount: 0,
    verifiedToday: 0,
    unreadNotices: 0,
    pendingBookings: 0,
    pendingComplaints: 0,
  });

  // Menu items with icons
  const menuItems = [
    {
      value: "dashboard" as TabType,
      label: "Dashboard",
      icon: homeOutline,
      description: "Overview and analytics",
    },
    {
      value: "apartments" as TabType,
      label: "Apartments",
      icon: businessOutline,
      description: "Manage building units",
    },
    {
      value: "residents" as TabType,
      label: "Residents",
      icon: peopleOutline,
      description: "Manage residents and users",
    },
    {
      value: "verify" as TabType,
      label: "Verify Pass",
      icon: checkmarkCircleOutline,
      description: "Verify visitor passes",
    },
    {
      value: "notices" as TabType,
      label: "Notices",
      icon: notificationsOutline,
      description: "Post and manage notices",
      badge: stats.unreadNotices > 0 ? stats.unreadNotices : undefined,
    },
    {
      value: "bookings" as TabType,
      label: "Bookings",
      icon: calendarOutline,
      description: "Manage facility bookings",
      badge: stats.pendingBookings > 0 ? stats.pendingBookings : undefined,
    },
    {
      value: "complaints" as TabType,
      label: "Complaints",
      icon: alertCircleOutline,
      description: "Handle resident complaints",
      badge: stats.pendingComplaints > 0 ? stats.pendingComplaints : undefined,
    },
    {
      value: "watchmen" as TabType,
      label: "Watchmen",
      icon: shieldOutline,
      description: "Manage building security",
    },
  ];

  // Function to handle menu toggle
  const handleMenuToggle = () => {
    setShowDrawer(true);
  };

  // Function to handle menu item selection
  const handleMenuItemSelect = (tab: TabType) => {
    setActiveTab(tab);
    setShowDrawer(false);
  };

  // Function to handle logout from menu
  const handleLogoutFromMenu = () => {
    setShowDrawer(false);
    setTimeout(() => {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      history.push("/admin-login");
    }, 300);
  };

  // Function to show current active tab title
  const getActiveTabTitle = () => {
    const activeItem = menuItems.find((item) => item.value === activeTab);
    return activeItem ? activeItem.label : "Building Admin";
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    let bid = params.get("buildingId");

    if (!bid) {
      try {
        const u = localStorage.getItem("user");
        if (u) {
          const parsed = JSON.parse(u);
          bid = parsed.buildingId || parsed.building_id || null;
        }
      } catch (err) {
        console.warn("Failed to read user from localStorage", err);
      }
    }

    if (!bid) {
      setToast({
        show: true,
        message: "No building selected. Redirecting to Super Admin.",
        color: "warning",
      });
      setTimeout(() => history.push("/super-admin"), 2000);
      return;
    }

    const currentParams = new URLSearchParams(window.location.search);
    if (!currentParams.get("buildingId")) {
      currentParams.set("buildingId", String(bid));
      history.replace({ search: `?${currentParams.toString()}` });
    }

    setEffectiveBuildingId(String(bid));
    loadBuildingData(String(bid));
  }, [history]);

  async function loadBuildingData(bid: string) {
    setLoading(true);
    try {
      const [
        apartmentsRes,
        usersRes,
        passesRes,
        noticesRes,
        bookingsRes,
        complaintsRes,
        watchmenRes,
      ] = await Promise.all([
        api.get(`/admin/buildings/${bid}/apartments`),
        api.get(`/admin/buildings/${bid}/users`),
        api.get(`/admin/buildings/${bid}/active-passes`),
        api.get(`/buildings/${bid}/notices`),
        api.get(`/buildings/${bid}/bookings?status=pending`),
        api.get(`/buildings/${bid}/complaints/stats`),
        api.get(`/admin/buildings/${bid}/watchmen`),
      ]);

      // Extract data from API responses
      const apartmentsData = apartmentsRes?.data || apartmentsRes;
      const usersData = usersRes?.data || usersRes;
      const passesData = passesRes?.data || passesRes;
      const noticesData = noticesRes?.data || noticesRes;
      const bookingsData = bookingsRes?.data || bookingsRes;
      const complaintsStatsData = complaintsRes?.data || complaintsRes;
      const watchmenData = watchmenRes?.data || watchmenRes;
      setWatchmen(watchmenData?.watchmen || []);

      setApartments(apartmentsData?.apartments || []);
      setUsers(usersData?.users || []);
      setPendingBookings(bookingsData?.bookings || []);

      // Format passes dates
      const formattedPasses = (passesData?.passes || []).map(
        (pass: VisitorPass) => ({
          ...pass,
          created_at: formatDateTime(pass.created_at),
          expires_at: formatDateTime(pass.expires_at),
        })
      );
      setActivePasses(formattedPasses);

      // Format notices dates
      const formattedNotices = (noticesData?.notices || []).map(
        (notice: any) => ({
          ...notice,
          created_at: formatDateTime(notice.created_at),
          expires_at: notice.expires_at
            ? formatDateTime(notice.expires_at)
            : undefined,
          content: notice.body || notice.content || "",
        })
      );
      setNotices(formattedNotices);

      // Parse complaints stats
      const parsedComplaintStats = complaintsStatsData?.stats || {
        total: 0,
        submitted: 0,
        in_progress: 0,
        resolved: 0,
        rejected: 0,
        today: 0,
      };
      setComplaintStats(parsedComplaintStats);

      // Calculate stats
      const residents = (usersData?.users || []).filter(
        (u: User) => u.role === "resident"
      );
      const unreadNoticesCount = formattedNotices.filter(
        (notice: Notice) => !notice.is_expired
      ).length;

      setStats({
        totalApartments: apartmentsData?.apartments?.length || 0,
        totalResidents: residents.length,
        totalWatchmen: watchmenData?.watchmen?.length || 0,
        activePassesCount: passesData?.passes?.length || 0,
        verifiedToday: 0,
        unreadNotices: unreadNoticesCount,
        pendingBookings: bookingsData?.bookings?.length || 0,
        pendingComplaints: parsedComplaintStats.submitted || 0,
      });

      if (apartmentsData?.apartments?.length > 0 && !selectedApartmentId) {
        setSelectedApartmentId(String(apartmentsData.apartments[0].id));
      }
    } catch (err: any) {
      console.error("loadBuildingData error:", err);
      showToast("Failed to load building data", "danger");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateWatchman() {
    const bid = effectiveBuildingId;
    if (!bid) return showToast("No building selected", "warning");
    if (
      !watchmanPhone.trim() ||
      !watchmanPassword.trim() ||
      !watchmanName.trim()
    ) {
      return showToast("Name, phone and password are required", "warning");
    }

    setBusy(true);
    try {
      const res = await api.post(`/admin/buildings/${bid}/watchmen`, {
        name: watchmanName.trim(),
        phone: watchmanPhone.trim(),
        password: watchmanPassword,
      });

      const resData = res?.data || res;
      if (resData?.watchman) {
        setWatchmanPhone("");
        setWatchmanPassword("");
        setWatchmanName("");
        showToast(`Watchman ${resData.watchman.name} created successfully`);
        loadBuildingData(bid);
      }
    } catch (err: any) {
      showToast(err.message || "Failed to create watchman", "danger");
    } finally {
      setBusy(false);
    }
  }

  async function handleDeleteWatchman(watchmanId: number) {
    const bid = effectiveBuildingId;
    if (!bid) return showToast("No building selected", "warning");

    setBusy(true);
    try {
      await api.del(`/admin/buildings/${bid}/watchmen/${watchmanId}`);
      setWatchmen((prev) => prev.filter((w) => w.id !== watchmanId));
      showToast("Watchman deleted successfully");
    } catch (err: any) {
      showToast(err.message || "Failed to delete watchman", "danger");
    } finally {
      setBusy(false);
    }
  }

  const showToast = (
    message: string,
    color: "success" | "danger" | "warning" = "success"
  ) => {
    setToast({ show: true, message, color });
  };

  async function handleCreateApartment() {
    const bid = effectiveBuildingId;
    if (!bid) return showToast("No building selected", "warning");
    if (!unitNumber.trim())
      return showToast("Unit number is required", "warning");

    setBusy(true);
    try {
      const res = await api.post(`/admin/buildings/${bid}/apartments`, {
        unit_number: unitNumber.trim(),
        owner_name: ownerName.trim() || null,
      });

      const resData = res?.data || res;
      if (resData?.apartment) {
        setApartments((prev) => [resData.apartment, ...prev]);
        setUnitNumber("");
        setOwnerName("");
        setSelectedApartmentId(String(resData.apartment.id));
        showToast(
          `Apartment ${resData.apartment.unit_number} created successfully`
        );
        loadBuildingData(bid);
      }
    } catch (err: any) {
      showToast(err.message || "Failed to create apartment", "danger");
    } finally {
      setBusy(false);
    }
  }

  async function handleCreateResident() {
    const bid = effectiveBuildingId;
    if (!bid) return showToast("No building selected", "warning");
    if (!selectedApartmentId)
      return showToast("Please select an apartment first", "warning");
    if (!residentPhone.trim() || !residentPassword.trim()) {
      return showToast("Phone and password are required", "warning");
    }

    setBusy(true);
    try {
      const res = await api.post(`/admin/buildings/${bid}/users`, {
        name: residentName.trim() || null,
        phone: residentPhone.trim(),
        password: residentPassword,
        apartment_id: Number(selectedApartmentId),
      });

      const resData = res?.data || res;
      if (resData?.user) {
        setResidentPhone("");
        setResidentPassword("");
        setResidentName("");
        showToast(`Resident created for ${residentPhone}`);
        loadBuildingData(bid);
      }
    } catch (err: any) {
      showToast(err.message || "Failed to create resident", "danger");
    } finally {
      setBusy(false);
    }
  }

  async function handleCreateNotice() {
    const bid = effectiveBuildingId;
    if (!bid) return showToast("No building selected", "warning");
    if (!noticeTitle.trim() || !noticeContent.trim()) {
      return showToast("Title and content are required", "warning");
    }

    setBusy(true);
    try {
      const res = await api.post(`/buildings/${bid}/notices`, {
        title: noticeTitle.trim(),
        body: noticeContent.trim(),
        category: noticeCategory,
        priority: noticePriority,
        expires_at: noticeExpiresAt || null,
      });

      const resData = res?.data || res;
      if (resData?.notice) {
        const formattedNotice = {
          ...resData.notice,
          created_at: formatDateTime(resData.notice.created_at),
          expires_at: resData.notice.expires_at
            ? formatDateTime(resData.notice.expires_at)
            : undefined,
          content: resData.notice.body || "",
        };
        setNotices((prev) => [formattedNotice, ...prev]);
        setNoticeTitle("");
        setNoticeContent("");
        setNoticeCategory("general");
        setNoticePriority("medium");
        setNoticeExpiresAt("");
        setShowNoticeModal(false);
        showToast("Notice created successfully");
        loadBuildingData(bid);
      }
    } catch (err: any) {
      showToast(err.message || "Failed to create notice", "danger");
    } finally {
      setBusy(false);
    }
  }

  async function handleDeleteNotice(noticeId: number) {
    const bid = effectiveBuildingId;
    if (!bid) return showToast("No building selected", "warning");

    setBusy(true);
    try {
      await api.del(`/notices/${noticeId}`);
      setNotices((prev) => prev.filter((n) => n.id !== noticeId));
      showToast("Notice deleted successfully");
    } catch (err: any) {
      showToast(err.message || "Failed to delete notice", "danger");
    } finally {
      setBusy(false);
    }
  }

  // Change this function in BuildingAdmin/index.tsx
  async function handleVerifyPass() {
    const bid = effectiveBuildingId;
    if (!bid) return showToast("No building selected", "warning");
    if (!verificationCode.trim())
      return showToast("Enter a pass code to verify", "warning");

    setBusy(true);
    try {
      const res = await api.post(`/buildings/${bid}/verify-pass`, {
        code: verificationCode.trim().toUpperCase(),
      });

      const resData = res?.data || res;
      setVerificationResult(resData);
      if (resData?.valid) {
        showToast("✅ Valid pass - Access granted", "success");
      } else {
        showToast("❌ Invalid or expired pass", "danger");
      }
    } catch (err: any) {
      showToast(err.message || "Verification failed", "danger");
      setVerificationResult(null);
    } finally {
      setBusy(false);
    }
  }

  async function handleDeleteItem() {
    if (!itemToDelete || !effectiveBuildingId) return;

    setBusy(true);
    try {
      if (itemToDelete.type === "apartment") {
        await api.del(
          `/admin/buildings/${effectiveBuildingId}/apartments/${itemToDelete.id}`
        );
        setApartments((prev) => prev.filter((a) => a.id !== itemToDelete.id));
        showToast("Apartment deleted successfully");
      } else if (itemToDelete.type === "user") {
        await api.del(
          `/admin/buildings/${effectiveBuildingId}/users/${itemToDelete.id}`
        );
        setUsers((prev) => prev.filter((u) => u.id !== itemToDelete.id));
        showToast("User deleted successfully");
      } else if (itemToDelete.type === "notice") {
        await handleDeleteNotice(itemToDelete.id);
      } else if (itemToDelete.type === "watchman") {
        await handleDeleteWatchman(itemToDelete.id);
      }
    } catch (err: any) {
      showToast(err.message || "Delete failed", "danger");
    } finally {
      setBusy(false);
      setShowDeleteAlert(false);
      setItemToDelete(null);
    }
  }

  function startScanner() {
    showToast(
      "QR Scanner functionality will be available after installing @capacitor/barcode-scanner package",
      "warning"
    );
  }

  function handleDeleteApartment(apartmentId: number) {
    setItemToDelete({ type: "apartment", id: apartmentId });
    setShowDeleteAlert(true);
  }

  function handleDeleteUser(userId: number) {
    setItemToDelete({ type: "user", id: userId });
    setShowDeleteAlert(true);
  }

  function handleDeleteNoticeClick(noticeId: number) {
    setItemToDelete({ type: "notice", id: noticeId });
    setShowDeleteAlert(true);
  }

  function handleDeleteWatchmanClick(watchmanId: number) {
    setItemToDelete({ type: "watchman", id: watchmanId });
    setShowDeleteAlert(true);
  }

  function handleBookingUpdate() {
    if (effectiveBuildingId) {
      loadBuildingData(effectiveBuildingId);
    }
  }

  return (
    <IonPage>
      <IonHeader className="admin-header">
        <IonToolbar className="admin-toolbar">
          {/* Menu toggle button on the left */}
          <IonButtons slot="start">
            <IonButton
              onClick={handleMenuToggle}
              className="menu-toggle-button"
              fill="clear"
            >
              <IonIcon icon={menuOutline} slot="icon-only" />
            </IonButton>
          </IonButtons>

          {/* Page title showing current active section */}
          <IonTitle className="page-title">
            <div className="title-container">
              <span className="active-tab-title">{getActiveTabTitle()}</span>
              {effectiveBuildingId && (
                <span className="building-id-badge">
                  Building ID: {effectiveBuildingId}
                </span>
              )}
            </div>
          </IonTitle>

          {/* Quick Scan button on the right */}
          <IonButtons slot="end">
            <IonButton
              onClick={() => {
                startScanner();
                setShowScanner(true);
              }}
              className="quick-scan-button"
              fill="clear"
            >
              <IonIcon icon={qrCodeOutline} slot="icon-only" />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      {/* Menu Toggle Popover (contains all menu items including logout) */}
      <div
        className={`drawer-backdrop ${showDrawer ? "visible" : ""}`}
        onClick={() => setShowDrawer(false)}
      />

      <div className={`sliding-drawer ${showDrawer ? "open" : ""}`}>
        <div className="drawer-header">
          <div className="user-info">
            <IonIcon icon={personOutline} className="user-icon" />
            <div className="user-details">
              <h3 className="user-title">Building Administrator</h3>
              <p className="user-subtitle">
                {effectiveBuildingId
                  ? `Building ID: ${effectiveBuildingId}`
                  : "Loading..."}
              </p>
            </div>
          </div>
          <IonButton
            onClick={() => setShowDrawer(false)}
            className="drawer-close-button"
            fill="clear"
          >
            <IonIcon icon={closeOutline} slot="icon-only" />
          </IonButton>
        </div>

        <div className="drawer-content">
          <IonList lines="full" className="menu-list">
            <div className="menu-section">
              {menuItems.map((item) => (
                <IonItem
                  key={item.value}
                  button
                  detail={false}
                  onClick={() => handleMenuItemSelect(item.value)}
                  className={`menu-item ${
                    activeTab === item.value ? "active" : ""
                  }`}
                >
                  <div className="menu-item-content">
                    <div className="menu-item-icon-container">
                      <IonIcon icon={item.icon} className="menu-item-icon" />
                      {item.badge && (
                        <span className="menu-item-badge">{item.badge}</span>
                      )}
                    </div>
                    <div className="menu-item-text">
                      <IonLabel className="menu-item-label">
                        {item.label}
                      </IonLabel>
                      <p className="menu-item-description">
                        {item.description}
                      </p>
                    </div>
                  </div>
                  {activeTab === item.value && (
                    <IonIcon
                      icon={chevronForwardOutline}
                      className="active-indicator"
                    />
                  )}
                </IonItem>
              ))}
            </div>

            <div className="menu-section">
              <h4 className="section-title">Account</h4>
              <IonItem
                button
                detail={false}
                onClick={handleLogoutFromMenu}
                className="menu-item logout-item"
              >
                <div className="menu-item-content">
                  <div className="menu-item-icon-container">
                    <IonIcon
                      icon={logOutOutline}
                      className="menu-item-icon logout-icon"
                    />
                  </div>
                  <div className="menu-item-text">
                    <IonLabel className="menu-item-label">Logout</IonLabel>
                    <p className="menu-item-description">
                      Sign out from the system
                    </p>
                  </div>
                </div>
              </IonItem>
            </div>
          </IonList>
        </div>
      </div>

      <IonContent className="admin-content">
        {/* Modals */}
        <ScannerModal
          isOpen={showScanner}
          onClose={() => setShowScanner(false)}
        />

        <NoticeModal
          isOpen={showNoticeModal}
          onClose={() => setShowNoticeModal(false)}
          onCreate={handleCreateNotice}
          title={noticeTitle}
          content={noticeContent}
          category={noticeCategory}
          priority={noticePriority}
          expiresAt={noticeExpiresAt}
          busy={busy}
          onTitleChange={setNoticeTitle}
          onContentChange={setNoticeContent}
          onCategoryChange={setNoticeCategory}
          onPriorityChange={setNoticePriority}
          onExpiresAtChange={setNoticeExpiresAt}
        />

        <div className="content-wrapper">
          {loading ? (
            <div className="loading-container">
              <div className="loading-spinner">⌛</div>
              <div className="loading-text">Loading building data...</div>
            </div>
          ) : (
            <>
              {activeTab === "dashboard" && (
                <DashboardTab
                  stats={stats}
                  activePasses={activePasses}
                  notices={notices}
                  complaintStats={complaintStats}
                  onTabChange={setActiveTab}
                />
              )}

              {activeTab === "apartments" && (
                <ApartmentsTab
                  apartments={apartments}
                  unitNumber={unitNumber}
                  ownerName={ownerName}
                  busy={busy}
                  onUnitNumberChange={setUnitNumber}
                  onOwnerNameChange={setOwnerName}
                  onCreateApartment={handleCreateApartment}
                  onDeleteApartment={handleDeleteApartment}
                />
              )}

              {activeTab === "residents" && (
                <ResidentsTab
                  users={users}
                  apartments={apartments}
                  residentPhone={residentPhone}
                  residentPassword={residentPassword}
                  residentName={residentName}
                  selectedApartmentId={selectedApartmentId}
                  busy={busy}
                  onResidentPhoneChange={setResidentPhone}
                  onResidentPasswordChange={setResidentPassword}
                  onResidentNameChange={setResidentName}
                  onSelectedApartmentIdChange={setSelectedApartmentId}
                  onCreateResident={handleCreateResident}
                  onDeleteUser={handleDeleteUser}
                />
              )}

              {activeTab === "verify" && (
                <VerifyTab
                  verificationCode={verificationCode}
                  verificationResult={verificationResult}
                  busy={busy}
                  onVerificationCodeChange={setVerificationCode}
                  onVerifyPass={handleVerifyPass}
                  onStartScanner={() => {
                    startScanner();
                    setShowScanner(true);
                  }}
                />
              )}

              {activeTab === "notices" && (
                <NoticesTab
                  notices={notices}
                  busy={busy}
                  onCreateNoticeClick={() => setShowNoticeModal(true)}
                  onDeleteNotice={handleDeleteNoticeClick}
                />
              )}

              {activeTab === "bookings" && effectiveBuildingId && (
                <AdminBookingsTab
                  buildingId={effectiveBuildingId}
                  onUpdate={handleBookingUpdate}
                />
              )}

              {activeTab === "complaints" && effectiveBuildingId && (
                <ComplaintsTab buildingId={effectiveBuildingId} />
              )}

              {activeTab === "watchmen" && (
                <WatchmenTab
                  watchmen={watchmen}
                  watchmanPhone={watchmanPhone}
                  watchmanPassword={watchmanPassword}
                  watchmanName={watchmanName}
                  busy={busy}
                  onWatchmanPhoneChange={setWatchmanPhone}
                  onWatchmanPasswordChange={setWatchmanPassword}
                  onWatchmanNameChange={setWatchmanName}
                  onCreateWatchman={handleCreateWatchman}
                  onDeleteWatchman={handleDeleteWatchmanClick}
                />
              )}
            </>
          )}
        </div>
      </IonContent>

      {/* Delete Confirmation Alert */}
      <IonAlert
        isOpen={showDeleteAlert}
        onDidDismiss={() => setShowDeleteAlert(false)}
        header="Confirm Delete"
        message={`Are you sure you want to delete this ${itemToDelete?.type}? This action cannot be undone.`}
        buttons={[
          { text: "Cancel", role: "cancel", className: "alert-button" },
          {
            text: "Delete",
            handler: handleDeleteItem,
            className: "alert-button delete",
          },
        ]}
        className="delete-alert"
      />

      {/* Toast */}
      <IonToast
        isOpen={toast.show}
        message={toast.message}
        duration={3000}
        color={toast.color}
        onDidDismiss={() => setToast((prev) => ({ ...prev, show: false }))}
        position="top"
        className="admin-toast"
      />
    </IonPage>
  );
}
