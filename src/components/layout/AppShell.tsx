import React, { Suspense, lazy } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useMonitoring } from '../../context/MonitoringContext';
import { Header } from '../common/Header';
import { Sidebar } from '../common/Sidebar';
import { ErrorBoundary } from '../common/ErrorBoundary';

const EventDetailModal = lazy(() => import('../common/EventDetailModal').then(m => ({ default: m.EventDetailModal })));
const EventReplayModal = lazy(() => import('../common/EventReplayModal').then(m => ({ default: m.EventReplayModal })));

const PageFallbackLoader: React.FC = () => (
  <div className="flex items-center justify-center min-h-[400px] text-slate-400 font-mono text-xs gap-2">
    <div className="w-2 h-2 rounded-full bg-blue-600 animate-ping" />
    <span>Loading workspace module...</span>
  </div>
);

export const AppShell: React.FC = () => {
  const { selectedReplayEvent, setSelectedReplayEvent } = useMonitoring();
  const location = useLocation();

  return (
    <div className="h-screen w-full flex flex-col bg-[#F8FAFC] text-[#172033] font-sans selection:bg-blue-100 selection:text-blue-900 overflow-hidden">
      {/* Top Shell: Clean, Breathable Header with Dynamic Breadcrumb */}
      <Header />

      {/* Main App Body: Sidebar + Scrollable Viewport */}
      <div className="flex-1 min-h-0 flex flex-col md:flex-row w-full overflow-hidden">
        <Sidebar />

        <main className="flex-1 min-w-0 min-h-0 h-full overflow-y-auto overflow-x-hidden flex flex-col p-4 md:p-6">
          <div className="w-full max-w-7xl mx-auto flex-1 min-h-0">
            <ErrorBoundary fallbackTitle="Console Workspace Error">
              <Suspense fallback={<PageFallbackLoader />}>
                <div key={location.pathname} className="w-full">
                  <Outlet />
                </div>
              </Suspense>
            </ErrorBoundary>
          </div>

        </main>
      </div>

      {/* Viewport-level Modals */}
      <Suspense fallback={null}>
        <EventDetailModal />
        {selectedReplayEvent && (
          <EventReplayModal
            event={selectedReplayEvent}
            onClose={() => setSelectedReplayEvent(null)}
          />
        )}
      </Suspense>
    </div>
  );
};

export default AppShell;
