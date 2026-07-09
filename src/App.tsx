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
        return <Dashboard />;
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
    <div className="min-h-screen bg-[#fafafa] flex text-gray-900 selection:bg-black/5 overflow-x-hidden">
      {/* Collapsible Left Navigation Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <main 
        id="main-viewport"
        className="flex-1 min-w-0 min-h-screen flex flex-col transition-all duration-300 ease-in-out pl-0 overflow-x-hidden"
      >
        {/* Top Header Spacing Padding for mobile toggles */}
        <div className="h-16 md:h-0 w-full flex-shrink-0" />

        {/* Firestore Offline & Quota Warning Banner */}
        {firestoreStatus !== 'online' && (
          <div 
            className={`w-full px-6 py-3 border-b text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 font-sans transition-colors ${
              firestoreStatus === 'quota-exceeded' 
                ? 'bg-amber-50 border-amber-200 text-amber-800' 
                : 'bg-orange-50 border-orange-200 text-orange-800'
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
                className="px-3 py-1 bg-white border border-gray-200 text-gray-700 font-medium rounded-sm hover:bg-gray-50 active:bg-gray-100 transition-all text-[10px] flex items-center gap-1 cursor-pointer shadow-xs"
                id="retry-connection-btn"
              >
                <RefreshCw size={10} className="text-gray-500" />
                {language === 'es' ? 'Reintentar Conexión' : 'Retry Connection'}
              </button>
            </div>
          </div>
        )}

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
