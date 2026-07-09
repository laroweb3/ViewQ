import React, { useState, useRef } from 'react';
import { useQuantum } from '../hooks/useQuantum';
import { useApp } from '../context/AppContext';
import { translations } from '../translations';
import { ProcessEventFeed } from './ProcessEventFeed';
import { decodeEncryptedPayload } from '../lib/pqc';
import { 
  Upload, 
  FileText, 
  X, 
  Copy, 
  Check, 
  Download, 
  Lock,
  Eye,
  User,
  ArrowRight,
  FileCheck2,
  FileSpreadsheet,
  AlertCircle,
  Clock,
  Share2,
  Link2,
  Send,
  HelpCircle,
  Info,
  ShieldCheck
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { isRunning, executePipeline, manifestResult } = useQuantum();
  const { settings, logs, addLog, vaults, language, addEphemeralShare, setActiveTab, registeredUsers, resolveFilePayload, notifications } = useApp();
  const t = translations[language];
  
  const [destinatario, setDestinatario] = useState('');
  const [selectedRecipientUsername, setSelectedRecipientUsername] = useState<string>('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [notes, setNotes] = useState('');
  const [payloadText, setPayloadText] = useState('');
  const [selectedFile, setSelectedFile] = useState<{ name: string; size: number; type: string; content: string | Uint8Array } | null>(null);
  const [showTextArea, setShowTextArea] = useState(false);
  const [requiresSignature, setRequiresSignature] = useState(false);
  
  const [copied, setCopied] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [showJson, setShowJson] = useState(false);
  const [isDownloadingArmored, setIsDownloadingArmored] = useState(false);
  const [isDownloadingViewQ, setIsDownloadingViewQ] = useState(false);

  const encryptedPayloadSize = manifestResult ? decodeEncryptedPayload(manifestResult.payload.encryptedData).length : 0;

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle manual file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  // Convert uploaded file to text or raw bytes
  const processFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target && event.target.result) {
        const fileContent = typeof event.target.result === 'string'
          ? event.target.result
          : new Uint8Array(event.target.result as ArrayBuffer);
        setSelectedFile({
          name: file.name,
          size: file.size,
          type: file.type,
          content: fileContent
        });
        
        addLog('SYSTEM', `Archivo cargado para sellado: ${file.name} (${(file.size / 1024).toFixed(2)} KB)`);
      }
    };

    if (file.type.startsWith('text/') || file.name.endsWith('.json') || file.name.endsWith('.txt') || file.name.endsWith('.md') || file.name.endsWith('.csv')) {
      reader.readAsText(file);
    } else {
      reader.readAsArrayBuffer(file);
    }
  };

  // Handle drag and drop events
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Trigger quantum pipeline execution
  const handleSealExecute = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!destinatario.trim()) {
      alert('Por favor, introduzca el destinatario autorizado.');
      return;
    }

    const finalPayload = selectedFile ? selectedFile.content : payloadText;
    const finalFilename = selectedFile ? selectedFile.name : undefined;
    const finalMimeType = selectedFile?.type || 'text/plain';

    if ((typeof finalPayload === 'string' && !finalPayload.trim()) || (finalPayload instanceof Uint8Array && finalPayload.length === 0)) {
      alert('Por favor, cargue un archivo de evidencia o escriba un texto confidencial.');
      return;
    }

    // Build title and notes in a clear judicial format
    const finalTitle = `Para: ${destinatario} | ${selectedFile ? selectedFile.name : 'Mensaje Directo'}`;
    const finalNotes = notes.trim() || `Evidencia sellada bajo protección poscuántica enviada a: ${destinatario}.`;

    // Try to resolve a recipientUsername if it is not selected or matches typed name
    let recipientUser = selectedRecipientUsername;
    if (!recipientUser) {
      const match = registeredUsers.find(
        u => u.status === 'approved' && (
          u.username.toLowerCase() === destinatario.trim().toLowerCase() ||
          (u.profile && `${u.profile.nombres} ${u.profile.apellidos}`.toLowerCase() === destinatario.trim().toLowerCase())
        )
      );
      if (match) {
        recipientUser = match.username;
      }
    }

    await executePipeline(
      finalPayload,
      finalTitle,
      finalFilename,
      finalNotes,
      finalMimeType,
      destinatario,
      recipientUser || undefined,
      requiresSignature
    );
    setRequiresSignature(false);
  };

  // Copy manifest to clipboard with sandbox safety fallback
  const copyManifestToClipboard = async () => {
    if (!manifestResult) return;
    const text = JSON.stringify(manifestResult, null, 2);
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
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Download manifest as .json file
  const downloadManifestFile = () => {
    if (!manifestResult) return;
    const blob = new Blob([JSON.stringify(manifestResult, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `acta_sello_cuantico_${manifestResult.quantumSource.jobId.substring(0, 8)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Download armored file with embedded metadata
  const downloadArmoredFile = async () => {
    const currentVault = vaults.find(v => v.manifest.payload.sha3Hash === manifestResult?.payload.sha3Hash);
    if (!currentVault) {
      alert(language === 'es' 
        ? 'Sincronizando con la base de datos... Por favor, espere un segundo e intente de nuevo.' 
        : 'Syncing with database... Please wait a second and try again.');
      return;
    }
    const base64DataUrl = currentVault.armoredFileBase64;
    if (!base64DataUrl) {
      alert(language === 'es' 
        ? 'Archivo blindado no disponible en los metadatos de esta bóveda.' 
        : 'Shielded file not available in this vault\'s metadata.');
      return;
    }

    setIsDownloadingArmored(true);
    try {
      const resolvedDataUrl = await resolveFilePayload(base64DataUrl, currentVault.id, 'armored');
      const filename = currentVault.manifest.payload.originalFilename || 'evidencia_blindada.txt';
      const link = document.createElement('a');
      link.href = resolvedDataUrl;
      link.download = `blindado_${filename}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      addLog('SUCCESS', `Evidencia blindada descargada localmente: blindado_${filename}`);
    } catch (err) {
      console.error(err);
      alert(language === 'es' ? 'Error al descargar el archivo' : 'Error downloading file');
    } finally {
      setIsDownloadingArmored(false);
    }
  };

  // Download encrypted .viewQ file
  const downloadViewQFile = async () => {
    const currentVault = vaults.find(v => v.manifest.payload.sha3Hash === manifestResult?.payload.sha3Hash);
    if (!currentVault) {
      alert(language === 'es' 
        ? 'Sincronizando con la base de datos... Por favor, espere un segundo e intente de nuevo.' 
        : 'Syncing with database... Please wait a second and try again.');
      return;
    }
    const base64DataUrl = currentVault.viewQFileBase64;
    if (!base64DataUrl) {
      alert(language === 'es' 
        ? 'Archivo .viewQ no disponible en los metadatos de esta bóveda.' 
        : 'Encrypted .viewQ file not available in this vault\'s metadata.');
      return;
    }

    setIsDownloadingViewQ(true);
    try {
      const resolvedDataUrl = await resolveFilePayload(base64DataUrl, currentVault.id, 'viewq');
      const originalName = currentVault.manifest.payload.originalFilename || 'evidencia.txt';
      const baseName = originalName.includes('.') 
        ? originalName.substring(0, originalName.lastIndexOf('.'))
        : originalName;
        
      const filename = `${baseName}.viewQ`;
      const link = document.createElement('a');
      link.href = resolvedDataUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      addLog('SUCCESS', `Archivo de evidencia encriptado .viewQ descargado: ${filename}`);
    } catch (err) {
      console.error(err);
      alert(language === 'es' ? 'Error al descargar el archivo' : 'Error downloading file');
    } finally {
      setIsDownloadingViewQ(false);
    }
  };

  // Calculate timeline states based on real-time execution logs
  const getStepStatuses = () => {
    const hasLog = (text: string) => logs.some(l => l.message.toLowerCase().includes(text.toLowerCase()));
    
    let step1 = 'pending'; // Integrity check
    let step2 = 'pending'; // QRNG key physical seal
    let step3 = 'pending'; // Kyber-768 privacy shield
    let step4 = 'pending'; // Stellar ledger notarization
    let stepFinal = 'pending'; // Final certificate

    if (isRunning) {
      step1 = 'running';
      
      if (hasLog('Calculando hash') || hasLog('SHA3-256 Hash del Mensaje') || hasLog('circuito cuántico') || hasLog('Simulador Cuántico') || hasLog('Coprocesador Cuántico') || hasLog('Hadamard')) {
        step1 = 'success';
        step2 = 'running';
      }
      
      if (hasLog('Semilla cuántica') || hasLog('Iniciando Capa de Encriptación') || hasLog('ML-KEM-768') || hasLog('Kyber')) {
        step1 = 'success';
        step2 = 'success';
        step3 = 'running';
      }
      
      if (hasLog('cifrado simétrico completado') || hasLog('Sello criptográfico') || hasLog('Iniciando Fase 4') || hasLog('Notarización')) {
        step1 = 'success';
        step2 = 'success';
        step3 = 'success';
        step4 = 'running';
      }

      if (hasLog('Sello inmutable grabado') || hasLog('Transmisión consolidada') || hasLog('Ledger consolidado')) {
        step1 = 'success';
        step2 = 'success';
        step3 = 'success';
        step4 = 'success';
        stepFinal = 'success';
      }
    } else if (manifestResult) {
      step1 = 'success';
      step2 = 'success';
      step3 = 'success';
      step4 = 'success';
      stepFinal = 'success';
    }

    return { step1, step2, step3, step4, stepFinal };
  };

  const steps = getStepStatuses();
  const processFeedItems = [
    {
      id: 'fingerprint',
      title: language === 'es' ? 'Huella de Seguridad' : 'Security Fingerprint',
      description: language === 'es'
        ? 'Calculando la huella SHA3-256 del archivo para fijar su identidad exacta antes de sellarlo.'
        : 'Calculating the SHA3-256 fingerprint to lock the file identity before sealing.',
      stage: 'Stage 01',
      color: '#dbeafe',
      status: steps.step1 as 'pending' | 'running' | 'success',
      glyph: '🧬',
    },
    {
      id: 'entropy',
      title: language === 'es' ? 'Entropía Cuántica' : 'Quantum Entropy',
      description: language === 'es'
        ? 'Inyectando aleatoriedad física de IonQ para fabricar el candado de custodia.'
        : 'Injecting IonQ physical randomness to fabricate the custody lock.',
      stage: 'Stage 02',
      color: '#ede9fe',
      status: steps.step2 as 'pending' | 'running' | 'success',
      glyph: '⚛️',
    },
    {
      id: 'shielding',
      title: language === 'es' ? 'Blindaje del Sobre' : 'Envelope Shielding',
      description: language === 'es'
        ? 'Empaquetando la evidencia dentro de un contenedor ML-KEM para tránsito sellado.'
        : 'Packing the evidence inside an ML-KEM container for sealed transit.',
      stage: 'Stage 03',
      color: '#dcfce7',
      status: steps.step3 as 'pending' | 'running' | 'success',
      glyph: '🔐',
    },
    {
      id: 'notary',
      title: language === 'es' ? 'Notaría Stellar' : 'Stellar Notary',
      description: language === 'es'
        ? 'Registrando el despacho como evento inmutable y verificable en el ledger.'
        : 'Registering the dispatch as an immutable, verifiable ledger event.',
      stage: 'Stage 04',
      color: '#fee2e2',
      status: steps.step4 as 'pending' | 'running' | 'success',
      glyph: '📜',
    },
    {
      id: 'delivery',
      title: language === 'es' ? 'Estampa consolidada' : 'Stamp consolidated',
      description: language === 'es'
        ? 'El contenedor queda listo para remisión, auditoría y firma de acuse del destinatario.'
        : 'The container is ready for dispatch, audit, and recipient receipt signature.',
      stage: 'Final',
      color: '#fef3c7',
      status: steps.stepFinal as 'pending' | 'running' | 'success',
      glyph: '✅',
    },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Main Grid: Clean Judicial Form on Left | Judicial Audit Timeline on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Form (Destinatario, Evidencia, Botón) */}
        <div className="lg:col-span-6 flex flex-col gap-6">
          <div className="glass-surface rounded-[28px] p-6 space-y-5">
            
            <div className="flex items-center gap-2 pb-3 border-b border-white/70">
              <Lock size={15} className="text-slate-950" />
              <h2 className="font-sans font-bold text-xs text-slate-950 uppercase tracking-wider">
                Secure Custody Channel
              </h2>
            </div>

            <form onSubmit={handleSealExecute} className="space-y-5">
              
              {/* Field 1: Destinatario */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wide mb-1.5">
                  1. Authorized Channel
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                  <input
                    type="text"
                    required
                    value={destinatario}
                    onChange={(e) => {
                      const val = e.target.value;
                      setDestinatario(val);
                      const match = registeredUsers.find(u => u.status === 'approved' && u.username.toLowerCase() === val.trim().toLowerCase());
                      if (match) {
                        setSelectedRecipientUsername(match.username);
                      } else {
                        setSelectedRecipientUsername('');
                      }
                    }}
                    onFocus={() => setShowSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                    placeholder={language === 'es' ? 'Ej. Fiscalía de Instrucción N° 4 o correo electrónico' : 'e.g. Prosecutor Office No. 4 or email'}
                    className="glass-input w-full text-xs font-sans pl-9 pr-3 py-2.5"
                    disabled={isRunning}
                    id="destinatario-input"
                    autoComplete="off"
                  />
                  
                  {/* Suggestions Dropdown */}
                  {showSuggestions && (destinatario.trim() ? registeredUsers.filter(u => {
                    if (u.status !== 'approved') return false;
                    const query = destinatario.toLowerCase();
                    const usernameMatch = u.username.toLowerCase().includes(query);
                    const nameMatch = u.profile ? `${u.profile.nombres} ${u.profile.apellidos}`.toLowerCase().includes(query) : false;
                    const emailMatch = u.profile?.email ? u.profile.email.toLowerCase().includes(query) : false;
                    return usernameMatch || nameMatch || emailMatch;
                  }) : []).length > 0 && (
                    <div className="absolute left-0 right-0 z-50 mt-1 max-h-48 overflow-y-auto hide-scrollbar glass-surface rounded-[20px] divide-y divide-white/60">
                      {(destinatario.trim() ? registeredUsers.filter(u => {
                        if (u.status !== 'approved') return false;
                        const query = destinatario.toLowerCase();
                        const usernameMatch = u.username.toLowerCase().includes(query);
                        const nameMatch = u.profile ? `${u.profile.nombres} ${u.profile.apellidos}`.toLowerCase().includes(query) : false;
                        const emailMatch = u.profile?.email ? u.profile.email.toLowerCase().includes(query) : false;
                        return usernameMatch || nameMatch || emailMatch;
                      }) : []).map((u) => {
                        const displayName = u.profile ? `${u.profile.nombres} ${u.profile.apellidos}` : u.username;
                        const roleAndJurisdiction = u.profile ? `${u.profile.matricula} - ${u.profile.jurisdiccion}` : '';
                        return (
                          <button
                            key={u.username}
                            type="button"
                            className="w-full text-left px-3 py-2 hover:bg-white/70 flex flex-col transition-colors cursor-pointer"
                            onClick={() => {
                              setDestinatario(displayName);
                              setSelectedRecipientUsername(u.username);
                              setShowSuggestions(false);
                            }}
                          >
                            <span className="text-xs font-bold text-slate-950 font-sans">
                              {displayName} ({u.username})
                            </span>
                            {u.profile && (
                              <span className="text-[10px] text-gray-400 font-sans">
                                {u.profile.email} {roleAndJurisdiction ? `| ${roleAndJurisdiction}` : ''}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 mt-1 leading-normal">
                  Define the authorized channel that can open and validate this envelope. Only that account will be able to decrypt the evidence and sign the receipt.
                </p>

                {/* Visual Recipient Verification Confirmation Badge */}
                {(() => {
                  const matchedUser = registeredUsers.find(u => u.username.toLowerCase() === selectedRecipientUsername.toLowerCase() || u.username.toLowerCase() === destinatario.trim().toLowerCase());
                  if (matchedUser) {
                    const fullName = matchedUser.profile ? `${matchedUser.profile.nombres} ${matchedUser.profile.apellidos}` : matchedUser.username;
                    const matricula = matchedUser.profile?.matricula || '';
                    const jurisdiccion = matchedUser.profile?.jurisdiccion || '';
                    const cargo = matchedUser.profile?.cargo || '';
                    return (
                      <div className="mt-2 p-2.5 glass-surface-soft rounded-[20px] flex items-start gap-2.5 text-left">
                        <div className="p-1 bg-emerald-500 text-white rounded-full mt-0.5">
                          <Check size={10} className="stroke-[3]" />
                        </div>
                        <div className="space-y-0.5">
                          <p className="text-xs font-bold text-emerald-900 font-sans flex items-center gap-1.5 flex-wrap">
                            {language === 'es' ? 'Canal Verificado y Autorizado' : 'Verified & Authorized Channel'}
                            <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-full font-mono font-semibold">
                              {matchedUser.username}
                            </span>
                          </p>
                          <p className="text-[11px] text-emerald-800 font-sans">
                            <span className="font-semibold">{fullName}</span>
                            {matricula && ` | M.P.: ${matricula}`}
                          </p>
                          {(cargo || jurisdiccion) && (
                            <p className="text-[10px] text-emerald-700/80 font-sans">
                              {cargo} {jurisdiccion ? `(${jurisdiccion})` : ''}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  }
                  return null;
                })()}

                {/* Checkbox: Requiere Firma */}
                <div className="mt-3 flex items-start gap-2.5 glass-surface-soft p-3 rounded-[20px]" id="requires-signature-wrapper">
                  <input
                    type="checkbox"
                    id="requires-signature-checkbox"
                    checked={requiresSignature}
                    onChange={(e) => setRequiresSignature(e.target.checked)}
                    className="w-4 h-4 accent-slate-950 cursor-pointer rounded-sm mt-0.5"
                    disabled={isRunning}
                  />
                  <div className="flex flex-col text-left">
                    <label htmlFor="requires-signature-checkbox" className="text-[11px] font-sans text-slate-800 cursor-pointer font-bold select-none leading-tight">
                      Send with mandatory receipt confirmation
                    </label>
                    <span className="text-[10px] text-slate-500 mt-0.5 leading-normal">
                      The recipient will validate access with a PIN or passkey. Receipt is logged as an immutable fingerprint on Stellar.
                    </span>
                  </div>
                </div>
              </div>

              {/* Field 2: Documento / Evidencia (Recuadro Gris Sutil) */}
              <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wide mb-1.5">
                  2. Document or Evidence Payload
                </label>
                
                {!selectedFile && !showTextArea ? (
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border border-dashed rounded-[24px] p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 glass-surface-soft ${
                      isDragOver 
                        ? 'border-slate-950' 
                        : 'border-white/70 hover:border-slate-300'
                    }`}
                    id="drag-drop-area"
                  >
                    <Upload size={20} className="text-gray-400 mb-2" />
                    <p className="text-xs font-sans text-slate-700">
                      Drag and drop your file here, or click to browse
                    </p>
                    <p className="text-[10px] text-slate-400 mt-1">
                      Supported Formats: PDF, Images, Text (Max. 10MB)
                    </p>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      className="hidden"
                      disabled={isRunning}
                      id="file-selector-input"
                    />
                  </div>
                ) : selectedFile ? (
                  <div className="flex items-center justify-between p-3.5 glass-surface-soft rounded-[22px]" id="selected-file-card">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="p-2 bg-white/80 rounded-2xl border border-white/70 text-slate-950 flex-shrink-0">
                        <FileText size={16} />
                      </div>
                      <div className="overflow-hidden">
                        <p className="text-xs font-semibold text-slate-950 truncate">{selectedFile.name}</p>
                        <p className="text-[10px] text-slate-400 font-mono">
                          {(selectedFile.size / 1024).toFixed(1)} KB • {selectedFile.type || 'Binario'}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={removeFile}
                      className="p-1.5 rounded-2xl hover:bg-white text-slate-400 hover:text-slate-600 transition-colors"
                      disabled={isRunning}
                      id="remove-file-btn"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <textarea
                      value={payloadText}
                      onChange={(e) => setPayloadText(e.target.value)}
                      placeholder={language === 'es' ? 'Redacte o pegue aquí el testimonio judicial o registro sensible que desea proteger...' : 'Draft or paste here the judicial testimony or sensitive record you wish to protect...'}
                      rows={4}
                      className="glass-input w-full text-xs font-mono p-3 resize-none rounded-[20px]"
                      disabled={isRunning}
                    />
                    <button
                      type="button"
                      onClick={() => { setShowTextArea(false); setPayloadText(''); }}
                      className="text-[10px] text-slate-500 hover:text-slate-950 font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <X size={11} /> {language === 'es' ? 'Cancelar redacción de texto' : 'Cancel text drafting'}
                    </button>
                  </div>
                )}

                {!selectedFile && !showTextArea && (
                  <div className="mt-2 text-right">
                    <button
                      type="button"
                      onClick={() => setShowTextArea(true)}
                      className="text-[10px] text-slate-500 hover:text-slate-950 font-bold tracking-wide uppercase cursor-pointer"
                    >
                      + Draft plain text statement
                    </button>
                  </div>
                )}

                <div className="mt-2.5 p-2 glass-surface-soft rounded-[18px] flex items-start gap-2 text-[10px] text-blue-800 font-sans">
                  <Info size={13} className="text-blue-500 mt-0.5 flex-shrink-0" />
                  <p className="leading-normal">
                    Automatic Protection: Your file is securely encoded on your computer before sending. It travels fully sealed and no one on the internet can read it.
                  </p>
                </div>
              </div>

              {/* Optional notes */}
              <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wide mb-1.5">
                  Custody Notes / Description
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={language === 'es' ? 'Ej. Bajo custodia estricta. Causa Penal Nro 4220' : 'e.g., Under strict custody. Criminal Case No. 4220'}
                  className="glass-input w-full text-xs font-sans px-3 py-2"
                  disabled={isRunning}
                  id="notes-input"
                />
              </div>

              {/* Field 3: Botón Principal (Negro Sólido y Elegante) */}
              <button
                type="submit"
                disabled={isRunning || (!selectedFile && !payloadText.trim()) || !destinatario.trim()}
                className="glass-button-primary w-full py-3.5 text-xs font-bold uppercase tracking-widest disabled:opacity-40 disabled:pointer-events-none"
                id="seal-execute-btn"
              >
                {isRunning ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>{language === 'es' ? 'Procesando en QPU...' : 'Processing in QPU...'}</span>
                  </>
                ) : (
                  <>
                    <Lock size={13} />
                    <span>Start Quantum Sealing</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Visual Timeline (Replacing old tech Console) */}
        <div className="lg:col-span-6">
          <div className="glass-surface rounded-[28px] p-6 h-full flex flex-col justify-between">
            
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-[#fafafa] mb-5">
                <span className="text-[10px] font-mono uppercase text-slate-500 font-bold">
                  Custody Chain / Audit
                </span>
                {isRunning && (
                  <span className="text-[9px] font-mono bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 rounded-sm animate-pulse">
                    {language === 'es' ? 'Midiendo Qubits...' : 'Measuring Qubits...'}
                  </span>
                )}
              </div>

              {!isRunning && !manifestResult ? (
                /* Welcome / Ready State */
                <div className="py-8 text-center space-y-4">
                  <div className="w-12 h-12 bg-indigo-50/80 border border-indigo-100 text-indigo-600 flex items-center justify-center rounded-2xl mx-auto shadow-[0_16px_35px_-24px_rgba(99,102,241,0.5)]">
                    <FileCheck2 size={24} />
                  </div>
                  <div className="max-w-sm mx-auto space-y-2">
                    <h3 className="font-sans font-bold text-xs text-slate-950 uppercase tracking-wider">
                      Custody engine ready
                    </h3>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      On start, the system packs the report into an encrypted container, applies high-entropy randomness, and records the receipt on Stellar.
                    </p>
                  </div>
                </div>
              ) : (
                /* Interactive Timeline */
                <div className="space-y-5">
                  <ProcessEventFeed items={processFeedItems} />

                  <div className="rounded-[22px] border border-white/70 bg-white/70 p-4">
                    <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-slate-500 block mb-3">
                      {language === 'es' ? 'Narrativa operativa' : 'Operational narrative'}
                    </span>

                    <div className="space-y-4">
                  
                  {/* Step 1 */}
                  <div className="flex items-start gap-3.5">
                    <div className="mt-0.5 flex-shrink-0">
                      {steps.step1 === 'pending' && <div className="w-4 h-4 rounded-full border-2 border-gray-200" />}
                      {steps.step1 === 'running' && (
                        <div className="w-4 h-4 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
                      )}
                      {steps.step1 === 'success' && (
                        <span className="w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center text-white text-[9px] font-bold">✓</span>
                      )}
                    </div>
                    <div>
                      <p className={`text-xs font-bold leading-none ${steps.step1 === 'running' ? 'text-black' : steps.step1 === 'success' ? 'text-gray-900' : 'text-gray-400'}`}>
                        {language === 'es' ? 'Paso 1: Huella de Seguridad (SHA3-256)' : 'Step 1: Security Fingerprint (SHA3-256)'}
                      </p>
                      <p className="text-[11px] text-gray-500 mt-1 leading-normal font-sans">
                        {language === 'es' 
                          ? 'Calculando el código de identidad único del archivo. Si alguien cambia una sola coma, este código cambiará, alertándonos de inmediato.' 
                          : 'Calculating the unique file identity code. If anyone alters a single comma, this code will change, instantly alerting us.'}
                      </p>
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className="flex items-start gap-3.5">
                    <div className="mt-0.5 flex-shrink-0">
                      {steps.step2 === 'pending' && <div className="w-4 h-4 rounded-full border-2 border-gray-200" />}
                      {steps.step2 === 'running' && (
                        <div className="w-4 h-4 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
                      )}
                      {steps.step2 === 'success' && (
                        <span className="w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center text-white text-[9px] font-bold">✓</span>
                      )}
                    </div>
                    <div>
                      <p className={`text-xs font-bold leading-none ${steps.step2 === 'running' ? 'text-black' : steps.step2 === 'success' ? 'text-gray-900' : 'text-gray-400'}`}>
                        {language === 'es' ? 'Paso 2: Generación de Candado Cuántico' : 'Step 2: Quantum Key Fabrication'}
                      </p>
                      <p className="text-[11px] text-gray-500 mt-1 leading-normal font-sans">
                        {language === 'es' 
                          ? 'Usando un chip cuántico IonQ de átomos suspendidos para crear una llave secreta física 100% indescifrable ante supercomputadoras.' 
                          : 'Using an IonQ quantum chip of suspended atoms to fabricate a 100% physically random key, uncrackable by supercomputers.'}
                      </p>
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div className="flex items-start gap-3.5">
                    <div className="mt-0.5 flex-shrink-0">
                      {steps.step3 === 'pending' && <div className="w-4 h-4 rounded-full border-2 border-gray-200" />}
                      {steps.step3 === 'running' && (
                        <div className="w-4 h-4 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
                      )}
                      {steps.step3 === 'success' && (
                        <span className="w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center text-white text-[9px] font-bold">✓</span>
                      )}
                    </div>
                    <div>
                      <p className={`text-xs font-bold leading-none ${steps.step3 === 'running' ? 'text-black' : steps.step3 === 'success' ? 'text-gray-900' : 'text-gray-400'}`}>
                        {language === 'es' ? 'Paso 3: Blindaje del Sobre Digital' : 'Step 3: Shielding the Digital Envelope'}
                      </p>
                      <p className="text-[11px] text-gray-500 mt-1 leading-normal font-sans">
                        {language === 'es' 
                          ? 'Guardando su archivo dentro de un bloque encriptado de grado militar (estándar NIST ML-KEM) que solo el destinatario podrá abrir.' 
                          : 'Sealing your file inside a military-grade encrypted envelope (NIST ML-KEM standard) that only your recipient can unlock.'}
                      </p>
                    </div>
                  </div>

                  {/* Step 4 */}
                  <div className="flex items-start gap-3.5">
                    <div className="mt-0.5 flex-shrink-0">
                      {steps.step4 === 'pending' && <div className="w-4 h-4 rounded-full border-2 border-gray-200" />}
                      {steps.step4 === 'running' && (
                        <div className="w-4 h-4 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
                      )}
                      {steps.step4 === 'success' && (
                        <span className="w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center text-white text-[9px] font-bold">✓</span>
                      )}
                    </div>
                    <div>
                      <p className={`text-xs font-bold leading-none ${steps.step4 === 'running' ? 'text-black' : steps.step4 === 'success' ? 'text-gray-900' : 'text-gray-400'}`}>
                        {language === 'es' ? 'Paso 4: Notarización en Libro de Actas' : 'Step 4: Notarization in Digital Ledger'}
                      </p>
                      <p className="text-[11px] text-gray-500 mt-1 leading-normal font-sans">
                        {language === 'es' 
                          ? 'Anclando el registro de envío de forma permanente e imborrable en el gran libro de actas digital público Stellar.' 
                          : 'Anchoring the dispatch record permanently and unerasably in the public Stellar digital notary book.'}
                      </p>
                    </div>
                  </div>

                  {/* Final Step */}
                  {steps.stepFinal === 'success' && (
                    <div className="pt-4 border-t border-[#fafafa] flex items-start gap-3.5 animate-fadeIn">
                      <div className="flex-shrink-0">
                        <span className="w-5 h-5 bg-[#111111] rounded-full flex items-center justify-center text-white text-[10px] font-bold">✓</span>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-900 leading-none">
                          {language === 'es' ? '¡Envío y Notarización Completados!' : 'Dispatch & Notarization Complete!'}
                        </p>
                        <p className="text-[11px] text-emerald-600 font-semibold mt-1 font-sans">
                          {language === 'es' 
                            ? 'El sobre de evidencia fue cerrado correctamente, registrado en Stellar y ya está listo para el receptor.' 
                            : 'The evidence envelope was successfully sealed, registered in Stellar, and is now ready for the recipient.'}
                        </p>
                      </div>
                    </div>
                  )}

                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-[#fafafa] text-left">
              <span className="text-[9px] font-mono tracking-widest text-[#999999] font-semibold uppercase block">
                INTEGRATED SECURITY TECHNOLOGY
              </span>
              <p className="text-[10px] text-gray-400 leading-normal mt-0.5 font-sans">
                NIST-validated algorithms (ML-KEM FIPS 203) and distributed Stellar notarization.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Manifest Display Area (When completed) */}
      {manifestResult && (
        <div className="bg-white border border-[#eaeaea] rounded-sm p-6 space-y-6 animate-fadeIn" id="manifest-result-panel">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#eaeaea] pb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-sm bg-[#fafafa] border border-[#eaeaea] text-black flex items-center justify-center">
                <ShieldCheck size={20} />
              </div>
              <div>
                <h3 className="font-sans font-bold tracking-tight text-sm text-[#111111] uppercase">
                  {language === 'es' ? '¡Sello Cuántico Consolidado!' : 'Quantum Seal Consolidated!'}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  {language === 'es' 
                    ? 'El expediente ha sido sellado usando NIST ML-KEM-768 y entropía física IonQ.' 
                    : 'The case record has been sealed using NIST ML-KEM-768 and physical IonQ entropy.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setShowJson(!showJson)}
                className="flex items-center gap-1.5 bg-white border border-[#eaeaea] text-gray-700 hover:text-black px-3 py-2 rounded-sm text-xs font-sans font-semibold transition-colors cursor-pointer"
                id="toggle-json-view-btn"
              >
                <Eye size={13} />
                {showJson 
                  ? (language === 'es' ? 'Ver Resumen Visual' : 'View Visual Summary') 
                  : (language === 'es' ? 'Ver Manifiesto JSON' : 'View JSON Manifest')}
              </button>
              
              <button
                onClick={copyManifestToClipboard}
                className="flex items-center gap-1.5 bg-white border border-[#eaeaea] text-gray-700 hover:text-black px-3 py-2 rounded-sm text-xs font-sans font-semibold transition-colors cursor-pointer"
                id="copy-json-btn"
              >
                {copied ? <Check size={13} className="text-green-600" /> : <Copy size={13} />}
                {copied 
                  ? (language === 'es' ? 'Copiado' : 'Copied') 
                  : (language === 'es' ? 'Copiar JSON' : 'Copy JSON')}
              </button>

              {manifestResult && (
                <button
                  onClick={downloadViewQFile}
                  disabled={isDownloadingViewQ}
                  className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-2 rounded-sm text-xs font-sans font-semibold transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  id="download-viewq-btn"
                >
                  <Lock size={13} className={isDownloadingViewQ ? 'animate-spin' : ''} />
                  {isDownloadingViewQ
                    ? (language === 'es' ? 'Descargando...' : 'Downloading...')
                    : (language === 'es' ? 'Descargar Evidencia .viewQ' : 'Download .viewQ Evidence')}
                </button>
              )}

              {manifestResult && (
                <button
                  onClick={downloadArmoredFile}
                  disabled={isDownloadingArmored}
                  className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-sm text-xs font-sans font-semibold transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  id="download-armored-btn"
                >
                  <FileCheck2 size={13} className={isDownloadingArmored ? 'animate-spin' : ''} />
                  {isDownloadingArmored 
                    ? (language === 'es' ? 'Descargando...' : 'Downloading...')
                    : (language === 'es' ? 'Descargar Evidencia Blindada' : 'Download Armored Evidence')}
                </button>
              )}
            </div>
          </div>

          {showJson ? (
            /* JSON View in elegant white/gray */
            <div className="bg-[#fafafa] border border-[#eaeaea] rounded-sm p-5 overflow-hidden">
              <div className="flex items-center justify-between pb-3 border-b border-[#eaeaea] mb-4">
                <span className="text-[10px] font-mono text-gray-400">ACTA_SCHEMAS_V1.0_AUTHENTIC_SEAL</span>
                <span className="text-[10px] font-mono bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 rounded-sm">
                  {language === 'es' ? 'ACTA DE CUSTODIA INTEGRAL' : 'INTEGRAL CUSTODY RECORD'}
                </span>
              </div>
              <pre className="text-[11px] font-mono text-gray-800 overflow-x-auto hide-scrollbar max-h-[380px] leading-relaxed select-all">
                {JSON.stringify(manifestResult, null, 2)}
              </pre>
            </div>
          ) : (
            /* Visual Breakdown Summary Cards */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4" id="visual-breakdown-grid">
              
              {/* Card 1: Quantum Entropy Source */}
              <div className="bg-[#fafafa] border border-[#eaeaea] p-4 rounded-sm flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-mono uppercase text-gray-400 font-bold block mb-2">
                    01. {language === 'es' ? 'ENTROPÍA QRNG' : 'QRNG ENTROPY'}
                  </span>
                  <div className="flex items-center gap-1.5 mb-2">
                    <span className={`w-1.5 h-1.5 rounded-full ${manifestResult.quantumSource.isSimulated ? 'bg-amber-400' : 'bg-emerald-500'}`} />
                    <p className="text-xs font-bold text-[#111111] leading-tight">
                      {manifestResult.quantumSource.isSimulated 
                        ? (language === 'es' ? 'QPU Virtual (Local)' : 'Virtual QPU (Local)') 
                        : (language === 'es' ? 'QPU Física IonQ' : 'Physical IonQ QPU')}
                    </p>
                  </div>
                  <p className="text-[10px] font-mono text-gray-500 break-all bg-white p-2 rounded-sm border border-[#eaeaea] max-h-16 overflow-y-auto hide-scrollbar">
                    Seed: {manifestResult.quantumSource.quantumSeed}
                  </p>
                </div>
                <div className="text-[9px] text-gray-400 font-mono mt-4 pt-2 border-t border-gray-100">
                  JOB: {manifestResult.quantumSource.jobId.slice(0, 16)}...
                </div>
              </div>

              {/* Card 2: NIST ML-KEM-768 */}
              <div className="bg-[#fafafa] border border-[#eaeaea] p-4 rounded-sm flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-mono uppercase text-gray-400 font-bold block mb-2">
                    02. {language === 'es' ? 'METADATOS KEM' : 'KEM METADATA'}
                  </span>
                  <p className="text-xs font-bold text-[#111111] mb-1 leading-tight">
                    {manifestResult.algorithm.kem}
                  </p>
                  <p className="text-[10px] text-gray-500 mb-2 leading-snug">
                    {language === 'es' 
                      ? 'Reticulado algebraico mod q=3329, dimensión k=3.' 
                      : 'Algebraic lattice mod q=3329, dimension k=3.'}
                  </p>
                  <div className="space-y-1">
                    <div className="flex justify-between text-[9px] font-mono text-gray-400 bg-white px-1.5 py-0.5 rounded-sm border border-gray-100">
                      <span>{language === 'es' ? 'Dimensión (k):' : 'Dimension (k):'}</span>
                      <span className="text-black font-semibold">3</span>
                    </div>
                  </div>
                </div>
                <div className="text-[9px] text-gray-400 font-mono mt-3 pt-2 border-t border-gray-100">
                  EK: {manifestResult.cryptographicKeys.encapsulationKeyEk.length} Bytes
                </div>
              </div>

              {/* Card 3: Encapsulated Ciphertext */}
              <div className="bg-[#fafafa] border border-[#eaeaea] p-4 rounded-sm flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-mono uppercase text-gray-400 font-bold block mb-2">
                    03. CIPHERTEXT (CT)
                  </span>
                  <p className="text-xs font-bold text-[#111111] mb-1 leading-tight">
                    {language === 'es' ? 'Secreto Compartido (ss)' : 'Shared Secret (ss)'}
                  </p>
                  <p className="text-[10px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-100 p-1.5 rounded-sm break-all select-all font-semibold leading-normal mb-2">
                    {manifestResult.cryptographicKeys.sharedSecretSs.slice(0, 32)}...
                  </p>
                </div>
                <div className="text-[9px] text-gray-400 font-mono mt-3 pt-2 border-t border-gray-100">
                  CT: {manifestResult.cryptographicKeys.ciphertextCt.slice(13, 29)}...
                </div>
              </div>

              {/* Card 4: Symmetric Sealed Envelope */}
              <div className="bg-[#fafafa] border border-[#eaeaea] p-4 rounded-sm flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-mono uppercase text-gray-400 font-bold block mb-2">
                    04. {language === 'es' ? 'CIFRADO SIMÉTRICO' : 'SYMMETRIC ENCRYPTION'}
                  </span>
                  <p className="text-xs font-bold text-[#111111] mb-1 leading-tight">
                    {manifestResult.algorithm.symmetric}
                  </p>
                  <p className="text-[10px] text-gray-500 leading-snug mb-2">
                    {language === 'es' 
                      ? 'Cifrado simétrico autenticado con integridad total (AEAD).' 
                      : 'Authenticated symmetric encryption with total integrity (AEAD).'}
                  </p>
                  <div className="space-y-1">
                    <div className="flex justify-between text-[9px] font-mono text-gray-400 bg-white px-1.5 py-0.5 rounded-sm border border-gray-100">
                      <span>Hash SHA3:</span>
                      <span className="text-black font-semibold">{manifestResult.payload.sha3Hash.slice(0, 8)}...</span>
                    </div>
                  </div>
                </div>
                <div className="text-[9px] text-gray-400 font-mono mt-3 pt-2 border-t border-gray-100">
                  DATA: {encryptedPayloadSize} Bytes
                </div>
              </div>

              {/* Card 5: Stellar Ledger Notarization */}
              <div className="bg-[#fafafa] border border-[#eaeaea] p-4 rounded-sm flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-mono uppercase text-gray-400 font-bold block mb-2">
                    05. {language === 'es' ? 'NOTARIZACIÓN STELLAR' : 'STELLAR NOTARIZATION'}
                  </span>
                  {manifestResult.stellarNotarization ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <p className="text-xs font-bold text-black uppercase">
                          {language === 'es' ? 'Registrado Ok' : 'Registered Ok'}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-[8px] font-mono text-gray-400 bg-white px-1.5 py-0.5 rounded-sm border border-gray-100">
                          <span>Ledger:</span>
                          <span className="text-black font-semibold">#{manifestResult.stellarNotarization.ledger}</span>
                        </div>
                        <div className="flex justify-between text-[8px] font-mono text-gray-400 bg-white px-1.5 py-0.5 rounded-sm border border-gray-100">
                          <span>{language === 'es' ? 'Red:' : 'Network:'}</span>
                          <span className="text-black font-semibold uppercase">{manifestResult.stellarNotarization.network}</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400 font-sans italic">
                      {language === 'es' ? 'Pendiente de anclaje.' : 'Pending anchor.'}
                    </p>
                  )}
                </div>
                <div className="text-[8px] text-gray-400 font-mono mt-3 pt-2 border-t border-gray-100 flex items-center justify-between" title={manifestResult.stellarNotarization?.txHash}>
                  <span className="truncate mr-1 select-all">TX: {manifestResult.stellarNotarization?.txHash.slice(0, 10)}...</span>
                  {manifestResult.stellarNotarization && (
                    <a
                      href={`https://stellar.expert/explorer/${manifestResult.stellarNotarization.network === 'public' ? 'public' : 'testnet'}/tx/${manifestResult.stellarNotarization.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline font-semibold font-sans text-[8px] whitespace-nowrap animate-pulse"
                    >
                      {t.viewInExplorer} →
                    </a>
                  )}
                </div>
                {manifestResult.stellarNotarization?.isSimulated !== false && (
                  <div className="text-[9px] text-amber-700 bg-amber-50/50 p-1.5 rounded-sm border border-amber-100/30 font-sans leading-normal mt-2 text-left">
                    {language === 'es' 
                      ? '⚠️ Sello de Demostración: Registro virtual local. No figurará en el explorador de Stellar real.'
                      : '⚠️ Demo Seal: Virtual local registration. It will not appear in the live Stellar explorer.'}
                  </div>
                )}
              </div>

              {/* Card 6: Certified Forensic Expert / Perito */}
              {manifestResult.certifiedBy && (
                <div className="bg-[#fafafa] border border-l-2 border-l-emerald-600 border-[#eaeaea] p-4 rounded-sm flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-mono uppercase text-emerald-800 font-bold block mb-2">
                      06. {language === 'es' ? 'FIRMANTE CERTIFICADO' : 'CERTIFIED SIGNER'}
                    </span>
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-gray-950 truncate" title={`${manifestResult.certifiedBy.nombres} ${manifestResult.certifiedBy.apellidos}`}>
                        {manifestResult.certifiedBy.nombres} {manifestResult.certifiedBy.apellidos}
                      </p>
                      <p className="text-[9px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded-sm inline-block font-semibold">
                        {manifestResult.certifiedBy.matricula}
                      </p>
                      <div className="flex justify-between text-[8px] font-mono text-gray-400 bg-white px-1.5 py-0.5 rounded-sm border border-gray-100 mt-1">
                        <span>DNI:</span>
                        <span className="text-black font-semibold">{manifestResult.certifiedBy.dni}</span>
                      </div>
                      <div className="flex justify-between text-[8px] font-mono text-gray-400 bg-white px-1.5 py-0.5 rounded-sm border border-gray-100">
                        <span>Jurisdicción:</span>
                        <span className="text-black font-semibold truncate max-w-[100px]" title={manifestResult.certifiedBy.jurisdiccion}>{manifestResult.certifiedBy.jurisdiccion}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-[8px] text-gray-400 font-mono mt-3 pt-2 border-t border-gray-100 truncate" title={manifestResult.certifiedBy.email}>
                    {manifestResult.certifiedBy.email}
                  </div>
                </div>
              )}

            </div>
          )}

          {/* Delivery Instructions Panel */}
          <div className="mt-6 pt-6 border-t border-[#eaeaea]" id="delivery-channels-panel">
            <div className="flex items-center gap-2 mb-4">
              <HelpCircle size={16} className="text-black" />
              <h4 className="font-sans font-bold text-xs text-gray-900 uppercase tracking-wider">
                {language === 'es' ? '¿Cómo recibe la evidencia el destinatario?' : 'How does the recipient receive the evidence?'}
              </h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Channel A: Download & Manual send */}
              <div className="bg-[#fafafa] border border-[#eaeaea] rounded-sm p-5 space-y-4 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="p-1 rounded-sm bg-gray-200/50 text-gray-700">
                      <Download size={13} />
                    </span>
                    <span className="font-sans font-bold text-[11px] text-[#111111] uppercase tracking-wide">
                      {language === 'es' ? 'Vía A: Descarga y Entrega Manual' : 'Path A: Download & Manual Delivery'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed font-sans">
                    {language === 'es' 
                      ? 'Descargue el archivo de evidencia encriptado .viewQ o el archivo de evidencia blindada. Puede enviarlo por cualquier canal seguro estándar (correo institucional, pendrive, o sistema pericial). El destinatario podrá subir el archivo en la pestaña "Verificador Forense" de su sistema para descifrarlo con su llave y auditar la cadena de custodia.' 
                      : 'Download the encrypted .viewQ file or armored evidence file. Send it via any standard secure channel (institutional email, secure drive, or forensic folders). The recipient can upload it to the "Forensic Verification" tab to decrypt with their key and audit the chain of custody.'}
                  </p>
                </div>
                
                <div className="pt-2 flex flex-col sm:flex-row gap-2">
                  {manifestResult && (
                    <button
                      onClick={downloadViewQFile}
                      disabled={isDownloadingViewQ}
                      className="flex-1 py-2 bg-indigo-50 text-indigo-800 hover:bg-indigo-100 border border-indigo-200 text-[11px] font-sans font-semibold uppercase tracking-wider transition-all rounded-sm cursor-pointer text-center disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isDownloadingViewQ
                        ? (language === 'es' ? 'Descargando...' : 'Downloading...')
                        : (language === 'es' ? 'Descargar .viewQ' : 'Download .viewQ')}
                    </button>
                  )}
                  {manifestResult && (
                    <button
                      onClick={downloadArmoredFile}
                      disabled={isDownloadingArmored}
                      className="flex-1 py-2 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 text-[11px] font-sans font-semibold uppercase tracking-wider transition-all rounded-sm cursor-pointer text-center disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isDownloadingArmored 
                        ? (language === 'es' ? 'Descargando...' : 'Downloading...')
                        : (language === 'es' ? 'Descargar Blindado' : 'Download Armored')}
                    </button>
                  )}
                </div>
              </div>

              {/* Channel B: Instant Ephemeral Share */}
              <div className="bg-[#fafafa] border border-[#eaeaea] rounded-sm p-5 space-y-4 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="p-1 rounded-sm bg-black text-white">
                      <Share2 size={13} />
                    </span>
                    <span className="font-sans font-bold text-[11px] text-[#111111] uppercase tracking-wide">
                      {language === 'es' ? 'Vía B: Compartir Enlace Efímero al Instante' : 'Path B: Instant Ephemeral Link Share'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed font-sans">
                    {language === 'es' 
                      ? 'Genere un enlace de acceso único "Burn-after-Reading". Los datos se encriptan de forma local y se autodestruirán automáticamente tras la primera visualización del destinatario. Además, se registrará una captura forense inmutable de identidad y geolocalización en Stellar de quién abrió el enlace.' 
                      : 'Generate a one-time "Burn-after-Reading" access link. Your files are encrypted locally and will automatically self-destruct upon the recipient\'s first opening. In addition, an immutable forensic fingerprint of access metadata will be notarized on Stellar.'}
                  </p>
                </div>
                
                <button
                  onClick={() => {
                    if (!manifestResult) return;
                    const filename = manifestResult.payload.originalFilename || 'evidencia_sellada.txt';
                    const encryptedData = manifestResult.payload.encryptedData;
                    const token = manifestResult.quantumSource.quantumSeed.substring(0, 16) || Math.random().toString(36).substring(2, 10);
                    const iv = manifestResult.payload.iv;
                    const aesKeyHex = manifestResult.cryptographicKeys.sharedSecretSs;

                    const newShare = {
                      token,
                      filename,
                      encryptedData,
                      iv,
                      aesKeyHex,
                      createdAt: new Date().toISOString(),
                      consumed: false
                    };

                    addEphemeralShare(newShare);
                    addLog('SUCCESS', `Enlace efímero generado con éxito desde el Sello Cuántico. Redirigiendo a Enlaces Compartidos...`);
                    setActiveTab('shares');
                  }}
                  className="w-full py-2 bg-black hover:bg-[#222222] text-white text-[11px] font-sans font-bold uppercase tracking-wider transition-all rounded-sm cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Send size={11} />
                  <span>{language === 'es' ? 'Generar Enlace Compartido' : 'Generate Shared Link'}</span>
                </button>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
};
