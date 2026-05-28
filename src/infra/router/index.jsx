import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { PrivateRoute, Spinner } from '@aviary-ui/ui';
import { storage } from '@aviary-ui/core';

const LoginPage = lazy(() => import('../../pages/LoginPage'));
const DashboardPage = lazy(() => import('../../pages/DashboardPage'));
const AppsPage = lazy(() => import('../../pages/AppsPage'));
const AppDetailsPage = lazy(() => import('../../pages/AppDetailsPage'));

function PageLoader() {
  return (
    <div className="d-flex justify-content-center align-items-center vh-100">
      <Spinner />
    </div>
  );
}

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <DashboardPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/apps"
            element={
              <PrivateRoute>
                <AppsPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/apps/:id"
            element={
              <PrivateRoute>
                <AppDetailsPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/"
            element={<Navigate to={storage.getToken() ? '/dashboard' : '/login'} replace />}
          />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
