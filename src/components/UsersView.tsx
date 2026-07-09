import React, { useState } from 'react';
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
      createDemoBtn: 'Simular Registro Pendiente',
      demoSuccess: 'Se ha simulado el registro de un perito forense en estado pendiente.',
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

  return (
    <div className="space-y-6" id="users-view-root">
      
      {/* Disclaimer Alert */}
      <div className="bg-emerald-50 border border-emerald-150 p-4 rounded-sm flex items-start gap-3 text-emerald-950 text-xs">
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#eaeaea] pb-6">
        <div>
          <h1 className="font-sans font-bold text-2xl text-gray-900 tracking-tight flex items-center gap-2">
            <Users size={22} className="text-gray-900" />
            {t.title}
          </h1>
          <p className="text-xs text-gray-500 font-sans mt-1 max-w-2xl leading-relaxed">
            {t.subtitle}
          </p>
        </div>

        {/* Simulate sign-up button for quick testing */}
        <button
          onClick={handleCreateMockUser}
          className="self-start md:self-center bg-black hover:bg-zinc-800 text-white text-[11px] font-mono px-4 py-2.5 rounded-sm cursor-pointer transition-all flex items-center gap-1.5 font-semibold shadow-xs"
          title="Simulate user registration"
        >
          <PlusCircle size={14} />
          {t.createDemoBtn}
        </button>
      </div>

      {/* Statistics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4" id="users-stats-grid">
        <div className="bg-[#fafafa] border border-[#eaeaea] p-4 rounded-sm">
          <span className="text-[10px] font-mono text-gray-400 block uppercase font-bold tracking-wider">
            {t.statsTotal}
          </span>
          <span className="text-2xl font-mono font-bold text-gray-900">{stats.total}</span>
        </div>
        
        <div className="bg-[#fafafa] border border-[#eaeaea] p-4 rounded-sm border-l-2 border-l-amber-500">
          <span className="text-[10px] font-mono text-amber-600 block uppercase font-bold tracking-wider flex items-center gap-1">
            <Clock size={11} /> {t.statsPending}
          </span>
          <span className="text-2xl font-mono font-bold text-amber-700">{stats.pending}</span>
        </div>

        <div className="bg-[#fafafa] border border-[#eaeaea] p-4 rounded-sm border-l-2 border-l-emerald-600">
          <span className="text-[10px] font-mono text-emerald-600 block uppercase font-bold tracking-wider flex items-center gap-1">
            <Check size={11} /> {t.statsApproved}
          </span>
          <span className="text-2xl font-mono font-bold text-emerald-700">{stats.approved}</span>
        </div>

        <div className="bg-[#fafafa] border border-[#eaeaea] p-4 rounded-sm border-l-2 border-l-red-600">
          <span className="text-[10px] font-mono text-red-600 block uppercase font-bold tracking-wider flex items-center gap-1">
            <X size={11} /> {t.statsRejected}
          </span>
          <span className="text-2xl font-mono font-bold text-red-700">{stats.rejected}</span>
        </div>
      </div>

      {/* Filters & Search Block */}
      <div className="flex flex-col sm:flex-row gap-3 bg-white border border-[#eaeaea] p-3 rounded-sm">
        {/* Search Input */}
        <div className="relative flex-1 flex items-center">
          <Search className="absolute left-3 text-gray-400" size={14} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t.searchPlaceholder}
            className="w-full text-xs font-sans pl-9 pr-4 py-2 border border-[#eaeaea] rounded-sm bg-[#fafafa] text-[#111111] focus:outline-none focus:border-black focus:bg-white transition-all"
          />
        </div>

        {/* Tab Filters */}
        <div className="flex bg-gray-100 p-0.5 rounded-sm border border-[#eaeaea] self-start sm:self-auto">
          {(['all', 'pending', 'approved', 'rejected'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-1.5 text-[10px] font-sans font-bold uppercase rounded-xs transition-all cursor-pointer ${
                filterStatus === status 
                  ? 'bg-white text-black shadow-xs' 
                  : 'text-gray-400 hover:text-gray-600'
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
        <div className="bg-white border border-[#eaeaea] rounded-sm py-16 px-6 text-center max-w-xl mx-auto">
          <div className="w-12 h-12 bg-gray-50 border border-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
            <Users size={20} />
          </div>
          <h3 className="font-sans font-bold text-sm text-gray-900 uppercase tracking-wider">
            {stats.total === 0 ? t.noUsersGeneral : t.noUsers}
          </h3>
          <p className="text-xs text-gray-400 font-sans mt-2 leading-relaxed">
            {stats.total === 0 ? t.noUsersDesc : ''}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6" id="users-review-grid">
          {filteredUsers.map((item) => {
            const hasProfile = !!item.profile;
            return (
              <div 
                key={item.username} 
                className={`bg-white border rounded-sm p-6 flex flex-col justify-between transition-all relative ${
                  item.status === 'pending' ? 'border-amber-200 ring-2 ring-amber-500/5' : 
                  item.status === 'approved' ? 'border-emerald-200' : 'border-red-200 opacity-80'
                }`}
              >
                
                {/* Header info card */}
                <div>
                  <div className="flex items-start justify-between gap-2 mb-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-mono font-bold text-xs text-black uppercase tracking-wide truncate">
                          {item.username}
                        </span>
                        
                        {/* Status badges */}
                        {item.status === 'pending' && (
                          <span className="bg-amber-50 text-amber-700 border border-amber-100 px-2 py-0.5 rounded-sm text-[8px] font-mono uppercase tracking-wide font-bold">
                            {t.pending.toUpperCase()}
                          </span>
                        )}
                        {item.status === 'approved' && (
                          <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 rounded-sm text-[8px] font-mono uppercase tracking-wide font-bold">
                            {t.approved.toUpperCase()}
                          </span>
                        )}
                        {item.status === 'rejected' && (
                          <span className="bg-red-50 text-red-700 border border-red-100 px-2 py-0.5 rounded-sm text-[8px] font-mono uppercase tracking-wide font-bold">
                            {t.rejected.toUpperCase()}
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-3 text-[9px] text-gray-400 font-mono mt-1 flex-wrap">
                        <span>{t.authType} <strong className="text-gray-700 uppercase">{item.authType}</strong></span>
                        <span>|</span>
                        <span>{t.registeredAt} <strong className="text-gray-700">{new Date(item.registeredAt).toLocaleDateString()}</strong></span>
                      </div>
                    </div>
                  </div>

                  {/* Professional profile details if present */}
                  {hasProfile ? (
                    <div className="bg-[#fafafa] border border-[#eaeaea] p-4 rounded-sm text-xs space-y-3 mb-4">
                      <span className="text-[9px] font-mono text-gray-400 uppercase tracking-wider font-bold block pb-1 border-b border-gray-200/60">
                        {t.detailsTitle}
                      </span>
                      
                      <div className="grid grid-cols-2 gap-3 font-sans">
                        <div>
                          <span className="text-[10px] text-gray-400 block">{language === 'es' ? 'Nombre Completo' : 'Full Name'}</span>
                          <span className="font-bold text-gray-900 text-xs">
                            {item.profile?.nombres} {item.profile?.apellidos}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-gray-400 block">{t.matricula}</span>
                          <span className="font-mono text-emerald-700 font-semibold text-[11px] bg-emerald-50 border border-emerald-100 px-1 py-0.5 rounded-xs inline-block">
                            {item.profile?.matricula}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-gray-400 block">{t.dni}</span>
                          <span className="font-mono font-bold text-gray-800 text-xs">
                            {item.profile?.dni}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-gray-400 block">{t.jurisdiccion}</span>
                          <span className="font-sans font-bold text-gray-800 text-xs truncate max-w-[150px] block" title={item.profile?.jurisdiccion}>
                            {item.profile?.jurisdiccion}
                          </span>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-gray-200/40 text-[10px] text-gray-500 font-mono truncate" title={item.profile?.email}>
                        <Mail size={10} className="inline mr-1 text-gray-400" />
                        {item.profile?.email}
                      </div>
                    </div>
                  ) : (
                    <div className="border border-dashed border-gray-200 p-4 rounded-sm text-center py-6 text-gray-400 text-xs mb-4">
                      {language === 'es' 
                        ? 'Perfil profesional no rellenado todavía (esperando aprobación inicial)' 
                        : 'Professional profile not filled yet (awaiting initial approval)'}
                    </div>
                  )}
                </div>

                {/* Operations & actions block */}
                <div className="pt-4 border-t border-[#eaeaea] flex items-center justify-end gap-2">
                  {item.status === 'pending' && (
                    <>
                      <button
                        onClick={() => rejectUser(item.username)}
                        className="px-3 py-1.5 border border-red-200 text-red-600 hover:bg-red-50 text-[10px] font-sans font-bold uppercase tracking-wider rounded-sm cursor-pointer transition-colors flex items-center gap-1"
                      >
                        <X size={12} />
                        {t.rejectBtn}
                      </button>
                      
                      <button
                        onClick={() => approveUser(item.username)}
                        className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-sans font-bold uppercase tracking-wider rounded-sm cursor-pointer transition-colors flex items-center gap-1 shadow-xs"
                      >
                        <Check size={12} />
                        {t.approveBtn}
                      </button>
                    </>
                  )}

                  {item.status === 'approved' && (
                    <button
                      onClick={() => rejectUser(item.username)}
                      className="px-3 py-1.5 border border-red-100 text-red-600 hover:bg-red-50 text-[10px] font-sans font-bold uppercase tracking-wider rounded-sm cursor-pointer transition-colors flex items-center gap-1"
                    >
                      <UserX size={12} />
                      {t.revokeBtn}
                    </button>
                  )}

                  {item.status === 'rejected' && (
                    <button
                      onClick={() => approveUser(item.username)}
                      className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-[10px] font-sans font-bold uppercase tracking-wider rounded-sm cursor-pointer transition-colors flex items-center gap-1"
                    >
                      <UserCheck size={12} />
                      {t.reapproveBtn}
                    </button>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
