import React from 'react';
import { MonitoringProvider, useMonitoring } from './context/MonitoringContext';
import { Header } from './components/common/Header';
import { Sidebar } from './components/common/Sidebar';
import { StatusStrip } from './components/common/StatusStrip';
import { DisclaimerFooter } from './components/common/DisclaimerFooter';
import { EventDetailModal } from './components/common/EventDetailModal';
import { EventReplayModal } from './components/common/EventReplayModal';

// Pages
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { SessionSetupPage } from './pages/SessionSetupPage';
import { DashboardPage } from './pages/DashboardPage';
import { AIApneaPage } from './pages/AIApneaPage';
import { LiveMonitoringPage } from './pages/LiveMonitoringPage';
import { AlertsPage } from './pages/AlertsPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { EventHistoryPage } from './pages/EventHistoryPage';
import { EventReplayPage } from './pages/EventReplayPage';
import { ThermalControlPage } from './pages/ThermalControlPage';
import { SensorHealthPage } from './pages/SensorHealthPage';
import { BabySessionPage } from './pages/BabySessionPage';
import { SettingsPage } from './pages/SettingsPage';

const MainContent: React.FC = () => {
  const { activeTab, selectedReplayEvent, setSelectedReplayEvent } = useMonitoring();

  const isLanding = activeTab === 'landing';

  const renderTabContent = () => {
    switch (activeTab) {
      case 'landing':
        return <LandingPage />;
      case 'login':
        return <LoginPage />;
      case 'sessionSetup':
        return <SessionSetupPage />;
      case 'dashboard':
        return <DashboardPage />;
      case 'aiApnea':
        return <AIApneaPage />;
      case 'liveMonitoring':
        return <LiveMonitoringPage />;
      case 'alerts':
        return <AlertsPage />;
      case 'eventHistory':
        return <EventHistoryPage />;
      case 'eventReplay':
        return <EventReplayPage />;
      case 'analytics':
        return <AnalyticsPage />;
      case 'thermal':
        return <ThermalControlPage />;
      case 'sensorHealth':
        return <SensorHealthPage />;
      case 'session':
        return <BabySessionPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <LandingPage />;
    }
  };

  return (
    <div className="h-screen w-full flex flex-col bg-[#070b14] text-slate-100 font-sans selection:bg-cyan-500 selection:text-black overflow-hidden">
      {/* Fixed Top Shell: Header + Persistent Telemetry Status Strip */}
      <div className="flex-shrink-0 z-30 flex flex-col">
        <Header />
        {!isLanding && <StatusStrip />}
      </div>

      {/* Main App Body: Fixed Sidebar + Independent Scrollable Main Viewport */}
      <div className="flex-1 min-h-0 flex flex-col md:flex-row w-full overflow-hidden">
        {!isLanding && <Sidebar />}

        <main className={`flex-1 min-w-0 min-h-0 h-full overflow-y-auto overflow-x-hidden flex flex-col ${isLanding ? 'py-6 px-4 md:px-8 max-w-7xl mx-auto w-full' : 'p-4 md:p-6'}`}>
          <div className="flex-1 min-h-0 w-full max-w-7xl mx-auto">
            {renderTabContent()}
          </div>

          <div className="mt-8 flex-shrink-0 w-full max-w-7xl mx-auto">
            <DisclaimerFooter />
          </div>
        </main>
      </div>

      {/* Viewport-level Event Detail Modal */}
      <EventDetailModal />

      {/* Viewport-level Synchronized Event Replay Modal */}
      {selectedReplayEvent && (
        <EventReplayModal
          event={selectedReplayEvent}
          onClose={() => setSelectedReplayEvent(null)}
        />
      )}
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <MonitoringProvider>
      <MainContent />
    </MonitoringProvider>
  );
};

export default App;
