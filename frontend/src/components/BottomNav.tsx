// src/components/BottomNav.jsx
import React from "react";
import { IonIcon } from "@ionic/react";
import {
  homeOutline,
  home,
  notificationsOutline,
  notifications,
  walletOutline,
  wallet,
  ellipsisHorizontalOutline,
  menu,
} from "ionicons/icons";
import { useLocation, useHistory } from "react-router-dom";

export default function BottomNav() {
  const location = useLocation();
  const history = useHistory();

  const items = [
    {
      id: "home",
      label: "Home",
      path: "/home",
      icon: homeOutline,
      activeIcon: home,
    },
    {
      id: "notice",
      label: "Notice",
      path: "/notice",
      icon: notificationsOutline,
      activeIcon: notifications,
    },
    {
      id: "payments",
      label: "Payments",
      path: "/payments",
      icon: walletOutline,
      activeIcon: wallet,
    },
    {
      id: "more",
      label: "More",
      path: "/more",
      icon: ellipsisHorizontalOutline,
      activeIcon: menu,
    },
  ];

  const go = (path) => history.push(path);

  return (
    <>
      <style>{`
        /* =========================
           ROOT WRAPPER
        ========================== */
        .bottom-nav-wrapper {
          position: fixed;
          left: 0;
          right: 0;
          bottom: env(safe-area-inset-bottom);
          display: flex;
          justify-content: center;
          padding: 12px 14px;
          z-index: 1000;
          pointer-events: none;
        }

        /* =========================
           NAV CONTAINER
        ========================== */
        .bottom-nav {
          pointer-events: auto;
          display: flex;
          gap: 6px;
          padding: 10px;
          background: rgba(255, 255, 255, 0.85);
          border-radius: 22px;
          backdrop-filter: blur(14px);
          box-shadow:
            0 10px 30px rgba(0, 0, 0, 0.12),
            inset 0 1px 0 rgba(255, 255, 255, 0.6);
          animation: navEnter 0.45s ease;
        }

        @keyframes navEnter {
          from {
            opacity: 0;
            transform: translateY(18px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* =========================
           NAV ITEM
        ========================== */
        .nav-item {
          min-width: 64px;
          padding: 10px 14px;
          border-radius: 16px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          font-size: 11px;
          font-weight: 600;
          color: #64748b;
          cursor: pointer;
          transition: all 0.25s ease;
          position: relative;
        }

        .nav-item ion-icon {
          font-size: 22px;
          transition: transform 0.25s ease;
        }

        .nav-item:active {
          transform: scale(0.95);
        }

        /* =========================
           ACTIVE STATE
        ========================== */
        .nav-item.active {
          color: #fff;
          background: linear-gradient(135deg, #667eea, #764ba2);
          box-shadow:
            0 6px 16px rgba(102, 126, 234, 0.35);
        }

        .nav-item.active ion-icon {
          transform: scale(1.12);
        }

        /* =========================
           HOVER (DESKTOP)
        ========================== */
        @media (hover: hover) {
          .nav-item:hover:not(.active) {
            background: rgba(102, 126, 234, 0.08);
            color: #667eea;
          }
        }

        /* =========================
           SMALL SCREENS
        ========================== */
        @media (max-width: 360px) {
          .nav-item span {
            display: none;
          }

          .nav-item {
            min-width: 52px;
            padding: 10px;
          }
        }

        /* =========================
           TABLETS & LARGE SCREENS
        ========================== */
        @media (min-width: 768px) {
          .bottom-nav-wrapper {
            bottom: 24px;
          }

          .bottom-nav {
            gap: 10px;
            padding: 12px;
          }

          .nav-item {
            min-width: 78px;
            padding: 12px 18px;
            font-size: 12px;
          }

          .nav-item ion-icon {
            font-size: 24px;
          }
        }

        /* =========================
           CONTENT SPACER
        ========================== */
        .bottom-nav-spacer {
          height: calc(90px + env(safe-area-inset-bottom));
        }
      `}</style>

      <div className="bottom-nav-wrapper">
        <nav
          className="bottom-nav"
          role="navigation"
          aria-label="Bottom Navigation"
        >
          {items.map((it) => {
            const active = location.pathname === it.path;

            return (
              <div
                key={it.id}
                className={`nav-item ${active ? "active" : ""}`}
                onClick={() => go(it.path)}
                role="button"
                tabIndex={0}
                aria-current={active ? "page" : undefined}
              >
                <IonIcon icon={active ? it.activeIcon : it.icon} />
                <span>{it.label}</span>
              </div>
            );
          })}
        </nav>
      </div>

      {/* Spacer so content doesn’t hide behind nav */}
      <div className="bottom-nav-spacer" />
    </>
  );
}
