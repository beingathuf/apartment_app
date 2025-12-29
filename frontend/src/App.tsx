// src/App.tsx
import React from "react";
import { IonApp, IonRouterOutlet, setupIonicReact } from "@ionic/react";
import { IonReactRouter } from "@ionic/react-router";
import { Route, Redirect, useLocation } from "react-router-dom";

/* Ionic core CSS */
import "@ionic/react/css/core.css";
import "@ionic/react/css/normalize.css";
import "@ionic/react/css/structure.css";
import "@ionic/react/css/typography.css";
import "@ionic/react/css/padding.css";
import "@ionic/react/css/float-elements.css";
import "@ionic/react/css/text-alignment.css";
import "@ionic/react/css/text-transformation.css";
import "@ionic/react/css/flex-utils.css";
import "@ionic/react/css/display.css";
import "./theme/variables.css";

/* Pages */
import Login from "./pages/Login";
import AdminLogin from "./pages/AdminLogin";
import SuperAdmin from "./pages/SuperAdmin";
import BuildingAdmin from "./pages/BuildingAdmin";
import ProtectedRoute from "./components/ProtectedRoute";
import Home from "./pages/Home";
import NoticeBoardPage from "./pages/NoticeBoard";
import PaymentsPage from "./pages/Payments";
import MorePage from "./pages/More";
import AmenitiesPage from "./pages/Amenities";
import BottomNav from "./components/BottomNav";
import Watchman from "./pages/Watchman";
setupIonicReact();

// In your App.tsx, ensure the Amenities route is included
// ... existing imports ...

const AppRoutes: React.FC = () => {
  return (
    <IonRouterOutlet>
      <Route exact path="/">
        <Redirect to="/login" />
      </Route>

      <Route exact path="/login" component={Login} />
      <Route exact path="/admin-login" component={AdminLogin} />

      {/* Resident pages */}
      <Route exact path="/home" component={Home} />
      <Route exact path="/notice" component={NoticeBoardPage} />
      <Route exact path="/payments" component={PaymentsPage} />
      <Route exact path="/more" component={MorePage} />
      <Route exact path="/amenities" component={AmenitiesPage} />
      <Route exact path="/watchman">
        <Watchman />
      </Route>
      {/* Admin routes */}
      <ProtectedRoute
        exact
        path="/super-admin"
        component={SuperAdmin}
        roles={["super_admin"]}
      />
      <ProtectedRoute
        exact
        path="/building-admin"
        component={BuildingAdmin}
        roles={["building_admin", "super_admin"]}
      />
    </IonRouterOutlet>
  );
};
const App: React.FC = () => {
  return (
    <IonApp>
      <IonReactRouter>
        <AppWithConditionalNav />
      </IonReactRouter>
    </IonApp>
  );
};

/* ------------------------------------------------------------------
   Hide BottomNav when user is on:
   - /login
   - /admin-login
   - /super-admin (and nested)
   - /building-admin (and nested)
   - /
------------------------------------------------------------------- */

const AppWithConditionalNav: React.FC = () => {
  const location = useLocation();

  const hideNavPrefixes = [
    "/login",
    "/admin-login",
    "/super-admin",
    "/building-admin",
    "/watchman",
    "/",
  ];

  const raw = location.pathname || "/";
  const pathname = raw.endsWith("/") && raw !== "/" ? raw.slice(0, -1) : raw;

  const hideNav = hideNavPrefixes.some((prefix) => {
    if (prefix === "/") return pathname === "/";
    return (
      pathname === prefix ||
      pathname.startsWith(prefix + "/") ||
      pathname.startsWith(prefix)
    );
  });

  return (
    <>
      <AppRoutes />
      {!hideNav && <BottomNav />}
    </>
  );
};

export default App;
