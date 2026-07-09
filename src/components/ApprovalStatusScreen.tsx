import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Logo } from './Logo';
import { Shield, ShieldAlert, LogOut, RefreshCw, CheckCircle, Clock } from 'lucide-react';

export const ApprovalStatusScreen: React.FC = () => {
  const { user, logout, language, setLanguage, registeredUsers } = useApp();
  const [isChecking, setIsChecking] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  const t = {
    es: {
      pendingTitle: 'Acceso en Proceso de Autorización',
      pendingSub: 'Su clave e identidad digital post-cuántica han sido encriptadas y notificadas al Superadministrador.',
      rejectedTitle: 'Acceso Denegado',
      rejectedSub: 'La firma del dispositivo o su registro de matrícula profesional no han sido validados por la fiscalía de control.',
      identifier: 'Identificador pericial:',
      pendingBadge: 'Pendiente de Aprobación',
      rejectedBadge: 'Acceso Rechazado',
      checkBtn: 'Verificar Estado Actual',
      checking: 'Sincronizando con ledger de gobernanza...',
      noChangesEs: 'Consola: Su registro sigue en estado de revisión. Por favor, espere la aprobación del Superadministrador.',
      logoutBtn: 'Cerrar Sesión',
      backToLogin: 'Volver a Identificación',
      securityStatus: 'Enclave de Seguridad Cuántica'
    },
    en: {
      pendingTitle: 'Access Pending Authorization',
      pendingSub: 'Your key and post-quantum digital identity have been encrypted and sent to the Superadministrator for review.',
      rejectedTitle: 'Access Denied',
      rejectedSub: 'Your device signature or professional license registry has not been validated by the control prosecutor.',
      identifier: 'Expert identifier:',
      pendingBadge: 'Pending Approval',
      rejectedBadge: 'Access Rejected',
      checkBtn: 'Verify Status Now',
      checking: 'Synchronizing with governance ledger...',
      noChangesEs: 'Console: Your registry is still under review. Please wait for Superadministrator approval.',
      logoutBtn: 'Log Out',
      backToLogin: 'Back to Login',
      securityStatus: 'Quantum Security Enclave'
    }
  }[language];

  const handleCheckStatus = async () => {
    setIsChecking(true);
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] Sincronizando firmas digitales...`]);
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Check if the state in localStorage has changed
    const savedUsersRaw = localStorage.getItem('quantum_pqc_registered_users');
    let liveStatus = user?.status || 'pending';
    if (savedUsersRaw && user) {
      try {
        const list = JSON.parse(savedUsersRaw);
        const match = list.find((u: any) => u.username.toLowerCase() === user.username.toLowerCase());
        if (match) {
          liveStatus = match.status;
        }
      } catch (e) {}
    }

    if (liveStatus === 'approved') {
      setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ¡AUTORIZACIÓN CONFIRMADA! Recargando aplicación...`]);
      await new Promise(resolve => setTimeout(resolve, 500));
      window.location.reload();
    } else if (liveStatus === 'rejected') {
      setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${language === 'es' ? 'ACCESO RECHAZADO: Póngase en contacto con el Administrador.' : 'ACCESS DENIED: Contact the Administrator.'}`]);
    } else {
      setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] Estado actual: PENDIENTE. No se detectan firmas de aprobación todavía.`]);
    }
    setIsChecking(false);
  };

  const isRejected = user?.status === 'rejected';

  return (
    <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 py-10 relative overflow-hidden" id="approval-status-container">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.14),transparent_26%),radial-gradient(circle_at_top_right,rgba(16,185,129,0.10),transparent_24%),radial-gradient(circle_at_bottom_right,rgba(168,85,247,0.06),transparent_20%),linear-gradient(180deg,rgba(255,255,255,0.7),rgba(238,242,247,1))]" />
      <div className="pointer-events-none absolute inset-0 opacity-45 bg-[linear-gradient(rgba(255,255,255,0.34)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.28)_1px,transparent_1px)] bg-[size:64px_64px]" />

      <div className="relative max-w-xl w-full glass-surface rounded-[32px] p-8 sm:p-10 text-center">
        
        {/* Language selector */}
        <div className="absolute top-4 right-4 flex items-center gap-1 z-10">
          <button
            onClick={() => setLanguage(language === 'es' ? 'en' : 'es')}
            className="glass-button-secondary px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.22em]"
          >
            {language === 'es' ? 'EN' : 'ES'}
          </button>
        </div>

        {/* Logo and Security Enclave */}
        <div className="space-y-3 mb-6">
          <Logo size={48} className="mx-auto mb-3" />
          
          {isRejected ? (
            <div className="glass-badge px-2.5 py-1 text-[9px] font-mono font-bold uppercase tracking-wider text-red-700 border-red-100 bg-red-50/85">
              <ShieldAlert size={10} />
              {t.rejectedBadge.toUpperCase()}
            </div>
          ) : (
            <div className="glass-badge px-2.5 py-1 text-[9px] font-mono font-bold uppercase tracking-wider text-amber-700 border-amber-100 bg-amber-50/85 animate-pulse">
              <Clock size={10} />
              {t.pendingBadge.toUpperCase()}
            </div>
          )}

          <p className="text-xs font-mono text-gray-400">
            {t.identifier} <strong className="text-black uppercase">{user?.username}</strong>
          </p>

          <h2 className="font-display font-semibold text-2xl text-slate-950 tracking-tight mt-3">
            {isRejected ? t.rejectedTitle : t.pendingTitle}
          </h2>
          <p className="text-sm text-slate-600 font-sans leading-relaxed max-w-sm mx-auto">
            {isRejected ? t.rejectedSub : t.pendingSub}
          </p>
        </div>

        {/* Informative Help Box */}
        <div className="glass-surface-soft rounded-[24px] p-4 text-left space-y-2.5 mb-6 text-xs">
          <span className="text-[9px] font-mono text-slate-500 block uppercase font-bold tracking-wider">
            {t.securityStatus}
          </span>
          <p className="text-slate-600 leading-relaxed font-sans">
            {isRejected 
              ? (language === 'es' 
                  ? 'Su clave post-cuántica y perfil forense han sido bloqueados. Por favor, póngase en contacto con el Administrador para resolver discrepancias de credenciales.'
                  : 'Your post-quantum key and forensic profile have been locked. Please contact the Administrator to resolve credential discrepancies.')
              : (language === 'es'
                  ? 'Solo el Superadministrador puede otorgar permisos oficiales de inyección cuántica en el panel de control de usuarios.'
                  : 'Only the Superadministrator can grant official quantum injection permissions in the user control panel.')
            }
          </p>
          <div className="text-[10px] font-mono text-slate-500 flex items-center justify-between pt-1.5 border-t border-white/70">
            <span>{language === 'es' ? 'Rol Requerido:' : 'Required Role:'}</span>
            <span className="text-slate-950 font-semibold uppercase">Superadmin</span>
          </div>
        </div>

        {/* Live log / updates */}
        {!isRejected && (
          <div className="space-y-3 mb-6">
            <button
              onClick={handleCheckStatus}
              disabled={isChecking}
              className="glass-button-primary w-full py-3 text-xs font-semibold uppercase tracking-[0.22em] disabled:opacity-50"
            >
              <RefreshCw size={12} className={isChecking ? 'animate-spin' : ''} />
              {isChecking ? t.checking : t.checkBtn}
            </button>

            {logs.length > 0 && (
              <div className="glass-surface-soft rounded-[22px] p-3 h-24 overflow-y-auto font-mono text-[9px] text-left text-slate-600 space-y-1 hide-scrollbar">
                {logs.map((log, i) => (
                  <div key={i} className="leading-relaxed border-l border-white/70 pl-1.5">
                    {log}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Logout action */}
        <div className="pt-4 border-t border-white/70">
          <button
            onClick={logout}
            className="glass-button-secondary w-full py-3 text-xs font-semibold uppercase tracking-[0.22em] text-red-600 border-red-200 bg-red-50/70 hover:bg-red-50"
          >
            <LogOut size={12} />
            {t.logoutBtn}
          </button>
        </div>

        {/* Footprint Powered By VibeDesk */}
        <div className="mt-8 pt-4 border-t border-white/60">
          <span className="text-[9px] font-sans font-semibold tracking-widest text-slate-500 uppercase">
            POWERED BY VIBEDESK
          </span>
        </div>

      </div>
    </div>
  );
};
