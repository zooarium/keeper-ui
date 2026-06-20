import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { PrivateRoute, RootRedirect, Spinner, ImpersonationExchange } from '@aviary-ui/ui';

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
          {/* Impersonation handoff landing (when a sysadmin logs in as a user
              within keeper-ui itself). Reads the one-time code from the URL
              fragment, exchanges it, and enters the per-tab impersonation overlay. */}
          <Route path="/impersonate/exchange" element={<ImpersonationExchange redirectTo="/dashboard" />} />
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
          <Route path="/" element={<RootRedirect />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
