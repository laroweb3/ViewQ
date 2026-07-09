import React, { useEffect, useState } from 'react';
import { useApp, handleFirestoreError, OperationType } from '../context/AppContext';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { 
  Users, 
  ShieldCheck, 
  UserX, 
  UserCheck, 
  Clock, 
  Search, 
  PlusCircle, 
  User, 
  Mail, 
  FileText, 
  MapPin, 
  Check, 
  X, 
  RefreshCw, 
  ShieldAlert 
} from 'lucide-react';

export const UsersView: React.FC = () => {
  const { 
    registeredUsers, 
    approveUser, 
    rejectUser, 
    language, 
    addLog,
    user: currentUser
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [selectedUsername, setSelectedUsername] = useState<string | null>(null);

  const t = {
    es: {
      title: 'Control de Gobernanza de Usuarios',
      subtitle: 'Portal exclusivo del Superadministrador Laro para la verificación criptográfica, aprobación y rechazo de credenciales forenses.',
      searchPlaceholder: 'Buscar por alias, nombre, matrícula o DNI...',
      all: 'Todos',
      pending: 'Pendientes',
      approved: 'Aprobados',
      rejected: 'Rechazados',
      statsTotal: 'Registrados',
      statsPending: 'Pendientes',
      statsApproved: 'Aprobados',
      statsRejected: 'Rechazados',
      noUsers: 'No hay usuarios que coincidan con los filtros.',
      noUsersGeneral: 'No hay otros usuarios registrados en el sistema todavía.',
      noUsersDesc: 'Cuando un nuevo fiscal o perito intente acceder con su dispositivo o frase cuántica, quedará en cuarentena criptográfica y aparecerá aquí esperando su veredicto de aprobación.',
      createDemoBtn: 'Generar Registro de Prueba',
      demoSuccess: 'Se ha generado un registro de prueba de perito forense en estado pendiente.',
      authType: 'Seguridad:',
      registeredAt: 'Fecha de Registro:',
      statusLabel: 'Estado:',
      approveBtn: 'Autorizar Acceso',
      rejectBtn: 'Denegar Acceso',
      revokeBtn: 'Revocar Permisos',
      reapproveBtn: 'Re-Aprobar',
      detailsTitle: 'Perfil Profesional Relacionado',
      matricula: 'Matrícula:',
      dni: 'DNI/ID:',
      jurisdiccion: 'Jurisdicción:',
      contacto: 'Contacto/Email:',
      superadminDisclaimer: 'Usted está operando con privilegios absolutos de SUPERADMIN (Laro). Toda alteración de firmas de acceso quedará asentada de forma irreversible en la bitácora cuántica local.'
    },
    en: {
      title: 'User Governance Control',
      subtitle: 'Exclusive Superadministrator Laro portal for cryptographic verification, approval, and rejection of forensic credentials.',
      searchPlaceholder: 'Search by alias, name, license number, or DNI...',
      all: 'All',
      pending: 'Pending',
      approved: 'Approved',
      rejected: 'Rejected',
      statsTotal: 'Total',
      statsPending: 'Pending',
      statsApproved: 'Approved',
      statsRejected: 'Rejected',
      noUsers: 'No users match the active filters.',
      noUsersGeneral: 'No other users registered in the system yet.',
      noUsersDesc: 'When a new prosecutor or expert tries to sign in with their device or quantum phrase, they will be placed in cryptographic quarantine and will appear here awaiting your approval verdict.',
      createDemoBtn: 'Simulate Pending Sign-up',
      demoSuccess: 'Simulated registration of a forensic expert in pending state.',
      authType: 'Security:',
      registeredAt: 'Registered At:',
      statusLabel: 'Status:',
      approveBtn: 'Authorize Access',
      rejectBtn: 'Deny Access',
      revokeBtn: 'Revoke Permissions',
      reapproveBtn: 'Re-Approve',
      detailsTitle: 'Professional Profile Details',
      matricula: 'License Number:',
      dni: 'DNI/ID:',
      jurisdiccion: 'Jurisdiction:',
      contacto: 'Contact/Email:',
      superadminDisclaimer: 'You are operating with absolute SUPERADMIN (Laro) privileges. Any alteration of access signatures will be irreversibly logged in the local quantum audit ledger.'
    }
  }[language];

  // Handler to generate a random mock user for testing purposes
  const handleCreateMockUser = () => {
    const mockNames = ['Mariana', 'Esteban', 'Clara', 'Sebastián', 'Gabriela', 'Alejandro'];
    const mockLastNames = ['Gómez', 'Fernández', 'Torres', 'López', 'Ríos', 'Castillo'];
    const mockJurisdictions = ['Buenos Aires', 'Madrid', 'Bogotá', 'Santiago de Chile', 'Ciudad de México', 'Lima'];
    
    const randomIdx = Math.floor(Math.random() * mockNames.length);
    const firstName = mockNames[randomIdx];
    const lastName = mockLastNames[Math.floor(Math.random() * mockLastNames.length)];
    const username = `${firstName.toLowerCase()}_forensic_${Math.floor(100 + Math.random() * 900)}`;
    const randomDni = `${Math.floor(25000000 + Math.random() * 20000000)}`;
    const randomMat = `MP-${Math.floor(10000 + Math.random() * 89999)}`;
    const randomJur = mockJurisdictions[Math.floor(Math.random() * mockJurisdictions.length)];
    const randomEmail = `${username}@fiscalia-forense.gob`;

    const newUser = {
      username,
      authType: Math.random() > 0.5 ? 'passkey' as const : 'diceware' as const,
      status: 'pending' as const,
      registeredAt: new Date().toISOString(),
      profile: {
        nombres: firstName,
        apellidos: lastName,
        nacionalidad: language === 'es' ? 'Argentina' : 'Argentinian',
        dni: randomDni,
        matricula: randomMat,
        jurisdiccion: randomJur,
        contacto: '+54 9 11 ' + Math.floor(40000000 + Math.random() * 50000000),
        email: randomEmail
      }
    };

    // Store in firestore to trigger real-time updates
    setDoc(doc(db, 'users', username.toLowerCase()), newUser).catch((err) => {
      handleFirestoreError(err, OperationType.WRITE, `users/${username.toLowerCase()}`);
    });
    
    // Log the operation
    addLog('INFO', `SIMULACIÓN DE REGISTRO: El usuario externo ${username.toUpperCase()} (${firstName} ${lastName}) ha solicitado vinculación mediante ${newUser.authType.toUpperCase()}.`);
  };

  const filteredUsers = registeredUsers
    .filter(u => u.username.toLowerCase() !== 'laro') // Exclude Laro from the list of reviews
    .filter(u => {
      // Status filter
      if (filterStatus !== 'all' && u.status !== filterStatus) return false;
      
      // Search text filter
      if (!searchQuery) return true;
      const term = searchQuery.toLowerCase();
      const hasMatch = 
        u.username.toLowerCase().includes(term) ||
        (u.profile?.nombres || '').toLowerCase().includes(term) ||
        (u.profile?.apellidos || '').toLowerCase().includes(term) ||
        (u.profile?.matricula || '').toLowerCase().includes(term) ||
        (u.profile?.dni || '').toLowerCase().includes(term) ||
        (u.profile?.jurisdiccion || '').toLowerCase().includes(term);
      return hasMatch;
    });

  // Calculate stats excluding Laro
  const auditUsersList = registeredUsers.filter(u => u.username.toLowerCase() !== 'laro');
  const stats = {
    total: auditUsersList.length,
    pending: auditUsersList.filter(u => u.status === 'pending').length,
    approved: auditUsersList.filter(u => u.status === 'approved').length,
    rejected: auditUsersList.filter(u => u.status === 'rejected').length,
  };

  useEffect(() => {
    if (filteredUsers.length === 0) {
      setSelectedUsername(null);
      return;
    }

    if (!selectedUsername || !filteredUsers.some(user => user.username === selectedUsername)) {
      setSelectedUsername(filteredUsers[0].username);
    }
  }, [filteredUsers, selectedUsername]);

  const selectedUser = filteredUsers.find(user => user.username === selectedUsername) || null;

  return (
    <div className="space-y-6" id="users-view-root">
      
      {/* Disclaimer Alert */}
      <div className="glass-surface-soft border border-emerald-100 p-4 rounded-[24px] flex items-start gap-3 text-emerald-950 text-xs">
        <ShieldCheck className="text-emerald-700 mt-0.5 flex-shrink-0 animate-pulse" size={16} />
        <div>
          <span className="font-bold block text-[10px] font-mono tracking-wider text-emerald-800 uppercase mb-1">
            00. PRIVILEGIOS DE SUPERADMINISTRADOR DETECTADOS
          </span>
          <p className="font-sans leading-relaxed">
            {t.superadminDisclaimer}
          </p>
        </div>
      </div>

      {/* Header Block with Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/70 pb-6">
        <div>
          <h1 className="font-sans font-bold text-2xl text-slate-950 tracking-tight flex items-center gap-2">
            <Users size={22} className="text-slate-950" />
            {t.title}
          </h1>
          <p className="text-xs text-slate-500 font-sans mt-1 max-w-2xl leading-relaxed">
            {t.subtitle}
          </p>
        </div>

        {/* Simulate sign-up button for quick testing */}
        <button
          onClick={handleCreateMockUser}
          className="self-start md:self-center glass-button-primary text-white text-[11px] font-mono px-4 py-2.5 rounded-[18px] cursor-pointer transition-all flex items-center gap-1.5 font-semibold"
          title="Simulate user registration"
        >
          <PlusCircle size={14} />
          {t.createDemoBtn}
        </button>
      </div>

      {/* Statistics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4" id="users-stats-grid">
        <div className="glass-surface-soft p-4 rounded-[24px]">
          <span className="text-[10px] font-mono text-slate-400 block uppercase font-bold tracking-wider">
            {t.statsTotal}
          </span>
          <span className="text-2xl font-mono font-bold text-slate-950">{stats.total}</span>
        </div>
        
        <div className="glass-surface-soft p-4 rounded-[24px] border-l-2 border-l-amber-500">
          <span className="text-[10px] font-mono text-amber-600 block uppercase font-bold tracking-wider flex items-center gap-1">
            <Clock size={11} /> {t.statsPending}
          </span>
          <span className="text-2xl font-mono font-bold text-amber-700">{stats.pending}</span>
        </div>

        <div className="glass-surface-soft p-4 rounded-[24px] border-l-2 border-l-emerald-600">
          <span className="text-[10px] font-mono text-emerald-600 block uppercase font-bold tracking-wider flex items-center gap-1">
            <Check size={11} /> {t.statsApproved}
          </span>
          <span className="text-2xl font-mono font-bold text-emerald-700">{stats.approved}</span>
        </div>

        <div className="glass-surface-soft p-4 rounded-[24px] border-l-2 border-l-red-600">
          <span className="text-[10px] font-mono text-red-600 block uppercase font-bold tracking-wider flex items-center gap-1">
            <X size={11} /> {t.statsRejected}
          </span>
          <span className="text-2xl font-mono font-bold text-red-700">{stats.rejected}</span>
        </div>
      </div>

      {/* Filters & Search Block */}
      <div className="flex flex-col sm:flex-row gap-3 glass-surface-soft p-3 rounded-[24px]">
        {/* Search Input */}
        <div className="relative flex-1 flex items-center">
          <Search className="absolute left-3 text-slate-400" size={14} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t.searchPlaceholder}
            className="glass-input w-full text-xs font-sans pl-9 pr-4 py-2 rounded-[18px]"
          />
        </div>

        {/* Tab Filters */}
        <div className="flex glass-surface-soft p-0.5 rounded-[18px] border border-white/70 self-start sm:self-auto">
          {(['all', 'pending', 'approved', 'rejected'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-1.5 text-[10px] font-sans font-bold uppercase rounded-[14px] transition-all cursor-pointer ${
                filterStatus === status 
                  ? 'bg-white text-slate-950 shadow-[0_12px_24px_-20px_rgba(15,23,42,0.45)]' 
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              {status === 'all' && t.all}
              {status === 'pending' && t.pending}
              {status === 'approved' && t.approved}
              {status === 'rejected' && t.rejected}
            </button>
          ))}
        </div>
      </div>

      {/* Users list / grid */}
      {filteredUsers.length === 0 ? (
        <div className="glass-surface rounded-[28px] py-16 px-6 text-center max-w-xl mx-auto">
          <div className="w-12 h-12 glass-surface-soft rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
            <Users size={20} />
          </div>
          <h3 className="font-sans font-bold text-sm text-slate-950 uppercase tracking-wider">
            {stats.total === 0 ? t.noUsersGeneral : t.noUsers}
          </h3>
          <p className="text-xs text-slate-400 font-sans mt-2 leading-relaxed">
            {stats.total === 0 ? t.noUsersDesc : ''}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_0.8fr] gap-6 items-start" id="users-review-grid">
          <div className="glass-surface rounded-[28px] overflow-hidden">
            <div className="px-5 py-4 border-b border-white/70 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-sans font-bold text-slate-950 uppercase tracking-wider">
                  {language === 'es' ? 'Lista de usuarios' : 'User list'}
                </h2>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {language === 'es'
                    ? 'Seleccione una fila para abrir el detalle y ejecutar una acción.'
                    : 'Select a row to open the detail panel and act on the user.'}
                </p>
              </div>
              <span className="glass-badge px-2.5 py-1 text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                {filteredUsers.length}
              </span>
            </div>

            <div className="divide-y divide-white/70">
              {filteredUsers.map((item) => {
                const statusLabel = item.status === 'pending' ? t.pending : item.status === 'approved' ? t.approved : t.rejected;
                const isActive = selectedUser?.username === item.username;

                return (
                  <button
                    key={item.username}
                    onClick={() => setSelectedUsername(item.username)}
                    className={`w-full text-left px-5 py-4 transition-all cursor-pointer hover:bg-white/70 ${
                      isActive ? 'bg-white/80' : 'bg-transparent'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono font-bold text-xs text-slate-950 uppercase tracking-wide truncate">
                            {item.username}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-[8px] font-mono uppercase tracking-wide font-bold border ${
                            item.status === 'pending'
                              ? 'bg-amber-50 text-amber-700 border-amber-100'
                              : item.status === 'approved'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                : 'bg-red-50 text-red-700 border-red-100'
                          }`}>
                            {statusLabel}
                          </span>
                          {isActive && (
                            <span className="text-[8px] font-mono uppercase tracking-[0.22em] text-slate-400">{language === 'es' ? 'Seleccionado' : 'Selected'}</span>
                          )}
                        </div>

                        <div className="mt-1.5 flex items-center gap-3 text-[10px] text-slate-500 font-mono flex-wrap">
                          <span>{t.authType} <strong className="text-slate-700 uppercase">{item.authType}</strong></span>
                          <span>•</span>
                          <span>{t.registeredAt} <strong className="text-slate-700">{new Date(item.registeredAt).toLocaleDateString()}</strong></span>
                          <span>•</span>
                          <span className="truncate max-w-[180px]">{item.profile?.jurisdiccion || (language === 'es' ? 'Sin perfil profesional' : 'No professional profile')}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 flex-shrink-0">
                        <div className="hidden sm:flex items-center gap-1 text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                          {item.profile ? <UserCheck size={12} /> : <User size={12} />}
                          {item.profile ? (language === 'es' ? 'Perfil' : 'Profile') : (language === 'es' ? 'Pendiente' : 'Pending')}
                        </div>
                        <div className="w-8 h-8 rounded-full glass-surface-soft flex items-center justify-center text-slate-500">
                          <Clock size={14} />
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="glass-surface rounded-[28px] p-6 sticky top-6 space-y-5" id="user-detail-panel">
            {selectedUser ? (
              <>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <span className="text-[10px] font-mono uppercase tracking-[0.22em] text-slate-400 block mb-1">
                      {language === 'es' ? 'Detalle del usuario' : 'User detail'}
                    </span>
                    <h3 className="text-lg font-bold text-slate-950 font-sans truncate">
                      {selectedUser.username}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      {selectedUser.profile
                        ? (language === 'es' ? 'Perfil profesional listo para revisión y acción.' : 'Professional profile ready for review and action.')
                        : (language === 'es' ? 'Aún no completó el perfil profesional.' : 'Professional profile has not been completed yet.')}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-[10px] font-mono uppercase tracking-wider font-bold border ${
                    selectedUser.status === 'pending'
                      ? 'bg-amber-50 text-amber-700 border-amber-100'
                      : selectedUser.status === 'approved'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                        : 'bg-red-50 text-red-700 border-red-100'
                  }`}>
                    {selectedUser.status}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="glass-surface-soft rounded-[20px] p-3 space-y-1">
                    <span className="text-[9px] uppercase tracking-wider font-mono text-slate-400 block">{t.authType}</span>
                    <p className="font-semibold text-slate-950 uppercase">{selectedUser.authType}</p>
                  </div>
                  <div className="glass-surface-soft rounded-[20px] p-3 space-y-1">
                    <span className="text-[9px] uppercase tracking-wider font-mono text-slate-400 block">{t.registeredAt}</span>
                    <p className="font-semibold text-slate-950">{new Date(selectedUser.registeredAt).toLocaleString()}</p>
                  </div>
                </div>

                <div className="glass-surface-soft rounded-[24px] p-4 space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">
                      {t.detailsTitle}
                    </span>
                    <span className="text-[10px] font-mono uppercase tracking-[0.22em] text-slate-400">
                      {selectedUser.profile ? (language === 'es' ? 'Completo' : 'Complete') : (language === 'es' ? 'Vacío' : 'Empty')}
                    </span>
                  </div>

                  {selectedUser.profile ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <span className="text-[10px] text-slate-400 block uppercase font-mono">{language === 'es' ? 'Nombre Completo' : 'Full Name'}</span>
                          <p className="text-sm font-semibold text-slate-950 truncate">
                            {selectedUser.profile.nombres} {selectedUser.profile.apellidos}
                          </p>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block uppercase font-mono">{t.matricula}</span>
                          <p className="text-sm font-mono font-semibold text-emerald-700">
                            {selectedUser.profile.matricula}
                          </p>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block uppercase font-mono">{t.dni}</span>
                          <p className="text-sm font-mono font-semibold text-slate-800">
                            {selectedUser.profile.dni}
                          </p>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block uppercase font-mono">{t.jurisdiccion}</span>
                          <p className="text-sm font-semibold text-slate-800 truncate" title={selectedUser.profile.jurisdiccion}>
                            {selectedUser.profile.jurisdiccion}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-2 text-xs text-slate-600 pt-2 border-t border-white/70">
                        <Mail size={12} className="text-slate-400 mt-0.5 flex-shrink-0" />
                        <span className="truncate" title={selectedUser.profile.email}>{selectedUser.profile.email}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-[18px] border border-dashed border-white/80 p-4 text-slate-500 text-sm leading-relaxed">
                      {language === 'es'
                        ? 'Este usuario todavía no completó su perfil profesional. Puede actuar sobre su acceso desde aquí.'
                        : 'This user has not completed their professional profile yet. You can still act on access from here.'}
                    </div>
                  )}
                </div>

                <div className="glass-surface-soft rounded-[24px] p-4 space-y-3">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold block">
                    {language === 'es' ? 'Acciones' : 'Actions'}
                  </span>

                  <div className="flex flex-col gap-2">
                    {selectedUser.status === 'pending' && (
                      <>
                        <button
                          onClick={() => rejectUser(selectedUser.username)}
                          className="w-full glass-button-secondary justify-center px-4 py-3 text-[10px] font-sans font-bold uppercase tracking-wider text-red-700 border-red-100 rounded-[18px]"
                        >
                          <X size={12} />
                          {t.rejectBtn}
                        </button>
                        <button
                          onClick={() => approveUser(selectedUser.username)}
                          className="w-full glass-button-primary justify-center px-4 py-3 text-[10px] font-sans font-bold uppercase tracking-wider rounded-[18px]"
                        >
                          <Check size={12} />
                          {t.approveBtn}
                        </button>
                      </>
                    )}

                    {selectedUser.status === 'approved' && (
                      <button
                        onClick={() => rejectUser(selectedUser.username)}
                        className="w-full glass-button-secondary justify-center px-4 py-3 text-[10px] font-sans font-bold uppercase tracking-wider text-red-700 border-red-100 rounded-[18px]"
                      >
                        <UserX size={12} />
                        {t.revokeBtn}
                      </button>
                    )}

                    {selectedUser.status === 'rejected' && (
                      <button
                        onClick={() => approveUser(selectedUser.username)}
                        className="w-full glass-button-primary justify-center px-4 py-3 text-[10px] font-sans font-bold uppercase tracking-wider rounded-[18px]"
                      >
                        <UserCheck size={12} />
                        {t.reapproveBtn}
                      </button>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="h-full min-h-[320px] flex flex-col items-center justify-center text-center space-y-3 text-slate-500">
                <div className="w-12 h-12 rounded-full glass-surface-soft flex items-center justify-center text-slate-400">
                  <ShieldAlert size={22} />
                </div>
                <div className="space-y-1 max-w-sm">
                  <h3 className="text-sm font-bold text-slate-950 uppercase tracking-wider">
                    {language === 'es' ? 'Sin selección' : 'No user selected'}
                  </h3>
                  <p className="text-xs leading-relaxed">
                    {language === 'es'
                      ? 'Seleccione un usuario de la lista para revisar su perfil y ejecutar acciones de gobernanza.'
                      : 'Select a user from the list to review their profile and execute governance actions.'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
