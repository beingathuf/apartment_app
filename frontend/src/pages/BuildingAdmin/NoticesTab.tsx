// src/pages/BuildingAdmin/NoticesTab.tsx
import React from "react";
import {
  IonCard,
  IonCardContent,
  IonButton,
  IonIcon,
  IonBadge,
} from "@ionic/react";
import {
  notificationsOutline,
  addOutline,
  trashOutline,
} from "ionicons/icons";
import { Notice } from "./types";
import { formatDate, getPriorityColor } from "./utils";

interface NoticesTabProps {
  notices: Notice[];
  busy: boolean;
  onCreateNoticeClick: () => void;
  onDeleteNotice: (noticeId: number) => void;
}

const NoticesTab: React.FC<NoticesTabProps> = ({
  notices,
  busy,
  onCreateNoticeClick,
  onDeleteNotice,
}) => {
  return (
    <div>
      {/* Create Notice Button */}
      <div style={{ marginBottom: "20px" }}>
        <IonButton
          expand="block"
          onClick={onCreateNoticeClick}
          style={{
            "--background": "linear-gradient(135deg, #9eaadcff 0%, #8a73a0ff 100%)",
            "--border-radius": "12px",
            height: "48px",
            fontWeight: "600",
          }}
        >
          <IonIcon icon={addOutline} slot="start" />
          Create New Notice
        </IonButton>
      </div>

      {/* Notices List */}
      <IonCard style={{ borderRadius: "16px" }}>
        <IonCardContent>
          <h2
            style={{
              fontSize: "18px",
              fontWeight: "700",
              marginBottom: "16px",
              color: "#1e293b",
            }}
          >
            All Notices ({notices.length})
          </h2>

          {notices.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "60px 20px",
                color: "#94a3b8",
              }}
            >
              <IonIcon
                icon={notificationsOutline}
                style={{ fontSize: "48px", marginBottom: "16px" }}
              />
              <div style={{ fontWeight: "600" }}>No notices yet</div>
              <div style={{ fontSize: "14px", marginTop: "4px" }}>
                Create your first notice using the button above
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {notices.map((notice) => (
                <div
                  key={notice.id}
                  style={{
                    padding: "20px",
                    background: "white",
                    borderRadius: "12px",
                    border: "1px solid #e2e8f0",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      marginBottom: "12px",
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
                            fontSize: "16px",
                            fontWeight: "700",
                            color: "#334155",
                          }}
                        >
                          {notice.title}
                        </div>
                        <div
                          style={{
                            padding: "2px 8px",
                            background: getPriorityColor(notice.priority),
                            color: "white",
                            borderRadius: "4px",
                            fontSize: "10px",
                            fontWeight: "600",
                            textTransform: "uppercase",
                          }}
                        >
                          {notice.priority}
                        </div>
                        <div
                          style={{
                            padding: "2px 8px",
                            background: "#f1f5f9",
                            color: "#64748b",
                            borderRadius: "4px",
                            fontSize: "10px",
                            fontWeight: "600",
                          }}
                        >
                          {notice.category}
                        </div>
                      </div>
                      <div
                        style={{
                          fontSize: "14px",
                          color: "#475569",
                          lineHeight: "1.6",
                          marginBottom: "12px",
                        }}
                      >
                        {notice.content}
                      </div>
                    </div>
                    <IonButton
                      fill="clear"
                      color="danger"
                      onClick={() => onDeleteNotice(notice.id)}
                      style={{
                        "--padding-start": "8px",
                        "--padding-end": "8px",
                      }}
                    >
                      <IonIcon icon={trashOutline} slot="icon-only" />
                    </IonButton>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      fontSize: "12px",
                      color: "#94a3b8",
                      borderTop: "1px solid #f1f5f9",
                      paddingTop: "12px",
                    }}
                  >
                    <div>
                      <span>Created: {formatDate(notice.created_at)}</span>
                      {notice.created_by_name && (
                        <span style={{ marginLeft: "12px" }}>
                          By: {notice.created_by_name}
                        </span>
                      )}
                    </div>
                    <div>
                      {notice.expires_at ? (
                        <span>Expires: {formatDate(notice.expires_at)}</span>
                      ) : (
                        <span>No expiry</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </IonCardContent>
      </IonCard>
    </div>
  );
};

export default NoticesTab;