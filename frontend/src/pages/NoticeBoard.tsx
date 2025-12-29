// src/pages/NoticeBoard.tsx
import React, { useState, useEffect } from "react";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  IonIcon,
  IonBadge,
  IonChip,
  IonButton,
  IonSegment,
  IonSegmentButton,
  IonText,
  IonLoading,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  IonRefresher,
  IonRefresherContent,
  IonModal,
  IonButtons,
  IonBackButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
} from "@ionic/react";
import {
  megaphoneOutline,
  timeOutline,
  alertCircleOutline,
  hammerOutline,
  calendarOutline,
  cashOutline,
  shieldOutline,
  informationCircleOutline,
  filterOutline,
  refreshOutline,
  chevronBackOutline,
} from "ionicons/icons";
import api from "../api";
import { useHistory } from "react-router-dom";

interface Notice {
  id: number;
  title: string;
  body: string | null;
  category: string;
  priority: string;
  created_at: string;
  created_by: number | null;
  created_by_name: string | null;
  days_ago: number;
}

interface Category {
  category: string;
  count: number;
}

export default function NoticeBoardPage() {
  const history = useHistory();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null);
  const [showNoticeDetail, setShowNoticeDetail] = useState(false);
  const [pagination, setPagination] = useState({
    total: 0,
    limit: 20,
    offset: 0,
    hasMore: false,
  });
  const [buildingId, setBuildingId] = useState<string | null>(null);

  useEffect(() => {
    loadBuildingId();
  }, []);

  useEffect(() => {
    if (buildingId) {
      loadCategories();
      loadNotices();
    }
  }, [buildingId, selectedCategory]);

  const loadBuildingId = () => {
    try {
      const userData = localStorage.getItem("user");
      if (userData) {
        const user = JSON.parse(userData);
        const bid = user.buildingId || user.building_id;
        if (bid) {
          setBuildingId(String(bid));
        } else {
          console.error("No building ID found in user data");
        }
      }
    } catch (error) {
      console.error("Failed to load building ID:", error);
    }
  };

  const loadCategories = async () => {
    if (!buildingId) return;

    try {
      const response = await api.get(
        `/buildings/${buildingId}/notice-categories`
      );
      setCategories(response.categories);
    } catch (error) {
      console.error("Failed to load categories:", error);
    }
  };

  const loadNotices = async (loadMore = false) => {
    if (!buildingId) return;

    if (!loadMore) {
      setLoading(true);
    }

    try {
      const offset = loadMore ? pagination.offset + pagination.limit : 0;
      const response = await api.get(
        `/buildings/${buildingId}/notices?category=${selectedCategory}&limit=${pagination.limit}&offset=${offset}`
      );

      if (loadMore) {
        setNotices((prev) => [...prev, ...response.notices]);
      } else {
        setNotices(response.notices);
      }

      setPagination(response.pagination);
    } catch (error) {
      console.error("Failed to load notices:", error);
      showToast("Failed to load notices", "danger");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = (event: CustomEvent) => {
    setRefreshing(true);
    loadNotices().then(() => {
      event.detail.complete();
    });
  };

  const loadMore = (event: CustomEvent) => {
    loadNotices(true).then(() => {
      event.detail.complete();
    });
  };

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case "important":
        return alertCircleOutline;
      case "maintenance":
        return hammerOutline;
      case "event":
        return calendarOutline;
      case "payment":
        return cashOutline;
      case "security":
        return shieldOutline;
      default:
        return informationCircleOutline;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case "important":
        return "danger";
      case "maintenance":
        return "warning";
      case "event":
        return "success";
      case "payment":
        return "primary";
      case "security":
        return "dark";
      default:
        return "medium";
    }
  };

  const getPriorityBadge = (priority: string) => {
    const colors: Record<string, string> = {
      urgent: "danger",
      high: "warning",
      normal: "primary",
      low: "medium",
    };

    return colors[priority.toLowerCase()] || "medium";
  };

  const formatTimeAgo = (daysAgo: number) => {
    if (daysAgo === 0) return "Today";
    if (daysAgo === 1) return "Yesterday";
    if (daysAgo < 7) return `${daysAgo} days ago`;
    if (daysAgo < 30) return `${Math.floor(daysAgo / 7)} weeks ago`;
    return `${Math.floor(daysAgo / 30)} months ago`;
  };

  const handleNoticeClick = (notice: Notice) => {
    setSelectedNotice(notice);
    setShowNoticeDetail(true);
  };

  if (loading && !refreshing) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar
            style={{
              "--background":
                "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              "--color": "white",
            }}
          >
            <IonTitle>Notice Board</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent>
          <IonLoading isOpen={true} message="Loading notices..." />
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      {/* Header */}
      <IonHeader>
        <IonToolbar
          style={{
            "--background": "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            "--color": "white",
          }}
        >
          <IonTitle>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <IonIcon icon={megaphoneOutline} style={{ fontSize: "20px" }} />
              Notice Board
            </div>
          </IonTitle>
          <IonButtons slot="end">
            <IonButton
              onClick={() => loadNotices()}
              fill="clear"
              style={{ "--color": "white" }}
            >
              <IonIcon icon={refreshOutline} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen>
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent pullingIcon={chevronBackOutline} />
        </IonRefresher>

        <div style={{ padding: "16px" }}>
          {/* Header Section */}
          <div
            style={{
              fontWeight: 900,
              fontSize: "28px",
              marginBottom: "20px",
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              lineHeight: 1.2,
            }}
          >
            Community Updates
            <div
              style={{
                fontSize: "14px",
                fontWeight: 500,
                color: "#6b7280",
                marginTop: "4px",
              }}
            >
              Stay informed with the latest announcements
            </div>
          </div>

          {/* Category Filter */}
          <div style={{ marginBottom: "24px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginBottom: "12px",
                color: "#4b5563",
                fontSize: "14px",
                fontWeight: 600,
              }}
            >
              <IonIcon icon={filterOutline} />
              <span>Filter by Category</span>
            </div>

            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "8px",
                marginBottom: "8px",
              }}
            >
              <IonChip
                color={selectedCategory === "all" ? "primary" : "medium"}
                onClick={() => setSelectedCategory("all")}
                style={{ cursor: "pointer", margin: 0 }}
              >
                <IonLabel>All ({pagination.total})</IonLabel>
              </IonChip>

              {categories.map((cat) => (
                <IonChip
                  key={cat.category}
                  color={
                    selectedCategory === cat.category
                      ? (getCategoryColor(cat.category) as any)
                      : "medium"
                  }
                  onClick={() => setSelectedCategory(cat.category)}
                  style={{ cursor: "pointer", margin: 0 }}
                >
                  <IonIcon
                    icon={getCategoryIcon(cat.category)}
                    style={{ marginRight: "4px" }}
                  />
                  <IonLabel>
                    {cat.category.charAt(0).toUpperCase() +
                      cat.category.slice(1)}{" "}
                    ({cat.count})
                  </IonLabel>
                </IonChip>
              ))}
            </div>
          </div>

          {/* Notices List */}
          {notices.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "60px 20px",
                color: "#9ca3af",
              }}
            >
              <div
                style={{
                  fontSize: "64px",
                  marginBottom: "16px",
                  opacity: 0.5,
                }}
              >
                📢
              </div>
              <div
                style={{
                  fontSize: "18px",
                  fontWeight: 600,
                  marginBottom: "8px",
                  color: "#4b5563",
                }}
              >
                No notices yet
              </div>
              <div
                style={{
                  fontSize: "14px",
                  color: "#6b7280",
                }}
              >
                Check back later for updates from your building management
              </div>
            </div>
          ) : (
            <IonList style={{ background: "transparent" }}>
              {notices.map((notice) => (
                <IonItem
                  key={notice.id}
                  lines="none"
                  button
                  onClick={() => handleNoticeClick(notice)}
                  style={{
                    borderRadius: "20px",
                    marginBottom: "16px",
                    padding: "16px",
                    background: "rgba(255, 255, 255, 0.9)",
                    backdropFilter: "blur(20px)",
                    border: "1px solid rgba(255,255,255,0.3)",
                    boxShadow: "0 10px 40px rgba(0,0,0,0.08)",
                    transition: "all 0.3s ease",
                  }}
                >
                  <div style={{ width: "100%" }}>
                    {/* Header Row */}
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        marginBottom: "12px",
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
                            width: "40px",
                            height: "40px",
                            borderRadius: "12px",
                            background: `linear-gradient(135deg, var(--ion-color-${getCategoryColor(
                              notice.category
                            )}), var(--ion-color-${getCategoryColor(
                              notice.category
                            )}-shade))`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "white",
                          }}
                        >
                          <IonIcon
                            icon={getCategoryIcon(notice.category)}
                            style={{ fontSize: "20px" }}
                          />
                        </div>
                        <div>
                          <div
                            style={{
                              fontWeight: 700,
                              fontSize: "16px",
                              color: "#1f2937",
                              marginBottom: "4px",
                            }}
                          >
                            {notice.title}
                          </div>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                            }}
                          >
                            <IonBadge
                              color={getPriorityBadge(notice.priority)}
                              style={{
                                fontSize: "10px",
                                fontWeight: 700,
                                padding: "4px 8px",
                              }}
                            >
                              {notice.priority.toUpperCase()}
                            </IonBadge>
                            <IonBadge
                              color={getCategoryColor(notice.category)}
                              style={{
                                fontSize: "10px",
                                fontWeight: 700,
                                padding: "4px 8px",
                              }}
                            >
                              {notice.category.toUpperCase()}
                            </IonBadge>
                          </div>
                        </div>
                      </div>

                      <div style={{ textAlign: "right" }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                            color: "#6b7280",
                            fontSize: "12px",
                            fontWeight: 500,
                          }}
                        >
                          <IonIcon
                            icon={timeOutline}
                            style={{ fontSize: "14px" }}
                          />
                          <span>{formatTimeAgo(notice.days_ago)}</span>
                        </div>
                        {notice.created_by_name && (
                          <div
                            style={{
                              fontSize: "11px",
                              color: "#9ca3af",
                              marginTop: "2px",
                            }}
                          >
                            By {notice.created_by_name}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Preview Body */}
                    {notice.body && (
                      <div
                        style={{
                          color: "#4b5563",
                          fontSize: "14px",
                          lineHeight: 1.5,
                          marginTop: "12px",
                          paddingTop: "12px",
                          borderTop: "1px solid rgba(229, 231, 235, 0.5)",
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {notice.body}
                      </div>
                    )}

                    {/* View More Hint */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "flex-end",
                        gap: "4px",
                        marginTop: "12px",
                        color: "#667eea",
                        fontSize: "12px",
                        fontWeight: 600,
                      }}
                    >
                      <span>Tap to read more</span>
                      <IonIcon
                        icon={chevronBackOutline}
                        style={{ transform: "rotate(180deg)" }}
                      />
                    </div>
                  </div>
                </IonItem>
              ))}
            </IonList>
          )}

          {/* Infinite Scroll */}
          {pagination.hasMore && (
            <IonInfiniteScroll onIonInfinite={loadMore}>
              <IonInfiniteScrollContent loadingText="Loading more notices..." />
            </IonInfiniteScroll>
          )}

          <div style={{ height: "80px" }} />
        </div>
      </IonContent>

      {/* Notice Detail Modal */}
      <IonModal
        isOpen={showNoticeDetail}
        onDidDismiss={() => setShowNoticeDetail(false)}
      >
        <IonHeader>
          <IonToolbar
            style={{
              "--background":
                "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              "--color": "white",
            }}
          >
            <IonButtons slot="start">
              <IonButton
                onClick={() => setShowNoticeDetail(false)}
                style={{ "--color": "white" }}
              >
                <IonIcon icon={chevronBackOutline} />
                Back
              </IonButton>
            </IonButtons>
            <IonTitle>Notice Details</IonTitle>
          </IonToolbar>
        </IonHeader>

        <IonContent>
          {selectedNotice && (
            <div
              style={{ padding: "20px", maxWidth: "800px", margin: "0 auto" }}
            >
              <IonCard style={{ borderRadius: "20px", marginTop: "16px" }}>
                <IonCardHeader style={{ padding: "24px" }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      marginBottom: "16px",
                    }}
                  >
                    <div
                      style={{
                        width: "48px",
                        height: "48px",
                        borderRadius: "14px",
                        background: `linear-gradient(135deg, var(--ion-color-${getCategoryColor(
                          selectedNotice.category
                        )}), var(--ion-color-${getCategoryColor(
                          selectedNotice.category
                        )}-shade))`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "white",
                      }}
                    >
                      <IonIcon
                        icon={getCategoryIcon(selectedNotice.category)}
                        style={{ fontSize: "24px" }}
                      />
                    </div>
                    <div>
                      <IonCardTitle
                        style={{
                          fontSize: "20px",
                          fontWeight: 700,
                          color: "#1f2937",
                        }}
                      >
                        {selectedNotice.title}
                      </IonCardTitle>
                      <IonCardSubtitle
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          marginTop: "4px",
                        }}
                      >
                        <IonBadge
                          color={getPriorityBadge(selectedNotice.priority)}
                          style={{
                            fontSize: "11px",
                            fontWeight: 700,
                            padding: "4px 8px",
                          }}
                        >
                          {selectedNotice.priority.toUpperCase()}
                        </IonBadge>
                        <IonBadge
                          color={getCategoryColor(selectedNotice.category)}
                          style={{
                            fontSize: "11px",
                            fontWeight: 700,
                            padding: "4px 8px",
                          }}
                        >
                          {selectedNotice.category.toUpperCase()}
                        </IonBadge>
                      </IonCardSubtitle>
                    </div>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      paddingTop: "16px",
                      borderTop: "1px solid rgba(229, 231, 235, 0.5)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        color: "#6b7280",
                        fontSize: "14px",
                      }}
                    >
                      <IonIcon icon={timeOutline} />
                      <span>
                        Posted {formatTimeAgo(selectedNotice.days_ago)}
                      </span>
                    </div>

                    {selectedNotice.created_by_name && (
                      <div
                        style={{
                          fontSize: "14px",
                          color: "#4b5563",
                          fontWeight: 500,
                        }}
                      >
                        By: {selectedNotice.created_by_name}
                      </div>
                    )}
                  </div>
                </IonCardHeader>

                <IonCardContent style={{ padding: "0 24px 24px" }}>
                  {selectedNotice.body ? (
                    <div
                      style={{
                        fontSize: "16px",
                        lineHeight: 1.6,
                        color: "#374151",
                        whiteSpace: "pre-wrap",
                      }}
                    >
                      {selectedNotice.body}
                    </div>
                  ) : (
                    <div
                      style={{
                        textAlign: "center",
                        padding: "40px 20px",
                        color: "#9ca3af",
                        fontStyle: "italic",
                      }}
                    >
                      No additional details provided
                    </div>
                  )}
                </IonCardContent>
              </IonCard>
            </div>
          )}
        </IonContent>
      </IonModal>
    </IonPage>
  );
}
