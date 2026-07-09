import React from 'react';
import { useApp } from '../context/AppContext';
import { Terminal, Trash2, ShieldCheck, RefreshCw } from 'lucide-react';
import { ProcessEventFeed } from './ProcessEventFeed';

interface ConsoleProps {
  isRunning: boolean;
}

export const Console: React.FC<ConsoleProps> = ({ isRunning }) => {
  const { logs, clearLogs, language } = useApp();
  const feedItems = logs.slice(-8).map((log, index) => {
    const tone = log.level === 'SUCCESS'
      ? { color: '#dcfce7', glyph: '✅' }
      : log.level === 'WARN'
        ? { color: '#fef3c7', glyph: '⚠️' }
        : log.level === 'ERROR'
          ? { color: '#fee2e2', glyph: '⛔' }
          : { color: '#dbeafe', glyph: '🛰️' };

    return {
      id: `${log.id}-${index}`,
      title: log.level,
      description: log.message,
      stage: log.timestamp,
      color: tone.color,
      status: log.level === 'ERROR' ? 'running' as const : log.level === 'SUCCESS' ? 'success' as const : isRunning && index === logs.slice(-8).length - 1 ? 'running' as const : 'success' as const,
      glyph: tone.glyph,
    };
  });

  return (
    <div id="quantum-console-container" className="flex flex-col bg-[#18181b] border border-[#27272a] rounded-sm overflow-hidden h-full min-h-[420px] md:min-h-[480px]">
      {/* Console Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#09090b] border-b border-[#27272a]">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-2 h-2 rounded-full bg-[#3f3f46]"></div>
            <div className="w-2 h-2 rounded-full bg-[#3f3f46]"></div>
            <div className="w-2 h-2 rounded-full bg-[#22c55e]"></div>
          </div>
          <span className="text-[11px] font-mono text-gray-400 ml-2 select-none flex items-center gap-1.5">
            <Terminal size={12} />
            ionq@vibedesk-qpu-node-03:~
          </span>
        </div>

        <div className="flex items-center gap-3">
          {isRunning ? (
            <span className="flex items-center gap-1.5 px-2 py-0.5 bg-[#f59e0b]/10 text-[#f59e0b] text-[10px] font-mono rounded-sm border border-[#f59e0b]/20 animate-pulse">
              <RefreshCw size={10} className="animate-spin" />
              STATUS: {language === 'es' ? 'PROCESANDO' : 'PROCESSING'}
            </span>
          ) : (
            <span className="flex items-center gap-1.5 px-2 py-0.5 bg-[#10b981]/10 text-[#10b981] text-[10px] font-mono rounded-sm border border-[#10b981]/20">
              <ShieldCheck size={10} />
              STATUS: {language === 'es' ? 'LISTO' : 'READY'}
            </span>
          )}

          {logs.length > 0 && (
            <button
              onClick={clearLogs}
              disabled={isRunning}
              className="p-1 rounded-sm text-gray-500 hover:text-gray-300 hover:bg-gray-800 disabled:opacity-40 transition-colors cursor-pointer"
              title={language === 'es' ? 'Limpiar consola' : 'Clear console'}
              id="clear-console-btn"
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Console Display Screen */}
      <div className="flex-1 p-5 overflow-y-auto hide-scrollbar font-mono text-xs leading-relaxed space-y-2 selection:bg-white/10">
        {logs.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-[#52525b] select-none py-12">
            <Terminal size={32} className="opacity-40 mb-3" />
            <p className="font-semibold text-gray-400">
              {language === 'es' ? 'Consola de Telemetría Cuántica' : 'Quantum Telemetry Console'}
            </p>
            <p className="text-[11px] max-w-sm mt-1 leading-normal">
              {language === 'es' 
                ? 'La consola está en espera. Configure sus parámetros y presione "Iniciar Sellado Cuántico" para visualizar el diagnóstico de flujo y sellado criptográfico en tiempo real.'
                : 'The console is waiting. Configure your parameters and press "Start Quantum Sealing" to visualize the flow diagnosis and cryptographic sealing in real time.'}
            </p>
          </div>
        ) : (
          <ProcessEventFeed items={feedItems} variant="dark" className="h-full min-h-[320px]" />
        )}
      </div>

      {/* Console Input Bar Simulation */}
      <div className="px-4 py-2 bg-[#09090b] border-t border-[#27272a] flex items-center font-mono text-xs text-gray-500 select-none">
        <span className="text-[#10b981] mr-1.5">guest@vibedesk:~$</span>
        <span className="flex-1">
          {isRunning ? (
            <span className="text-gray-400 animate-pulse">quantum-pipeline --run --active-qpu-target</span>
          ) : (
            <span className="text-gray-600">awaiting_transmission_payload_job_call</span>
          )}
        </span>
        <span className="w-1.5 h-3.5 bg-gray-400 animate-ping"></span>
      </div>
    </div>
  );
};
