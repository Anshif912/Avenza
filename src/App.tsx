import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { MonitoringProvider } from './context/MonitoringContext';
import { AppRoutes } from './routes/AppRoutes';

export const App: React.FC = () => {
  return (
    <MonitoringProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </MonitoringProvider>
  );
};

export default App;
