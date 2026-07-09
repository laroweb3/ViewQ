import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ProcessEventFeed } from './ProcessEventFeed';
import { 
  Bell, 
  User, 
  FileCheck2, 
  Clock, 
  Lock, 
  Download, 
  Check, 
  Copy, 
  ExternalLink, 
  AlertCircle,
  Eye,
  Shield,
  Send,
  EyeOff,
  RefreshCw
} from 'lucide-react';
import { AppNotification } from '../types';

const surfaceCard = 'bg-white/90 backdrop-blur-xl border border-slate-200/80 rounded-[28px] shadow-[0_24px_70px_-42px_rgba(15,23,42,0.45)]';

export const NotificationsView: React.FC = () => {
  const { 
    notifications, 
    vaults, 
    markNotificationAsRead, 
    signCustodyRecord, 
    language, 
    addLog, 
    resolveFilePayload, 
    settings, 
    user 
  } = useApp();
  const [selectedNotif, setSelectedNotif] = useState<AppNotification | null>(null);
  const [copied, setCopied] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadingType, setDownloadingType] = useState<'armored' | 'viewq' | null>(null);
  const [isSigning, setIsSigning] = useState(false);

  const [decryptedPayload, setDecryptedPayload] = useState<string | null>(null);
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [decryptError, setDecryptError] = useState<string | null>(null);

  const unreadCount = notifications.filter(n => n.status === 'unread').length;

  const handleSelectNotification = (notif: AppNotification) => {
    setSelectedNotif(notif);
    setDecryptedPayload(null);
    setDecryptError(null);
    if (notif.status === 'unread') {
      markNotificationAsRead(notif.id);
    }
  };

  const handleDecryptAndPreview = async () => {
    if (!matchedVault) return;
    setIsDecrypting(true);
    setDecryptError(null);
    addLog('SYSTEM', language === 'es' ? `Iniciando desencapsulado de claves poscuánticas para visualización en memoria...` : `Starting post-quantum key decapsulation for volatile preview...`);
    try {
      const { unsealPayload } = await import('../lib/pqc');
      const decrypted = await unsealPayload(matchedVault.manifest);
      setDecryptedPayload(decrypted);
      addLog('SUCCESS', language === 'es' ? `¡Documento descifrado exitosamente en la memoria RAM!` : `Document decrypted successfully in RAM state!`);
    } catch (err: any) {
      setDecryptError(err.message || 'Error decrypting');
      addLog('ERROR', `Error decrypting notification document: ${err.message || err}`);
    } finally {
      setIsDecrypting(false);
    }
  };

  const handleSignReceipt = async () => {
    if (!selectedNotif || !user?.profile) return;
    setIsSigning(true);
    try {
      const txHash = await signCustodyRecord(selectedNotif.vaultId, user.profile);
      setSelectedNotif(prev => prev ? {
        ...prev,
        signatureStatus: 'signed',
        signerName: `${user.profile?.nombres} ${user.profile?.apellidos}`,
        signatureTimestamp: new Date().toISOString(),
        signatureStellarTxHash: txHash
      } : null);
    } catch (err) {
      console.error(err);
      alert(language === 'es' ? 'Fallo al firmar el acta' : 'Failed to sign the record');
    } finally {
      setIsSigning(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 200);
  };

  // Find corresponding vault to enable downloads if available in cloud
  const matchedVault = selectedNotif ? vaults.find(v => v.id === selectedNotif.vaultId) : null;
  
  const isArmoredAvailable = !!matchedVault?.armoredFileBase64;
  const isViewQAvailable = !!matchedVault?.viewQFileBase64;
  const isLocalOnly = matchedVault?.viewQFileBase64?.startsWith('local_only:') || matchedVault?.armoredFileBase64?.startsWith('local_only:');
  const notificationFeedItems = selectedNotif ? [
    {
      id: 'inbox',
      title: language === 'es' ? 'Custodia recibida' : 'Custody received',
      description: language === 'es'
        ? 'El sobre sellado ya se encuentra asociado a su bandeja y listo para revisión operativa.'
        : 'The sealed envelope is already bound to your inbox and ready for operational review.',
      stage: 'Inbox',
      color: '#dbeafe',
      status: 'success' as const,
      glyph: '📥',
    },
    {
      id: 'signature',
      title: language === 'es' ? 'Firma de recibo' : 'Receipt signature',
      description: selectedNotif.signatureStatus === 'signed'
        ? (language === 'es'
            ? 'La recepción ya fue firmada y asociada a la identidad del receptor.'
            : 'Receipt has already been signed and bound to the recipient identity.')
        : (language === 'es'
            ? 'La recepción sigue esperando confirmación mediante PIN o passkey.'
            : 'Receipt is still waiting for confirmation through PIN or passkey.'),
      stage: 'Stage 01',
      color: '#fef3c7',
      status: selectedNotif.signatureStatus === 'signed' ? 'success' : isSigning ? 'running' : 'pending',
      glyph: '✍️',
    },
    {
      id: 'ledger',
      title: language === 'es' ? 'Estampa en Stellar' : 'Stellar stamp',
      description: (selectedNotif.signatureStellarTxHash || selectedNotif.stellarTxHash)
        ? (language === 'es'
            ? 'La operación ya cuenta con anclaje verificable en el ledger para auditoría externa.'
            : 'The operation already has a verifiable ledger anchor for external audit.')
        : (language === 'es'
            ? 'El anclaje ledger se emitirá junto con la confirmación o el registro del despacho.'
            : 'The ledger anchor will be emitted with receipt confirmation or dispatch registration.'),
      stage: 'Stage 02',
      color: '#dcfce7',
      status: (selectedNotif.signatureStellarTxHash || selectedNotif.stellarTxHash) ? 'success' : isSigning ? 'running' : 'pending',
      glyph: '📜',
    },
    {
      id: 'payload',
      title: language === 'es' ? 'Disponibilidad de evidencia' : 'Evidence availability',
      description: isLocalOnly
        ? (language === 'es'
            ? 'La metadata está disponible, pero el archivo físico permanece en el dispositivo del emisor.'
            : 'Metadata is available, but the physical file still resides on the sender device.')
        : (language === 'es'
            ? 'Los contenedores .viewQ o blindados están listos para descarga y verificación.'
            : '.viewQ or armored containers are ready for download and verification.'),
      stage: 'Stage 03',
      color: '#fee2e2',
      status: matchedVault ? 'success' : 'pending',
      glyph: '🗂️',
    },
  ] : [];

  const downloadFile = async (base64Data: string, filename: string, vaultId: string, type: 'armored' | 'viewq') => {
    setIsDownloading(true);
    setDownloadingType(type);
    try {
      const resolvedDataUrl = await resolveFilePayload(base64Data, vaultId, type);
      const link = document.createElement('a');
      link.href = resolvedDataUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      addLog('SUCCESS', `Evidencia descargada localmente desde notificación: ${filename}`);
    } catch (err) {
      console.error(err);
      alert(language === 'es' ? 'Error al descargar' : 'Error downloading');
    } finally {
      setIsDownloading(false);
      setDownloadingType(null);
    }
  };

  return (
    <div className="space-y-6" id="notifications-view-container">
      {/* View Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-slate-950 uppercase">
            {language === 'es' ? 'Alertas y Notificaciones' : 'Alerts & Notifications'}
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            {language === 'es' 
              ? 'Custodias digitales compartidas y selladas predictivamente por emisarios autorizados.' 
              : 'Digital custody records shared and sealed predictively by authorized emissaries.'}
          </p>
        </div>
        {unreadCount > 0 && (
          <span className="bg-slate-950 text-white border border-slate-900 text-[10px] font-mono font-bold px-3 py-1.5 rounded-full animate-pulse uppercase shadow-sm">
            {unreadCount} {language === 'es' ? 'Pendientes' : 'Unread'}
          </span>
        )}
      </div>

      {/* Grid Layout: Master list (Left) & Detail view (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left column: Notifications list */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-200/70">
            <Bell size={13} className="text-slate-400" />
            <span className="text-[10px] font-mono uppercase text-slate-400 font-bold tracking-[0.24em]">
              {language === 'es' ? 'Bandeja de Entrada' : 'Incoming Inbox'}
            </span>
          </div>

          {notifications.length === 0 ? (
            <div className={surfaceCard + ' p-8 text-center space-y-3'}>
              <div className="w-10 h-10 bg-slate-50 border border-slate-200 text-slate-400 flex items-center justify-center rounded-2xl mx-auto">
                <Bell size={18} />
              </div>
              <div className="max-w-xs mx-auto space-y-1">
                <p className="font-sans font-bold text-xs text-slate-950 uppercase tracking-[0.22em]">
                  {language === 'es' ? 'Sin notificaciones' : 'No notifications'}
                </p>
                <p className="text-[11px] text-slate-500 leading-normal">
                  {language === 'es'
                    ? 'No ha recibido ninguna notificación de custodia digital en esta cuenta todavía.'
                    : 'You have not received any digital custody alerts on this account yet.'}
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[600px] overflow-y-auto hide-scrollbar pr-1">
              {notifications.map((notif) => {
                const isSelected = selectedNotif?.id === notif.id;
                const isUnread = notif.status === 'unread';
                
                return (
                  <button
                    key={notif.id}
                    onClick={() => handleSelectNotification(notif)}
                    className={`w-full text-left p-4 rounded-2xl border transition-all flex flex-col gap-2 relative cursor-pointer ${
                      isSelected 
                          ? 'bg-slate-950 text-white border-slate-950 shadow-[0_18px_35px_-24px_rgba(15,23,42,0.85)]' 
                        : isUnread 
                            ? 'bg-white border-slate-200 hover:bg-slate-50 text-slate-950 ring-1 ring-red-100' 
                            : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isUnread ? 'bg-cyan-400' : 'bg-slate-300'}`} />
                        <span className={`text-[10px] font-mono truncate uppercase ${isSelected ? 'text-slate-300' : 'text-slate-400'}`}>
                          {language === 'es' ? 'De: ' : 'From: '}{notif.sender}
                        </span>
                      </div>
                      <span className={`text-[9px] font-mono whitespace-nowrap ${isSelected ? 'text-slate-400' : 'text-slate-400'}`}>
                        {new Date(notif.timestamp).toLocaleDateString()} {new Date(notif.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </span>
                    </div>

                    <h3 className="font-sans font-bold text-xs truncate max-w-full">
                      {notif.title}
                    </h3>

                    {notif.requiresSignature && (
                      <div className="flex flex-wrap gap-1 mt-0.5">
                        {notif.signatureStatus === 'signed' ? (
                          <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-sm ${
                            isSelected ? 'bg-emerald-900 text-emerald-100' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                          }`}>
                            {language === 'es' ? '✓ FIRMADO' : '✓ SIGNED'}
                          </span>
                        ) : (
                          <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-sm flex items-center gap-1 animate-pulse ${
                            isSelected ? 'bg-amber-800 text-amber-100' : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}>
                            <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-ping" />
                            {language === 'es' ? '⚠️ FIRMA REQUERIDA' : '⚠️ SIGNATURE REQUIRED'}
                          </span>
                        )}
                      </div>
                    )}

                    {notif.notes && (
                      <p className={`text-[11px] line-clamp-1 ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                        {notif.notes}
                      </p>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Right column: Notification details */}
        <div className="lg:col-span-7">
          {selectedNotif ? (
            <div className={surfaceCard + ' p-6 space-y-6 animate-fadeIn'}>
              
              {/* Header Details */}
              <div className="flex items-start justify-between gap-4 border-b border-slate-200/70 pb-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full font-bold uppercase tracking-[0.2em]">
                      {language === 'es' ? 'Custodia Oficial Recibida' : 'Official Custody Receipt'}
                    </span>
                  </div>
                  <h2 className="font-display font-bold text-base text-slate-950 leading-snug">
                    {selectedNotif.title}
                  </h2>
                </div>
                <div className="text-right text-[10px] font-mono text-slate-400">
                  <p>{language === 'es' ? 'ID ACTA' : 'RECORD ID'}</p>
                  <p className="font-bold text-slate-950">{selectedNotif.vaultId.slice(6)}</p>
                </div>
              </div>

              {/* Sections Breakdown: New Digital Custody Record */}
              <div className="space-y-5">
                <div className="space-y-2">
                  <h4 className="text-[10px] font-mono uppercase text-slate-400 font-bold block tracking-[0.24em]">
                    {language === 'es' ? 'FEED OPERATIVO DE CUSTODIA' : 'CUSTODY OPERATIONAL FEED'}
                  </h4>
                  <div className="glass-surface-soft rounded-[24px] p-3">
                    <ProcessEventFeed items={notificationFeedItems} variant="compact" className="max-h-[320px]" />
                  </div>
                </div>
                
                {/* 1. Authorized Recipient */}
                <div className="space-y-2">
                  <h4 className="text-[10px] font-mono uppercase text-slate-400 font-bold block tracking-[0.24em]">
                    1. {language === 'es' ? 'DESTINATARIO AUTORIZADO' : 'AUTHORIZED RECIPIENT'}
                  </h4>
                  <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-2xl flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-950/5 flex items-center justify-center text-slate-950">
                      <User size={14} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-950">
                        {language === 'es' ? 'Su Usuario (Usted)' : 'Your Account (You)'}
                      </p>
                      <p className="text-[10px] text-slate-500 font-mono uppercase">
                        {selectedNotif.recipientUsername}
                      </p>
                    </div>
                  </div>
                </div>

                {/* 2. Document or Evidence Report */}
                <div className="space-y-2">
                  <h4 className="text-[10px] font-mono uppercase text-slate-400 font-bold block tracking-[0.24em]">
                    2. {language === 'es' ? 'REPORTE DE EVIDENCIA Y FIRMA' : 'DOCUMENT OR EVIDENCE REPORT'}
                  </h4>
                  
                  <div className="border border-slate-200 rounded-2xl divide-y divide-slate-100 overflow-hidden bg-white">
                    
                    {/* Filename & Timestamp */}
                    <div className="p-3 bg-slate-50 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-2 min-w-0">
                        <FileCheck2 size={14} className="text-emerald-600 flex-shrink-0" />
                        <span className="text-xs font-bold text-slate-950 truncate">
                          {selectedNotif.originalFilename || (language === 'es' ? 'Mensaje o Declaración Directa' : 'Direct Statement/Message')}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-slate-400 whitespace-nowrap">
                        <Clock size={11} />
                        <span>{new Date(selectedNotif.timestamp).toLocaleString()}</span>
                      </div>
                    </div>

                    {/* SHA3-256 Hash */}
                    <div className="p-3 bg-white space-y-1.5">
                      <span className="text-[9px] font-mono text-slate-400 uppercase font-semibold">
                        SHA3-256 {language === 'es' ? 'HUELLA DIGITAL' : 'FINGERPRINT'}
                      </span>
                      <div className="flex items-center justify-between gap-4 bg-slate-50 border border-slate-200 px-2 py-1.5 rounded-2xl">
                        <span className="text-[10px] font-mono text-slate-700 truncate select-all">
                          {selectedNotif.sha3Hash}
                        </span>
                        <button
                          onClick={() => copyToClipboard(selectedNotif.sha3Hash)}
                          className="text-slate-400 hover:text-slate-950 p-1 transition-colors"
                          title="Copiar Hash"
                        >
                          {copied ? <Check size={11} className="text-green-600" /> : <Copy size={11} />}
                        </button>
                      </div>
                    </div>

                    {/* Custody Notes */}
                    {selectedNotif.notes && (
                      <div className="glass-surface-soft rounded-[20px] p-3 space-y-1">
                        <span className="text-[9px] font-mono text-slate-400 uppercase font-semibold">
                          {language === 'es' ? 'OBSERVACIONES / CUSTODIA' : 'OBSERVATIONS / CUSTODIA'}
                        </span>
                        <p className="text-xs text-slate-700 leading-relaxed font-sans">
                          {selectedNotif.notes}
                        </p>
                      </div>
                    )}

                    {/* Emisario (Sender profile) */}
                    {selectedNotif.senderProfile && (
                      <div className="glass-surface-soft rounded-[20px] p-3 space-y-2">
                        <span className="text-[9px] font-mono text-slate-400 uppercase font-semibold block">
                          {language === 'es' ? 'EMISARIO / FIRMANTE CERTIFICADO' : 'EMISSARY / CERTIFIED SIGNER'}
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-sans">
                          <div className="space-y-1 glass-surface-soft p-2 rounded-[18px]">
                            <span className="text-slate-400 block text-[9px] uppercase font-mono">{language === 'es' ? 'Funcionario' : 'Officer'}</span>
                            <span className="font-bold text-slate-950 block truncate">
                              {selectedNotif.senderProfile.nombres} {selectedNotif.senderProfile.apellidos}
                            </span>
                          </div>
                          <div className="space-y-1 glass-surface-soft p-2 rounded-[18px]">
                            <span className="text-slate-400 block text-[9px] uppercase font-mono">{language === 'es' ? 'Matrícula' : 'License ID'}</span>
                            <span className="font-bold text-slate-950 block font-mono">{selectedNotif.senderProfile.matricula}</span>
                          </div>
                          <div className="space-y-1 glass-surface-soft p-2 rounded-[18px]">
                            <span className="text-slate-400 block text-[9px] uppercase font-mono">{language === 'es' ? 'Jurisdicción' : 'Jurisdiction'}</span>
                            <span className="font-bold text-slate-950 block truncate">{selectedNotif.senderProfile.jurisdiccion}</span>
                          </div>
                          <div className="space-y-1 glass-surface-soft p-2 rounded-[18px]">
                            <span className="text-slate-400 block text-[9px] uppercase font-mono">Email</span>
                            <span className="font-bold text-slate-950 block truncate">{selectedNotif.senderProfile.email}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Visualizer Trigger Block */}
                    {matchedVault && (
                      <div className="glass-surface-soft rounded-[20px] p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-white/60">
                        <div className="text-left">
                          <span className="text-[9px] font-mono text-indigo-700 uppercase font-bold block">
                            {language === 'es' ? 'VISTA PREVIA DE SEGURIDAD' : 'SECURITY PREVIEW'}
                          </span>
                          <span className="text-[10px] text-indigo-900/75 block leading-snug">
                            {language === 'es' 
                              ? 'Descifre el documento de forma temporal para revisarlo antes de firmar.' 
                              : 'Decrypt the document temporarily to review it before signing.'}
                          </span>
                        </div>
                        <button
                          onClick={decryptedPayload ? () => setDecryptedPayload(null) : handleDecryptAndPreview}
                          disabled={isDecrypting}
                          className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-2xl text-[10px] font-sans font-bold uppercase tracking-wider transition-all cursor-pointer ${
                            decryptedPayload 
                              ? 'bg-red-600 hover:bg-red-700 text-white' 
                              : 'bg-indigo-600 hover:bg-indigo-700 text-white animate-pulse'
                          }`}
                        >
                          {isDecrypting ? (
                            <>
                              <RefreshCw size={11} className="animate-spin" />
                              <span>{language === 'es' ? 'Descifrando...' : 'Decrypting...'}</span>
                            </>
                          ) : decryptedPayload ? (
                            <>
                              <EyeOff size={11} />
                              <span>{language === 'es' ? 'Cerrar Vista Previa' : 'Close Preview'}</span>
                            </>
                          ) : (
                            <>
                              <Eye size={11} />
                              <span>{language === 'es' ? 'Ver Documento' : 'View Document'}</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}

                    {/* Embedded Zero-Trace Secure Viewer */}
                    {decryptedPayload && (
                      <div className="glass-surface rounded-[24px] p-4 text-slate-950 space-y-3 text-left">
                        <div className="flex items-center justify-between border-b border-white/70 pb-2">
                          <div className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider font-bold">
                              {language === 'es' ? 'VISOR VOLÁTIL EN MEMORIA (FRICTIONLESS)' : 'VOLATILE MEMORY VIEWER (FRICTIONLESS)'}
                            </span>
                          </div>
                          <button
                            onClick={() => setDecryptedPayload(null)}
                            className="text-[9px] font-mono text-red-500 hover:text-red-700 uppercase tracking-widest font-bold"
                          >
                            {language === 'es' ? '[Purgar RAM]' : '[Purge RAM]'}
                          </button>
                        </div>
                        
                        <div className="p-1 glass-surface-soft rounded-[20px] overflow-hidden min-h-[300px] flex flex-col justify-between">
                          {decryptedPayload.includes('application/pdf') ? (
                            <div className="flex flex-col items-center justify-center p-2 glass-surface-soft rounded-[18px] space-y-3 w-full">
                              <object
                                data={decryptedPayload}
                                type="application/pdf"
                                className="w-full h-[400px] bg-slate-800 rounded-[18px] border border-slate-700"
                              >
                                <iframe
                                  src={decryptedPayload}
                                  className="w-full h-[400px] bg-slate-800 rounded-[18px] border border-slate-700"
                                  title="Zero-Trace Document View"
                                />
                              </object>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => {
                                    const newWindow = window.open();
                                    if (newWindow) {
                                      newWindow.document.write(
                                        `<iframe src="${decryptedPayload}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`
                                      );
                                    } else {
                                      alert(language === 'es' ? 'La ventana emergente fue bloqueada por su navegador.' : 'Popup was blocked by your browser.');
                                    }
                                  }}
                                  className="glass-button-primary px-3 py-1.5 text-[10px] font-sans font-bold cursor-pointer"
                                >
                                  {language === 'es' ? 'Abrir PDF en pantalla completa' : 'Open PDF in full screen'}
                                </button>
                                <button
                                  onClick={() => {
                                    const link = document.createElement('a');
                                    link.href = decryptedPayload;
                                    link.download = selectedNotif.originalFilename || 'evidencia_descifrada.pdf';
                                    document.body.appendChild(link);
                                    link.click();
                                    document.body.removeChild(link);
                                  }}
                                  className="glass-button-secondary px-3 py-1.5 text-[10px] font-sans font-bold cursor-pointer"
                                >
                                  {language === 'es' ? 'Descargar PDF' : 'Download PDF'}
                                </button>
                              </div>
                            </div>
                          ) : decryptedPayload.startsWith('data:image/') ? (
                            <div className="flex items-center justify-center p-4 glass-surface-soft rounded-[18px]">
                              <img
                                src={decryptedPayload}
                                alt="Decrypted Evidence"
                                className="max-w-full max-h-[350px] object-contain border border-slate-800 rounded-[18px] shadow-xl"
                                referrerPolicy="no-referrer"
                              />
                            </div>
                          ) : (
                            (() => {
                              let text = '';
                              if (decryptedPayload.startsWith('data:')) {
                                try {
                                  const parts = decryptedPayload.split(',');
                                  const base64Str = parts[1];
                                  text = atob(base64Str);
                                } catch (e) {
                                  text = decryptedPayload;
                                }
                              } else {
                                text = decryptedPayload;
                              }
                              
                              return (
                                <div className="glass-surface-soft p-4 rounded-[18px] border border-white/70 font-mono text-xs text-slate-700 overflow-auto hide-scrollbar max-h-[300px] leading-relaxed whitespace-pre-wrap select-text">
                                  {text}
                                </div>
                              );
                            })()
                          )}
                        </div>
                      </div>
                    )}

                    {/* Requires Digital Signature Row */}
                    {selectedNotif.requiresSignature && (
                      <div className="glass-surface-soft rounded-[24px] p-4 space-y-3" id="notification-signature-box">
                        <span className="text-[9px] font-mono text-slate-400 uppercase font-bold block">
                            {language === 'es' ? 'FIRMA DIGITAL DE RECIBO DE CUSTODIA' : 'DIGITAL RECEIPT SIGNATURE OF CUSTODY'}
                        </span>
                        
                        {selectedNotif.signatureStatus === 'signed' ? (
                          <div className="glass-surface-soft border border-emerald-100 p-3 rounded-[20px] space-y-2 text-emerald-950">
                            <div className="flex items-center gap-2">
                              <Check size={14} className="text-emerald-700 bg-emerald-100 p-0.5 rounded-full" />
                              <span className="text-xs font-bold uppercase tracking-wide">
                                {language === 'es' ? 'FIRMADO Y NOTARIZADO CON ÉXITO' : 'SUCCESSFULLY SIGNED & NOTARIZED'}
                              </span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-sans">
                              <div>
                                <span className="text-emerald-600/75 block text-[9px] uppercase font-mono">{language === 'es' ? 'Firmante' : 'Signer'}</span>
                                <span className="font-bold block">{selectedNotif.signerName}</span>
                              </div>
                              <div>
                                <span className="text-emerald-600/75 block text-[9px] uppercase font-mono">{language === 'es' ? 'Fecha y Hora' : 'Date & Time'}</span>
                                <span className="font-bold block">
                                  {selectedNotif.signatureTimestamp ? new Date(selectedNotif.signatureTimestamp).toLocaleString() : ''}
                                </span>
                              </div>
                            </div>
                            {selectedNotif.signatureStellarTxHash && (
                              <div className="pt-2 border-t border-emerald-100 space-y-1">
                                <span className="text-[9px] font-mono text-emerald-600/75 uppercase font-bold block">
                                  {language === 'es' ? 'Hash de Notarización de Firma (Stellar)' : 'Signature Notarization Hash (Stellar)'}
                                </span>
                                <div className="flex items-center justify-between gap-3 text-[10px] font-mono glass-surface-soft px-2 py-1.5 rounded-[16px]">
                                  <span className="text-emerald-900 truncate select-all">
                                    {selectedNotif.signatureStellarTxHash}
                                  </span>
                                  <a
                                    href={`https://stellar.expert/explorer/${settings.stellarNetwork === 'public' ? 'public' : 'testnet'}/tx/${selectedNotif.signatureStellarTxHash}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-emerald-700 hover:text-emerald-950 p-0.5 transition-colors animate-pulse"
                                    title={language === 'es' ? 'Ver en Stellar.expert' : 'View on Stellar.expert'}
                                    id="stellar-sign-tx-link"
                                  >
                                    <ExternalLink size={12} />
                                  </a>
                                </div>
                                {selectedNotif.signatureIsSimulated !== false && (
                                  <div className="text-[10px] text-amber-700 bg-amber-50/70 p-1.5 rounded-[14px] border border-amber-100/30 font-sans leading-normal">
                                    {language === 'es' 
                                      ? '⚠️ Firma Virtual de Demostración: Esta transacción se generó localmente de manera simulada porque no hay llaves de Stellar reales configuradas. No figurará en el explorador público. Configure su "STELLAR_SOURCE_SECRET" en la pestaña de Configuración para notarizaciones reales.'
                                      : '⚠️ Simulated/Virtual Signature: This transaction was generated locally because no real Stellar keys are configured in Settings. It will not appear on the public blockchain explorer. Configure "STELLAR_SOURCE_SECRET" in the Settings tab for live notarizations.'}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="glass-surface-soft border border-amber-100 p-4 rounded-[20px] space-y-3">
                            <div className="flex items-start gap-2.5">
                              <AlertCircle size={15} className="text-amber-700 flex-shrink-0 mt-0.5" />
                              <div className="space-y-0.5">
                                <h5 className="text-xs font-bold text-amber-900 uppercase">
                                  {language === 'es' ? 'Se requiere su firma digital' : 'Your digital signature is required'}
                                </h5>
                                <p className="text-[11px] text-amber-800 leading-normal">
                                  {language === 'es'
                                    ? 'El emisor ha solicitado su firma obligatoria de conformidad para este acta de custodia. Al firmar, se generará un recibo inmutable con su identidad poscuántica que se registrará de forma permanente en la red Stellar.'
                                    : 'The sender has requested your mandatory signature of receipt for this custody record. Signing will generate an immutable receipt with your post-quantum identity, registered permanently on Stellar.'}
                                </p>
                              </div>
                            </div>
                            
                            {user?.profile ? (
                              <button
                                onClick={handleSignReceipt}
                                disabled={isSigning}
                                className="w-full flex items-center justify-center gap-2 glass-button-primary text-white font-sans text-xs font-black uppercase tracking-wider px-4 py-2.5 rounded-[18px] transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                id="sign-receipt-btn"
                              >
                                {isSigning ? (
                                  <>
                                    <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    <span>{language === 'es' ? 'PROCESANDO FIRMA EN STELLAR LEDGER...' : 'PROCESSING SIGNATURE ON STELLAR LEDGER...'}</span>
                                  </>
                                ) : (
                                  <>
                                    <Check size={14} />
                                    <span>{language === 'es' ? 'Firmar y Notarizar Recibo de Custodia' : 'Sign & Notarize Custody Receipt'}</span>
                                  </>
                                )}
                              </button>
                            ) : (
                              <div className="glass-surface-soft border border-red-100 text-red-900 rounded-[18px] p-3 text-xs leading-normal">
                                <p className="font-bold">
                                  {language === 'es' ? 'Perfil incompleto' : 'Incomplete profile'}
                                </p>
                                <p className="text-red-800 mt-0.5">
                                  {language === 'es' 
                                    ? 'Para firmar este acta, primero debe configurar su identidad digital y pericial en la sección de "Perfil Pericial" en la configuración de la barra lateral.' 
                                    : 'To sign this record, you must first complete your digital and forensic identity under the "Forensic Profile" section in Sidebar settings.'}
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                  </div>
                </div>

                {/* Notarization details */}
                {selectedNotif.stellarTxHash && (
                  <div className="space-y-2">
                    <h4 className="text-[10px] font-mono uppercase text-gray-400 font-bold block">
                      3. {language === 'es' ? 'SOPORTE NOTARIAL STELLAR LEDGER' : 'STELLAR LEDGER NOTARIZATION'}
                    </h4>
                    <div className="glass-surface-soft p-3.5 rounded-[20px] space-y-2.5">
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="text-slate-500">{language === 'es' ? 'Número de Ledger:' : 'Ledger Number:'}</span>
                        <span className="font-bold text-slate-950 glass-surface-soft px-2 py-0.5 rounded-full">
                          #{selectedNotif.ledger || 51892150}
                        </span>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[9px] font-mono text-slate-400 uppercase font-semibold block">
                          Transaction Hash (Tx)
                        </span>
                        <div className="flex items-center justify-between gap-3 text-[10px] font-mono glass-surface-soft px-2 py-1.5 rounded-[16px]">
                          <span className="text-slate-700 truncate select-all">
                            {selectedNotif.stellarTxHash}
                          </span>
                          <a
                            href={`https://stellar.expert/explorer/${(matchedVault?.manifest?.stellarNotarization?.network || settings.stellarNetwork) === 'public' ? 'public' : 'testnet'}/tx/${selectedNotif.stellarTxHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 p-0.5 transition-colors"
                            title={language === 'es' ? 'Ver en Stellar.expert' : 'View on Stellar.expert'}
                          >
                            <ExternalLink size={12} />
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Actions & Download */}
                <div className="pt-3 border-t border-[#eaeaea] space-y-3">
                  <h4 className="text-[10px] font-mono uppercase text-gray-400 font-bold block">
                    {language === 'es' ? 'ACCIONES DE EVACUACIÓN / DESCARGA' : 'DISCHARGE & DOWNLOAD ACTIONS'}
                  </h4>

                  {isLocalOnly ? (
                    <div className="glass-surface-soft border border-amber-100 text-amber-900 rounded-[20px] p-4 flex gap-3 text-xs leading-normal">
                      <AlertCircle size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold">
                          {language === 'es' ? 'Evidencia Local en el Emisor' : 'Evidence Saved Locally on Sender Device'}
                        </p>
                        <p className="text-amber-800 mt-1">
                          {language === 'es' 
                            ? 'Este archivo supera el límite de peso de almacenamiento en la nube (1 MB). El emisor ha anclado las llaves y marcas de tiempo, pero el archivo físico se mantiene guardado en su propio dispositivo. Solicite el envío directo o copia física para auditarlo.' 
                            : 'This file exceeds the cloud storage size limit (1 MB). The sender has anchored all hashes and timestamps, but the file content remains strictly on their local device. Please request manual delivery to audit.'}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {isViewQAvailable && matchedVault?.viewQFileBase64 && (
                        <button
                          onClick={() => {
                            const ext = matchedVault.manifest.payload.originalFilename?.includes('.') 
                              ? matchedVault.manifest.payload.originalFilename.substring(matchedVault.manifest.payload.originalFilename.lastIndexOf('.'))
                              : '.txt';
                            const origName = matchedVault.manifest.payload.originalFilename || 'evidencia';
                            const baseName = origName.includes('.') ? origName.substring(0, origName.lastIndexOf('.')) : origName;
                            downloadFile(matchedVault.viewQFileBase64!, `${baseName}.viewQ`, matchedVault.id, 'viewq');
                          }}
                          disabled={isDownloading}
                          className="flex items-center justify-center gap-1.5 glass-button-primary text-white font-sans text-xs font-bold uppercase tracking-wider px-4 py-3 rounded-[18px] transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Lock size={12} className={isDownloading && downloadingType === 'viewq' ? 'animate-spin' : ''} />
                          <span>
                            {isDownloading && downloadingType === 'viewq'
                              ? (language === 'es' ? 'Descargando...' : 'Downloading...')
                              : (language === 'es' ? 'Descargar .viewQ' : 'Download .viewQ')}
                          </span>
                        </button>
                      )}

                      {isArmoredAvailable && matchedVault?.armoredFileBase64 && (
                        <button
                          onClick={() => {
                            const name = matchedVault.manifest.payload.originalFilename || 'evidencia_blindada.txt';
                            downloadFile(matchedVault.armoredFileBase64!, `blindado_${name}`, matchedVault.id, 'armored');
                          }}
                          disabled={isDownloading}
                          className="flex items-center justify-center gap-1.5 glass-button-primary text-white font-sans text-xs font-bold uppercase tracking-wider px-4 py-3 rounded-[18px] transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Download size={12} className={isDownloading && downloadingType === 'armored' ? 'animate-spin' : ''} />
                          <span>
                            {isDownloading && downloadingType === 'armored'
                              ? (language === 'es' ? 'Descargando...' : 'Downloading...')
                              : (language === 'es' ? 'Descargar Blindado' : 'Download Armored')}
                          </span>
                        </button>
                      )}

                      {!isViewQAvailable && !isArmoredAvailable && (
                        <div className="sm:col-span-2 py-4 text-center glass-surface-soft rounded-[18px] text-slate-400 font-sans text-xs italic">
                          {language === 'es' 
                            ? 'Este registro no contiene archivos binarios adjuntos para descargar (Mensaje de texto directo).' 
                            : 'This record does not contain attached binary files for download (Plain text statement).'}
                        </div>
                      )}
                    </div>
                  )}
                </div>

              </div>
              
            </div>
          ) : (
            /* Empty state detail view */
            <div className="glass-surface rounded-[30px] p-12 text-center space-y-4 h-full flex flex-col justify-center items-center min-h-[400px]">
              <div className="w-12 h-12 glass-surface-soft text-slate-400 flex items-center justify-center rounded-2xl">
                <FileCheck2 size={24} />
              </div>
              <div className="max-w-sm mx-auto space-y-2">
                <h3 className="font-sans font-bold text-xs text-slate-950 uppercase tracking-wider">
                  {language === 'es' ? 'Seleccione una notificación' : 'Select a notification'}
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {language === 'es' 
                    ? 'Haga clic en una alerta de la lista izquierda para expandir el acta de custodia, auditar las llaves ML-KEM, comprobar la notarización en Stellar o evacuar la evidencia.' 
                    : 'Click on any incoming notification in the left panel to expand the custody record, audit the ML-KEM keys, verify the Stellar notarization ledger, or download the evidence.'}
                </p>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
