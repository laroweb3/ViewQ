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
  X
} from 'lucide-react';

export const HistoryView: React.FC = () => {
  const { vaults, deleteVault, addLog, language, resolveFilePayload } = useApp();
  const t = translations[language];
  
  const [selectedVault, setSelectedVault] = useState<VaultRecord | null>(null);
  const [decryptedText, setDecryptedText] = useState<string | null>(null);
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [decryptError, setDecryptError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'sim' | 'qpu'>('all');

  const filteredVaults = vaults.filter(record => {
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
          <span>{language === 'es' ? 'EXPEDIENTES ACTIVOS: ' : 'ACTIVE CASE RECORDS: '}<strong className="text-black font-semibold">{vaults.length}</strong></span>
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
                {language === 'es' ? 'Simulados' : 'Simulated'}
              </button>
            </div>
            
            {/* Search counts or Reset option */}
            {(searchTerm || filterType !== 'all') && (
              <div className="text-[10px] text-gray-500 font-sans flex justify-between items-center bg-gray-50 px-2.5 py-1 rounded-sm border border-gray-100">
                <span>
                  {language === 'es' 
                    ? `Encontrados: ${filteredVaults.length} de ${vaults.length}` 
                    : `Found: ${filteredVaults.length} of ${vaults.length}`}
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

          {vaults.length === 0 ? (
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
                      {record.manifest.quantumSource.isSimulated ? (language === 'es' ? 'Local Sim' : 'Local Sim') : (language === 'es' ? 'QPU Remoto' : 'Remote QPU')}
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

              {/* Technical Sealing Metadata */}
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
