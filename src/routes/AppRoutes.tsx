import React, { lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { LandingPage } from '../pages/LandingPage';
import { DashboardPage } from '../pages/DashboardPage';
import { NotFoundPage } from '../pages/NotFoundPage';

// Lazy-loaded console workspaces
const LiveMonitoringPage = lazy(() => import('../pages/LiveMonitoringPage').then(m => ({ default: m.LiveMonitoringPage })));
const AlertsPage = lazy(() => import('../pages/AlertsPage').then(m => ({ default: m.AlertsPage })));
const AIApneaPage = lazy(() => import('../pages/AIApneaPage').then(m => ({ default: m.AIApneaPage })));
const ThermalControlPage = lazy(() => import('../pages/ThermalControlPage').then(m => ({ default: m.ThermalControlPage })));
const SensorHealthPage = lazy(() => import('../pages/SensorHealthPage').then(m => ({ default: m.SensorHealthPage })));
const EventHistoryPage = lazy(() => import('../pages/EventHistoryPage').then(m => ({ default: m.EventHistoryPage })));
const EventReplayPage = lazy(() => import('../pages/EventReplayPage').then(m => ({ default: m.EventReplayPage })));
const SettingsPage = lazy(() => import('../pages/SettingsPage').then(m => ({ default: m.SettingsPage })));
const AnalyticsPage = lazy(() => import('../pages/AnalyticsPage').then(m => ({ default: m.AnalyticsPage })));
const BabySessionPage = lazy(() => import('../pages/BabySessionPage').then(m => ({ default: m.BabySessionPage })));
const SessionSetupPage = lazy(() => import('../pages/SessionSetupPage').then(m => ({ default: m.SessionSetupPage })));
const LoginPage = lazy(() => import('../pages/LoginPage').then(m => ({ default: m.LoginPage })));
const IoTConsolePage = lazy(() => import('../pages/IoTConsolePage').then(m => ({ default: m.IoTConsolePage })));

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* ─── 1. Canonical Landing Page (Pure Editorial Standalone Viewport) ─── */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/landing" element={<Navigate to="/" replace />} />

      {/* ─── 2. Console Workspaces (Shared AppShell with Header & Sidebar) ─── */}
      <Route element={<AppShell />}>
        {/* Canonical Workspaces */}
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/live-monitoring" element={<LiveMonitoringPage />} />
        <Route path="/event-review" element={<AlertsPage />} />
        <Route path="/ai-apnea" element={<AIApneaPage />} />
        <Route path="/environment" element={<ThermalControlPage />} />
        <Route path="/device-health" element={<SensorHealthPage />} />
        <Route path="/history" element={<EventHistoryPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/iot" element={<IoTConsolePage />} />
        <Route path="/esp32" element={<Navigate to="/iot" replace />} />

        {/* Canonical Aliases */}
        <Route path="/thermal" element={<Navigate to="/environment" replace />} />
        <Route path="/event-history" element={<Navigate to="/history" replace />} />

        {/* Deep Utility Workspaces */}
        <Route path="/event-replay" element={<EventReplayPage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
        <Route path="/session" element={<BabySessionPage />} />
        <Route path="/session/setup" element={<SessionSetupPage />} />
        <Route path="/login" element={<LoginPage />} />
      </Route>

      {/* ─── 3. 404 Fallback ─── */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};

export default AppRoutes;
