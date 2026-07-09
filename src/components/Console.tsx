import React, { useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { Terminal, Trash2, ShieldCheck, RefreshCw } from 'lucide-react';

interface ConsoleProps {
  isRunning: boolean;
}

export const Console: React.FC<ConsoleProps> = ({ isRunning }) => {
  const { logs, clearLogs, language } = useApp();
  const consoleEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom of the console on new logs
  useEffect(() => {
    if (consoleEndRef.current) {
      consoleEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  const getLogColorClass = (level: string) => {
    switch (level) {
      case 'SUCCESS':
        return 'text-[#10b981] font-semibold'; // Emerald green
      case 'WARN':
        return 'text-[#f59e0b]'; // Amber orange
      case 'ERROR':
        return 'text-[#ef4444] font-bold animate-pulse'; // Bright red
      case 'SYSTEM':
        return 'text-[#38bdf8] font-bold tracking-wide'; // Sky blue
      default:
        return 'text-[#a1a1aa]'; // Zinc gray
    }
  };

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
      <div className="flex-1 p-5 overflow-y-auto font-mono text-xs leading-relaxed space-y-2 selection:bg-white/10 scrollbar-thin">
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
          <>
            {logs.map((log) => (
              <div key={log.id} className="flex items-start gap-2 border-b border-[#27272a]/10 pb-1">
                <span className="text-gray-600 select-none flex-shrink-0">[{log.timestamp}]</span>
                <span className="font-bold flex-shrink-0 select-none min-w-[55px]">
                  <span className={getLogColorClass(log.level)}>{log.level}</span>:
                </span>
                <span className={`break-all ${getLogColorClass(log.level)}`}>{log.message}</span>
              </div>
            ))}
            <div ref={consoleEndRef} />
          </>
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
