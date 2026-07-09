import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Cpu, Zap, Activity, ShieldCheck, Thermometer, Radio, Clock, AlertCircle } from 'lucide-react';
import { translations } from '../translations';

export const TelemetryView: React.FC = () => {
  const { settings, language } = useApp();
  const t = translations[language];
  const [hoveredQubit, setHoveredQubit] = useState<number | null>(null);
  const [pulsePhase, setPulsePhase] = useState(0);

  // Animate laser pulse effect inside the RF trap visualization
  useEffect(() => {
    const timer = setInterval(() => {
      setPulsePhase((prev) => (prev + 1) % 100);
    }, 50);
    return () => clearInterval(timer);
  }, []);

  // Determine active telemetry stats based on chosen target
  const targetKey = settings.target;

  const isSimulated = targetKey === 'ionq.simulator';

  // Trapped Ion chain parameters
  const qubitCount = targetKey === 'ionq.qpu.forte-1' ? 35 : (targetKey === 'ionq.qpu.aria-1' ? 25 : 29);
  const displayedQubits = Math.min(qubitCount, 12); // Limit SVG visualizer length for aesthetics

  // Hover stats for individual qubits (trapped ions)
  const getQubitSpecs = (index: number) => {
    if (isSimulated) {
      return {
        type: language === 'es' ? 'Qubit Virtual (Coprocesamiento Equivalente)' : 'Virtual Qubit (Equivalent Processing)',
        fidelity: '99.999%',
        coherence: language === 'es' ? '∞ (Definido por Software)' : '∞ (Software defined)',
        frequency: language === 'es' ? 'N/A (Calculado)' : 'N/A (Calculated)',
        state: language === 'es' ? '|+> Superposición' : '|+> Superposition'
      };
    }
    
    // Trapped physical Ytterbium-171 ions
    const isForte = targetKey === 'ionq.qpu.forte-1';
    const baseFidelity = isForte ? 99.97 : 99.94;
    const variation = Math.sin(index * 2.3) * 0.02;
    const fidelity = (baseFidelity + variation).toFixed(3) + '%';
    const coherence = isForte 
      ? (1.5 + Math.sin(index * 1.7) * 0.1).toFixed(2) + 's' 
      : (0.95 + Math.sin(index * 1.7) * 0.08).toFixed(2) + 's';
    
    return {
      type: language === 'es' ? 'Qubit Físico de Ion Atrapado 171Yb+' : '171Yb+ Trapped Ion Qubit',
      fidelity: fidelity,
      coherence: coherence,
      frequency: language === 'es' ? '12.642821 GHz (Transición hiperfina)' : '12.642821 GHz (Hyperfine transition)',
      state: index % 3 === 0 
        ? (language === 'es' ? '|0> estado base' : '|0> ground state')
        : (index % 3 === 1 ? (language === 'es' ? '|1> estado excitado' : '|1> excited state') : (language === 'es' ? 'α|0> + β|1> superposición' : 'α|0> + β|1> superposed'))
    };
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header section */}
      <div className="border-b border-[#eaeaea] pb-5">
        <h1 className="font-sans font-semibold tracking-tight text-2xl text-[#111111]" id="telemetry-title">
          {t.telemetryTitle}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {t.telemetrySub}
        </p>
      </div>

      {/* Trap Visualization (Trapped Ion Physics) */}
      <div className="bg-[#18181b] border border-[#27272a] rounded-sm p-6 text-left relative overflow-hidden" id="ion-trap-visualizer-card">
        <div className="flex items-center justify-between pb-4 border-b border-[#27272a] mb-6">
          <div className="flex items-center gap-2">
            <Radio size={16} className="text-[#38bdf8] animate-pulse" />
            <h3 className="font-mono text-xs font-semibold text-gray-300">
              RF PAUL TRAP ION-CHAIN MONITOR // target: {settings.target}
            </h3>
          </div>
          <span className="text-[10px] font-mono bg-[#38bdf8]/10 text-[#38bdf8] border border-[#38bdf8]/20 px-2 py-0.5 rounded-sm">
            {isSimulated ? 'VIRTUAL COPROCESSOR' : 'PHYSICAL VACUUM TRAP'}
          </span>
        </div>

        {/* SVG Trap Graphics */}
        <div className="relative py-10 bg-[#09090b] rounded-sm border border-[#27272a]/50 flex items-center justify-center overflow-x-auto hide-scrollbar min-h-[220px]">
          {/* Background grid */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#27272a_1px,transparent_1px),linear-gradient(to_bottom,#27272a_1px,transparent_1px)] bg-[size:24px_24px] opacity-10" />

          {/* Paul Trap Electrodes drawing */}
          <svg className="w-full max-w-xl h-24 overflow-visible relative z-10" viewBox="0 0 600 100">
            {/* Top RF Electrode */}
            <path d="M 50 15 L 550 15 L 550 25 L 50 25 Z" fill="#27272a" stroke="#3f3f46" strokeWidth="1" />
            {/* Bottom RF Electrode */}
            <path d="M 50 75 L 550 75 L 550 85 L 50 85 Z" fill="#27272a" stroke="#3f3f46" strokeWidth="1" />

            {/* Trapping Fields RF lines (animated) */}
            <g opacity="0.3">
              <line x1="100" y1="30" x2="100" y2="70" stroke="#38bdf8" strokeWidth="1" strokeDasharray="3 3" />
              <line x1="200" y1="30" x2="200" y2="70" stroke="#38bdf8" strokeWidth="1" strokeDasharray="3 3" />
              <line x1="300" y1="30" x2="300" y2="70" stroke="#38bdf8" strokeWidth="1" strokeDasharray="3 3" />
              <line x1="400" y1="30" x2="400" y2="70" stroke="#38bdf8" strokeWidth="1" strokeDasharray="3 3" />
              <line x1="500" y1="30" x2="500" y2="70" stroke="#38bdf8" strokeWidth="1" strokeDasharray="3 3" />
            </g>

            {/* Individual trapped atomic ions (Fluorescent Qubits) */}
            {Array.from({ length: displayedQubits }).map((_, idx) => {
              const spacing = 500 / (displayedQubits + 1);
              const xCoord = 50 + spacing * (idx + 1);
              const isHovered = hoveredQubit === idx;
              
              // Glow color: virtual uses violet/emerald, physical uses cyan fluorescence
              const glowColor = isSimulated ? '#a855f7' : '#38bdf8';
              
              return (
                <g 
                  key={idx}
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredQubit(idx)}
                  onMouseLeave={() => setHoveredQubit(null)}
                >
                  {/* Laser addressing pulse (glowing laser dot moving) */}
                  {!isSimulated && hoveredQubit === idx && (
                    <line 
                      x1={xCoord} 
                      y1="0" 
                      x2={xCoord} 
                      y2="100" 
                      stroke="#f43f5e" 
                      strokeWidth="2.5" 
                      opacity="0.85" 
                      className="animate-pulse"
                    />
                  )}

                  {/* Qubit glow bubble */}
                  <circle
                    cx={xCoord}
                    cy="50"
                    r={isHovered ? 12 : 6}
                    fill={glowColor}
                    opacity={isHovered ? 0.45 : 0.2}
                    className="transition-all duration-200"
                  />
                  {/* Qubit Core Atom particle */}
                  <circle
                    cx={xCoord}
                    cy="50"
                    r={isHovered ? 5.5 : 3.5}
                    fill={isHovered ? '#ffffff' : glowColor}
                    stroke={isHovered ? glowColor : '#ffffff'}
                    strokeWidth="1"
                    className="transition-all duration-200"
                  />
                  {/* Hover visual tag */}
                  {isHovered && (
                    <text
                      x={xCoord}
                      y="32"
                      fill="#ffffff"
                      fontSize="9"
                      fontFamily="monospace"
                      textAnchor="middle"
                    >
                      q{idx}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        </div>

        {/* Hover info panel */}
        <div className="mt-4 min-h-[50px] border-t border-[#27272a] pt-4 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
          {hoveredQubit !== null ? (
            <>
              <div className="space-y-0.5 text-[#38bdf8]" id="qubit-spec-label">
                <span className="font-mono text-[10px] uppercase text-gray-500 font-semibold block">
                  {language === 'es' ? `ION SELECCIONADO: Qubit #${hoveredQubit}` : `SELECTED ION: Qubit #${hoveredQubit}`}
                </span>
                <span className="font-semibold">{getQubitSpecs(hoveredQubit).type}</span> • <span className="italic font-mono">{getQubitSpecs(hoveredQubit).state}</span>
              </div>
              <div className="flex gap-6 font-mono text-[11px] text-[#a1a1aa]">
                <div>
                  <span className="text-gray-600 mr-1.5">{t.qubitFidelity}:</span>
                  <span className="text-white font-semibold">{getQubitSpecs(hoveredQubit).fidelity}</span>
                </div>
                <div>
                  <span className="text-gray-600 mr-1.5">{t.qubitCoherence}:</span>
                  <span className="text-white font-semibold">{getQubitSpecs(hoveredQubit).coherence}</span>
                </div>
              </div>
            </>
          ) : (
            <p className="text-[#a1a1aa] font-mono text-[11px] italic mx-auto">
              {t.qubitHoverPrompt}
            </p>
          )}
        </div>
      </div>

      {/* Grid: Physical Stats & Environment diagnostics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left" id="telemetry-grid">
        
        {/* Card 1: Cryogenics & Temp */}
        <div className="bg-white border border-[#eaeaea] p-5 rounded-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#fafafa]">
            <h4 className="font-sans font-bold text-xs text-[#111111] uppercase tracking-widest flex items-center gap-2">
              <Thermometer size={14} className="text-blue-500" />
              {language === 'es' ? 'Criogenia y Vacío' : 'Cryogenics & Vacuum'}
            </h4>
          </div>
          
          <div className="space-y-3">
            <div>
              <span className="text-[9px] font-mono text-gray-400 block font-semibold">{language === 'es' ? 'TEMPERATURA DE CÁMARA (SHIELD)' : 'CHAMBER TEMPERATURE (SHIELD)'}</span>
              <p className="text-lg font-mono font-semibold text-gray-900 mt-0.5">
                {isSimulated ? '293.15 K' : '4.15 K'}
              </p>
              <span className="text-[10px] text-gray-400">
                {isSimulated ? (language === 'es' ? 'Temperatura Ambiente Virtual' : 'Virtual Ambient Temperature') : 'Liquid Helium Shielded QPU'}
              </span>
            </div>

            <div>
              <span className="text-[9px] font-mono text-gray-400 block font-semibold">{language === 'es' ? 'NIVEL DE VACÍO (ULTRA-HIGH VACUUM)' : 'VACUUM LEVEL (ULTRA-HIGH VACUUM)'}</span>
              <p className="text-lg font-mono font-semibold text-gray-900 mt-0.5">
                {isSimulated ? 'N/A' : '1.2 × 10⁻¹¹ Torr'}
              </p>
              <span className="text-[10px] text-gray-400">
                {isSimulated ? (language === 'es' ? 'Sin recipiente de vacío' : 'No vacuum vessel') : (language === 'es' ? 'Menor que la presión interestelar' : 'Less than interstellar pressure')}
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Gate Fidelities */}
        <div className="bg-white border border-[#eaeaea] p-5 rounded-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#fafafa]">
            <h4 className="font-sans font-bold text-xs text-[#111111] uppercase tracking-widest flex items-center gap-2">
              <Zap size={14} className="text-amber-500" />
              {language === 'es' ? 'Fidelidad de Compuertas' : 'Gate Fidelities'}
            </h4>
          </div>

          <div className="space-y-3">
            <div>
              <span className="text-[9px] font-mono text-gray-400 block font-semibold">{language === 'es' ? 'FIDELIDAD PROMEDIO SINGLE-QUBIT (1Q)' : 'AVERAGE SINGLE-QUBIT FIDELITY (1Q)'}</span>
              <p className="text-lg font-mono font-semibold text-gray-900 mt-0.5">
                {targetKey === 'ionq.qpu.forte-1' ? '99.97%' : (targetKey === 'ionq.qpu.aria-1' ? '99.94%' : '99.999%')}
              </p>
              <div className="w-full bg-gray-100 rounded-full h-1 mt-1.5">
                <div 
                  className="bg-emerald-500 h-1 rounded-full transition-all duration-500" 
                  style={{ width: targetKey === 'ionq.qpu.forte-1' ? '99.97%' : (targetKey === 'ionq.qpu.aria-1' ? '99.94%' : '100%') }}
                />
              </div>
            </div>

            <div>
              <span className="text-[9px] font-mono text-gray-400 block font-semibold">{language === 'es' ? 'FIDELIDAD COMPUERTA ENMARAÑANTE (2Q)' : 'ENTANGLING GATE FIDELITY (2Q)'}</span>
              <p className="text-lg font-mono font-semibold text-gray-900 mt-0.5">
                {targetKey === 'ionq.qpu.forte-1' ? '99.82%' : (targetKey === 'ionq.qpu.aria-1' ? '99.65%' : '99.99%')}
              </p>
              <div className="w-full bg-gray-100 rounded-full h-1 mt-1.5">
                <div 
                  className="bg-emerald-400 h-1 rounded-full transition-all duration-500" 
                  style={{ width: targetKey === 'ionq.qpu.forte-1' ? '99.82%' : (targetKey === 'ionq.qpu.aria-1' ? '99.65%' : '99.9%') }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: Queues & Availability */}
        <div className="bg-white border border-[#eaeaea] p-5 rounded-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#fafafa]">
            <h4 className="font-sans font-bold text-xs text-[#111111] uppercase tracking-widest flex items-center gap-2">
              <Clock size={14} className="text-emerald-500" />
              {language === 'es' ? 'Disponibilidad y Cola' : 'Availability & Queue'}
            </h4>
          </div>

          <div className="space-y-3">
            <div>
              <span className="text-[9px] font-mono text-gray-400 block font-semibold">{language === 'es' ? 'ESTADO DE HARDWARE' : 'HARDWARE STATUS'}</span>
              <div className="flex items-center gap-2 mt-1">
                <span className={`w-2.5 h-2.5 rounded-full ${targetKey === 'ionq.qpu.forte-1' ? 'bg-amber-400 animate-pulse' : 'bg-green-500'}`} />
                <p className="text-xs font-semibold text-gray-900">
                  {targetKey === 'ionq.qpu.forte-1' ? (language === 'es' ? 'CALIBRANDO (Forte-1)' : 'CALIBRATING (Forte-1)') : (language === 'es' ? 'ONLINE / DISPONIBLE' : 'ONLINE / AVAILABLE')}
                </p>
              </div>
              <span className="text-[10px] text-gray-400 mt-1 block">
                {targetKey === 'ionq.qpu.forte-1' ? (language === 'es' ? 'Ciclo ordinario de alineación óptica AOD' : 'Ordinary AOD optical alignment cycle') : (language === 'es' ? 'Listo para ejecutar trabajos' : 'Ready to execute jobs')}
              </span>
            </div>

            <div>
              <span className="text-[9px] font-mono text-gray-400 block font-semibold">{language === 'es' ? 'TIEMPO PROMEDIO DE COLA' : 'AVERAGE QUEUE TIME'}</span>
              <p className="text-lg font-mono font-semibold text-gray-900 mt-0.5">
                {targetKey === 'ionq.qpu.forte-1' ? '~12 Horas' : (targetKey === 'ionq.qpu.aria-1' ? '~4 Horas' : '0.00 Segundos')}
              </p>
              <span className="text-[10px] text-gray-400">
                {isSimulated ? (language === 'es' ? 'Acceso directo sin esperas' : 'Direct access without waiting') : (language === 'es' ? 'Espera estimada para jobs externos' : 'Estimated wait for external jobs')}
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* Physics Trapped-Ion explanation text */}
      <div className="bg-gray-50 border border-[#eaeaea] rounded-sm p-5 text-left flex gap-4">
        <AlertCircle className="text-gray-400 flex-shrink-0 mt-0.5" size={18} />
        <div>
          <h4 className="font-sans font-bold text-xs text-gray-900">{language === 'es' ? 'Nota de Arquitectura Física sobre Iones Atrapados (Trapped Ions)' : 'Physical Architecture Note on Trapped Ions'}</h4>
          <p className="text-[11px] text-gray-500 leading-relaxed mt-1">
            {language === 'es' 
              ? 'A diferencia de los procesadores superconductores que se fabrican sobre chips de silicio (sensibles a imperfecciones litográficas), las QPUs de IonQ utilizan átomos de Ytterbium idénticos en la naturaleza. Cada ion es levitado en una trampa de Paul al vacío absoluto y direccionado individualmente por un haz de láser de alta frecuencia para realizar compuertas lógicas de 1 y 2 qubits mediante fuerzas de Coulomb. El colapso aleatorio medido al final del circuito nos provee la aleatoriedad física ideal (QRNG) para inicializar nuestros esquemas criptográficos pre y poscuánticos NIST Kyber-768.' 
              : 'Unlike superconducting processors manufactured on silicon chips (sensitive to lithographic imperfections), IonQ QPUs use Ytterbium atoms identical in nature. Each ion is levitated in a Paul trap under absolute vacuum and individually addressed by a high-frequency laser beam to execute 1- and 2-qubit logic gates via Coulomb forces. The random collapse measured at the end of the circuit provides the ideal physical randomness (QRNG) to initialize our NIST Kyber-768 pre- and post-quantum cryptographic schemes.'}
          </p>
        </div>
      </div>
    </div>
  );
};
