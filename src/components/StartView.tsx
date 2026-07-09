import React from 'react';
import { useApp } from '../context/AppContext';
import { motion } from 'motion/react';
import { Shield, Database, FileSearch, Bell, ArrowRight, Sparkles, Radio, ShieldCheck, Activity, Orbit, CheckCircle2 } from 'lucide-react';

type ExecutiveCard = {
  key: string;
  label: string;
  title: string;
  desc: string;
  indicator: string;
  action: string;
  tab: 'transmission' | 'history' | 'verify' | 'notifications';
  progress: number;
  accent: string;
  glow: string;
  className: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
};

const ProgressDial: React.FC<{ value: number; accent: string }> = ({ value, accent }) => {
  const safeValue = Math.max(0, Math.min(100, value));

  return (
    <div
      className="relative flex h-20 w-20 items-center justify-center rounded-full"
      style={{
        background: `conic-gradient(${accent} ${safeValue * 3.6}deg, rgba(148,163,184,0.16) 0deg)`,
      }}
    >
      <div className="absolute inset-[7px] rounded-full bg-white/88 backdrop-blur-xl" />
      <div className="relative text-center">
        <span className="block text-[18px] font-semibold leading-none text-slate-950">{safeValue}</span>
        <span className="mt-1 block text-[9px] font-mono uppercase tracking-[0.2em] text-slate-400">score</span>
      </div>
    </div>
  );
};

const BeamButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({ children, className = '', ...props }) => {
  return (
    <button
      {...props}
      className={`group relative inline-flex overflow-hidden rounded-2xl border border-slate-200/80 bg-white/82 px-4 py-3 text-xs font-bold uppercase tracking-[0.18em] text-slate-900 shadow-[0_18px_40px_-28px_rgba(15,23,42,0.35)] backdrop-blur-xl transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:bg-white ${className}`}
    >
      <motion.span
        className="pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 bg-[linear-gradient(90deg,transparent,rgba(99,102,241,0.24),transparent)] opacity-0 group-hover:opacity-100"
        initial={{ x: '-15%' }}
        whileHover={{ x: '360%' }}
        transition={{ duration: 0.9, ease: 'easeOut' }}
      />
      <span className="relative z-10 flex items-center justify-center gap-2">{children}</span>
    </button>
  );
};

