import React from 'react';
import { useApp } from '../context/AppContext';
import { Logo } from './Logo';
import { 
  Shield, 
  Sliders, 
  Database, 
  Menu, 
  X, 
  ChevronLeft, 
  ChevronRight,
  Link2,
  LogOut,
  UserCheck,
  FileSearch,
  HelpCircle,
  Users,
  Bell
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { 
    sidebarOpen, 
    setSidebarOpen, 
    activeTab, 
    setActiveTab,
    user,
    logout,
    language,
    setLanguage,
    notifications
  } = useApp();

  const unreadCount = notifications.filter(n => n.status === 'unread').length;
  const isLaro = user?.username.toLowerCase() === 'laro';

  const navItems = [
    {
      id: 'transmission',
      label: language === 'es' ? 'Asegurar y Enviar' : 'Secure & Send',
      icon: Shield,
      desc: language === 'es' ? 'Sellar y bloquear envío' : 'Seal & lock transit',
    },
    {
      id: 'history',
      label: language === 'es' ? 'Registro de Evidencias' : 'Evidence Registry',
      icon: Database,
      desc: language === 'es' ? 'Historial de archivos sellados' : 'History of sealed files',
    },
    {
      id: 'verify',
      label: language === 'es' ? 'Verificador Forense' : 'Forensic Verifier',
      icon: FileSearch,
      desc: language === 'es' ? 'Auditar firma y metadatos' : 'Audit signature & metadata',
    },
    {
      id: 'notifications',
      label: language === 'es' ? 'Notificaciones' : 'Notifications',
      icon: Bell,
      desc: language === 'es' ? 'Alertas de evidencia recibida' : 'Received evidence alerts',
    },
    {
      id: 'shares',
      label: language === 'es' ? 'Enlaces Compartidos' : 'Shared Links',
      icon: Link2,
      desc: language === 'es' ? 'Control de accesos efímeros' : 'Ephemeral access control',
    },
    ...(isLaro ? [
      {
        id: 'users' as const,
        label: language === 'es' ? 'Control de Usuarios' : 'User Control',
        icon: Users,
        desc: language === 'es' ? 'Aprobar o rechazar registros' : 'Approve or reject users',
      },
      {
        id: 'settings' as const,
        label: language === 'es' ? 'Configuración del Sistema' : 'System Settings',
        icon: Sliders,
        desc: language === 'es' ? 'Configuración técnica' : 'Technical configuration',
      }
    ] : []),
    {
      id: 'wiki',
      label: language === 'es' ? 'Preguntas Frecuentes (Wiki)' : 'FAQs & Wiki',
      icon: HelpCircle,
      desc: language === 'es' ? 'Cómo funciona y seguridad' : 'How it works & security',
    },
  ];

  return (
    <>
      {/* Mobile Header Bar (Fixed at the top) */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-[#eaeaea] flex items-center justify-between px-4 z-30 shadow-xs">
        <div className="flex items-center gap-2">
          <Logo size={24} />
          <span className="font-bold text-sm tracking-tight text-[#111111] font-sans">
            viewQ
          </span>
        </div>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 rounded-md hover:bg-gray-50 text-[#111111] focus:outline-none border border-gray-200 transition-all cursor-pointer"
          id="mobile-sidebar-toggle"
        >
          {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      {/* Sidebar Container */}
      <aside
        id="app-sidebar"
        className={`fixed md:relative inset-y-0 left-0 h-full z-40 bg-white flex flex-col transition-all duration-300 ease-in-out select-none ${
          sidebarOpen 
            ? 'w-80 translate-x-0 border-r border-[#eaeaea]' 
            : 'w-0 md:w-20 -translate-x-full md:translate-x-0 md:border-r md:border-[#eaeaea]'
        }`}
      >
        {/* Toggle Button floating on the right border (Desktop only) */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="hidden md:flex absolute top-5 -right-3.5 z-50 w-7 h-7 items-center justify-center bg-white border border-[#eaeaea] rounded-full text-gray-400 hover:text-gray-700 shadow-xs hover:shadow-sm transition-all hover:scale-105 cursor-pointer focus:outline-none"
          id="sidebar-edge-toggle"
          title={sidebarOpen ? (language === 'es' ? 'Colapsar menú' : 'Collapse menu') : (language === 'es' ? 'Expandir menú' : 'Expand menu')}
        >
          {sidebarOpen ? <ChevronLeft size={13} /> : <ChevronRight size={13} />}
        </button>

        {/* Inner layout wrapper to correctly mask child elements when collapsed */}
        <div className="w-full h-full flex flex-col overflow-hidden">
          
          {/* Sidebar Header */}
          <div className={`h-16 border-b border-[#eaeaea] flex items-center flex-shrink-0 ${sidebarOpen ? 'px-6 justify-between' : 'px-4 justify-center'}`}>
            <div className="flex items-center gap-3 overflow-hidden">
              <Logo size={28} className="flex-shrink-0" />
              {sidebarOpen && (
                <div className="flex flex-col">
                  <span className="font-bold tracking-tight text-sm text-[#111111] leading-none">
                    viewQ
                  </span>
                  <span className="text-[8px] tracking-widest text-[#999999] font-mono mt-1 uppercase font-semibold">
                    Quantum Sealing
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Navigation Items */}
          <nav className={`flex-1 py-6 space-y-1 overflow-y-auto transition-all ${sidebarOpen ? 'px-4' : 'px-2.5'}`}>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              
              return (
                <button
                  key={item.id}
                  id={`nav-tab-${item.id}`}
                  onClick={() => {
                    setActiveTab(item.id);
                    // Auto close on mobile
                    if (window.innerWidth < 768) {
                      setSidebarOpen(false);
                    }
                  }}
                  title={!sidebarOpen ? item.label : undefined}
                  className={`w-full flex items-center rounded-md text-left transition-all duration-200 group relative ${
                    sidebarOpen ? 'px-3 py-2.5 gap-3' : 'p-3 justify-center'
                  } ${
                    isActive
                      ? 'bg-gray-100 text-[#111111] font-medium'
                      : 'text-[#444444] hover:bg-gray-50 hover:text-[#111111]'
                  }`}
                >
                  <div className={`flex-shrink-0 ${isActive ? 'text-[#111111]' : 'text-[#666666] group-hover:text-gray-900'}`}>
                    <Icon size={16} />
                  </div>
                  
                  {sidebarOpen && (
                    <div className="flex flex-col min-w-0">
                      <span className={`text-xs ${isActive ? 'font-medium text-[#111111]' : 'text-[#444444]'}`}>{item.label}</span>
                      <span className={`text-[10px] leading-tight ${isActive ? 'text-[#666666]' : 'text-gray-400'} truncate`}>
                        {item.desc}
                      </span>
                    </div>
                  )}

                  {/* Notification Badge */}
                  {item.id === 'notifications' && unreadCount > 0 && (
                    <span className={`absolute ${sidebarOpen ? 'right-3 top-1/2 -translate-y-1/2' : 'top-2 right-2'} bg-red-500 text-white text-[9px] font-sans font-bold w-4.5 h-4.5 rounded-full flex items-center justify-center animate-pulse`}>
                      {unreadCount}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* User profile card */}
          {user && (
            <div className="p-4 border-t border-[#eaeaea] bg-gray-50 flex-shrink-0">
              {sidebarOpen ? (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between gap-2 text-left">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <UserCheck size={12} className="text-emerald-600 flex-shrink-0" />
                        <span className="text-[11px] font-mono font-bold text-gray-950 truncate uppercase leading-none">
                          {user.username}
                        </span>
                      </div>
                      <span className="text-[9px] text-gray-400 font-sans block truncate uppercase mt-1">
                        {language === 'es' ? `Autenticación: ${user.authType}` : `Auth: ${user.authType}`}
                      </span>
                    </div>
                    <button
                      onClick={logout}
                      className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md border border-[#eaeaea] bg-white transition-all cursor-pointer focus:outline-none"
                      title={language === 'es' ? "Cerrar sesión" : "Logout"}
                    >
                      <LogOut size={13} />
                    </button>
                  </div>

                  {/* Segmented language switcher inside the user card */}
                  <div className="flex items-center justify-between border-t border-gray-200/60 pt-3 mt-1">
                    <span className="text-[9px] text-gray-400 font-sans uppercase font-bold tracking-wide">
                      {language === 'es' ? 'Idioma' : 'Language'}
                    </span>
                    <div className="flex items-center bg-gray-100 p-0.5 rounded-md border border-gray-200/50">
                      <button
                        onClick={() => setLanguage('es')}
                        className={`px-3 py-1 text-[9px] font-sans font-bold rounded-sm transition-all cursor-pointer focus:outline-none ${
                          language === 'es' ? 'bg-white text-gray-900 shadow-xs font-semibold' : 'text-gray-400 hover:text-gray-700'
                        }`}
                      >
                        ES
                      </button>
                      <button
                        onClick={() => setLanguage('en')}
                        className={`px-3 py-1 text-[9px] font-sans font-bold rounded-sm transition-all cursor-pointer focus:outline-none ${
                          language === 'en' ? 'bg-white text-gray-900 shadow-xs font-semibold' : 'text-gray-400 hover:text-gray-700'
                        }`}
                      >
                        EN
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  {/* Language Button (Same w-8 h-8 size as logout) */}
                  <button
                    onClick={() => setLanguage(language === 'es' ? 'en' : 'es')}
                    className="w-8 h-8 flex items-center justify-center rounded-md border border-gray-200 bg-white text-gray-600 hover:text-black hover:border-gray-300 transition-all cursor-pointer font-mono text-[10px] font-bold focus:outline-none"
                    title={language === 'es' ? 'Cambiar a Inglés' : 'Switch to Spanish'}
                  >
                    {language.toUpperCase()}
                  </button>
                  {/* Logout Button (Same w-8 h-8 size as language) */}
                  <button
                    onClick={logout}
                    className="w-8 h-8 flex items-center justify-center rounded-md border border-gray-200 bg-white text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all cursor-pointer focus:outline-none"
                    title={language === 'es' ? "Cerrar sesión" : "Logout"}
                  >
                    <LogOut size={13} />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Sidebar Footer with Branding */}
          <div className={`border-t border-[#eaeaea] flex-shrink-0 ${sidebarOpen ? 'p-6' : 'py-4 px-2'}`}>
            {sidebarOpen ? (
              <div className="flex flex-col items-start">
                <span className="text-[9px] font-mono tracking-[0.2em] text-[#999999] font-bold uppercase leading-none">
                  POWERED BY VIBEDESK
                </span>
                <span className="text-[8px] font-mono text-[#aaaaaa] mt-1.5 leading-none">
                  SECURE HYBRID CRYPTO // v1.0.0
                </span>
              </div>
            ) : (
              <div className="flex justify-center">
                <span className="text-[9px] font-mono font-bold text-gray-300 tracking-wider leading-none" title="POWERED BY VIBEDESK">
                  VD
                </span>
              </div>
            )}
          </div>

        </div>
      </aside>

      {/* Mobile Backdrop overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-[#000000]/10 backdrop-blur-[1px] md:hidden z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </>
  );
};
