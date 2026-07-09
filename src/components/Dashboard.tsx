import React, { useState, useRef } from 'react';
import { useQuantum } from '../hooks/useQuantum';
import { useApp } from '../context/AppContext';
import { translations } from '../translations';
import { 
  ShieldCheck, 
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
  ChevronDown,
  ChevronUp,
  Info,
  Sparkles,
  BookOpen
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { isRunning, executePipeline, manifestResult } = useQuantum();
  const { settings, logs, addLog, vaults, language, addEphemeralShare, setActiveTab, registeredUsers, resolveFilePayload } = useApp();
  const t = translations[language];
  
  const [destinatario, setDestinatario] = useState('');
  const [selectedRecipientUsername, setSelectedRecipientUsername] = useState<string>('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [notes, setNotes] = useState('');
  const [payloadText, setPayloadText] = useState('');
  const [selectedFile, setSelectedFile] = useState<{ name: string; size: number; type: string; content: string } | null>(null);
  const [showTextArea, setShowTextArea] = useState(false);
  const [requiresSignature, setRequiresSignature] = useState(false);
  
  const [copied, setCopied] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [showJson, setShowJson] = useState(false);
  const [isDownloadingArmored, setIsDownloadingArmored] = useState(false);
  const [isDownloadingViewQ, setIsDownloadingViewQ] = useState(false);
  const [showDidacticGuide, setShowDidacticGuide] = useState(true);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle manual file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  // Convert uploaded file to base64 or text
  const processFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target && event.target.result) {
        const fileContent = event.target.result as string;
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
      reader.readAsDataURL(file);
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

    if (!finalPayload.trim()) {
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

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#eaeaea] pb-5">
        <div>
          <h1 className="font-sans font-semibold tracking-tight text-2xl text-[#111111]" id="dashboard-title">
            {t.sealingTitle}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {t.sealingSub}
          </p>
        </div>
        <div className="flex items-center gap-2 text-[11px] font-mono bg-gray-50 text-gray-600 px-3 py-1.5 rounded-sm border border-[#eaeaea]">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse inline-block" />
          <span>{language === 'es' ? 'NODO SEGURO ACTIVO' : 'ACTIVE SECURE NODE'}: <strong className="text-black font-semibold uppercase">{settings.target}</strong></span>
        </div>
      </div>

      {/* Interactive Didactic Guide (Collapsible, Plain-Language Explanation) */}
      <div className="bg-gradient-to-r from-blue-50/70 to-indigo-50/70 border border-indigo-100/80 rounded-sm p-5 shadow-xs transition-all duration-300">
        <div className="flex items-center justify-between cursor-pointer select-none" onClick={() => setShowDidacticGuide(!showDidacticGuide)}>
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-indigo-600 text-white rounded-sm flex items-center justify-center">
              <BookOpen size={15} />
            </div>
            <div>
              <h2 className="font-sans font-bold text-xs uppercase tracking-wider text-indigo-950 flex items-center gap-1.5">
                {language === 'es' ? 'Guía Didáctica de Custodia' : 'Forensic Custody Guide'}
                <span className="text-[10px] bg-indigo-200/80 text-indigo-850 px-2 py-0.5 rounded-full lowercase font-mono font-normal">
                  {language === 'es' ? 'explicación sencilla sin tecnicismos' : 'simple explanation without jargon'}
                </span>
              </h2>
              <p className="text-[11px] text-indigo-700 font-sans mt-0.5">
                {language === 'es' 
                  ? 'Entienda cómo protegemos su evidencia en 4 simples analogías del mundo real.' 
                  : 'Understand how we protect your evidence in 4 simple real-world analogies.'}
              </p>
            </div>
          </div>
          <button type="button" className="p-1 text-indigo-600 hover:text-indigo-900 transition-colors cursor-pointer">
            {showDidacticGuide ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>

        {showDidacticGuide && (
          <div className="mt-4 pt-4 border-t border-indigo-100/50 grid grid-cols-1 md:grid-cols-4 gap-4 text-left animate-fadeIn">
            
            {/* Step 1: El Sobre Digital */}
            <div className="space-y-1 bg-white/85 p-3.5 rounded-sm border border-indigo-100/30 shadow-2xs">
              <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-950 font-sans">
                <span className="w-4 h-4 bg-indigo-100 text-indigo-800 rounded-full flex items-center justify-center text-[10px] font-mono">1</span>
                <span>{language === 'es' ? 'El Sobre Seguro' : 'The Safe Envelope'}</span>
              </div>
              <p className="text-[11px] text-gray-600 leading-normal">
                {language === 'es' 
                  ? 'Ciframos su archivo para meterlo en un "sobre digital" inviolable. Solo el destinatario que usted elija posee la clave exacta para poder abrirlo.' 
                  : 'We encrypt your file, placing it in an unbreakable "digital envelope". Only your chosen recipient holds the key required to open it.'}
              </p>
            </div>

            {/* Step 2: El Candado Cuántico */}
            <div className="space-y-1 bg-white/85 p-3.5 rounded-sm border border-indigo-100/30 shadow-2xs">
              <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-950 font-sans">
                <span className="w-4 h-4 bg-indigo-100 text-indigo-800 rounded-full flex items-center justify-center text-[10px] font-mono">2</span>
                <span>{language === 'es' ? 'Candado Cuántico' : 'Quantum Lock'}</span>
              </div>
              <p className="text-[11px] text-gray-600 leading-normal">
                {language === 'es' 
                  ? 'Cerramos el sobre usando un chip cuántico físico real de IonQ. Funciona como un candado con infinitas combinaciones generadas por átomos, indescifrable.' 
                  : 'We lock the envelope using a real physical IonQ quantum chip. It works like a padlock with infinite atom-generated combinations, uncrackable.'}
              </p>
            </div>

            {/* Step 3: El Libro Notarial */}
            <div className="space-y-1 bg-white/85 p-3.5 rounded-sm border border-indigo-100/30 shadow-2xs">
              <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-950 font-sans">
                <span className="w-4 h-4 bg-indigo-100 text-indigo-800 rounded-full flex items-center justify-center text-[10px] font-mono">3</span>
                <span>{language === 'es' ? 'Notario Digital' : 'Digital Notary'}</span>
              </div>
              <p className="text-[11px] text-gray-600 leading-normal">
                {language === 'es' 
                  ? 'Escribimos el envío en Stellar, un libro de actas digital público e imborrable. Así se certifica el segundo exacto del envío y quién es su emisor.' 
                  : 'We write the dispatch in Stellar, an unerasable public digital ledger. This certifies the exact second of dispatch and who the sender is.'}
              </p>
            </div>

            {/* Step 4: Firma de Acuse */}
            <div className="space-y-1 bg-white/85 p-3.5 rounded-sm border border-indigo-100/30 shadow-2xs">
              <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-950 font-sans">
                <span className="w-4 h-4 bg-indigo-100 text-indigo-800 rounded-full flex items-center justify-center text-[10px] font-mono">4</span>
                <span>{language === 'es' ? 'Firma de Recibo' : 'Receipt Signature'}</span>
              </div>
              <p className="text-[11px] text-gray-600 leading-normal">
                {language === 'es' 
                  ? 'Si activa la firma requerida, el receptor estará obligado a firmar digitalmente con su PIN para confirmar que recibió la prueba original e intacta.' 
                  : 'If you enable the signature requirement, the recipient is forced to digitally sign with their PIN to confirm they received the original, untouched file.'}
              </p>
            </div>

          </div>
        )}
      </div>

      {/* Main Grid: Clean Judicial Form on Left | Judicial Audit Timeline on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Form (Destinatario, Evidencia, Botón) */}
        <div className="lg:col-span-6 flex flex-col gap-6">
          <div className="bg-white border border-[#eaeaea] rounded-sm p-6 space-y-5 shadow-xs">
            
            <div className="flex items-center gap-2 pb-3 border-b border-[#fafafa]">
              <Lock size={15} className="text-black" />
              <h2 className="font-sans font-bold text-xs text-[#111111] uppercase tracking-wider">
                {language === 'es' ? 'Nueva Acta de Custodia Digital' : 'New Digital Custody Record'}
              </h2>
            </div>

            <form onSubmit={handleSealExecute} className="space-y-5">
              
              {/* Field 1: Destinatario */}
              <div>
                <label className="block text-[11px] font-bold text-[#444444] uppercase tracking-wide mb-1.5">
                  1. {language === 'es' ? 'Destinatario Autorizado' : 'Authorized Recipient'}
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
                    className="w-full text-xs font-sans pl-9 pr-3 py-2.5 border border-[#eaeaea] bg-white text-[#111111] focus:outline-none focus:border-black transition-all rounded-sm"
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
                    <div className="absolute left-0 right-0 z-50 mt-1 max-h-48 overflow-y-auto bg-white border border-[#eaeaea] rounded-sm shadow-md divide-y divide-gray-100">
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
                            className="w-full text-left px-3 py-2 hover:bg-[#fafafa] flex flex-col transition-colors cursor-pointer"
                            onClick={() => {
                              setDestinatario(displayName);
                              setSelectedRecipientUsername(u.username);
                              setShowSuggestions(false);
                            }}
                          >
                            <span className="text-xs font-bold text-gray-900 font-sans">
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
                <p className="text-[11px] text-gray-500 mt-1 leading-normal">
                  {language === 'es' 
                    ? '¿Quién recibirá este sobre? Indique la fiscalía, juzgado o perito autorizado. Solo esta cuenta podrá descifrar y abrir la evidencia.' 
                    : 'Who will receive this envelope? Specify the authorized court, prosecutor, or colleague. Only this account will be able to decrypt and open the evidence.'}
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
                      <div className="mt-2 p-2.5 bg-emerald-50 border border-emerald-100 rounded-sm flex items-start gap-2.5 text-left">
                        <div className="p-1 bg-emerald-500 text-white rounded-full mt-0.5">
                          <Check size={10} className="stroke-[3]" />
                        </div>
                        <div className="space-y-0.5">
                          <p className="text-xs font-bold text-emerald-900 font-sans flex items-center gap-1.5 flex-wrap">
                            {language === 'es' ? 'Destinatario Verificado y Autorizado' : 'Verified & Authorized Recipient'}
                            <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-sm font-mono font-semibold">
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
                <div className="mt-3 flex items-start gap-2.5 bg-gray-50/50 border border-[#eaeaea] p-3 rounded-sm" id="requires-signature-wrapper">
                  <input
                    type="checkbox"
                    id="requires-signature-checkbox"
                    checked={requiresSignature}
                    onChange={(e) => setRequiresSignature(e.target.checked)}
                    className="w-4 h-4 accent-black cursor-pointer rounded-sm mt-0.5"
                    disabled={isRunning}
                  />
                  <div className="flex flex-col text-left">
                    <label htmlFor="requires-signature-checkbox" className="text-[11px] font-sans text-gray-800 cursor-pointer font-bold select-none leading-tight">
                      {language === 'es' 
                        ? 'Enviar con acuse de recibo obligatorio (Firma Digital)' 
                        : 'Send with mandatory delivery confirmation (Digital Signature)'}
                    </label>
                    <span className="text-[10px] text-gray-500 mt-0.5 leading-normal">
                      {language === 'es'
                        ? 'El receptor deberá ingresar su huella o PIN para firmar y desbloquear el sobre, registrando la recepción conforme en Stellar.'
                        : 'The recipient will be required to enter their passkey or PIN to sign and unlock the envelope, logging the clean receipt in Stellar.'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Field 2: Documento / Evidencia (Recuadro Gris Sutil) */}
              <div>
                <label className="block text-[11px] font-bold text-[#444444] uppercase tracking-wide mb-1.5">
                  2. {language === 'es' ? 'Documento o Reporte de Evidencia' : 'Document or Evidence Report'}
                </label>
                
                {!selectedFile && !showTextArea ? (
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border border-dashed rounded-sm p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 bg-[#fafafa] ${
                      isDragOver 
                        ? 'border-black bg-gray-50' 
                        : 'border-[#eaeaea] hover:border-gray-400 hover:bg-gray-50'
                    }`}
                    id="drag-drop-area"
                  >
                    <Upload size={20} className="text-gray-400 mb-2" />
                    <p className="text-xs font-sans text-gray-700">
                      {t.dragDropText}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-1">
                      {t.supportedFormats}
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
                  <div className="flex items-center justify-between p-3.5 bg-[#fafafa] border border-[#eaeaea] rounded-sm" id="selected-file-card">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="p-2 bg-white rounded-sm border border-[#eaeaea] text-black flex-shrink-0">
                        <FileText size={16} />
                      </div>
                      <div className="overflow-hidden">
                        <p className="text-xs font-semibold text-gray-900 truncate">{selectedFile.name}</p>
                        <p className="text-[10px] text-gray-400 font-mono">
                          {(selectedFile.size / 1024).toFixed(1)} KB • {selectedFile.type || 'Binario'}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={removeFile}
                      className="p-1.5 rounded-sm hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition-colors"
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
                      className="w-full text-xs font-mono p-3 border border-[#eaeaea] bg-[#fafafa] text-[#111111] focus:outline-none focus:border-black transition-all resize-none rounded-sm"
                      disabled={isRunning}
                    />
                    <button
                      type="button"
                      onClick={() => { setShowTextArea(false); setPayloadText(''); }}
                      className="text-[10px] text-gray-500 hover:text-black font-semibold flex items-center gap-1 cursor-pointer"
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
                      className="text-[10px] text-gray-500 hover:text-black font-bold tracking-wide uppercase cursor-pointer"
                    >
                      + {language === 'es' ? 'Redactar declaración en texto plano' : 'Draft plain text statement'}
                    </button>
                  </div>
                )}

                <div className="mt-2.5 p-2 bg-blue-50/40 border border-blue-100/50 rounded-sm flex items-start gap-2 text-[10px] text-blue-800 font-sans">
                  <Info size={13} className="text-blue-500 mt-0.5 flex-shrink-0" />
                  <p className="leading-normal">
                    {language === 'es' 
                      ? 'Protección Automática: Su archivo se codifica de manera segura en su computadora antes de enviarse. Viajará totalmente cerrado y nadie en internet podrá leerlo.'
                      : 'Automatic Protection: Your file is securely encoded on your computer before sending. It travels fully sealed and no one on the internet can read it.'}
                  </p>
                </div>
              </div>

              {/* Optional notes */}
              <div>
                <label className="block text-[11px] font-bold text-[#444444] uppercase tracking-wide mb-1.5">
                  {t.notesLabel}
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={language === 'es' ? 'Ej. Bajo custodia estricta. Causa Penal Nro 4220' : 'e.g., Under strict custody. Criminal Case No. 4220'}
                  className="w-full text-xs font-sans px-3 py-2 border border-[#eaeaea] bg-white text-[#111111] focus:outline-none focus:border-black transition-all rounded-sm"
                  disabled={isRunning}
                  id="notes-input"
                />
              </div>

              {/* Field 3: Botón Principal (Negro Sólido y Elegante) */}
              <button
                type="submit"
                disabled={isRunning || (!selectedFile && !payloadText.trim()) || !destinatario.trim()}
                className="w-full py-3.5 bg-black text-white text-xs font-sans font-bold uppercase tracking-widest hover:bg-[#222222] transition-colors rounded-sm cursor-pointer disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center gap-2 shadow-xs"
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
                    <span>{t.startSealing}</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Visual Timeline (Replacing old tech Console) */}
        <div className="lg:col-span-6">
          <div className="bg-white border border-[#eaeaea] rounded-sm p-6 h-full flex flex-col justify-between">
            
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-[#fafafa] mb-5">
                <span className="text-[10px] font-mono uppercase text-gray-400 font-bold">
                  {language === 'es' ? 'Auditoría de Enlace Judicial' : 'Judicial Link Audit'}
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
                  <div className="w-12 h-12 bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center rounded-sm mx-auto shadow-2xs">
                    <FileCheck2 size={24} />
                  </div>
                  <div className="max-w-sm mx-auto space-y-2">
                    <h3 className="font-sans font-bold text-xs text-gray-900 uppercase tracking-wider">
                      {language === 'es' ? 'Secuenciador Listo para Sellar' : 'Sequencer Ready to Seal'}
                    </h3>
                    <p className="text-xs text-gray-500 leading-relaxed">
                      {language === 'es' 
                        ? 'Al presionar "Iniciar", el sistema convertirá automáticamente su reporte en un sobre digital cerrado, lo sellará usando la aleatoriedad física de un chip cuántico IonQ, y grabará la prueba de entrega inalterable en Stellar.' 
                        : 'Upon clicking "Start", the system will automatically pack your report into a sealed digital envelope, lock it using real physical IonQ quantum randomness, and record an unalterable proof of delivery on Stellar.'}
                    </p>
                  </div>
                </div>
              ) : (
                /* Interactive Timeline */
                <div className="space-y-6">
                  
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
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-[#fafafa] text-left">
              <span className="text-[9px] font-mono tracking-widest text-[#999999] font-semibold uppercase block">
                {language === 'es' ? 'TECNOLOGÍA DE SEGURIDAD INTEGRADA' : 'INTEGRATED SECURITY TECHNOLOGY'}
              </span>
              <p className="text-[10px] text-gray-400 leading-normal mt-0.5 font-sans">
                {language === 'es' 
                  ? 'Algoritmos validados por NIST (ML-KEM FIPS 203) y notarización distribuida Stellar.' 
                  : 'NIST-validated algorithms (ML-KEM FIPS 203) and distributed Stellar notarization.'}
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
              <pre className="text-[11px] font-mono text-gray-800 overflow-x-auto max-h-[380px] leading-relaxed scrollbar-thin select-all">
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
                  <p className="text-[10px] font-mono text-gray-500 break-all bg-white p-2 rounded-sm border border-[#eaeaea] max-h-16 overflow-y-auto">
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
                  DATA: {manifestResult.payload.encryptedData.length / 2} Bytes
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
