// src/components/ProtectedRoute.jsx
import React from 'react';
import { Route, Redirect } from 'react-router-dom';

export default function ProtectedRoute({ component: Component, roles = [], ...rest }) {
  return (
    <Route
      {...rest}
      render={(props) => {
        const token = localStorage.getItem('token');
        const user = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : null;
        if (!token || !user) {
          return <Redirect to="/admin-login" />;
        }
        if (roles.length && !roles.includes(user.role)) {
          return <Redirect to="/admin-login" />;
        }
        return <Component {...props} />;
      }}
    />
  );
}
