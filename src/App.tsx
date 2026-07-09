/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { HistoryView } from './components/HistoryView';
import { TelemetryView } from './components/TelemetryView';
import { SettingsView } from './components/SettingsView';
import { SharesView } from './components/SharesView';
import { VerifyView } from './components/VerifyView';
import { AuthScreen } from './components/AuthScreen';

const MainLayout: React.FC = () => {
  const { activeTab, sidebarOpen, user } = useApp();

  const renderActiveView = () => {
    switch (activeTab) {
      case 'transmission':
        return <Dashboard />;
      case 'history':
        return <HistoryView />;
      case 'telemetry':
        return <TelemetryView />;
      case 'settings':
        return <SettingsView />;
      case 'shares':
        return <SharesView />;
      case 'verify':
        return <VerifyView />;
      default:
        return <Dashboard />;
    }
  };

  if (!user) {
    return <AuthScreen />;
  }

  return (
    <div className="min-h-screen bg-[#fafafa] flex text-gray-900 selection:bg-black/5">
      {/* Collapsible Left Navigation Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <main 
        id="main-viewport"
        className="flex-1 min-w-0 min-h-screen flex flex-col transition-all duration-300 ease-in-out pl-0"
      >
        {/* Top Header Spacing Padding for mobile toggles */}
        <div className="h-16 md:h-0 w-full flex-shrink-0" />

        {/* View container */}
        <div className="flex-1 px-4 md:px-10 py-8 md:py-12 overflow-y-auto max-w-7xl w-full mx-auto">
          {renderActiveView()}
        </div>
      </main>
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}
