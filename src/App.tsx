import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import ResourceAnalytics from "./pages/ResourceAnalytics";
import Inventory from "./pages/Inventory";
import Orders from "./pages/Orders";
import Tasks from "./pages/Tasks";
import Quality from "./pages/Quality";
import CRM from "./pages/CRM";
import Employees from "./pages/Employees";
import Roles from "./pages/Roles";
import Labors from "./pages/Labors";
import Lab from "./pages/Lab";
import AdminDashboard from "./pages/AdminDashboard";
import Costing from "./pages/Costing";
import Login from "./pages/Login";
import ExportInvoice from "./pages/ExportInvoice";
import ExportLabReport from "./pages/ExportLabReport";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { initStoreSync, cleanupStoreSync } from "./store/data";

import { Toaster } from "sonner";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { currentUser } = useAuth();
  
  useEffect(() => {
    if (currentUser) {
      initStoreSync();
    } else {
      cleanupStoreSync();
    }
    
    return () => {
       cleanupStoreSync();
    }
  }, [currentUser]);

  if (!currentUser) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

import { App as CapacitorApp } from '@capacitor/app';

function NavigationHandler() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Add Capacitor Android back button listener
    let listener: any = null;
    const setupListener = async () => {
      try {
        listener = await CapacitorApp.addListener('backButton', ({ canGoBack }) => {
          // If modals or menus have pushed state, browser history.back() will handle it naturally.
          if (canGoBack) {
            window.history.back();
          } else if (location.pathname !== '/') {
            // If we can't go back in browser history, but we aren't on the home screen, go home instead of exiting
            navigate('/', { replace: true });
          } else {
            // Unavoidable, exit the app
            CapacitorApp.exitApp();
          }
        });
      } catch (e) {
        // Not in capacitor environment, ignore
      }
    };
    setupListener();

    return () => {
      if (listener?.remove) listener.remove();
    };
  }, [location.pathname, navigate]);

  return null;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <NavigationHandler />
        <Toaster theme="dark" position="top-right" />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/export/:orderId" element={<ProtectedRoute><ExportInvoice /></ProtectedRoute>} />
          <Route path="/export-lab" element={<ProtectedRoute><ExportLabReport /></ProtectedRoute>} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="analytics" element={<ResourceAnalytics />} />
            <Route path="inventory" element={<Inventory />} />
            <Route path="orders" element={<Orders />} />
            <Route path="tasks" element={<Tasks />} />
            <Route path="quality" element={<Quality />} />
            <Route path="customers" element={<CRM />} />
            <Route path="employees" element={<Employees />} />
            <Route path="labors" element={<Labors />} />
            <Route path="lab" element={<Lab />} />
            <Route path="roles" element={<Roles />} />
            <Route path="admin" element={<AdminDashboard />} />
            <Route path="costing" element={<Costing />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
