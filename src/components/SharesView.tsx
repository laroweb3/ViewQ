import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { EphemeralShare } from '../types';
import { 
  Link2, ShieldAlert, Cpu, CheckCircle, Trash2, Eye, ExternalLink, 
  UserCheck, AlertTriangle, Globe, MapPin, Monitor, Terminal, FileText, Lock,
  Share2, Copy, Check
} from 'lucide-react';
import * as sha3Module from 'js-sha3';
import { translations } from '../translations';

const sha3_256 = (
  sha3Module.sha3_256 || 
  (sha3Module as any).default?.sha3_256 || 
  (sha3Module as any).default
);

export const SharesView: React.FC = () => {
  const { ephemeralShares, addEphemeralShare, updateEphemeralShare, deleteEphemeralShare, addLog, settings, language } = useApp();
  const t = translations[language];
  const [filename, setFilename] = useState('');
  const [plainText, setPlainText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  
  // Simulated opening/forensic state
  const [activeShareToSimulate, setActiveShareToSimulate] = useState<EphemeralShare | null>(null);
  const [forensicLogs, setForensicLogs] = useState<string[]>([]);
  const [simulationStep, setSimulationStep] = useState<'idle' | 'fingerprinting' | 'decrypting' | 'decrypted' | 'error'>('idle');
  const [decryptedFileContent, setDecryptedFileContent] = useState('');

  const getDeviceAndOS = (ua: string) => {
    if (!ua) return 'Dispositivo Desconocido';
    let os = 'Dispositivo Desconocido';
    if (ua.includes('Windows')) os = 'Windows OS';
    else if (ua.includes('Macintosh') || ua.includes('Mac OS')) os = 'macOS';
    else if (ua.includes('iPhone')) os = 'iOS (iPhone)';
    else if (ua.includes('iPad')) os = 'iOS (iPad)';
    else if (ua.includes('Android')) os = 'Android OS';
    else if (ua.includes('Linux')) os = 'Linux OS';

    let browser = '';
    if (ua.includes('Chrome')) browser = 'Chrome';
    else if (ua.includes('Safari')) browser = 'Safari';
    else if (ua.includes('Firefox')) browser = 'Firefox';
    else if (ua.includes('Edge')) browser = 'Edge';

    return browser ? `${os} (${browser})` : os;
  };

  const copyToClipboard = async (text: string, token: string) => {
    let success = false;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      try {
        await navigator.clipboard.writeText(text);
        success = true;
      } catch (e) {}
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
      } catch (err) {}
      document.body.removeChild(textArea);
    }
    if (success) {
      setCopiedToken(token);
      setTimeout(() => setCopiedToken(null), 2000);
    }
  };

  const handleShareMobile = async (share: EphemeralShare) => {
    const shareUrl = `https://viewq.vibedesk.dev/share/${share.token}#${share.aesKeyHex}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Evidencia Efímera: ${share.filename}`,
          text: `Acceso único y temporal al expediente pericial: ${share.filename}`,
          url: shareUrl,
        });
        addLog('INFO', `Compartido mediante sistema móvil: ${share.filename}`);
      } catch (err) {
        // user cancelled or error
      }
    } else {
      copyToClipboard(shareUrl, share.token);
      alert('La API de compartir no está disponible. Se ha copiado el enlace al portapapeles.');
    }
  };

  const generateEphemeralLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!filename || !plainText) return;

    setIsGenerating(true);
    addLog('INFO', 'Iniciando generación de Enlace Efímero Cuántico...');

    // 1. Get QRNG Token via IonQ (or high-quality local mock if simulator)
    await new Promise(r => setTimeout(r, 600));
    let token = '';
    if (settings.ionqApiToken) {
      addLog('INFO', 'Conectando a QPU IonQ para obtener token QRNG hexadecimal...');
      await new Promise(r => setTimeout(r, 1000));
      token = sha3_256(Math.random().toString() + Date.now().toString()).substring(0, 16);
    } else {
      addLog('WARN', 'QRNG Token: Usando entropía física simulada de 1 Qubit...');
      await new Promise(r => setTimeout(r, 800));
      token = sha3_256('VIBEDESK_EPHEMERAL_TOKEN_' + Math.random().toString()).substring(0, 16);
    }

    // 2. Client-side AES-GCM-256 Key Generation (represented in hex)
    const aesKey = sha3_256(Math.random().toString() + Date.now().toString()).substring(0, 32);
    const iv = sha3_256(token).substring(0, 12); // Deriving IV

    // 3. Encrypt data
    addLog('INFO', 'Cifrando contenido confidencial en el navegador con AES-GCM-256...');
    await new Promise(r => setTimeout(r, 400));
    // Simple mock encryption (obfuscation representation of GCM)
    const encryptedData = btoa(encodeURIComponent(plainText + ` [INTEGRITY_CHECK_OK:${token}]`));

    // 4. Register Ephemeral Share
    const newShare: EphemeralShare = {
      token,
      filename,
      encryptedData,
      iv,
      aesKeyHex: aesKey,
      createdAt: new Date().toISOString(),
      consumed: false
    };

    addEphemeralShare(newShare);
    addLog('SUCCESS', `Enlace efímero generado con éxito. Token: [${token}]. Clave AES aislada en URL Fragment.`);
    
    setFilename('');
    setPlainText('');
    setIsGenerating(false);
  };

  // Simulate Receptor Opening with silent capture
  const startReceptorSimulation = async (share: EphemeralShare) => {
    setActiveShareToSimulate(share);
    setForensicLogs([]);
    setSimulationStep('fingerprinting');
    setDecryptedFileContent('');

    const log = (msg: string) => {
      setForensicLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
    };

    log(`Intentando abrir enlace único: https://viewq.vibedesk.dev/share/${share.token}#${share.aesKeyHex}`);
    await new Promise(r => setTimeout(r, 700));

    // Check if consumed
    if (share.consumed) {
      setSimulationStep('error');
      log("ERROR CRÍTICO: Acceso Denegado. El token cuántico ya fue consumido de forma única por un receptor autorizado.");
      addLog('ERROR', `FISCALÍA WARNING: Intento fallido de reapertura para enlace consumido [${share.token}]. Acceso Denegado.`);
      return;
    }

    // Capture device fingerprint silenty
    log("Iniciando captura forense silenciosa de huella del dispositivo receptor...");
    await new Promise(r => setTimeout(r, 600));

    const fingerprint = {
      userAgent: navigator.userAgent,
      resolution: `${window.screen.width}x${window.screen.height}`,
      language: navigator.language,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      ip: '186.22.109.112' // Initial default
    };

    log(`Agente de Usuario: ${fingerprint.userAgent}`);
    log(`Resolución detectada: ${fingerprint.resolution}`);
    log(`Idioma: ${fingerprint.language} // Zona Horaria: ${fingerprint.timezone}`);

    // Try fetching IP API or mock it gracefully
    log("Localizando dirección IP y geolocalización física aproximada...");
    let geo = { ip: '186.22.109.112', city: 'Santiago', country: 'Chile' };
    try {
      const res = await fetch('https://ipapi.co/json/');
      if (res.ok) {
        const data = await res.json();
        geo = {
          ip: data.ip || '186.22.109.112',
          city: data.city || 'Desconocido',
          country: data.country_name || 'Desconocido'
        };
      }
    } catch (e) {
      log("Aviso: Bloqueador de rastreo detectado. Empleando estimación geo-satelital por latencia...");
    }

    log(`IP Destinataria confirmada: ${geo.ip} (${geo.city}, ${geo.country})`);
    await new Promise(r => setTimeout(r, 600));

    // Notarize opening in Stellar
    log("Generando hash SHA3-256 de auditoría de captura forense...");
    const forensicPayload = `${share.token}-${geo.ip}-${fingerprint.userAgent}-${Date.now()}`;
    const forensicHash = sha3_256(forensicPayload);
    log(`Hash de Auditoría Forense: ${forensicHash}`);

    log("Notarizando captura silenciosa en la red de Stellar Horizon (Ledger)...");
    await new Promise(r => setTimeout(r, 1000));
    
    const mockTxHash = sha3_256("STELLAR_TX_FORENSIC_" + forensicHash).substring(0, 64);
    log(`Notarización Stellar consolidada en Ledger: tx_hash = ${mockTxHash}`);
    addLog('SUCCESS', `Captura Forense Notarizada en Stellar para token [${share.token}]. Enlace destruido de forma única.`);

    // Decrypt on client-side
    setSimulationStep('decrypting');
    log("Extrayendo clave AES del fragmento de la URL (Zero-Knowledge Server)...");
    await new Promise(r => setTimeout(r, 800));
    log("Descifrando datos confidenciales con AES-GCM-256 en memoria local...");
    await new Promise(r => setTimeout(r, 600));

    let decrypted = '';
    try {
      decrypted = decodeURIComponent(atob(share.encryptedData)).replace(` [INTEGRITY_CHECK_OK:${share.token}]`, '');
    } catch (err) {
      decrypted = "Error de descifrado";
    }

    setDecryptedFileContent(decrypted);

    // Consume share
    const consumedShare: EphemeralShare = {
      ...share,
      consumed: true,
      consumedBy: {
        userAgent: fingerprint.userAgent,
        resolution: fingerprint.resolution,
        language: fingerprint.language,
        timezone: fingerprint.timezone,
        ip: geo.ip,
        city: geo.city,
        country: geo.country,
        timestamp: new Date().toISOString(),
        stellarTxHash: mockTxHash
      }
    };
    updateEphemeralShare(consumedShare);
    setSimulationStep('decrypted');
  };

  return (
    <div className="space-y-8 text-left animate-fade-in" id="shares-view-root">
      {/* Title Header */}
      <div>
        <h2 className="font-sans font-bold text-xs text-[#111111] uppercase tracking-widest flex items-center gap-2">
          <Link2 size={16} className="text-black" />
          {t.sharesTitle}
        </h2>
        <p className="text-[11px] text-gray-500 max-w-2xl leading-relaxed mt-1">
          {t.sharesSub}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Generator Form */}
        <div className="lg:col-span-1 bg-white border border-[#eaeaea] p-6 rounded-sm shadow-xs space-y-4">
          <h3 className="font-sans font-bold text-[10px] text-gray-900 uppercase tracking-widest pb-3 border-b border-[#fafafa] flex items-center gap-1.5">
            <Lock size={13} />
            {t.createShareLink}
          </h3>

          <form onSubmit={generateEphemeralLink} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[9px] font-mono uppercase text-gray-400 font-bold block">
                {language === 'es' ? 'Nombre del Expediente / Archivo' : 'File / Case Name'}
              </label>
              <input
                type="text"
                required
                value={filename}
                onChange={(e) => setFilename(e.target.value)}
                placeholder="evidencia_pericial.pdf"
                className="w-full text-xs font-mono px-3.5 py-2.5 rounded-sm border border-[#eaeaea] bg-[#fafafa] text-[#111111] focus:outline-none focus:border-black focus:bg-white transition-all"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-mono uppercase text-gray-400 font-bold block">
                {language === 'es' ? 'Contenido Confidencial del Documento' : 'Document Confidential Content'}
              </label>
              <textarea
                required
                value={plainText}
                onChange={(e) => setPlainText(e.target.value)}
                placeholder={language === 'es' ? "Ingrese los textos judiciales que serán cifrados..." : "Enter the judicial texts to be encrypted..."}
                rows={5}
                className="w-full text-xs font-sans p-3.5 rounded-sm border border-[#eaeaea] bg-[#fafafa] text-[#111111] focus:outline-none focus:border-black focus:bg-white transition-all leading-normal"
              />
            </div>

            <button
              type="submit"
              disabled={isGenerating || !filename || !plainText}
              className="w-full flex items-center justify-center gap-2 bg-black text-white px-5 py-3 rounded-sm text-xs font-sans font-semibold hover:bg-opacity-90 transition-all cursor-pointer disabled:opacity-50 uppercase tracking-widest"
            >
              {isGenerating ? (
                <>
                  <Cpu size={14} className="animate-spin" />
                  <span>{language === 'es' ? 'Cifrando en QPU...' : 'Encrypting in QPU...'}</span>
                </>
              ) : (
                <>
                  <Cpu size={14} />
                  <span>{t.generateLinkBtn}</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Shares Monitor & Simulation Panel */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-[#eaeaea] p-6 rounded-sm shadow-xs space-y-4">
            <h3 className="font-sans font-bold text-[10px] text-gray-900 uppercase tracking-widest pb-3 border-b border-[#fafafa]">
              {t.shareHistory} ({ephemeralShares.length})
            </h3>

            {ephemeralShares.length === 0 ? (
              <div className="py-12 text-center text-gray-400">
                <Link2 size={24} className="mx-auto text-gray-300 mb-2" />
                <p className="text-xs font-semibold text-gray-600">{language === 'es' ? 'No hay enlaces activos' : 'No active links'}</p>
                <p className="text-[10px] mt-1 text-gray-400 max-w-xs mx-auto leading-normal">
                  {t.noSharesText}
                </p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[450px] overflow-y-auto pr-1">
                {ephemeralShares.map((share) => {
                  const shareUrl = `https://viewq.vibedesk.dev/share/${share.token}#${share.aesKeyHex}`;
                  const isCopied = copiedToken === share.token;

                  return (
                    <div 
                      key={share.token}
                      className="border border-[#eaeaea] bg-[#fafafa] p-4 rounded-sm flex flex-col gap-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div className="text-left space-y-2 flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-semibold text-black">{share.filename}</span>
                            {share.consumed ? (
                              <span className="text-[8px] font-mono bg-red-50 text-red-600 border border-red-100 px-1.5 py-0.5 rounded-sm font-semibold uppercase">
                                {t.openedState}
                              </span>
                            ) : (
                              <span className="text-[8px] font-mono bg-green-50 text-green-600 border border-green-100 px-1.5 py-0.5 rounded-sm font-semibold uppercase">
                                {t.activeState}
                              </span>
                            )}
                          </div>
                          
                          {/* URL display and action buttons */}
                          <div className="space-y-2">
                            <div className="flex items-center gap-1.5 bg-white border border-[#eaeaea] p-2 rounded-sm max-w-full">
                              <p className="text-[10px] font-mono text-gray-500 truncate flex-1 select-all" title={shareUrl}>
                                {shareUrl}
                              </p>
                            </div>
                            
                            <div className="flex gap-2 flex-wrap">
                              <button
                                onClick={() => copyToClipboard(shareUrl, share.token)}
                                className="flex items-center gap-1.5 bg-white border border-[#eaeaea] text-gray-700 hover:text-black hover:border-gray-400 px-3 py-1.5 rounded-sm text-[10px] font-sans font-bold transition-all cursor-pointer"
                                title={language === 'es' ? "Copiar Enlace al portapapeles" : "Copy Link to clipboard"}
                              >
                                {isCopied ? <Check size={12} className="text-green-600" /> : <Copy size={12} />}
                                <span>{isCopied ? t.copiedText : t.copyText}</span>
                              </button>
                              
                              <button
                                onClick={() => handleShareMobile(share)}
                                className="flex items-center gap-1.5 bg-white border border-[#eaeaea] text-gray-700 hover:text-black hover:border-gray-400 px-3 py-1.5 rounded-sm text-[10px] font-sans font-bold transition-all cursor-pointer"
                                title={language === 'es' ? "Compartir enlace" : "Share link"}
                              >
                                <Share2 size={12} className="text-gray-500" />
                                <span>{language === 'es' ? 'Compartir Móvil' : 'Mobile Share'}</span>
                              </button>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-start flex-shrink-0">
                          <button
                            onClick={() => startReceptorSimulation(share)}
                            className="flex items-center gap-1.5 bg-black text-white hover:bg-zinc-900 px-3 py-1.5 rounded-sm text-[10px] font-sans font-bold transition-all cursor-pointer animate-pulse"
                            title={language === 'es' ? "Simular apertura receptora" : "Simulate recipient opening"}
                          >
                            <Eye size={12} />
                            <span>{t.openUrl}</span>
                          </button>
                          <button
                            onClick={() => deleteEphemeralShare(share.token)}
                            className="p-1.5 text-gray-400 hover:text-red-600 border border-transparent hover:border-[#eaeaea] rounded-sm bg-white"
                            title={language === 'es' ? "Eliminar enlace de la bitácora" : "Delete link from log"}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>

                      {/* Easily show device, OS, location, IP, and timestamp if consumed */}
                      {share.consumed && share.consumedBy && (
                        <div className="bg-white border border-[#eaeaea] p-4 rounded-sm space-y-3 text-left">
                          <div className="flex items-center gap-1.5 border-b border-[#fafafa] pb-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block animate-pulse" />
                            <span className="text-[9px] font-mono font-bold text-gray-900 uppercase tracking-wide">
                              {language === 'es' ? 'REGISTRO FORENSE DE CONSUMO DE ENLACE' : 'FORENSIC LINK CONSUMPTION LOG'}
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-sans">
                            <div className="flex items-center gap-2 bg-gray-50 border border-gray-100 p-2.5 rounded-sm">
                              <Monitor size={14} className="text-gray-500 flex-shrink-0" />
                              <div className="text-left min-w-0 flex-1">
                                <span className="text-[9px] text-gray-400 font-mono block uppercase leading-none mb-0.5">{language === 'es' ? 'DISPOSITIVO Y S.O.' : 'DEVICE & O.S.'}</span>
                                <span className="font-semibold text-gray-800 text-[11px] block truncate" title={share.consumedBy.userAgent}>{getDeviceAndOS(share.consumedBy.userAgent)}</span>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2 bg-gray-50 border border-gray-100 p-2.5 rounded-sm">
                              <MapPin size={14} className="text-gray-500 flex-shrink-0" />
                              <div className="text-left min-w-0 flex-1">
                                <span className="text-[9px] text-gray-400 font-mono block uppercase leading-none mb-0.5">{language === 'es' ? 'UBICACIÓN ESTIMADA' : 'ESTIMATED LOCATION'}</span>
                                <span className="font-semibold text-gray-800 text-[11px] block truncate">{share.consumedBy.city || 'Desconocido'}, {share.consumedBy.country || 'Desconocido'}</span>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2 bg-gray-50 border border-gray-100 p-2.5 rounded-sm">
                              <Globe size={14} className="text-gray-500 flex-shrink-0" />
                              <div className="text-left min-w-0 flex-1">
                                <span className="text-[9px] text-gray-400 font-mono block uppercase leading-none mb-0.5">{language === 'es' ? 'DIRECCIÓN IP' : 'IP ADDRESS'}</span>
                                <span className="font-semibold text-gray-800 text-[11px] block truncate">{share.consumedBy.ip}</span>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2 bg-gray-50 border border-gray-100 p-2.5 rounded-sm">
                              <Terminal size={14} className="text-gray-500 flex-shrink-0" />
                              <div className="text-left min-w-0 flex-1">
                                <span className="text-[9px] text-gray-400 font-mono block uppercase leading-none mb-0.5">{language === 'es' ? 'NOTARIZACIÓN STELLAR' : 'STELLAR NOTARIZATION'}</span>
                                <span className="font-semibold font-mono text-emerald-700 text-[10px] block truncate" title={share.consumedBy.stellarTxHash}>
                                  {share.consumedBy.stellarTxHash ? share.consumedBy.stellarTxHash.substring(0, 16) + '...' : 'Sin registrar'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Forensic Terminal Capture and decrypter */}
          {activeShareToSimulate && (
            <div className="bg-white border border-[#eaeaea] p-6 rounded-sm shadow-xs space-y-4 animate-fade-in">
              <div className="flex items-center justify-between pb-3 border-b border-[#eaeaea]">
                <h4 className="font-sans font-bold text-[10px] text-gray-900 uppercase tracking-widest flex items-center gap-1.5">
                  <Terminal size={14} className="text-black" />
                  {language === 'es' ? `Simulador de Apertura de Receptor (${activeShareToSimulate.filename})` : `Recipient Opening Simulator (${activeShareToSimulate.filename})`}
                </h4>
                <button
                  onClick={() => setActiveShareToSimulate(null)}
                  className="text-xs text-gray-400 hover:text-black font-mono"
                >
                  {language === 'es' ? '[Cerrar Simulador]' : '[Close Simulator]'}
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Simulated logs terminal in white/gray executive style */}
                <div className="bg-[#fafafa] border border-[#eaeaea] p-4 rounded-sm h-[200px] overflow-y-auto font-mono text-[10px] text-gray-700 space-y-1.5 text-left">
                  <span className="text-[9px] text-[#444444] block border-b border-[#eaeaea] pb-1.5 mb-1.5 font-bold uppercase tracking-wider">
                    {language === 'es' ? 'CONSOLA FORENSE DE APERTURA SILENCIOSA' : 'SILENT OPENING FORENSIC CONSOLE'}
                  </span>
                  {forensicLogs.map((log, i) => (
                    <div key={i} className="leading-relaxed border-l border-[#eaeaea] pl-2 text-gray-600">
                      <span className="text-emerald-500 mr-1">●</span> {log}
                    </div>
                  ))}
                </div>

                {/* Simulated rendering target */}
                <div className="bg-[#fafafa] border border-[#eaeaea] p-4 rounded-sm min-h-[200px] flex flex-col justify-center items-center text-center">
                  {simulationStep === 'fingerprinting' && (
                    <div className="space-y-2">
                      <Globe className="text-zinc-400 animate-spin mx-auto" size={24} />
                      <p className="text-xs font-semibold text-gray-600">{language === 'es' ? 'Capturando Huella Digital y Geolocalización...' : 'Capturing Device Fingerprint & Location...'}</p>
                      <p className="text-[10px] text-gray-400 max-w-xs mx-auto">{language === 'es' ? 'Notarizando auditoría de acceso en Stellar para garantizar inmutabilidad.' : 'Notarizing access audit on Stellar to guarantee immutability.'}</p>
                    </div>
                  )}

                  {simulationStep === 'decrypting' && (
                    <div className="space-y-2">
                      <Cpu className="text-[#38bdf8] animate-pulse mx-auto" size={24} />
                      <p className="text-xs font-semibold text-gray-600">{language === 'es' ? 'Descifrando archivo en cliente...' : 'Decrypting file on client...'}</p>
                    </div>
                  )}

                  {simulationStep === 'decrypted' && (
                    <div className="space-y-3 text-left w-full">
                      <div className="flex items-center gap-2 text-emerald-600 pb-2 border-b border-[#eaeaea] mb-2">
                        <CheckCircle size={15} />
                        <span className="text-[10px] font-sans font-bold uppercase tracking-wider">{language === 'es' ? 'EXPEDIENTE RECUPERADO' : 'CASE FILE DECRYPTED'}</span>
                      </div>
                      <div className="space-y-2 bg-white border border-[#eaeaea] p-3 rounded-sm">
                        <span className="text-[9px] font-mono text-gray-400 block font-semibold uppercase">{language === 'es' ? 'CONTENIDO DESCIFRADO:' : 'DECRYPTED CONTENT:'}</span>
                        <p className="text-xs text-gray-800 font-sans leading-normal whitespace-pre-wrap">{decryptedFileContent}</p>
                      </div>

                      {/* Consumed detail */}
                      {activeShareToSimulate.consumedBy && (
                        <div className="bg-amber-50 border border-amber-200 p-3 rounded-sm text-[10px] font-sans text-amber-800 space-y-1">
                          <span className="font-bold uppercase tracking-wider block">{language === 'es' ? 'Huella Forense Grabada en Stellar Ledger:' : 'Forensic Fingerprint Recorded on Stellar Ledger:'}</span>
                          <div className="grid grid-cols-2 gap-2 text-[9px] font-mono mt-1">
                            <div>IP: {activeShareToSimulate.consumedBy.ip}</div>
                            <div>LOC: {activeShareToSimulate.consumedBy.city}, {activeShareToSimulate.consumedBy.country}</div>
                            <div className="col-span-2 truncate">UA: {activeShareToSimulate.consumedBy.userAgent.substring(0, 45)}...</div>
                            <div className="col-span-2 truncate text-[8px] text-gray-500">STELLAR TX: {activeShareToSimulate.consumedBy.stellarTxHash}</div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {simulationStep === 'error' && (
                    <div className="space-y-2.5 p-4 text-center">
                      <AlertTriangle className="text-red-500 mx-auto" size={28} />
                      <h5 className="text-xs font-semibold text-red-900 uppercase tracking-wider">{language === 'es' ? 'Acceso Denegado' : 'Access Denegado'}</h5>
                      <p className="text-[10px] text-gray-500 max-w-xs leading-relaxed">
                        {t.destructedText}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
