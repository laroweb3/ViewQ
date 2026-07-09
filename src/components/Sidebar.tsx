import React from 'react';
import { useApp } from '../context/AppContext';
import { Logo } from './Logo';
import { 
  Shield, 
  Sliders, 
  Database, 
  Cpu, 
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
      {/* Mobile Menu Button (Floating) */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 bg-white rounded-md border border-[#eaeaea] shadow-sm text-[#111111] hover:bg-gray-50 focus:outline-none"
          id="mobile-sidebar-toggle"
        >
          {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Sidebar Container */}
      <aside
        id="app-sidebar"
        className={`fixed md:sticky top-0 left-0 h-screen z-40 bg-white flex flex-col transition-all duration-300 ease-in-out ${
          sidebarOpen 
            ? 'w-80 translate-x-0 border-r border-[#eaeaea]' 
            : 'w-0 md:w-20 -translate-x-full md:translate-x-0 overflow-hidden md:border-r md:border-[#eaeaea]'
        }`}
      >
        {/* Sidebar Header */}
        <div className={`h-16 border-b border-[#eaeaea] flex items-center justify-between flex-shrink-0 ${sidebarOpen ? 'px-6' : 'px-4 justify-center'}`}>
          <div className="flex items-center gap-3 overflow-hidden">
            <Logo size={28} className="flex-shrink-0" />
            {sidebarOpen && (
              <div className="flex flex-col">
                <span className="font-bold tracking-tight text-lg text-[#111111]">
                  viewQ
                </span>
                <span className="text-[9px] tracking-widest text-[#999999] font-mono mt-0.5 uppercase font-medium">
                  Quantum Sealing
                </span>
              </div>
            )}
          </div>

          {/* Desktop Collapse Toggle */}
          {sidebarOpen && (
            <button
              onClick={() => setSidebarOpen(false)}
              className="hidden md:flex p-1.5 rounded-sm hover:bg-gray-50 text-gray-400 hover:text-gray-600 focus:outline-none"
              id="desktop-collapse-btn"
            >
              <ChevronLeft size={16} />
            </button>
          )}
        </div>

        {/* Desktop Expand Toggle when collapsed */}
        {!sidebarOpen && (
          <div className="hidden md:flex justify-center py-4 border-b border-[#eaeaea] flex-shrink-0">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-1.5 rounded-sm hover:bg-gray-50 text-gray-400 hover:text-gray-600 focus:outline-none"
              id="desktop-expand-btn"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}

        {/* Navigation items */}
        <nav className={`flex-1 py-6 space-y-1 overflow-y-auto transition-all ${sidebarOpen ? 'px-4' : 'px-2'}`}>
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
                className={`w-full flex items-center rounded-sm text-left transition-all duration-200 group relative ${
                  sidebarOpen ? 'px-3 py-2.5 gap-3' : 'p-3 justify-center'
                } ${
                  isActive
                    ? 'bg-[#f5f5f5] text-[#111111]'
                    : 'text-[#444444] hover:bg-[#fafafa] hover:text-[#111111]'
                }`}
              >
                <div className={`flex-shrink-0 ${isActive ? 'text-[#111111]' : 'text-[#666666] group-hover:text-gray-900'}`}>
                   <Icon size={16} />
                </div>
                
                {sidebarOpen && (
                  <div className="flex flex-col">
                    <span className={`text-xs ${isActive ? 'font-medium text-[#111111]' : 'text-[#444444]'}`}>{item.label}</span>
                    <span className={`text-[10px] leading-tight ${isActive ? 'text-[#666666]' : 'text-gray-400'}`}>
                      {item.desc}
                    </span>
                  </div>
                )}

                {/* Notification Badge */}
                {item.id === 'notifications' && unreadCount > 0 && (
                  <span className={`absolute ${sidebarOpen ? 'right-3 top-1/2 -translate-y-1/2' : 'top-1.5 right-1.5'} bg-red-500 text-white text-[9px] font-sans font-bold w-4.5 h-4.5 rounded-full flex items-center justify-center animate-pulse`}>
                    {unreadCount}
                  </span>
                )}

                {/* Micro tooltip for collapsed state */}
                {!sidebarOpen && (
                  <div className="absolute left-16 bg-[#000000] text-white text-[11px] font-sans px-2.5 py-1 rounded-sm shadow-md opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-50">
                    {item.label}
                  </div>
                )}
              </button>
            );
          })}
        </nav>

        {/* User profile card */}
        {user && (
          <div className="px-4 py-3 border-t border-[#eaeaea] bg-[#fafafa]">
            {sidebarOpen ? (
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between gap-2 text-left">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1">
                      <UserCheck size={12} className="text-emerald-600 flex-shrink-0" />
                      <span className="text-[11px] font-mono font-bold text-gray-900 truncate uppercase">
                        {user.username}
                      </span>
                    </div>
                    <span className="text-[9px] text-gray-400 font-sans block truncate uppercase">
                      {language === 'es' ? `Autenticación: ${user.authType}` : `Auth: ${user.authType}`}
                    </span>
                  </div>
                  <button
                    onClick={logout}
                    className="p-1.5 text-gray-400 hover:text-black rounded-sm border border-[#eaeaea] bg-white transition-all cursor-pointer"
                    title={language === 'es' ? "Cerrar sesión" : "Logout"}
                  >
                    <LogOut size={12} />
                  </button>
                </div>
                {/* Language switcher inside the user card */}
                <div className="flex items-center justify-between border-t border-[#eaeaea]/60 pt-2 mt-1">
                  <span className="text-[9px] text-gray-400 font-sans uppercase font-semibold">
                    {language === 'es' ? 'Idioma' : 'Language'}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setLanguage('es')}
                      className={`px-1.5 py-0.5 text-[9px] font-sans font-bold border rounded-sm transition-colors cursor-pointer ${
                        language === 'es' ? 'bg-black text-white border-black' : 'bg-white text-gray-400 border-gray-200 hover:text-black hover:border-gray-400'
                      }`}
                    >
                      ES
                    </button>
                    <button
                      onClick={() => setLanguage('en')}
                      className={`px-1.5 py-0.5 text-[9px] font-sans font-bold border rounded-sm transition-colors cursor-pointer ${
                        language === 'en' ? 'bg-black text-white border-black' : 'bg-white text-gray-400 border-gray-200 hover:text-black hover:border-gray-400'
                      }`}
                    >
                      EN
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <button
                  onClick={() => setLanguage(language === 'es' ? 'en' : 'es')}
                  className="p-1 text-[8px] font-mono font-bold rounded-sm border border-[#eaeaea] bg-white text-gray-600 hover:text-black hover:border-gray-400 transition-all cursor-pointer uppercase"
                  title={language === 'es' ? 'Cambiar a Inglés' : 'Switch to Spanish'}
                >
                  {language === 'es' ? 'ES' : 'EN'}
                </button>
                <button
                  onClick={logout}
                  className="p-2 text-gray-400 hover:text-black rounded-sm border border-[#eaeaea] bg-white transition-all cursor-pointer"
                  title={language === 'es' ? "Cerrar sesión" : "Logout"}
                >
                  <LogOut size={14} />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Sidebar Footer with Branding */}
        <div className={`border-t border-[#eaeaea] ${sidebarOpen ? 'p-6' : 'py-4 px-2'}`}>
          {sidebarOpen ? (
            <div className="flex flex-col items-start">
              <span className="text-[10px] font-mono tracking-[0.2em] text-[#999999] font-semibold uppercase leading-none">
                POWERED BY VIBEDESK
              </span>
              <span className="text-[8px] font-mono text-[#aaaaaa] mt-1">
                SECURE HYBRID CRYPTO // v1.0.0
              </span>
            </div>
          ) : (
            <div className="flex justify-center group relative">
              <span className="text-[9px] font-mono font-bold text-gray-300 tracking-widest leading-none">
                VD
              </span>
              <div className="absolute bottom-10 left-10 bg-[#000000] text-white text-[10px] font-mono px-2 py-1 rounded-sm shadow-md opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-50">
                POWERED BY VIBEDESK
              </div>
            </div>
          )}
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
