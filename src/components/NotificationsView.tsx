import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
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
  EyeOff
} from 'lucide-react';
import { AppNotification } from '../types';

export const NotificationsView: React.FC = () => {
  const { notifications, vaults, markNotificationAsRead, language, addLog } = useApp();
  const [selectedNotif, setSelectedNotif] = useState<AppNotification | null>(null);
  const [copied, setCopied] = useState(false);

  const unreadCount = notifications.filter(n => n.status === 'unread').length;

  const handleSelectNotification = (notif: AppNotification) => {
    setSelectedNotif(notif);
    if (notif.status === 'unread') {
      markNotificationAsRead(notif.id);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 200);
  };

  // Find corresponding vault to enable downloads if available in cloud
  const matchedVault = selectedNotif ? vaults.find(v => v.id === selectedNotif.vaultId) : null;
  
  const isArmoredAvailable = matchedVault?.armoredFileBase64 && !matchedVault.armoredFileBase64.startsWith('local_only:');
  const isViewQAvailable = matchedVault?.viewQFileBase64 && !matchedVault.viewQFileBase64.startsWith('local_only:');
  const isLocalOnly = matchedVault?.viewQFileBase64?.startsWith('local_only:') || matchedVault?.armoredFileBase64?.startsWith('local_only:');

  const downloadFile = (base64Data: string, filename: string) => {
    const link = document.createElement('a');
    link.href = base64Data;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addLog('SUCCESS', `Evidencia descargada localmente desde notificación: ${filename}`);
  };

  return (
    <div className="space-y-6" id="notifications-view-container">
      {/* View Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#eaeaea] pb-5">
        <div>
          <h1 className="text-xl font-sans font-black tracking-tight text-gray-900 uppercase">
            {language === 'es' ? 'Alertas y Notificaciones' : 'Alerts & Notifications'}
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            {language === 'es' 
              ? 'Custodias digitales compartidas y selladas predictivamente por emisarios autorizados.' 
              : 'Digital custody records shared and sealed predictively by authorized emissaries.'}
          </p>
        </div>
        {unreadCount > 0 && (
          <span className="bg-red-50 text-red-700 border border-red-100 text-[10px] font-mono font-bold px-2.5 py-1 rounded-sm animate-pulse uppercase">
            {unreadCount} {language === 'es' ? 'Pendientes' : 'Unread'}
          </span>
        )}
      </div>

      {/* Grid Layout: Master list (Left) & Detail view (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left column: Notifications list */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-[#fafafa]">
            <Bell size={13} className="text-gray-400" />
            <span className="text-[10px] font-mono uppercase text-gray-400 font-bold">
              {language === 'es' ? 'Bandeja de Entrada' : 'Incoming Inbox'}
            </span>
          </div>

          {notifications.length === 0 ? (
            <div className="bg-white border border-[#eaeaea] rounded-sm p-8 text-center space-y-3">
              <div className="w-10 h-10 bg-[#fafafa] border border-[#eaeaea] text-gray-400 flex items-center justify-center rounded-sm mx-auto">
                <Bell size={18} />
              </div>
              <div className="max-w-xs mx-auto space-y-1">
                <p className="font-sans font-bold text-xs text-gray-900 uppercase tracking-wider">
                  {language === 'es' ? 'Sin notificaciones' : 'No notifications'}
                </p>
                <p className="text-[11px] text-gray-500 leading-normal">
                  {language === 'es'
                    ? 'No ha recibido ninguna notificación de custodia digital en esta cuenta todavía.'
                    : 'You have not received any digital custody alerts on this account yet.'}
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
              {notifications.map((notif) => {
                const isSelected = selectedNotif?.id === notif.id;
                const isUnread = notif.status === 'unread';
                
                return (
                  <button
                    key={notif.id}
                    onClick={() => handleSelectNotification(notif)}
                    className={`w-full text-left p-4 rounded-sm border transition-all flex flex-col gap-2 relative cursor-pointer ${
                      isSelected 
                        ? 'bg-black text-white border-black shadow-sm' 
                        : isUnread 
                          ? 'bg-white border-l-4 border-l-red-500 border-[#eaeaea] hover:bg-gray-50 text-gray-900' 
                          : 'bg-white border-[#eaeaea] hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isUnread ? 'bg-red-500' : 'bg-gray-300'}`} />
                        <span className={`text-[10px] font-mono truncate uppercase ${isSelected ? 'text-gray-300' : 'text-gray-400'}`}>
                          {language === 'es' ? 'De: ' : 'From: '}{notif.sender}
                        </span>
                      </div>
                      <span className={`text-[9px] font-mono whitespace-nowrap ${isSelected ? 'text-gray-400' : 'text-gray-400'}`}>
                        {new Date(notif.timestamp).toLocaleDateString()} {new Date(notif.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </span>
                    </div>

                    <h3 className="font-sans font-bold text-xs truncate max-w-full">
                      {notif.title}
                    </h3>

                    {notif.notes && (
                      <p className={`text-[11px] line-clamp-1 ${isSelected ? 'text-gray-300' : 'text-gray-500'}`}>
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
            <div className="bg-white border border-[#eaeaea] rounded-sm p-6 space-y-6 animate-fadeIn shadow-xs">
              
              {/* Header Details */}
              <div className="flex items-start justify-between gap-4 border-b border-[#eaeaea] pb-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-sm font-bold uppercase tracking-wider">
                      {language === 'es' ? 'Custodia Oficial Recibida' : 'Official Custody Received'}
                    </span>
                  </div>
                  <h2 className="font-sans font-bold text-sm text-gray-900 leading-snug">
                    {selectedNotif.title}
                  </h2>
                </div>
                <div className="text-right text-[10px] font-mono text-gray-400">
                  <p>{language === 'es' ? 'ID ACTA' : 'RECORD ID'}</p>
                  <p className="font-bold text-black">{selectedNotif.vaultId.slice(6)}</p>
                </div>
              </div>

              {/* Sections Breakdown: New Digital Custody Record */}
              <div className="space-y-5">
                
                {/* 1. Authorized Recipient */}
                <div className="space-y-2">
                  <h4 className="text-[10px] font-mono uppercase text-gray-400 font-bold block">
                    1. {language === 'es' ? 'DESTINATARIO AUTORIZADO' : 'AUTHORIZED RECIPIENT'}
                  </h4>
                  <div className="bg-[#fafafa] border border-[#eaeaea] p-3.5 rounded-sm flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-black/5 flex items-center justify-center text-black">
                      <User size={14} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-900">
                        {language === 'es' ? 'Su Usuario (Usted)' : 'Your Account (You)'}
                      </p>
                      <p className="text-[10px] text-gray-500 font-mono uppercase">
                        {selectedNotif.recipientUsername}
                      </p>
                    </div>
                  </div>
                </div>

                {/* 2. Document or Evidence Report */}
                <div className="space-y-2">
                  <h4 className="text-[10px] font-mono uppercase text-gray-400 font-bold block">
                    2. {language === 'es' ? 'REPORTE DE EVIDENCIA Y FIRMA' : 'DOCUMENT OR EVIDENCE REPORT'}
                  </h4>
                  
                  <div className="border border-[#eaeaea] rounded-sm divide-y divide-gray-100 overflow-hidden">
                    
                    {/* Filename & Timestamp */}
                    <div className="p-3 bg-[#fafafa] flex items-center justify-between gap-4">
                      <div className="flex items-center gap-2 min-w-0">
                        <FileCheck2 size={14} className="text-emerald-600 flex-shrink-0" />
                        <span className="text-xs font-bold text-gray-900 truncate">
                          {selectedNotif.originalFilename || (language === 'es' ? 'Mensaje o Declaración Directa' : 'Direct Statement/Message')}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-gray-400 whitespace-nowrap">
                        <Clock size={11} />
                        <span>{new Date(selectedNotif.timestamp).toLocaleString()}</span>
                      </div>
                    </div>

                    {/* SHA3-256 Hash */}
                    <div className="p-3 bg-white space-y-1.5">
                      <span className="text-[9px] font-mono text-gray-400 uppercase font-semibold">
                        SHA3-256 {language === 'es' ? 'HUELLA DIGITAL' : 'FINGERPRINT'}
                      </span>
                      <div className="flex items-center justify-between gap-4 bg-gray-50 border border-[#eaeaea] px-2 py-1.5 rounded-sm">
                        <span className="text-[10px] font-mono text-gray-700 truncate select-all">
                          {selectedNotif.sha3Hash}
                        </span>
                        <button
                          onClick={() => copyToClipboard(selectedNotif.sha3Hash)}
                          className="text-gray-400 hover:text-black p-1 transition-colors"
                          title="Copiar Hash"
                        >
                          {copied ? <Check size={11} className="text-green-600" /> : <Copy size={11} />}
                        </button>
                      </div>
                    </div>

                    {/* Custody Notes */}
                    {selectedNotif.notes && (
                      <div className="p-3 bg-white space-y-1">
                        <span className="text-[9px] font-mono text-gray-400 uppercase font-semibold">
                          {language === 'es' ? 'OBSERVACIONES / CUSTODIA' : 'OBSERVATIONS / CUSTODIA'}
                        </span>
                        <p className="text-xs text-gray-700 leading-relaxed font-sans">
                          {selectedNotif.notes}
                        </p>
                      </div>
                    )}

                    {/* Emisario (Sender profile) */}
                    {selectedNotif.senderProfile && (
                      <div className="p-3 bg-white space-y-2">
                        <span className="text-[9px] font-mono text-gray-400 uppercase font-semibold block">
                          {language === 'es' ? 'EMISARIO / FIRMANTE CERTIFICADO' : 'EMISSARY / CERTIFIED SIGNER'}
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-sans">
                          <div className="space-y-1 bg-[#fafafa] p-2 rounded-sm border border-gray-50">
                            <span className="text-gray-400 block text-[9px] uppercase font-mono">{language === 'es' ? 'Funcionario' : 'Officer'}</span>
                            <span className="font-bold text-gray-900 block truncate">
                              {selectedNotif.senderProfile.nombres} {selectedNotif.senderProfile.apellidos}
                            </span>
                          </div>
                          <div className="space-y-1 bg-[#fafafa] p-2 rounded-sm border border-gray-50">
                            <span className="text-gray-400 block text-[9px] uppercase font-mono">{language === 'es' ? 'Matrícula' : 'License ID'}</span>
                            <span className="font-bold text-gray-900 block font-mono">{selectedNotif.senderProfile.matricula}</span>
                          </div>
                          <div className="space-y-1 bg-[#fafafa] p-2 rounded-sm border border-gray-50">
                            <span className="text-gray-400 block text-[9px] uppercase font-mono">{language === 'es' ? 'Jurisdicción' : 'Jurisdiction'}</span>
                            <span className="font-bold text-gray-900 block truncate">{selectedNotif.senderProfile.jurisdiccion}</span>
                          </div>
                          <div className="space-y-1 bg-[#fafafa] p-2 rounded-sm border border-gray-50">
                            <span className="text-gray-400 block text-[9px] uppercase font-mono">Email</span>
                            <span className="font-bold text-gray-900 block truncate">{selectedNotif.senderProfile.email}</span>
                          </div>
                        </div>
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
                    <div className="bg-[#fafafa] border border-[#eaeaea] p-3.5 rounded-sm space-y-2.5">
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="text-gray-500">{language === 'es' ? 'Número de Ledger:' : 'Ledger Number:'}</span>
                        <span className="font-bold text-black bg-white border border-[#eaeaea] px-2 py-0.5 rounded-sm">
                          #{selectedNotif.ledger || 51892150}
                        </span>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[9px] font-mono text-gray-400 uppercase font-semibold block">
                          Transaction Hash (Tx)
                        </span>
                        <div className="flex items-center justify-between gap-3 text-[10px] font-mono bg-white border border-[#eaeaea] px-2 py-1.5 rounded-sm">
                          <span className="text-gray-700 truncate select-all">
                            {selectedNotif.stellarTxHash}
                          </span>
                          <a
                            href={`https://stellar.expert/explorer/testnet/tx/${selectedNotif.stellarTxHash}`}
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
                    <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-sm p-4 flex gap-3 text-xs leading-normal">
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
                            downloadFile(matchedVault.viewQFileBase64!, `${baseName}.viewQ`);
                          }}
                          className="flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-sans text-xs font-bold uppercase tracking-wider px-4 py-3 rounded-sm transition-colors cursor-pointer"
                        >
                          <Lock size={12} />
                          <span>{language === 'es' ? 'Descargar .viewQ' : 'Download .viewQ'}</span>
                        </button>
                      )}

                      {isArmoredAvailable && matchedVault?.armoredFileBase64 && (
                        <button
                          onClick={() => {
                            const name = matchedVault.manifest.payload.originalFilename || 'evidencia_blindada.txt';
                            downloadFile(matchedVault.armoredFileBase64!, `blindado_${name}`);
                          }}
                          className="flex items-center justify-center gap-1.5 bg-black hover:bg-gray-800 text-white font-sans text-xs font-bold uppercase tracking-wider px-4 py-3 rounded-sm transition-colors cursor-pointer"
                        >
                          <Download size={12} />
                          <span>{language === 'es' ? 'Descargar Blindado' : 'Download Armored'}</span>
                        </button>
                      )}

                      {!isViewQAvailable && !isArmoredAvailable && (
                        <div className="sm:col-span-2 py-4 text-center bg-[#fafafa] border border-[#eaeaea] rounded-sm text-gray-400 font-sans text-xs italic">
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
            <div className="bg-white border border-[#eaeaea] rounded-sm p-12 text-center space-y-4 h-full flex flex-col justify-center items-center min-h-[400px]">
              <div className="w-12 h-12 bg-[#fafafa] border border-[#eaeaea] text-gray-400 flex items-center justify-center rounded-sm">
                <FileCheck2 size={24} />
              </div>
              <div className="max-w-sm mx-auto space-y-2">
                <h3 className="font-sans font-bold text-xs text-gray-900 uppercase tracking-wider">
                  {language === 'es' ? 'Seleccione una notificación' : 'Select a notification'}
                </h3>
                <p className="text-xs text-gray-500 leading-relaxed">
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
