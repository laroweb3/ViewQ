/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Sidebar } from './components/Sidebar';
import { StartView } from './components/StartView';
import { Dashboard } from './components/Dashboard';
import { HistoryView } from './components/HistoryView';
import { TelemetryView } from './components/TelemetryView';
import { SettingsView } from './components/SettingsView';
import { SharesView } from './components/SharesView';
import { VerifyView } from './components/VerifyView';
import { AuthScreen } from './components/AuthScreen';
import { WikiView } from './components/WikiView';
import { ProfileWizard } from './components/ProfileWizard';
import { ApprovalStatusScreen } from './components/ApprovalStatusScreen';
import { UsersView } from './components/UsersView';
import { NotificationsView } from './components/NotificationsView';
import { AlertTriangle, WifiOff, RefreshCw } from 'lucide-react';

const MainLayout: React.FC = () => {
  const { activeTab, sidebarOpen, user, firestoreStatus, language, setFirestoreStatus } = useApp();

  const renderActiveView = () => {
    switch (activeTab) {
      case 'start':
        return <StartView />;
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
      case 'wiki':
        return <WikiView />;
      case 'users':
        return <UsersView />;
      case 'notifications':
        return <NotificationsView />;
      default:
        return <StartView />;
    }
  };

  if (!user) {
    return <AuthScreen />;
  }

  if (user.status !== 'approved') {
    return <ApprovalStatusScreen />;
  }

  if (!user.profile) {
    return <ProfileWizard />;
  }

  return (
    <div className="relative h-screen w-screen flex overflow-hidden bg-[#eef2f7] text-slate-900 selection:bg-slate-900/10">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.14),transparent_26%),radial-gradient(circle_at_top_right,rgba(16,185,129,0.10),transparent_24%),radial-gradient(circle_at_bottom_right,rgba(168,85,247,0.08),transparent_20%),linear-gradient(180deg,rgba(255,255,255,0.75),rgba(238,242,247,1))]" />
      <div className="pointer-events-none absolute inset-0 opacity-45 bg-[linear-gradient(rgba(255,255,255,0.34)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.28)_1px,transparent_1px)] bg-[size:64px_64px]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-36 bg-gradient-to-b from-white/80 to-transparent" />

      {/* Collapsible Left Navigation Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <main 
        id="main-viewport"
        className="relative z-10 flex-1 min-w-0 h-full flex flex-col transition-all duration-300 ease-in-out overflow-hidden md:m-3 md:rounded-[32px] md:border md:border-white/60 md:bg-white/30 md:shadow-[0_30px_120px_-72px_rgba(15,23,42,0.55)] md:backdrop-blur-2xl"
      >
        {/* Top Header Spacing Padding for mobile toggles */}
        <div className="h-16 md:hidden w-full flex-shrink-0" />

        {/* Firestore Offline & Quota Warning Banner */}
        {firestoreStatus !== 'online' && (
          <div 
            className={`w-full px-6 py-3 border-b text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 font-sans transition-colors ${
              firestoreStatus === 'quota-exceeded' 
                ? 'bg-amber-50/80 border-amber-200/70 text-amber-800 backdrop-blur-xl' 
                : 'bg-orange-50/80 border-orange-200/70 text-orange-800 backdrop-blur-xl'
            }`}
            id="firestore-status-banner"
          >
            <div className="flex items-start gap-2.5">
              <span className="p-1 rounded-full bg-white/60 mt-0.5 sm:mt-0 flex-shrink-0">
                {firestoreStatus === 'quota-exceeded' ? (
                  <AlertTriangle size={14} className="text-amber-700 animate-pulse" />
                ) : (
                  <WifiOff size={14} className="text-orange-700 animate-pulse" />
                )}
              </span>
              <div>
                <p className="font-semibold text-gray-900 mb-0.5">
                  {firestoreStatus === 'quota-exceeded' 
                    ? (language === 'es' ? 'CUOTA DE SERVIDOR SUPERADA (MODO SEGURO LOCAL-FIRST)' : 'SERVER QUOTA EXCEEDED (LOCAL-FIRST SAFE MODE)')
                    : (language === 'es' ? 'DISPOSITIVO SIN CONEXIÓN (MODO FUERA DE LÍNEA)' : 'DEVICE OFFLINE (OFFLINE SAFE MODE)')
                  }
                </p>
                <p className="text-gray-600 leading-normal text-[11px]">
                  {firestoreStatus === 'quota-exceeded' 
                    ? (language === 'es' 
                        ? 'Se ha agotado el límite de operaciones de la base de datos en la nube. La aplicación ha activado el almacenamiento local encriptado automático: toda su información y expedientes se procesarán y guardarán de forma 100% segura en este navegador.' 
                        : 'The database cloud operation limit has been reached. The application has enabled secure local encrypted backup: all your data and records are processed and saved safely within this browser.')
                    : (language === 'es' 
                        ? 'No se puede establecer conexión con la base de datos remota. Las operaciones y modificaciones de expedientes se guardarán localmente en su dispositivo de manera segura y se sincronizarán en cuanto se restablezca la red.' 
                        : 'Could not connect to the remote database. Actions and record modifications will be saved securely on your local device and synchronized as soon as the network is restored.')
                  }
                </p>
              </div>
            </div>
            
            <div className="flex gap-2 w-full sm:w-auto justify-end">
              <button
                onClick={() => setFirestoreStatus('online')}
                className="px-3 py-1.5 bg-white/70 border border-white/80 text-slate-700 font-medium rounded-full hover:bg-white transition-all text-[10px] flex items-center gap-1 cursor-pointer shadow-[0_10px_30px_-24px_rgba(15,23,42,0.55)] backdrop-blur-xl"
                id="retry-connection-btn"
              >
                <RefreshCw size={10} className="text-gray-500" />
                {language === 'es' ? 'Reintentar Conexión' : 'Retry Connection'}
              </button>
            </div>
          </div>
        )}

        {/* View container */}
        <div className="flex-1 px-4 md:px-10 py-8 md:py-10 overflow-y-auto hide-scrollbar max-w-[1600px] w-full mx-auto">
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