export const StartView: React.FC = () => {
  const { setActiveTab } = useApp();

  const cards: ExecutiveCard[] = [
    {
      key: 'command',
      label: 'COMMAND CENTER',
      title: 'Secure node operating status',
      desc: 'Executive view of the custody workflow, with live telemetry and a presentation-ready visual layer.',
      indicator: 'Stable',
      action: 'Open sealing',
      tab: 'transmission',
      progress: 96,
      accent: '#2563eb',
      glow: 'from-sky-500/18 via-blue-500/10 to-transparent',
      className: 'lg:col-span-5 lg:row-span-2',
      icon: Shield,
    },
    {
      key: 'registry',
      label: 'REGISTRY',
      title: 'Custodied assets and traceability',
      desc: 'Vaults, events, and history are presented as business indicators, not technical blocks.',
      indicator: '11 vaults',
      action: 'View history',
      tab: 'history',
      progress: 84,
      accent: '#059669',
      glow: 'from-emerald-500/18 via-teal-500/10 to-transparent',
      className: 'lg:col-span-4 lg:row-span-1',
      icon: Database,
    },
    {
      key: 'verification',
      label: 'VERIFICATION',
      title: 'Forensic audit and verification',
      desc: 'A direct read of signature status, hash integrity, and evidence for supervision and control.',
      indicator: '00 events',
      action: 'Open verifier',
      tab: 'verify',
      progress: 72,
      accent: '#7c3aed',
      glow: 'from-violet-500/18 via-fuchsia-500/10 to-transparent',
      className: 'lg:col-span-3 lg:row-span-1',
      icon: FileSearch,
    },
    {
      key: 'collaboration',
      label: 'COLLABORATION',
      title: 'Notifications and internal access',
      desc: 'Operational messages, pending reviews, and access items that need a clear, fast response.',
      indicator: '03 alerts',
      action: 'Open notifications',
      tab: 'notifications',
      progress: 63,
      accent: '#f97316',
      glow: 'from-orange-500/18 via-amber-500/10 to-transparent',
      className: 'lg:col-span-4 lg:row-span-1',
      icon: Bell,
    },
  ];

  const steps = [
    {
      num: 1,
      title: 'The Safe Envelope',
      text: 'We encrypt your file, placing it in an unbreakable "digital envelope". Only your chosen recipient holds the key required to open it.',
    },
    {
      num: 2,
      title: 'Quantum Lock',
      text: 'We lock the envelope using a real physical IonQ quantum chip. It works like a padlock with infinite atom-generated combinations, uncrackable.',
    },
    {
      num: 3,
      title: 'Digital Notary',
      text: 'We write the dispatch in Stellar, an unerasable public digital ledger. This certifies the exact second of dispatch and who the sender is.',
    },
    {
      num: 4,
      title: 'Receipt Signature',
      text: 'If you enable the signature requirement, the recipient is forced to digitally sign with their PIN to confirm they received the original, untouched file.',
    },
  ];

  return (
    <div id="start-view-root" className="space-y-8 max-w-7xl mx-auto">
      <motion.section
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative overflow-hidden rounded-[36px] border border-white/70 bg-[linear-gradient(145deg,rgba(255,255,255,0.84),rgba(255,255,255,0.6))] p-7 shadow-[0_40px_120px_-58px_rgba(15,23,42,0.42)] backdrop-blur-2xl md:p-9"
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.1),transparent_26%),radial-gradient(circle_at_bottom_right,rgba(16,185,129,0.08),transparent_22%)]" />
        <div className="pointer-events-none absolute inset-0 opacity-20 bg-[radial-gradient(circle,rgba(15,23,42,0.1)_1px,transparent_1px)] [background-size:22px_22px] [mask-image:radial-gradient(380px_circle_at_28%_18%,black,transparent)]" />

        <div className="relative grid gap-6 lg:grid-cols-[1.3fr_0.7fr] lg:items-end">
          <div className="space-y-5">
            <div className="flex flex-col gap-3">
              <h1 className="font-display text-3xl font-semibold tracking-tight text-slate-950 md:text-[2.55rem] md:leading-[1.05]">
                Quantum Sealing & Evidence Injection
              </h1>
              <p className="max-w-3xl text-sm leading-relaxed text-slate-600 md:text-[15px]">
                Protect your files with post-quantum cryptography (ML-KEM-768) reinforced with real IonQ QRNG entropy.
              </p>
            </div>

            <div className="inline-flex items-center gap-2 glass-badge px-3 py-1.5 text-[10px] font-mono uppercase tracking-[0.22em] text-slate-500">
              <Radio size={12} className="text-emerald-500" />
              ACTIVE SECURE NODE: ionq.simulator
            </div>

            <div className="rounded-[26px] border border-white/70 bg-white/62 p-5 shadow-[0_22px_44px_-32px_rgba(15,23,42,0.28)] backdrop-blur-2xl">
              <span className="mb-1 block text-[10px] font-mono uppercase tracking-[0.22em] text-slate-500">
                Executive Panel
              </span>
              <h2 className="font-display text-[1.45rem] font-semibold text-slate-950">
                Corporate overview of the operation
              </h2>
              <p className="mt-1.5 max-w-2xl text-xs leading-relaxed text-slate-600 md:text-[13px]">
                A cleaner, more hierarchical surface designed for leadership briefings and operational oversight.
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
            <div className="relative overflow-hidden rounded-[26px] border border-white/70 bg-white/74 p-5 shadow-[0_20px_50px_-34px_rgba(15,23,42,0.35)] backdrop-blur-2xl">
              <div className="relative flex items-center justify-between gap-4">
                <div>
                  <span className="block text-[10px] font-mono uppercase tracking-[0.18em] text-slate-500">COMMAND CENTER</span>
                  <p className="mt-2 text-2xl font-semibold text-slate-950">Stable</p>
                  <p className="mt-1 text-[11px] font-mono uppercase tracking-[0.18em] text-slate-500">ionq.simulator</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-[0_18px_34px_-20px_rgba(15,23,42,0.7)]">
                  <ShieldCheck size={20} />
                </div>
              </div>
            </div>

            <div className="rounded-[26px] border border-white/70 bg-white/68 p-4 shadow-[0_20px_50px_-34px_rgba(15,23,42,0.28)] backdrop-blur-2xl">
              <div className="flex items-center gap-3">
                <ProgressDial value={96} accent="#2563eb" />
                <div>
                  <span className="block text-[10px] font-mono uppercase tracking-[0.18em] text-slate-500">Leadership ready</span>
                  <p className="mt-1 text-sm font-semibold text-slate-950">Operational posture</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-[22px] border border-white/70 bg-white/66 p-4 backdrop-blur-xl shadow-[0_18px_40px_-34px_rgba(15,23,42,0.25)]">
                <Activity size={16} className="text-indigo-500" />
                <p className="mt-3 text-[10px] font-mono uppercase tracking-[0.18em] text-slate-500">Telemetry</p>
                <p className="mt-1 text-lg font-semibold text-slate-950">Live</p>
              </div>
              <div className="rounded-[22px] border border-white/70 bg-white/66 p-4 backdrop-blur-xl shadow-[0_18px_40px_-34px_rgba(15,23,42,0.25)]">
                <Orbit size={16} className="text-emerald-500" />
                <p className="mt-3 text-[10px] font-mono uppercase tracking-[0.18em] text-slate-500">QRNG</p>
                <p className="mt-1 text-lg font-semibold text-slate-950">IonQ</p>
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:auto-rows-[minmax(220px,1fr)]">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <motion.article
              key={card.key}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.42, delay: 0.06 }}
              whileHover={{ y: -4 }}
              className={`group relative overflow-hidden rounded-[28px] border border-white/70 bg-white/72 p-6 shadow-[0_26px_70px_-42px_rgba(15,23,42,0.38)] backdrop-blur-2xl ${card.className}`}
            >
              <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${card.glow} opacity-80`} />
              <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.75),transparent)] opacity-70" />

              <div className="relative flex h-full flex-col justify-between gap-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-3">
                    <span className="block text-[10px] font-mono uppercase tracking-[0.22em] text-slate-500">
                      {card.label}
                    </span>
                    <div className="space-y-1.5">
                      <h3 className="text-lg font-semibold text-slate-950">{card.title}</h3>
                      <p className="max-w-md text-xs leading-relaxed text-slate-600">{card.desc}</p>
                    </div>
                  </div>

                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-[0_18px_34px_-20px_rgba(15,23,42,0.72)]">
                    <Icon size={18} />
                  </div>
                </div>

                <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                  <div className="rounded-[22px] border border-white/80 bg-white/78 p-4 shadow-[0_18px_44px_-36px_rgba(15,23,42,0.25)] backdrop-blur-xl xl:min-w-[220px]">
                    <span className="block text-[10px] font-mono uppercase tracking-[0.2em] text-slate-500">
                      Primary indicator
                    </span>
                    <p className="mt-1 text-[1.45rem] font-semibold leading-none text-slate-950">{card.indicator}</p>
                    <p className="mt-2 text-[11px] font-mono uppercase tracking-[0.18em] text-slate-500">ionq.simulator</p>
                  </div>

                  <div className="flex items-center justify-between gap-4 xl:flex-col xl:items-end xl:justify-end">
                    <ProgressDial value={card.progress} accent={card.accent} />
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-[0.22em] text-slate-500">
                      <Sparkles size={12} className="text-indigo-500" />
                      Leadership ready
                    </span>
                  </div>
                </div>

                <BeamButton onClick={() => setActiveTab(card.tab)} className="w-full justify-center md:w-auto md:min-w-[220px]">
                  <Icon size={14} />
                  {card.action}
                  <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
                </BeamButton>
              </div>
            </motion.article>
          );
        })}
      </div>

      <section className="relative overflow-hidden rounded-[32px] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.78),rgba(255,255,255,0.58))] p-6 shadow-[0_28px_84px_-46px_rgba(15,23,42,0.36)] backdrop-blur-2xl md:p-8">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(99,102,241,0.08),transparent_20%),radial-gradient(circle_at_80%_20%,rgba(16,185,129,0.08),transparent_20%)]" />
        <div className="relative mb-6 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <span className="block text-[10px] font-mono uppercase tracking-[0.22em] text-slate-500">Custody pipeline</span>
            <h2 className="mt-1 font-display text-2xl font-semibold tracking-tight text-slate-950">From envelope to receipt signature</h2>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/78 px-3 py-1.5 text-[10px] font-mono uppercase tracking-[0.2em] text-slate-500 shadow-[0_18px_38px_-30px_rgba(15,23,42,0.25)]">
            <CheckCircle2 size={12} className="text-emerald-500" />
            4-step executive replay
          </div>
        </div>

        <div className="relative grid grid-cols-1 gap-3.5 md:grid-cols-2 xl:grid-cols-4">
          {steps.map((step) => (
            <motion.div
              key={step.num}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: step.num * 0.04 }}
              whileHover={{ y: -3, scale: 1.01 }}
              className="relative overflow-hidden rounded-[24px] border border-white/80 bg-white/78 p-5 shadow-[0_20px_46px_-34px_rgba(15,23,42,0.3)] backdrop-blur-xl"
            >
              <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(59,130,246,0.42),transparent)]" />
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-950 text-[11px] font-mono font-bold text-white shadow-[0_12px_22px_-16px_rgba(15,23,42,0.7)]">
                {step.num}
              </span>
              <h3 className="mt-4 text-sm font-semibold text-slate-950">{step.title}</h3>
              <p className="mt-2 text-xs leading-relaxed text-slate-600">{step.text}</p>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
};
