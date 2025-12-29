// src/AppAdminRoutes.jsx
import React from 'react';
import { IonApp } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { Route, Switch } from 'react-router-dom';
import AdminLogin from './pages/AdminLogin';
import SuperAdmin from './pages/SuperAdmin';
import BuildingAdmin from './pages/BuildingAdmin';
import ProtectedRoute from './components/ProtectedRoute';

export default function AppAdminRoutes() {
  return (
    <IonApp>
      <IonReactRouter>
        <Switch>
          <Route exact path="/admin-login" component={AdminLogin} />
          <ProtectedRoute exact path="/super-admin" component={SuperAdmin} roles={['super_admin']} />
          <ProtectedRoute exact path="/building-admin" component={BuildingAdmin} roles={['building_admin','super_admin']} />
        </Switch>
      </IonReactRouter>
    </IonApp>
  );
}
