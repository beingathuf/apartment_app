// src/pages/SuperAdmin.jsx
import React, { useState, useEffect } from "react";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonCard,
  IonCardContent,
  IonItem,
  IonLabel,
  IonInput,
  IonButton,
  IonList,
  IonItemSliding,
  IonItemOptions,
  IonItemOption,
  IonLoading,
  IonRefresher,
  IonRefresherContent,
  IonIcon,
  IonSegment,
  IonSegmentButton,
  IonGrid,
  IonRow,
  IonCol,
  IonChip,
  IonBadge,
  IonSelect,
  IonSelectOption,
  IonAlert,
  IonToast,
  IonAvatar,
} from "@ionic/react";
import {
  personAddOutline,
  businessOutline,
  locationOutline,
  trashOutline,
  createOutline,
  eyeOutline,
  logOutOutline,
  checkmarkCircleOutline,
  warningOutline,
  searchOutline,
  refreshOutline,
  filterOutline,
  peopleOutline,
  addOutline,
  statsChartOutline,
  timeOutline,
} from "ionicons/icons";
import api from "../api";
import { useHistory } from "react-router-dom";
import "./SuperAdmin.css";

export default function SuperAdmin() {
  const history = useHistory();
  const [activeSegment, setActiveSegment] = useState("buildings");
  const [buildingName, setBuildingName] = useState("");
  const [buildingAddress, setBuildingAddress] = useState("");
  const [adminPhone, setAdminPhone] = useState("");
  const [adminPass, setAdminPass] = useState("");
  const [adminName, setAdminName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [selectedBuildingId, setSelectedBuildingId] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [buildings, setBuildings] = useState([]);
  const [allAdmins, setAllAdmins] = useState([]);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState({ type: "", id: "" });
  const [searchTerm, setSearchTerm] = useState("");
  const [toast, setToast] = useState({
    show: false,
    message: "",
    color: "success",
  });

  useEffect(() => {
    fetchAllData();
  }, []);

  useEffect(() => {
    const filteredBuildings = buildings.filter(
      (b) =>
        b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (b.address &&
          b.address.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    // Update state with filtered results if needed
  }, [searchTerm, buildings]);

  async function fetchAllData() {
    try {
      setLoading(true);
      // Fetch buildings with stats
      const buildingsRes = await api.get("/admin/buildings");
      setBuildings(buildingsRes.buildings || []);

      // Fetch all admins from all buildings
      const allAdmins = [];
      for (const building of buildingsRes.buildings || []) {
        try {
          const adminsRes = await api.get(
            `/admin/buildings/${building.id}/admins`
          );
          if (adminsRes.admins) {
            adminsRes.admins.forEach((admin) => {
              allAdmins.push({
                ...admin,
                building_id: building.id,
                building_name: building.name,
                building_address: building.address,
              });
            });
          }
        } catch (e) {
          console.warn(
            `Could not fetch admins for building ${building.id}:`,
            e
          );
        }
      }

      setAllAdmins(allAdmins);
      showToast("Data loaded successfully", "success");
    } catch (e) {
      showToast("Failed to load data: " + e.message, "danger");
    } finally {
      setLoading(false);
    }
  }

  async function handleRefresh(event) {
    await fetchAllData();
    event.detail.complete();
  }

  async function createBuilding() {
    if (!buildingName.trim()) {
      showToast("Building name is required", "warning");
      return;
    }

    try {
      setBusy(true);
      const res = await api.post("/admin/buildings", {
        name: buildingName.trim(),
        address: buildingAddress.trim(),
      });

      setBuildings((prev) => [res.building, ...prev]);
      setBuildingName("");
      setBuildingAddress("");
      showToast("Building created successfully!", "success");
    } catch (e) {
      showToast("Failed to create building: " + e.message, "danger");
    } finally {
      setBusy(false);
    }
  }

  async function createBuildingAdmin() {
    if (!selectedBuildingId) {
      showToast("Please select a building first", "warning");
      return;
    }
    if (!adminPhone.trim() || !adminPass.trim()) {
      showToast("Phone number and password are required", "warning");
      return;
    }

    try {
      setBusy(true);
      const res = await api.post(
        `/admin/buildings/${selectedBuildingId}/admins`,
        {
          name: adminName.trim(),
          phone: adminPhone.trim(),
          password: adminPass.trim(),
          email: adminEmail.trim() || null,
        }
      );

      // Add to allAdmins list with building name
      const building = buildings.find(
        (b) => b.id === parseInt(selectedBuildingId)
      );
      const newAdmin = {
        ...res.admin,
        building_name: building?.name || "Unknown",
      };
      setAllAdmins((prev) => [newAdmin, ...prev]);

      // Reset form
      setAdminPhone("");
      setAdminPass("");
      setAdminName("");
      setAdminEmail("");
      setSelectedBuildingId("");

      showToast("Building admin created successfully!", "success");
    } catch (e) {
      if (e.message.includes("Phone number already registered")) {
        showToast("This phone number is already registered", "warning");
      } else {
        showToast("Failed to create admin: " + e.message, "danger");
      }
    } finally {
      setBusy(false);
    }
  }

  async function deleteItem(type, id) {
    try {
      setBusy(true);
      if (type === "building") {
        await api.del(`/admin/buildings/${id}`);
        setBuildings((prev) => prev.filter((b) => b.id !== id));
        showToast("Building deleted successfully", "success");
      } else if (type === "admin") {
        await api.del(`/admin/users/${id}`);
        setAllAdmins((prev) => prev.filter((a) => a.id !== id));
        showToast("Admin deleted successfully", "success");
      }
    } catch (e) {
      showToast("Delete failed: " + e.message, "danger");
    } finally {
      setBusy(false);
      setShowDeleteAlert(false);
    }
  }

  function showToast(message, color = "success") {
    setToast({ show: true, message, color });
  }

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    history.push("/admin-login");
  }

  const filteredBuildings = buildings.filter(
    (b) =>
      b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (b.address && b.address.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredAdmins = allAdmins.filter(
    (a) =>
      a.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.phone?.includes(searchTerm) ||
      a.building_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    totalBuildings: buildings.length,
    totalAdmins: allAdmins.length,
    activeToday: buildings.length, // This would be calculated from actual data
  };

  return (
    <IonPage>
      <IonHeader className="ion-no-border">
        <IonToolbar className="gradient-toolbar">
          <IonTitle className="page-title">Super Admin Dashboard</IonTitle>
          <div slot="end" className="header-actions">
            <IonButton
              fill="clear"
              className="header-button"
              onClick={() => fetchAllData()}
            >
              <IonIcon slot="icon-only" icon={refreshOutline} />
            </IonButton>
            <IonButton
              fill="clear"
              className="header-button logout-button"
              onClick={logout}
            >
              <IonIcon slot="start" icon={logOutOutline} />
              Sign Out
            </IonButton>
          </div>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding dashboard-content">
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent />
        </IonRefresher>

        <IonLoading isOpen={loading} message="Loading dashboard..." />
        <IonToast
          isOpen={toast.show}
          onDidDismiss={() => setToast((prev) => ({ ...prev, show: false }))}
          message={toast.message}
          duration={3000}
          color={toast.color}
          position="top"
        />

        <div className="dashboard-container">
          {/* Stats Cards */}
          <IonGrid className="stats-grid">
            <IonRow>
              <IonCol size="12" sizeMd="6">
                <IonCard className="stats-card building-stats">
                  <IonCardContent>
                    <div className="stats-icon">
                      <IonIcon icon={businessOutline} />
                    </div>
                    <div className="stats-content">
                      <div className="stats-value">{stats.totalBuildings}</div>
                      <div className="stats-label">Total Buildings</div>
                    </div>
                  </IonCardContent>
                </IonCard>
              </IonCol>
              <IonCol size="12" sizeMd="6">
                <IonCard className="stats-card admin-stats">
                  <IonCardContent>
                    <div className="stats-icon">
                      <IonIcon icon={peopleOutline} />
                    </div>
                    <div className="stats-content">
                      <div className="stats-value">{stats.totalAdmins}</div>
                      <div className="stats-label">Building Admins</div>
                    </div>
                  </IonCardContent>
                </IonCard>
              </IonCol>
            </IonRow>
          </IonGrid>

          {/* Search Bar */}
          <IonCard className="search-card">
            <IonCardContent>
              <div className="search-container">
                <IonIcon icon={searchOutline} className="search-icon" />
                <IonInput
                  value={searchTerm}
                  placeholder="Search buildings or admins..."
                  onIonInput={(e) => setSearchTerm(e.detail.value)}
                  className="search-input"
                  clearInput
                />
                {searchTerm && (
                  <IonButton
                    fill="clear"
                    size="small"
                    onClick={() => setSearchTerm("")}
                  >
                    Clear
                  </IonButton>
                )}
              </div>
            </IonCardContent>
          </IonCard>

          {/* Segment Control */}
          <IonSegment
            value={activeSegment}
            onIonChange={(e) => setActiveSegment(e.detail.value)}
            className="main-segment"
          >
            <IonSegmentButton value="buildings">
              <IonLabel>
                <IonIcon icon={businessOutline} className="segment-icon" />
                Buildings
              </IonLabel>
            </IonSegmentButton>
            <IonSegmentButton value="admins">
              <IonLabel>
                <IonIcon icon={peopleOutline} className="segment-icon" />
                Admins
              </IonLabel>
            </IonSegmentButton>
            <IonSegmentButton value="create">
              <IonLabel>
                <IonIcon icon={addOutline} className="segment-icon" />
                Create
              </IonLabel>
            </IonSegmentButton>
          </IonSegment>

          {/* Create Forms */}
          {activeSegment === "create" && (
            <div className="creation-forms">
              <IonGrid>
                <IonRow>
                  <IonCol size="12" sizeLg="6">
                    <IonCard className="form-card">
                      <IonCardContent>
                        <div className="form-header">
                          <IonIcon
                            icon={businessOutline}
                            className="form-icon"
                          />
                          <h3>Create New Building</h3>
                        </div>
                        <p className="form-subtitle">
                          Add a new building to the system
                        </p>

                        <IonItem className="form-item" lines="none">
                          <IonLabel position="stacked" className="form-label">
                            Building Name *
                          </IonLabel>
                          <IonInput
                            value={buildingName}
                            onIonInput={(e) => setBuildingName(e.detail.value)}
                            placeholder="Sunrise Residency"
                            className="form-input"
                          />
                        </IonItem>

                        <IonItem className="form-item" lines="none">
                          <IonLabel position="stacked" className="form-label">
                            Address
                          </IonLabel>
                          <IonInput
                            value={buildingAddress}
                            onIonInput={(e) =>
                              setBuildingAddress(e.detail.value)
                            }
                            placeholder="Sector 21, Gurugram"
                            className="form-input"
                          />
                        </IonItem>

                        <IonButton
                          expand="block"
                          onClick={createBuilding}
                          disabled={busy || !buildingName.trim()}
                          className="submit-button"
                        >
                          <IonIcon slot="start" icon={checkmarkCircleOutline} />
                          Create Building
                        </IonButton>
                      </IonCardContent>
                    </IonCard>
                  </IonCol>

                  <IonCol size="12" sizeLg="6">
                    <IonCard className="form-card">
                      <IonCardContent>
                        <div className="form-header">
                          <IonIcon
                            icon={personAddOutline}
                            className="form-icon"
                          />
                          <h3>Create Building Admin</h3>
                        </div>
                        <p className="form-subtitle">
                          Assign an admin to manage a building
                        </p>

                        <IonItem className="form-item" lines="none">
                          <IonLabel position="stacked" className="form-label">
                            Select Building *
                          </IonLabel>
                          <IonSelect
                            value={selectedBuildingId}
                            onIonChange={(e) =>
                              setSelectedBuildingId(e.detail.value)
                            }
                            placeholder="Choose building"
                            className="form-select"
                          >
                            {buildings.map((building) => (
                              <IonSelectOption
                                key={building.id}
                                value={building.id}
                              >
                                {building.name}
                                {building.address && ` - ${building.address}`}
                              </IonSelectOption>
                            ))}
                          </IonSelect>
                        </IonItem>

                        <IonItem className="form-item" lines="none">
                          <IonLabel position="stacked" className="form-label">
                            Admin Name
                          </IonLabel>
                          <IonInput
                            value={adminName}
                            onIonInput={(e) => setAdminName(e.detail.value)}
                            placeholder="John Doe"
                            className="form-input"
                          />
                        </IonItem>

                        <IonItem className="form-item" lines="none">
                          <IonLabel position="stacked" className="form-label">
                            Phone Number *
                          </IonLabel>
                          <IonInput
                            type="tel"
                            value={adminPhone}
                            onIonInput={(e) => setAdminPhone(e.detail.value)}
                            placeholder="+91 9876543210"
                            className="form-input"
                          />
                        </IonItem>

                        <IonItem className="form-item" lines="none">
                          <IonLabel position="stacked" className="form-label">
                            Password *
                          </IonLabel>
                          <IonInput
                            type="password"
                            value={adminPass}
                            onIonInput={(e) => setAdminPass(e.detail.value)}
                            placeholder="Strong password"
                            className="form-input"
                          />
                        </IonItem>

                        <IonItem className="form-item" lines="none">
                          <IonLabel position="stacked" className="form-label">
                            Email (Optional)
                          </IonLabel>
                          <IonInput
                            type="email"
                            value={adminEmail}
                            onIonInput={(e) => setAdminEmail(e.detail.value)}
                            placeholder="admin@example.com"
                            className="form-input"
                          />
                        </IonItem>

                        <IonButton
                          expand="block"
                          onClick={createBuildingAdmin}
                          disabled={
                            busy ||
                            !selectedBuildingId ||
                            !adminPhone.trim() ||
                            !adminPass.trim()
                          }
                          className="submit-button admin-submit"
                        >
                          <IonIcon slot="start" icon={personAddOutline} />
                          Create Admin
                        </IonButton>
                      </IonCardContent>
                    </IonCard>
                  </IonCol>
                </IonRow>
              </IonGrid>
            </div>
          )}

          {/* Buildings List */}
          {activeSegment === "buildings" && (
            <IonCard className="list-card">
              <IonCardContent>
                <div className="list-header">
                  <h3>All Buildings ({filteredBuildings.length})</h3>
                  <IonChip color="primary">
                    <IonIcon icon={businessOutline} />
                    <IonLabel>Total: {buildings.length}</IonLabel>
                  </IonChip>
                </div>

                {filteredBuildings.length === 0 ? (
                  <div className="empty-state">
                    <IonIcon icon={businessOutline} className="empty-icon" />
                    <p>No buildings found</p>
                    <IonButton
                      fill="outline"
                      onClick={() => setActiveSegment("create")}
                    >
                      <IonIcon slot="start" icon={addOutline} />
                      Create First Building
                    </IonButton>
                  </div>
                ) : (
                  <IonList lines="full" className="styled-list">
                    {filteredBuildings.map((building) => (
                      <IonItemSliding key={building.id}>
                        <IonItem className="list-item">
                          <div className="item-content">
                            <div className="item-main">
                              <div className="item-title">
                                <IonIcon
                                  icon={businessOutline}
                                  className="item-icon"
                                />
                                <span>{building.name}</span>
                                {building.address && (
                                  <IonChip color="medium" size="small">
                                    <IonIcon icon={locationOutline} />
                                    <IonLabel>{building.address}</IonLabel>
                                  </IonChip>
                                )}
                              </div>
                              <div className="item-meta">
                                <div className="building-stats">
                                  <span className="stat-item">
                                    <IonIcon icon={peopleOutline} />
                                    <strong>
                                      {building.user_count || 0}
                                    </strong>{" "}
                                    users
                                  </span>
                                  <span className="stat-item">
                                    <IonIcon icon="home-outline" />
                                    <strong>
                                      {building.apartment_count || 0}
                                    </strong>{" "}
                                    apartments
                                  </span>
                                  <span className="stat-item">
                                    <IonIcon icon="ticket-outline" />
                                    <strong>
                                      {building.active_passes || 0}
                                    </strong>{" "}
                                    active passes
                                  </span>
                                </div>
                                <span className="item-date">
                                  <IonIcon icon={timeOutline} />
                                  Created:{" "}
                                  {new Date(
                                    building.created_at
                                  ).toLocaleDateString()}
                                  {building.last_activity && (
                                    <>
                                      • Last activity:{" "}
                                      {new Date(
                                        building.last_activity
                                      ).toLocaleDateString()}
                                    </>
                                  )}
                                </span>
                              </div>
                            </div>
                            <div className="item-actions">
                              <IonButton
                                fill="clear"
                                color="primary"
                                onClick={() =>
                                  history.push(
                                    `/building-admin?buildingId=${building.id}`
                                  )
                                }
                                title="Open Building Dashboard"
                              >
                                <IonIcon slot="icon-only" icon={eyeOutline} />
                              </IonButton>
                              <IonButton
                                fill="clear"
                                color="warning"
                                onClick={() => {
                                  setDeleteTarget({
                                    type: "building",
                                    id: building.id,
                                    name: building.name,
                                  });
                                  setShowDeleteAlert(true);
                                }}
                                title="Delete Building"
                              >
                                <IonIcon slot="icon-only" icon={trashOutline} />
                              </IonButton>
                            </div>
                          </div>
                        </IonItem>
                      </IonItemSliding>
                    ))}
                  </IonList>
                )}
              </IonCardContent>
            </IonCard>
          )}

          {/* Admins List */}
          {activeSegment === "admins" && (
            <IonCard className="list-card">
              <IonCardContent>
                <div className="list-header">
                  <h3>All Building Admins ({filteredAdmins.length})</h3>
                  <IonChip color="secondary">
                    <IonIcon icon={peopleOutline} />
                    <IonLabel>Active: {allAdmins.length}</IonLabel>
                  </IonChip>
                </div>

                {filteredAdmins.length === 0 ? (
                  <div className="empty-state">
                    <IonIcon icon={peopleOutline} className="empty-icon" />
                    <p>No admins found</p>
                    <IonButton
                      fill="outline"
                      onClick={() => setActiveSegment("create")}
                    >
                      <IonIcon slot="start" icon={personAddOutline} />
                      Create First Admin
                    </IonButton>
                  </div>
                ) : (
                  <IonList lines="full" className="styled-list">
                    {filteredAdmins.map((admin) => (
                      <IonItemSliding key={admin.id}>
                        <IonItem className="list-item">
                          <div className="item-content">
                            <IonAvatar slot="start" className="admin-avatar">
                              {admin.name
                                ? admin.name.charAt(0).toUpperCase()
                                : "A"}
                            </IonAvatar>
                            <div className="item-main">
                              <div className="item-title">
                                <span>{admin.name || "Unnamed Admin"}</span>
                                <IonBadge
                                  color="secondary"
                                  className="role-badge"
                                >
                                  {admin.role}
                                </IonBadge>
                              </div>
                              <div className="item-meta">
                                <div className="meta-row">
                                  <span className="meta-item">
                                    <IonIcon icon="call-outline" />
                                    {admin.phone}
                                  </span>
                                  {admin.email && (
                                    <span className="meta-item">
                                      <IonIcon icon="mail-outline" />
                                      {admin.email}
                                    </span>
                                  )}
                                </div>
                                <div className="meta-row">
                                  <span className="meta-item building-name">
                                    <IonIcon icon={businessOutline} />
                                    {admin.building_name || "No Building"}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="item-actions">
                              <IonButton
                                fill="clear"
                                color="danger"
                                onClick={() => {
                                  setDeleteTarget({
                                    type: "admin",
                                    id: admin.id,
                                  });
                                  setShowDeleteAlert(true);
                                }}
                              >
                                <IonIcon slot="icon-only" icon={trashOutline} />
                              </IonButton>
                            </div>
                          </div>
                        </IonItem>
                      </IonItemSliding>
                    ))}
                  </IonList>
                )}
              </IonCardContent>
            </IonCard>
          )}
        </div>

        <IonAlert
          isOpen={showDeleteAlert}
          onDidDismiss={() => setShowDeleteAlert(false)}
          header="Confirm Delete"
          message={`Are you sure you want to delete ${
            deleteTarget.type === "building" ? "building" : "admin"
          } "${deleteTarget.name}"? This action cannot be undone.`}
          buttons={[
            { text: "Cancel", role: "cancel" },
            {
              text: "Delete",
              role: "destructive",
              handler: () => deleteItem(deleteTarget.type, deleteTarget.id),
            },
          ]}
        />
      </IonContent>
    </IonPage>
  );
}
