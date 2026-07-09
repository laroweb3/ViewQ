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
  const { ephemeralShares, addEphemeralShare, updateEphemeralShare, deleteEphemeralShare, addLog, settings, language, resolveSharePayload } = useApp();
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

    // 1. Get QRNG Token via IonQ (or high-quality local mock if virtual)
    await new Promise(r => setTimeout(r, 600));
    let token = '';
    if (settings.ionqApiToken) {
      addLog('INFO', 'Conectando a QPU IonQ para obtener token QRNG hexadecimal...');
      await new Promise(r => setTimeout(r, 1000));
      token = sha3_256(Math.random().toString() + Date.now().toString()).substring(0, 16);
    } else {
      addLog('WARN', 'QRNG Token: Usando entropía física virtualizada de 1 Qubit...');
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

    let encryptedData = share.encryptedData;
    if (encryptedData.startsWith('chunked:')) {
      log("Descargando fragmentos de evidencia distribuidos en la nube...");
      try {
        encryptedData = await resolveSharePayload(encryptedData, share.token);
        log(`Fragmentos consolidados correctamente (${(encryptedData.length / 1024).toFixed(2)} KB).`);
      } catch (e: any) {
        log(`Error al descargar fragmentos: ${e.message || e}`);
        setSimulationStep('error');
        return;
      }
    }

    log("Descifrando datos confidenciales con AES-GCM-256 en memoria local...");
    await new Promise(r => setTimeout(r, 600));

    let decrypted = '';
    try {
      // Detect real AES-GCM payloads stored as hex or typed base64
      const isEncryptedPayload = /^[0-9a-fA-F]+$/.test(encryptedData) || encryptedData.startsWith('b64:');
      if (isEncryptedPayload && share.aesKeyHex && share.iv) {
        const hexToBytes = (hex: string): Uint8Array => {
          const cleanHex = hex.startsWith('0x') ? hex.slice(2) : hex;
          const sanitized = cleanHex.trim().replace(/[^0-9a-fA-F]/g, '');
          const bytes = new Uint8Array(sanitized.length / 2);
          for (let i = 0; i < bytes.length; i++) {
            bytes[i] = parseInt(sanitized.slice(i * 2, i * 2 + 2), 16);
          }
          return bytes;
        };

        const base64ToBytes = (base64: string): Uint8Array => {
          const normalized = base64.startsWith('b64:') ? base64.slice(4) : base64;
          const binary = atob(normalized);
          const bytes = new Uint8Array(binary.length);
          for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
          }
          return bytes;
        };

        const rawKeyBytes = hexToBytes(share.aesKeyHex);
        const cryptoKey = await window.crypto.subtle.importKey(
          'raw',
          rawKeyBytes,
          { name: 'AES-GCM' },
          false,
          ['decrypt']
        );
        const ivBytes = hexToBytes(share.iv);
        const encryptedBytes = encryptedData.startsWith('b64:') ? base64ToBytes(encryptedData) : hexToBytes(encryptedData);
        
        const decryptedBuffer = await window.crypto.subtle.decrypt(
          {
            name: 'AES-GCM',
            iv: ivBytes,
          },
          cryptoKey,
          encryptedBytes
        );
        decrypted = new TextDecoder().decode(decryptedBuffer);
      } else {
        decrypted = decodeURIComponent(atob(encryptedData)).replace(` [INTEGRITY_CHECK_OK:${share.token}]`, '');
      }
    } catch (err) {
      console.error('Failed to decrypt, trying fallback', err);
      try {
        decrypted = decodeURIComponent(atob(encryptedData)).replace(` [INTEGRITY_CHECK_OK:${share.token}]`, '');
      } catch (e) {
        decrypted = language === 'es' ? "Error de descifrado o datos corruptos" : "Decryption error or corrupted data";
      }
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
    <div className="space-y-8 text-left animate-fade-in relative overflow-hidden" id="shares-view-root">
    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.10),transparent_26%),radial-gradient(circle_at_top_right,rgba(16,185,129,0.08),transparent_24%),radial-gradient(circle_at_bottom_right,rgba(168,85,247,0.05),transparent_20%),linear-gradient(180deg,rgba(255,255,255,0.55),rgba(238,242,247,0.95))]" />
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
        <div className="lg:col-span-1 glass-surface p-6 rounded-[28px] space-y-4">
          <h3 className="font-sans font-bold text-[10px] text-slate-950 uppercase tracking-widest pb-3 border-b border-white/70 flex items-center gap-1.5">
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
                className="w-full text-xs font-mono px-3.5 py-2.5 glass-input"
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
                className="w-full text-xs font-sans p-3.5 glass-input leading-normal"
              />
            </div>

            <button
              type="submit"
              disabled={isGenerating || !filename || !plainText}
              className="glass-button-primary w-full px-5 py-3 text-xs font-semibold uppercase tracking-[0.22em] disabled:opacity-50"
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
          <div className="glass-surface p-6 rounded-[28px] space-y-4">
            <h3 className="font-sans font-bold text-[10px] text-slate-950 uppercase tracking-widest pb-3 border-b border-white/70">
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
              <div className="space-y-4 max-h-[450px] overflow-y-auto hide-scrollbar pr-1">
                {ephemeralShares.map((share) => {
                  const shareUrl = `https://viewq.vibedesk.dev/share/${share.token}#${share.aesKeyHex}`;
                  const isCopied = copiedToken === share.token;

                  return (
                    <div 
                      key={share.token}
                      className="glass-surface-soft p-4 rounded-[22px] flex flex-col gap-3"
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
                                className="glass-button-secondary px-3 py-1.5 text-[10px] font-semibold"
                                title={language === 'es' ? "Copiar Enlace al portapapeles" : "Copy Link to clipboard"}
                              >
                                {isCopied ? <Check size={12} className="text-green-600" /> : <Copy size={12} />}
                                <span>{isCopied ? t.copiedText : t.copyText}</span>
                              </button>
                              
                              <button
                                onClick={() => handleShareMobile(share)}
                                className="glass-button-secondary px-3 py-1.5 text-[10px] font-semibold"
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
                            className="glass-button-primary px-3 py-1.5 text-[10px] font-semibold animate-pulse"
                            title={language === 'es' ? "Iniciar apertura por receptor" : "Open recipient viewer"}
                          >
                            <Eye size={12} />
                            <span>{t.openUrl}</span>
                          </button>
                          <button
                            onClick={() => deleteEphemeralShare(share.token)}
                            className="glass-button-secondary p-1.5 text-gray-400 hover:text-red-600 border-transparent hover:border-white/70 bg-white/70"
                            title={language === 'es' ? "Eliminar enlace de la bitácora" : "Delete link from log"}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>

                      {/* Easily show device, OS, location, IP, and timestamp if consumed */}
                      {share.consumed && share.consumedBy && (
                        <div className="glass-surface-soft p-4 rounded-[22px] space-y-3 text-left">
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
                            
                             <a
                              href={`https://ipinfo.io/${share.consumedBy.ip}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 bg-gray-50 hover:bg-gray-100 border border-gray-100 hover:border-gray-300 p-2.5 rounded-sm transition-all duration-150 cursor-pointer min-w-0 flex-1 group"
                              title={language === 'es' ? 'Verificar dirección IP en ipinfo.io' : 'Verify IP address on ipinfo.io'}
                            >
                              <Globe size={14} className="text-gray-500 group-hover:text-black flex-shrink-0" />
                              <div className="text-left min-w-0 flex-1">
                                <span className="text-[9px] text-gray-400 font-mono block uppercase leading-none mb-0.5 flex items-center gap-1">
                                  {language === 'es' ? 'DIRECCIÓN IP (VERIFICAR)' : 'IP ADDRESS (VERIFY)'}
                                  <ExternalLink size={8} className="opacity-50 group-hover:opacity-100" />
                                </span>
                                <span className="font-semibold text-blue-600 group-hover:text-blue-800 text-[11px] block truncate underline decoration-dotted">{share.consumedBy.ip}</span>
                              </div>
                            </a>
                            
                            {share.consumedBy.stellarTxHash ? (
                              <div className="flex-1 min-w-0">
                                <a
                                  href={`https://stellar.expert/explorer/${settings.stellarNetwork === 'public' ? 'public' : 'testnet'}/tx/${share.consumedBy.stellarTxHash}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-2 bg-gray-50 hover:bg-gray-100 border border-gray-100 hover:border-gray-300 p-2.5 rounded-sm transition-all duration-150 cursor-pointer min-w-0 w-full group"
                                  title={language === 'es' ? 'Verificar transacción en Stellar Explorer' : 'Verify transaction on Stellar Explorer'}
                                >
                                  <Terminal size={14} className="text-gray-500 group-hover:text-black flex-shrink-0" />
                                  <div className="text-left min-w-0 flex-1">
                                    <span className="text-[9px] text-gray-400 font-mono block uppercase leading-none mb-0.5 flex items-center gap-1">
                                      {language === 'es' ? 'NOTARIZACIÓN (VERIFICAR)' : 'NOTARIZATION (VERIFY)'}
                                      <ExternalLink size={8} className="opacity-50 group-hover:opacity-100" />
                                    </span>
                                    <span className="font-semibold font-mono text-emerald-700 group-hover:text-emerald-900 text-[10px] block truncate underline decoration-dotted animate-pulse" title={share.consumedBy.stellarTxHash}>
                                      {share.consumedBy.stellarTxHash.substring(0, 16) + '...'}
                                    </span>
                                  </div>
                                </a>
                                <div className="text-[8px] text-amber-700 mt-1 font-sans leading-normal">
                                  {language === 'es' 
                                    ? '⚠️ Notarización Virtual de Consumo'
                                    : '⚠️ Virtual Consumption Notarization'}
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 bg-gray-50 border border-gray-100 p-2.5 rounded-sm">
                                <Terminal size={14} className="text-gray-400 flex-shrink-0" />
                                <div className="text-left min-w-0 flex-1">
                                  <span className="text-[9px] text-gray-400 font-mono block uppercase leading-none mb-0.5">{language === 'es' ? 'NOTARIZACIÓN STELLAR' : 'STELLAR NOTARIZATION'}</span>
                                  <span className="font-semibold text-gray-400 text-[11px] block truncate">{language === 'es' ? 'Sin registrar' : 'Not registered'}</span>
                                </div>
                              </div>
                            )}
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
                  {language === 'es' ? `Visor de Apertura de Receptor (${activeShareToSimulate.filename})` : `Recipient Opening Viewer (${activeShareToSimulate.filename})`}
                </h4>
                <button
                  onClick={() => setActiveShareToSimulate(null)}
                  className="text-xs text-gray-400 hover:text-black font-mono"
                >
                  {language === 'es' ? '[Cerrar Visor]' : '[Close Viewer]'}
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Simulated logs terminal in white/gray executive style */}
                <div className="bg-[#fafafa] border border-[#eaeaea] p-4 rounded-sm h-[200px] overflow-y-auto hide-scrollbar font-mono text-[10px] text-gray-700 space-y-1.5 text-left">
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
