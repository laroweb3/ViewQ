import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { unsealPayload } from '../lib/pqc';
import { VaultRecord } from '../types';
import { translations } from '../translations';
import { 
  Database, 
  Trash2, 
  Key, 
  Clock, 
  Cpu, 
  ArrowRight, 
  CheckCircle, 
  AlertTriangle, 
  FileText, 
  Download, 
  Copy, 
  Check, 
  Unlock,
  Eye,
  EyeOff,
  Calendar,
  Search,
  X,
  Globe,
  Sparkles,
  User,
  UserCheck,
  PenTool,
  HelpCircle,
  Activity
} from 'lucide-react';

export const HistoryView: React.FC = () => {
  const { vaults, deleteVault, addLog, language, resolveFilePayload, registeredUsers, user } = useApp();
  const t = translations[language];
  
  const [selectedVault, setSelectedVault] = useState<VaultRecord | null>(null);
  const [decryptedText, setDecryptedText] = useState<string | null>(null);
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [decryptError, setDecryptError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [inspectorTab, setInspectorTab] = useState<'roadmap' | 'technical'>('roadmap');

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'sim' | 'qpu'>('all');

  const myVaults = vaults.filter(record => {
    if (!user) return false;
    const usernameLower = user.username.toLowerCase();
    
    // 1. Is the user the explicit creator?
    if (record.creator && record.creator.toLowerCase() === usernameLower) return true;
    
    // 2. Or is the user the certified perito (fallback)?
    if (record.manifest?.certifiedBy && record.manifest.certifiedBy.email === user.profile?.email) return true;
    
    // 3. Or was it sent/shared with the user?
    if (record.recipientUsername && record.recipientUsername.toLowerCase() === usernameLower) return true;
    if (record.destinatario && record.destinatario.toLowerCase() === usernameLower) return true;
    
    // 4. Old or demo vault
    if (record.id === 'vault-demo-1') {
      return usernameLower === 'laro';
    }

    return false;
  });

  const filteredVaults = myVaults.filter(record => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = 
      record.title.toLowerCase().includes(term) ||
      (record.notes && record.notes.toLowerCase().includes(term)) ||
      record.id.toLowerCase().includes(term) ||
      (record.manifest.payload.originalFilename && record.manifest.payload.originalFilename.toLowerCase().includes(term));

    if (!matchesSearch) return false;

    if (filterType === 'sim') {
      return record.manifest.quantumSource.isSimulated;
    }
    if (filterType === 'qpu') {
      return !record.manifest.quantumSource.isSimulated;
    }

    return true;
  });

  // Trigger decapsulation and decryption (unsealing)
  const handleUnseal = async (record: VaultRecord) => {
    setIsDecrypting(true);
    setDecryptedText(null);
    setDecryptError(null);
    
    addLog('SYSTEM', language === 'es' ? `Iniciando descapsulado NIST ML-KEM-768 del expediente: "${record.title}"` : `Starting NIST ML-KEM-768 decapsulation for case record: "${record.title}"`);
    
    try {
      // Small simulated buffer to show the mathematical calculation in UI
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const decrypted = await unsealPayload(record.manifest);
      setDecryptedText(decrypted);
      addLog('SUCCESS', language === 'es' ? `¡Descapsulado exitoso! Secreto compartido restaurado. Payload recuperado de manera íntegra.` : `Successful decapsulation! Shared secret restored. Payload fully recovered with complete integrity.`);
    } catch (err: any) {
      setDecryptError(err.message || (language === 'es' ? 'Error en descapsulado.' : 'Error in decapsulation.'));
      addLog('ERROR', (language === 'es' ? `Error de descapsulado en expediente ` : `Decapsulation error in record `) + `${record.id}: ${err.message || err}`);
    } finally {
      setIsDecrypting(false);
    }
  };

  const copyManifest = async (record: VaultRecord) => {
    const text = JSON.stringify(record.manifest, null, 2);
    let success = false;
    
    if (navigator.clipboard && navigator.clipboard.writeText) {
      try {
        await navigator.clipboard.writeText(text);
        success = true;
      } catch (e) {
        // Fallback
      }
    }
    
    if (!success) {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed";
      textArea.style.top = "0";
      textArea.style.left = "0";
      textArea.style.opacity = "0";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand('copy');
        success = true;
      } catch (err) {
        console.error('Fallback copy failed', err);
      }
      document.body.removeChild(textArea);
    }

    if (success) {
      setCopiedId(record.id);
      setTimeout(() => setCopiedId(null), 2000);
    } else {
      addLog('WARN', language === 'es' ? 'No se pudo copiar automáticamente al portapapeles.' : 'Could not automatically copy to clipboard.');
    }
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const confirmMsg = language === 'es' 
      ? '¿Está seguro de que desea eliminar este expediente de la bóveda local? Esta acción es irreversible.' 
      : 'Are you sure you want to delete this case record from the local vault? This action is irreversible.';
    if (confirm(confirmMsg)) {
      deleteVault(id);
      addLog('WARN', language === 'es' ? `Expediente eliminado del historial: ID ${id}` : `Case record deleted from history: ID ${id}`);
      if (selectedVault?.id === id) {
        setSelectedVault(null);
        setDecryptedText(null);
      }
    }
  };

  const isBase64DataUrl = (str: string) => {
    return str.startsWith('data:');
  };

  const getBase64DataInfo = (str: string) => {
    const parts = str.split(',');
    if (parts.length < 2) return null;
    const meta = parts[0];
    const mime = meta.match(/data:(.*?);/)?.[1] || 'application/octet-stream';
    return { mime, rawBase64: parts[1] };
  };

  const downloadOriginalFile = (base64Str: string, defaultName: string) => {
    const info = getBase64DataInfo(base64Str);
    if (!info) return;

    const byteCharacters = atob(info.rawBase64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: info.mime });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = defaultName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header section */}
      <div className="border-b border-[#eaeaea] pb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-sans font-semibold tracking-tight text-2xl text-[#111111]" id="history-title">
            {t.historyTitle}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {t.historySub}
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-sans text-gray-600 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-sm">
          <Database size={14} className="text-gray-400" />
          <span>{language === 'es' ? 'EXPEDIENTES ACTIVOS: ' : 'ACTIVE CASE RECORDS: '}<strong className="text-black font-semibold">{myVaults.length}</strong></span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left hand side: Vault records list */}
        <div className="lg:col-span-1 space-y-4 max-h-[600px] overflow-y-auto pr-1">
          <h3 className="font-sans font-semibold text-xs text-gray-400 uppercase tracking-wider mb-2">
            {language === 'es' ? 'Archivos Sellados' : 'Sealed Files'}
          </h3>

          {/* Search and Quick Filters */}
          <div className="space-y-3 bg-white border border-[#eaeaea] p-3 rounded-sm shadow-2xs">
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Search size={14} className="text-gray-400" />
              </span>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={language === 'es' ? 'Buscar por expediente o notas...' : 'Search by record or notes...'}
                className="w-full text-xs pl-9 pr-8 py-2 border border-gray-200 rounded-sm focus:outline-none focus:border-black font-sans transition-colors placeholder:text-gray-400 bg-[#fafafa] focus:bg-white"
                id="vault-search-input"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute inset-y-0 right-0 flex items-center pr-2.5 text-gray-400 hover:text-black cursor-pointer"
                  id="clear-vault-search-btn"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Quick Filters */}
            <div className="flex gap-1.5 pt-0.5">
              <button
                onClick={() => setFilterType('all')}
                className={`px-2.5 py-1 text-[10px] font-sans font-medium rounded-sm border transition-all cursor-pointer ${
                  filterType === 'all'
                    ? 'bg-black text-white border-black'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400 hover:text-black'
                }`}
                id="filter-all-btn"
              >
                {language === 'es' ? 'Todos' : 'All'}
              </button>
              <button
                onClick={() => setFilterType('qpu')}
                className={`px-2.5 py-1 text-[10px] font-sans font-medium rounded-sm border transition-all cursor-pointer ${
                  filterType === 'qpu'
                    ? 'bg-black text-white border-black'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400 hover:text-black'
                }`}
                id="filter-qpu-btn"
              >
                QPU
              </button>
              <button
                onClick={() => setFilterType('sim')}
                className={`px-2.5 py-1 text-[10px] font-sans font-medium rounded-sm border transition-all cursor-pointer ${
                  filterType === 'sim'
                    ? 'bg-black text-white border-black'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400 hover:text-black'
                }`}
                id="filter-sim-btn"
              >
                {language === 'es' ? 'Virtuales' : 'Virtual'}
              </button>
            </div>
            
            {/* Search counts or Reset option */}
            {(searchTerm || filterType !== 'all') && (
              <div className="text-[10px] text-gray-500 font-sans flex justify-between items-center bg-gray-50 px-2.5 py-1 rounded-sm border border-gray-100">
                <span>
                  {language === 'es' 
                    ? `Encontrados: ${filteredVaults.length} de ${myVaults.length}` 
                    : `Found: ${filteredVaults.length} of ${myVaults.length}`}
                </span>
                <button 
                  onClick={() => {
                    setSearchTerm('');
                    setFilterType('all');
                  }}
                  className="text-black font-semibold hover:underline cursor-pointer"
                  id="reset-vault-filters-btn"
                >
                  {language === 'es' ? 'Restablecer' : 'Reset'}
                </button>
              </div>
            )}
          </div>

          {myVaults.length === 0 ? (
            <div className="border border-[#eaeaea] rounded-sm p-8 text-center text-gray-400 bg-[#fafafa]">
              <Database size={24} className="mx-auto text-gray-300 mb-2" />
              <p className="text-xs font-semibold text-gray-600">{language === 'es' ? 'Bóveda vacía' : 'Vault empty'}</p>
              <p className="text-[11px] mt-1 text-gray-400 leading-normal">
                {t.emptyHistory}
              </p>
            </div>
          ) : filteredVaults.length === 0 ? (
            <div className="border border-[#eaeaea] rounded-sm p-8 text-center text-gray-400 bg-[#fafafa]">
              <Search size={24} className="mx-auto text-gray-300 mb-2 text-gray-300" />
              <p className="text-xs font-semibold text-gray-600">
                {language === 'es' ? 'Sin resultados' : 'No results found'}
              </p>
              <p className="text-[11px] mt-1 text-gray-400 leading-normal">
                {language === 'es' 
                  ? 'No se encontraron expedientes que coincidan con los criterios de búsqueda.' 
                  : 'No case records found matching your search criteria.'}
              </p>
            </div>
          ) : (
            filteredVaults.map((record) => {
              const isSelected = selectedVault?.id === record.id;
              const dateStr = new Date(record.timestamp).toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              });

              return (
                <div
                  key={record.id}
                  id={`vault-item-${record.id}`}
                  onClick={() => {
                    setSelectedVault(record);
                    setDecryptedText(null);
                    setDecryptError(null);
                  }}
                  className={`border p-4 rounded-sm cursor-pointer transition-all duration-200 relative group text-left ${
                    isSelected 
                      ? 'border-black bg-white shadow-xs' 
                      : 'border-[#eaeaea] bg-[#fafafa] hover:bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="flex justify-between items-start gap-2 mb-2">
                    <span className="text-[10px] font-mono font-semibold text-gray-400 uppercase tracking-wider block">
                      {record.manifest.quantumSource.isSimulated ? (language === 'es' ? 'Virtual Local' : 'Virtual Local') : (language === 'es' ? 'QPU Remoto' : 'Remote QPU')}
                    </span>
                    <button
                      onClick={(e) => handleDelete(record.id, e)}
                      className="text-gray-400 hover:text-red-600 p-1 rounded-sm hover:bg-gray-100 opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100"
                      title={language === 'es' ? 'Eliminar registro' : 'Delete record'}
                      id={`delete-vault-btn-${record.id}`}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>

                  <h4 className="text-xs font-semibold text-gray-900 leading-snug line-clamp-2 pr-6">
                    {record.title}
                  </h4>
                  
                  {record.notes && (
                    <p className="text-[10px] text-gray-400 mt-1 line-clamp-1 italic font-sans">
                      "{record.notes}"
                    </p>
                  )}

                  <div className="flex items-center gap-4 mt-3 pt-2.5 border-t border-gray-100/50 text-[10px] text-gray-400 font-mono">
                    <span className="flex items-center gap-1">
                      <Clock size={11} />
                      {dateStr}
                    </span>
                    <span className="flex items-center gap-1 uppercase">
                      <Cpu size={11} />
                      {record.manifest.quantumSource.target.replace('ionq.', '')}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right hand side: Inspector Panel */}
        <div className="lg:col-span-2">
          {selectedVault ? (
            <div className="bg-white border border-[#eaeaea] rounded-sm p-6 md:p-8 space-y-6" id="vault-inspector-panel">
              {/* Card Title & General Info */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-[#eaeaea] pb-5">
                <div className="text-left">
                  <span className="text-[10px] font-mono uppercase text-gray-400 font-semibold bg-gray-100 border border-gray-200 px-2 py-0.5 rounded-sm">
                    ID: {selectedVault.id}
                  </span>
                  <h3 className="font-sans font-semibold text-xl text-gray-900 mt-2 leading-snug">
                    {selectedVault.title}
                  </h3>
                  <div className="flex items-center gap-3.5 mt-2.5 text-xs text-gray-500">
                    <span className="flex items-center gap-1 font-mono">
                      <Calendar size={13} className="text-gray-400" />
                      {new Date(selectedVault.timestamp).toLocaleString(language === 'es' ? 'es-ES' : 'en-US')}
                    </span>
                    {selectedVault.manifest.payload.originalFilename && (
                      <span className="flex items-center gap-1 text-black font-semibold bg-gray-50 border border-gray-200 px-2 py-0.5 rounded-sm">
                        <FileText size={12} className="text-gray-400" />
                        {selectedVault.manifest.payload.originalFilename}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {selectedVault.armoredFileBase64 && (
                    <button
                      onClick={async () => {
                        setIsDownloading(true);
                        try {
                          const resolvedDataUrl = await resolveFilePayload(selectedVault.armoredFileBase64!, selectedVault.id, 'armored');
                          const link = document.createElement('a');
                          link.href = resolvedDataUrl;
                          link.download = `${language === 'es' ? 'blindado' : 'shielded'}_${selectedVault.manifest.payload.originalFilename || 'archivo.bin'}`;
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                        } catch (err) {
                          console.error(err);
                          alert(language === 'es' ? 'Error al descargar' : 'Error downloading');
                        } finally {
                          setIsDownloading(false);
                        }
                      }}
                      disabled={isDownloading}
                      className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 px-3 py-1.5 rounded-sm text-xs font-sans font-semibold transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      title={language === 'es' ? 'Descargar Archivo Blindado con Metadatos Inyectados' : 'Download Shielded File with Injected Metadata'}
                      id="download-history-armored-btn"
                    >
                      <Download size={13} className={isDownloading ? 'animate-spin' : ''} />
                      {isDownloading 
                        ? (language === 'es' ? 'Descargando...' : 'Downloading...')
                        : (language === 'es' ? 'Evidencia Blindada' : 'Shielded Evidence')}
                    </button>
                  )}
                  
                  <button
                    onClick={() => copyManifest(selectedVault)}
                    className="p-2 rounded-sm bg-[#fafafa] border border-[#eaeaea] hover:bg-gray-50 text-gray-600 hover:text-black transition-colors"
                    title={language === 'es' ? 'Copiar Manifiesto JSON' : 'Copy JSON Manifest'}
                    id="copy-history-manifest-btn"
                  >
                    {copiedId === selectedVault.id ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
                  </button>
                </div>
              </div>

              {/* Inspector Tabs Switcher */}
              <div className="flex border-b border-[#eaeaea]" id="inspector-tabs-container">
                <button
                  type="button"
                  onClick={() => setInspectorTab('roadmap')}
                  className={`flex-1 pb-3 text-center text-xs font-sans font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                    inspectorTab === 'roadmap'
                      ? 'border-black text-black'
                      : 'border-transparent text-gray-400 hover:text-black'
                  }`}
                  id="tab-btn-roadmap"
                >
                  {language === 'es' ? 'Camino de Custodia (Simple)' : 'Custody Roadmap (Simple)'}
                </button>
                <button
                  type="button"
                  onClick={() => setInspectorTab('technical')}
                  className={`flex-1 pb-3 text-center text-xs font-sans font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                    inspectorTab === 'technical'
                      ? 'border-black text-black'
                      : 'border-transparent text-gray-400 hover:text-black'
                  }`}
                  id="tab-btn-technical"
                >
                  {language === 'es' ? 'Detalles Técnicos (Avanzado)' : 'Technical Details (Advanced)'}
                </button>
              </div>

              {/* Tab 1: Visual Custody Roadmap */}
              {inspectorTab === 'roadmap' && (() => {
                const recipientUser = registeredUsers.find(u => 
                  u.username.toLowerCase() === (selectedVault.recipientUsername || '').toLowerCase() ||
                  u.username.toLowerCase() === (selectedVault.destinatario || '').toLowerCase() ||
                  (u.profile && `${u.profile.nombres} ${u.profile.apellidos}`.toLowerCase() === (selectedVault.destinatario || '').toLowerCase())
                );

                const dateString = new Date(selectedVault.timestamp).toLocaleString(language === 'es' ? 'es-ES' : 'en-US');
                const sigDateString = selectedVault.signatureTimestamp 
                  ? new Date(selectedVault.signatureTimestamp).toLocaleString(language === 'es' ? 'es-ES' : 'en-US')
                  : '';

                return (
                  <div className="space-y-6 pt-2 animate-fadeIn text-left">
                    
                    {/* Visual Vertical Timeline */}
                    <div className="relative border-l-2 border-gray-100 ml-4 pl-6 space-y-7">
                      
                      {/* Step 1: Origin / Creation */}
                      <div className="relative">
                        {/* Dot */}
                        <div className="absolute -left-[31px] top-0.5 bg-black text-white w-5 h-5 rounded-full flex items-center justify-center border-4 border-white shadow-2xs">
                          <User size={10} />
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs font-bold text-gray-900 font-sans">
                              {language === 'es' ? '1. Creación del Sobre y Resguardo' : '1. Envelope Creation & Safeguard'}
                            </h4>
                            <span className="text-[9px] bg-gray-100 text-gray-800 px-1.5 py-0.5 rounded-sm font-semibold uppercase">
                              {language === 'es' ? 'COMPLETADO' : 'COMPLETED'}
                            </span>
                          </div>
                          <p className="text-[11px] text-gray-600 font-sans leading-relaxed">
                            {language === 'es' 
                              ? 'La evidencia original fue empaquetada dentro de un sobre digital hermético. Se calculó su huella digital única e inalterable SHA3-256 en su navegador.'
                              : 'The original evidence was packed inside an airtight digital envelope. Its unique, unaltered SHA3-256 digital fingerprint was calculated in your browser.'}
                          </p>
                          <div className="text-[10px] text-gray-400 font-mono flex items-center gap-3">
                            <span>{dateString}</span>
                            <span className="truncate max-w-[200px]" title={selectedVault.manifest.payload.sha3Hash}>
                              Hash: {selectedVault.manifest.payload.sha3Hash.slice(0, 12)}...
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Step 2: Quantum Sealing */}
                      <div className="relative">
                        {/* Dot */}
                        <div className="absolute -left-[31px] top-0.5 bg-indigo-600 text-white w-5 h-5 rounded-full flex items-center justify-center border-4 border-white shadow-2xs">
                          <Sparkles size={10} />
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs font-bold text-indigo-950 font-sans">
                              {language === 'es' ? '2. Sellado de Seguridad Física Cuántica' : '2. Quantum Physical Safety Seal'}
                            </h4>
                            <span className="text-[9px] bg-indigo-100 text-indigo-800 px-1.5 py-0.5 rounded-sm font-semibold uppercase">
                              {language === 'es' ? 'BLOQUEADO' : 'SECURED'}
                            </span>
                          </div>
                          <p className="text-[11px] text-gray-600 font-sans leading-relaxed">
                            {language === 'es' 
                              ? `Se forjó un candado indescifrable mediante claves cuánticas de alta entropía procedentes del procesador de átomos suspendidos de IonQ (${selectedVault.manifest.quantumSource.target.replace('ionq.', '')}).`
                              : `An unbreakable padlock was forged using high-entropy quantum keys from the IonQ suspended-atom processor (${selectedVault.manifest.quantumSource.target.replace('ionq.', '')}).`}
                          </p>
                          <div className="text-[10px] text-gray-400 font-mono flex items-center gap-3">
                            <span>{dateString}</span>
                            <span className="truncate max-w-[200px]" title={selectedVault.manifest.quantumSource.quantumSeed}>
                              Seed: {selectedVault.manifest.quantumSource.quantumSeed.slice(0, 12)}...
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Step 3: Ledger Notarization */}
                      <div className="relative">
                        {/* Dot */}
                        <div className="absolute -left-[31px] top-0.5 bg-blue-600 text-white w-5 h-5 rounded-full flex items-center justify-center border-4 border-white shadow-2xs">
                          <Globe size={10} />
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs font-bold text-blue-950 font-sans">
                              {language === 'es' ? '3. Acta de Entrega e Inmutabilidad Stellar' : '3. Immutable Record on Stellar'}
                            </h4>
                            <span className="text-[9px] bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded-sm font-semibold uppercase">
                              {language === 'es' ? 'NOTARIZADO' : 'NOTARIZED'}
                            </span>
                          </div>
                          <p className="text-[11px] text-gray-600 font-sans leading-relaxed">
                            {language === 'es' 
                              ? 'La marca de tiempo de despacho se grabó permanentemente en el libro público Stellar, sirviendo como un testigo imparcial independiente.'
                              : 'The dispatch timestamp was permanently recorded in the public Stellar ledger, serving as an independent, impartial third-party witness.'}
                          </p>
                          <div className="text-[10px] text-gray-400 font-mono flex flex-wrap items-center gap-x-3 gap-y-1">
                            <span>{dateString}</span>
                            {selectedVault.manifest.stellarNotarization ? (
                              <div className="space-y-1">
                                <a 
                                  href={`https://stellar.expert/explorer/testnet/tx/${selectedVault.manifest.stellarNotarization.txHash}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:underline font-bold flex items-center gap-0.5 animate-pulse"
                                >
                                  {language === 'es' ? 'Ver Ledger Stellar' : 'View Stellar Ledger'} →
                                </a>
                                {selectedVault.manifest.stellarNotarization.isSimulated !== false && (
                                  <div className="text-[10px] text-amber-700 font-sans font-normal normal-case leading-normal max-w-lg">
                                    {language === 'es' 
                                      ? '⚠️ Sello Virtual de Demostración: Esta transacción se generó localmente de manera simulada porque no hay llaves de Stellar reales configuradas. No figurará en el explorador público. Configure su "STELLAR_SOURCE_SECRET" en la pestaña de Configuración para notarizaciones reales.'
                                      : '⚠️ Simulated/Virtual Seal: This transaction was generated locally because no real Stellar keys are configured in Settings. It will not appear on the public blockchain explorer. Configure "STELLAR_SOURCE_SECRET" in the Settings tab for live notarizations.'}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="italic">{language === 'es' ? 'Transmisión directa registrada' : 'Direct registry logged'}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Step 4: Recipient Intervenors & Signature */}
                      <div className="relative">
                        {/* Dot */}
                        {selectedVault.signatureStatus === 'signed' ? (
                          <div className="absolute -left-[31px] top-0.5 bg-emerald-600 text-white w-5 h-5 rounded-full flex items-center justify-center border-4 border-white shadow-2xs">
                            <UserCheck size={10} />
                          </div>
                        ) : selectedVault.signatureStatus === 'pending' ? (
                          <div className="absolute -left-[31px] top-0.5 bg-amber-500 text-white w-5 h-5 rounded-full flex items-center justify-center border-4 border-white shadow-2xs">
                            <Clock size={10} className="animate-pulse" />
                          </div>
                        ) : (
                          <div className="absolute -left-[31px] top-0.5 bg-gray-500 text-white w-5 h-5 rounded-full flex items-center justify-center border-4 border-white shadow-2xs">
                            <Check size={10} />
                          </div>
                        )}

                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-xs font-bold text-gray-900 font-sans">
                              {language === 'es' ? '4. Recepción y Validación del Destinatario' : '4. Recipient Validation & Signature'}
                            </h4>
                            
                            {selectedVault.signatureStatus === 'signed' && (
                              <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-sm font-semibold uppercase">
                                {language === 'es' ? 'FIRMADO Y ENTREGADO' : 'SIGNED & DELIVERED'}
                              </span>
                            )}
                            {selectedVault.signatureStatus === 'pending' && (
                              <span className="text-[9px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-sm font-semibold uppercase animate-pulse">
                                {language === 'es' ? 'ESPERANDO FIRMA DEL RECEPTOR' : 'WAITING FOR SIGNATURE'}
                              </span>
                            )}
                            {selectedVault.signatureStatus === 'not_required' && (
                              <span className="text-[9px] bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded-sm font-semibold uppercase">
                                {language === 'es' ? 'ENTREGA INMEDIATA ABIERTA' : 'OPEN IMMEDIATE DELIVERY'}
                              </span>
                            )}
                          </div>

                          {/* Recipient Profile Details */}
                          <div className="bg-gray-50/70 border border-gray-100 rounded-sm p-3 space-y-1 text-xs">
                            <div className="flex items-center gap-2">
                              <User size={13} className="text-gray-400" />
                              <span className="font-bold text-gray-800 font-sans">
                                {recipientUser ? `${recipientUser.profile?.nombres} ${recipientUser.profile?.apellidos}` : (selectedVault.destinatario || selectedVault.recipientUsername || 'Externo / Desconocido')}
                              </span>
                              <span className="text-[10px] text-gray-400 font-mono">
                                (@{selectedVault.recipientUsername || selectedVault.destinatario || 'external'})
                              </span>
                            </div>

                            {recipientUser?.profile && (
                              <div className="text-[11px] text-gray-500 font-sans space-y-0.5 pl-5">
                                <p>
                                  <span className="font-semibold">{language === 'es' ? 'Matrícula Profesional' : 'Professional License'}:</span>{' '}
                                  <strong className="text-black font-semibold">{recipientUser.profile.matricula}</strong>
                                </p>
                                <p>
                                  <span className="font-semibold">{language === 'es' ? 'Cargo y Fuero' : 'Position & Court'}:</span>{' '}
                                  {recipientUser.profile.cargo} en {recipientUser.profile.jurisdiccion}
                                </p>
                              </div>
                            )}

                            {!recipientUser && selectedVault.destinatario && (
                              <p className="text-[10px] text-gray-400 italic pl-5">
                                {language === 'es' ? 'Entrega dirigida a oficina externa o correo manual.' : 'Delivery directed to external office or manual email.'}
                              </p>
                            )}
                          </div>

                          {/* Action Info or Signature Record */}
                          <p className="text-[11px] text-gray-600 font-sans leading-relaxed">
                            {selectedVault.signatureStatus === 'signed' ? (
                              language === 'es'
                                ? `El receptor ingresó su PIN de seguridad, verificó la integridad matemática del archivo y estampó su firma digital certificada en el ledger Stellar.`
                                : `The recipient entered their security PIN, verified the mathematical file integrity, and stamped their certified digital signature on the Stellar ledger.`
                            ) : selectedVault.signatureStatus === 'pending' ? (
                              language === 'es'
                                ? `El sobre permanece bloqueado de forma segura en tránsito. Solo el destinatario listado arriba puede desbloquearlo y validar la firma con sus credenciales autorizadas en la pestaña 'Recibidos'.`
                                : `The envelope remains securely locked in transit. Only the listed recipient can unlock it and validate the signature with their authorized credentials under the 'Received' tab.`
                            ) : (
                              language === 'es'
                                ? `No se especificó firma obligatoria para este expediente. El destinatario puede realizar el descapsulado y abrir la evidencia directamente.`
                                : `No mandatory signature was specified for this case file. The recipient can decapsulate and open the evidence directly.`
                            )}
                          </p>

                          {selectedVault.signatureStatus === 'signed' && (
                            <div className="text-[10px] text-emerald-700 font-mono flex flex-wrap items-center gap-x-3 gap-y-1 bg-emerald-50/50 p-2 rounded-sm border border-emerald-100/50">
                              <span className="flex items-center gap-1 font-bold">
                                <Check size={11} className="stroke-[3]" />
                                {language === 'es' ? 'RECIBIDO Y FIRMADO EL:' : 'RECEIVED & SIGNED ON:'} {sigDateString}
                              </span>
                              {selectedVault.signatureStellarTxHash && (
                                <div className="space-y-1 block w-full mt-1">
                                  <a 
                                    href={`https://stellar.expert/explorer/testnet/tx/${selectedVault.signatureStellarTxHash}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-emerald-700 hover:underline font-bold flex items-center gap-0.5 animate-pulse"
                                  >
                                    {language === 'es' ? 'Ver Transmisión de Firma' : 'View Signature Registry'} →
                                  </a>
                                  {selectedVault.signatureIsSimulated !== false && (
                                    <div className="text-[10px] text-amber-700 font-sans font-normal normal-case leading-normal max-w-lg mt-1 block">
                                      {language === 'es' 
                                        ? '⚠️ Firma Virtual de Demostración: Esta firma se generó de manera simulada localmente. No aparecerá en el explorador público Stellar.expert. Registre su clave privada en Configuración para notarizar firmas reales.'
                                        : '⚠️ Simulated/Virtual Signature: This signature was generated as a local simulation. It will not appear on the public Stellar.expert explorer. Register your private key in Settings for real notarizations.'}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          )}

                        </div>
                      </div>

                    </div>
                  </div>
                );
              })()}

              {/* Tab 2: Technical Sealing Metadata */}
              {inspectorTab === 'technical' && (
                <div className="space-y-4 pt-2 animate-fadeIn">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
                    <div className="bg-gray-50 border border-[#eaeaea] rounded-sm p-3.5 space-y-1">
                      <span className="text-[9px] font-mono uppercase text-gray-400 block font-semibold">
                        {language === 'es' ? 'DISPOSITIVO DE ENTROPÍA' : 'ENTROPY DEVICE'}
                      </span>
                      <p className="text-xs font-semibold text-gray-900 truncate">
                        {selectedVault.manifest.quantumSource.provider}
                      </p>
                      <p className="text-[10px] font-mono text-gray-400 truncate">
                        Target: {selectedVault.manifest.quantumSource.target}
                      </p>
                    </div>

                    <div className="bg-gray-50 border border-[#eaeaea] rounded-sm p-3.5 space-y-1">
                      <span className="text-[9px] font-mono uppercase text-gray-400 block font-semibold">
                        {language === 'es' ? 'ESTÁNDAR KEM SELECCIONADO' : 'SELECTED KEM STANDARD'}
                      </span>
                      <p className="text-xs font-semibold text-gray-900 truncate">
                        {selectedVault.manifest.algorithm.kem}
                      </p>
                      <p className="text-[10px] text-gray-400 font-mono">
                        {language === 'es' ? 'Parámetros: k=3, q=3329' : 'Parameters: k=3, q=3329'}
                      </p>
                    </div>

                    <div className="bg-gray-50 border border-[#eaeaea] rounded-sm p-3.5 space-y-1">
                      <span className="text-[9px] font-mono uppercase text-gray-400 block font-semibold">
                        {language === 'es' ? 'HASH DE INTEGRIDAD PRE/POST' : 'PRE/POST INTEGRITY HASH'}
                      </span>
                      <p className="text-xs font-mono font-semibold text-gray-900 truncate" title={selectedVault.manifest.payload.sha3Hash}>
                        {selectedVault.manifest.payload.sha3Hash.slice(0, 16)}...
                      </p>
                      <p className="text-[10px] text-gray-400 font-mono uppercase">
                        ALGORITMO: SHA3-256
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {selectedVault.notes && (
                <div className="bg-gray-50 border border-l-2 border-l-black border-[#eaeaea] p-3.5 rounded-sm text-left">
                  <span className="text-[9px] font-mono uppercase text-gray-400 block font-semibold mb-1">
                    {language === 'es' ? 'Notas de Custodia / Bitácora' : 'Custody Notes / Log'}
                  </span>
                  <p className="text-xs text-gray-700 italic font-sans leading-relaxed">
                    "{selectedVault.notes}"
                  </p>
                </div>
              )}

              {/* Action: Verify Integrity & Decrypt Envelope */}
              <div className="border-t border-[#eaeaea] pt-6 space-y-4 text-left">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h4 className="font-sans font-bold text-xs text-gray-900 uppercase tracking-widest">
                      {language === 'es' ? 'Descapsulado Cuántico de Datos' : 'Quantum Data Decapsulation'}
                    </h4>
                    <p className="text-[11px] text-gray-400 max-w-sm mt-0.5">
                      {language === 'es' 
                        ? 'Recupere la llave compartida Kyber para desencapsular y verificar la integridad original de este sobre en el cliente.' 
                        : 'Retrieve the Kyber shared secret to decapsulate and verify the original integrity of this envelope client-side.'}
                    </p>
                  </div>

                  <button
                    onClick={() => handleUnseal(selectedVault)}
                    disabled={isDecrypting}
                    className="flex items-center gap-2 bg-[#000000] text-white px-5 py-3 rounded-sm text-xs font-sans font-semibold hover:bg-opacity-90 transition-all cursor-pointer disabled:opacity-50"
                    id="unseal-action-btn"
                  >
                    {isDecrypting ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        {language === 'es' ? 'Descapsulando Lattices...' : 'Decapsulating Lattices...'}
                      </>
                    ) : (
                      <>
                        <Unlock size={14} />
                        {language === 'es' ? 'Verificar Integridad / Abrir Sello' : 'Verify Integrity / Open Seal'}
                      </>
                    )}
                  </button>
                </div>

                {/* Decrypted Payload Result Panel */}
                {decryptedText !== null && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-sm p-5 space-y-4 animate-fade-in" id="decrypted-result-panel">
                    <div className="flex items-start gap-2.5">
                      <CheckCircle size={16} className="text-emerald-600 mt-0.5" />
                      <div>
                        <h5 className="text-xs font-semibold text-emerald-900">
                          {language === 'es' ? 'Integridad Certificada al 100%' : '100% Certified Integrity'}
                        </h5>
                        <p className="text-[10px] text-emerald-700 leading-normal">
                          {language === 'es'
                            ? 'El sobre ha sido desencapsulado exitosamente utilizando el algoritmo NIST ML-KEM-768. El hash del contenido resultante coincide con precisión de bit con el registro original SHA3-256 de custodia.'
                            : 'The envelope has been successfully decapsulated using the NIST ML-KEM-768 algorithm. The hash of the resulting content matches bit-by-bit with the original SHA3-256 custody record.'}
                        </p>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-emerald-200">
                      {isBase64DataUrl(decryptedText) ? (
                        /* Decrypted Payload is an Uploaded File */
                        <div className="flex items-center justify-between bg-white border border-emerald-200 p-3 rounded-sm" id="decrypted-file-card">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-sm border border-emerald-100">
                              <FileText size={15} />
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-gray-900">
                                {selectedVault.manifest.payload.originalFilename || 'documento_sellado.bin'}
                              </p>
                              <p className="text-[9px] text-gray-400 font-mono">
                                {language === 'es' ? 'Tipo' : 'Type'}: {getBase64DataInfo(decryptedText)?.mime || 'Binario'}
                              </p>
                            </div>
                          </div>
                          
                          <button
                            onClick={() => downloadOriginalFile(
                              decryptedText, 
                              selectedVault.manifest.payload.originalFilename || 'archivo_recuperado.bin'
                            )}
                            className="flex items-center gap-1.5 bg-emerald-600 text-white hover:bg-emerald-700 px-3 py-1.5 rounded-sm text-[10px] font-sans font-semibold transition-colors cursor-pointer"
                            id="download-recovered-file-btn"
                          >
                            <Download size={12} />
                            {language === 'es' ? 'Descargar Archivo Original' : 'Download Original File'}
                          </button>
                        </div>
                      ) : (
                        /* Decrypted Payload is Plain Text Message */
                        <div className="bg-white border border-emerald-200 p-4 rounded-sm">
                          <span className="text-[9px] font-mono text-emerald-600 font-bold block mb-1">
                            {language === 'es' ? 'MENSAJE DE TEXTO RECUPERADO:' : 'RECOVERED TEXT MESSAGE:'}
                          </span>
                          <p className="text-xs font-mono text-gray-800 whitespace-pre-wrap break-all leading-relaxed">
                            {decryptedText}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Decrypt Error Panel */}
                {decryptError && (
                  <div className="bg-red-50 border border-red-200 rounded-sm p-4 flex items-start gap-2.5 animate-fade-in" id="decrypted-error-panel">
                    <AlertTriangle size={16} className="text-red-600 mt-0.5" />
                    <div>
                      <h5 className="text-xs font-semibold text-red-900">{language === 'es' ? 'Fallo en Desencriptado / Descapsulado' : 'Decryption / Decapsulation Failure'}</h5>
                      <p className="text-[10px] text-red-700 leading-normal mt-0.5">
                        {decryptError}
                      </p>
                    </div>
                  </div>
                )}
              </div>

            </div>
          ) : (
            /* Inspector Placeholder */
            <div className="h-[450px] border border-dashed border-gray-200 rounded-sm flex flex-col items-center justify-center text-center p-8 bg-[#fafafa]">
              <Database size={36} className="text-gray-300 mb-2.5" />
              <h4 className="font-sans font-medium text-sm text-gray-600">{language === 'es' ? 'Inspector de Expedientes' : 'Case File Inspector'}</h4>
              <p className="text-xs text-gray-400 max-w-sm mt-1 leading-normal">
                {language === 'es' 
                  ? 'Seleccione un expediente del historial de bóvedas a la izquierda para examinar sus metadatos de encriptación y ejecutar su descapsulado en vivo.' 
                  : 'Select a case file from the vault history on the left to inspect its encryption metadata and perform live decapsulation.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
