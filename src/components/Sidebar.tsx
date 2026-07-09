import React from 'react';
import { useApp } from '../context/AppContext';
import { Logo } from './Logo';
import { 
  Sparkles,
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
      id: 'start',
      label: language === 'es' ? 'Start' : 'Start',
      icon: Sparkles,
      desc: language === 'es' ? 'Vista ejecutiva principal' : 'Executive overview',
    },
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
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white/72 backdrop-blur-2xl border-b border-white/70 flex items-center justify-between px-4 z-30 shadow-[0_12px_30px_-20px_rgba(15,23,42,0.24)] text-slate-900">
        <div className="flex items-center gap-2">
          <Logo size={24} />
          <span className="font-semibold text-sm tracking-tight text-slate-900 font-display">
            viewQ
          </span>
        </div>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 rounded-full hover:bg-slate-900/5 text-slate-700 focus:outline-none border border-white/70 bg-white/60 transition-all cursor-pointer shadow-[0_10px_28px_-22px_rgba(15,23,42,0.45)]"
          id="mobile-sidebar-toggle"
        >
          {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      {/* Sidebar Container */}
      <aside
        id="app-sidebar"
        className={`fixed md:relative inset-y-0 left-0 h-full z-40 bg-white/68 backdrop-blur-2xl text-slate-900 flex flex-col transition-all duration-300 ease-in-out select-none shadow-[0_24px_80px_-44px_rgba(15,23,42,0.36)] border-white/60 md:rounded-[28px] md:my-3 md:ml-3 ${
          sidebarOpen 
            ? 'w-80 translate-x-0 border-r border-white/60' 
            : 'w-0 md:w-24 -translate-x-full md:translate-x-0 md:border-r md:border-white/60'
        }`}
      >
        {/* Toggle Button floating on the right border (Desktop only) */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="hidden md:flex absolute top-5 -right-3.5 z-50 w-8 h-8 items-center justify-center bg-white/80 border border-white/80 rounded-full text-slate-600 hover:text-slate-950 shadow-[0_12px_30px_-20px_rgba(15,23,42,0.28)] hover:shadow-[0_16px_32px_-18px_rgba(15,23,42,0.35)] transition-all hover:scale-105 cursor-pointer focus:outline-none backdrop-blur-xl"
          id="sidebar-edge-toggle"
          title={sidebarOpen ? (language === 'es' ? 'Colapsar menú' : 'Collapse menu') : (language === 'es' ? 'Expandir menú' : 'Expand menu')}
        >
          {sidebarOpen ? <ChevronLeft size={13} /> : <ChevronRight size={13} />}
        </button>

        {/* Inner layout wrapper to correctly mask child elements when collapsed */}
        <div className="w-full h-full flex flex-col overflow-hidden">
          
          {/* Sidebar Header */}
          <div className={`h-16 border-b border-white/60 flex items-center flex-shrink-0 ${sidebarOpen ? 'px-6 justify-between' : 'px-4 justify-center'}`}>
            <div className="flex items-center gap-3 overflow-hidden">
              <Logo size={28} className="flex-shrink-0" />
              {sidebarOpen && (
                <div className="flex flex-col">
                    <span className="font-semibold tracking-tight text-sm text-slate-950 leading-none font-display">
                    viewQ
                  </span>
                  <span className="text-[8px] tracking-[0.28em] text-slate-500 font-mono mt-1 uppercase font-semibold">
                    Quantum Sealing
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Navigation Items */}
          <nav className={`flex-1 py-6 space-y-1 overflow-y-auto hide-scrollbar transition-all ${sidebarOpen ? 'px-4' : 'px-2.5'}`}>
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
                      sidebarOpen ? 'px-3.5 py-3 gap-3 rounded-2xl' : 'p-3 justify-center rounded-2xl'
                  } ${
                    isActive
                        ? 'bg-white/80 text-slate-950 font-medium ring-1 ring-white/80 shadow-[0_16px_30px_-24px_rgba(15,23,42,0.16)]'
                        : 'text-slate-500 hover:bg-white/70 hover:text-slate-950'
                  }`}
                >
                    <div className={`flex-shrink-0 ${isActive ? 'text-slate-950' : 'text-slate-400 group-hover:text-slate-950'}`}>
                    <Icon size={16} />
                  </div>
                  
                  {sidebarOpen && (
                    <div className="flex flex-col min-w-0">
                        <span className={`text-xs ${isActive ? 'font-medium text-slate-950' : 'text-slate-700'}`}>{item.label}</span>
                        <span className={`text-[10px] leading-tight ${isActive ? 'text-slate-500' : 'text-slate-500'} truncate`}>
                        {item.desc}
                      </span>
                    </div>
                  )}

                  {/* Notification Badge */}
                  {item.id === 'notifications' && unreadCount > 0 && (
                      <span className={`absolute ${sidebarOpen ? 'right-3 top-1/2 -translate-y-1/2' : 'top-2 right-2'} bg-sky-500 text-white text-[9px] font-sans font-bold w-4.5 h-4.5 rounded-full flex items-center justify-center animate-pulse shadow-[0_10px_20px_-10px_rgba(14,165,233,0.85)]`}>
                      {unreadCount}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* User profile card */}
          {user && (
              <div className="p-4 border-t border-white/60 bg-white/45 flex-shrink-0 backdrop-blur-xl">
              {sidebarOpen ? (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between gap-2 text-left">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                          <UserCheck size={12} className="text-emerald-500 flex-shrink-0" />
                          <span className="text-[11px] font-mono font-bold text-slate-950 truncate uppercase leading-none">
                          {user.username}
                        </span>
                      </div>
                        <span className="text-[9px] text-slate-500 font-sans block truncate uppercase mt-1">
                        {language === 'es' ? `Autenticación: ${user.authType}` : `Auth: ${user.authType}`}
                      </span>
                    </div>
                    <button
                      onClick={logout}
                        className="w-8 h-8 flex items-center justify-center text-slate-500 hover:text-slate-950 hover:bg-white/80 rounded-xl border border-white/70 bg-white/70 transition-all cursor-pointer focus:outline-none backdrop-blur-xl"
                      title={language === 'es' ? "Cerrar sesión" : "Logout"}
                    >
                      <LogOut size={13} />
                    </button>
                  </div>

                  {/* Segmented language switcher inside the user card */}
                    <div className="flex items-center justify-between border-t border-white/70 pt-3 mt-1">
                      <span className="text-[9px] text-slate-500 font-sans uppercase font-bold tracking-wide">
                      {language === 'es' ? 'Idioma' : 'Language'}
                    </span>
                      <div className="flex items-center bg-white/70 p-0.5 rounded-xl border border-white/70 shadow-[0_10px_24px_-18px_rgba(15,23,42,0.35)] backdrop-blur-xl">
                      <button
                        onClick={() => setLanguage('es')}
                        className={`px-3 py-1 text-[9px] font-sans font-bold rounded-sm transition-all cursor-pointer focus:outline-none ${
                            language === 'es' ? 'bg-slate-950 text-white shadow-sm font-semibold rounded-lg' : 'text-slate-500 hover:text-slate-950'
                        }`}
                      >
                        ES
                      </button>
                      <button
                        onClick={() => setLanguage('en')}
                        className={`px-3 py-1 text-[9px] font-sans font-bold rounded-sm transition-all cursor-pointer focus:outline-none ${
                            language === 'en' ? 'bg-slate-950 text-white shadow-sm font-semibold rounded-lg' : 'text-slate-500 hover:text-slate-950'
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
                    className="w-8 h-8 flex items-center justify-center rounded-xl border border-white/70 bg-white/70 text-slate-600 hover:text-slate-950 hover:bg-white transition-all cursor-pointer font-mono text-[10px] font-bold focus:outline-none backdrop-blur-xl"
                    title={language === 'es' ? 'Cambiar a Inglés' : 'Switch to Spanish'}
                  >
                    {language.toUpperCase()}
                  </button>
                  {/* Logout Button (Same w-8 h-8 size as language) */}
                  <button
                    onClick={logout}
                    className="w-8 h-8 flex items-center justify-center rounded-xl border border-white/70 bg-white/70 text-slate-500 hover:text-slate-950 hover:bg-white transition-all cursor-pointer focus:outline-none backdrop-blur-xl"
                    title={language === 'es' ? "Cerrar sesión" : "Logout"}
                  >
                    <LogOut size={13} />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Sidebar Footer with Branding */}
          <div className={`border-t border-white/60 flex-shrink-0 ${sidebarOpen ? 'p-6' : 'py-4 px-2'}`}>
            {sidebarOpen ? (
              <div className="flex flex-col items-start">
                <span className="text-[9px] font-mono tracking-[0.28em] text-slate-500 font-bold uppercase leading-none">
                  POWERED BY VIBEDESK
                </span>
                <span className="text-[8px] font-mono text-slate-500 mt-1.5 leading-none">
                  SECURE HYBRID CRYPTO // v1.0.0
                </span>
              </div>
            ) : (
              <div className="flex justify-center">
                <span className="text-[9px] font-mono font-bold text-slate-500 tracking-wider leading-none" title="POWERED BY VIBEDESK">
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
          className="fixed inset-0 bg-slate-950/8 backdrop-blur-[2px] md:hidden z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </>
  );
};
