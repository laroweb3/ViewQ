import React, { useRef } from 'react';
import { motion } from 'motion/react';
import {
  ArrowLeft,
  ArrowRight,
  Activity,
  Bell,
  Database,
  FileSearch,
  Sparkles,
  Users,
} from 'lucide-react';

type ExecutiveCarouselProps = {
  language: 'es' | 'en';
  target: string;
  isRunning: boolean;
  logsCount: number;
  vaultCount: number;
  notificationCount: number;
  unreadNotificationCount: number;
  onNavigate: (tab: string) => void;
};

type Slide = {
  label: string;
  title: string;
  description: string;
  metric: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  accent: string;
  actionLabel: string;
  actionTarget: string;
};

export const ExecutiveCarousel: React.FC<ExecutiveCarouselProps> = ({
  language,
  target,
  isRunning,
  logsCount,
  vaultCount,
  notificationCount,
  unreadNotificationCount,
  onNavigate,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const slides: Slide[] = [
    {
      label: language === 'es' ? 'CENTRO DE MANDO' : 'COMMAND CENTER',
      title: language === 'es' ? 'Estado operativo del nodo seguro' : 'Secure node operating status',
      description: language === 'es'
        ? 'Vista ejecutiva del flujo de custodia, con telemetría en vivo y una capa visual preparada para presentaciones de dirección.'
        : 'Executive view of the custody workflow, with live telemetry and a presentation-ready visual layer.',
      metric: isRunning ? (language === 'es' ? 'Procesando' : 'Processing') : (language === 'es' ? 'Estable' : 'Stable'),
      icon: Activity,
      accent: 'from-slate-950 via-slate-900 to-cyan-950',
      actionLabel: language === 'es' ? 'Abrir sellado' : 'Open sealing',
      actionTarget: 'transmission',
    },
    {
      label: language === 'es' ? 'REGISTRO' : 'REGISTRY',
      title: language === 'es' ? 'Activos custodiados y trazabilidad' : 'Custodied assets and traceability',
      description: language === 'es'
        ? 'La bóveda, los eventos y el historial se muestran como indicadores de negocio, no como bloques técnicos.'
        : 'Vaults, events, and history are presented as business indicators, not technical blocks.',
      metric: `${vaultCount.toString().padStart(2, '0')} ${language === 'es' ? 'bóvedas' : 'vaults'}`,
      icon: Database,
      accent: 'from-slate-900 via-indigo-950 to-slate-800',
      actionLabel: language === 'es' ? 'Ver historial' : 'View history',
      actionTarget: 'history',
    },
    {
      label: language === 'es' ? 'VERIFICACIÓN' : 'VERIFICATION',
      title: language === 'es' ? 'Auditoría forense y verificación' : 'Forensic audit and verification',
      description: language === 'es'
        ? 'Una lectura directa del estado de la firma, el hash y la evidencia para supervisión y control.'
        : 'A direct read of signature status, hash integrity, and evidence for supervision and control.',
      metric: `${logsCount.toString().padStart(2, '0')} ${language === 'es' ? 'eventos' : 'events'}`,
      icon: FileSearch,
      accent: 'from-cyan-900 via-slate-950 to-slate-900',
      actionLabel: language === 'es' ? 'Abrir verificador' : 'Open verifier',
      actionTarget: 'verify',
    },
    {
      label: language === 'es' ? 'COLABORACIÓN' : 'COLLABORATION',
      title: language === 'es' ? 'Notificaciones y acceso interno' : 'Notifications and internal access',
      description: language === 'es'
        ? 'Mensajes operativos, pendientes de revisión y accesos que necesitan una respuesta clara y rápida.'
        : 'Operational messages, pending reviews, and access items that need a clear, fast response.',
      metric: `${notificationCount.toString().padStart(2, '0')} ${language === 'es' ? 'alertas' : 'alerts'}`,
      icon: notificationCount > 0 ? Bell : Users,
      accent: 'from-slate-950 via-emerald-950 to-slate-900',
      actionLabel: language === 'es' ? 'Abrir notificaciones' : 'Open notifications',
      actionTarget: unreadNotificationCount > 0 ? 'notifications' : 'users',
    },
  ];

  const scrollSlides = (direction: number) => {
    const container = scrollRef.current;
    if (!container) return;
    container.scrollBy({ left: direction * container.clientWidth * 0.84, behavior: 'smooth' });
  };

  return (
    <section className="rounded-[28px] border border-slate-200/70 bg-white/80 backdrop-blur-xl shadow-[0_24px_80px_-44px_rgba(15,23,42,0.45)] p-4 sm:p-6">
      <div className="flex items-center justify-between gap-4 mb-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-500">
            <Sparkles size={12} className="text-cyan-600" />
            {language === 'es' ? 'Panel Ejecutivo' : 'Executive Panel'}
          </div>
          <h2 className="mt-3 text-lg sm:text-xl font-semibold tracking-tight text-slate-950">
            {language === 'es' ? 'Resumen corporativo de la operación' : 'Corporate overview of the operation'}
          </h2>
          <p className="mt-1 text-sm text-slate-500 max-w-2xl">
            {language === 'es'
              ? 'Una superficie visual más limpia, más jerárquica y pensada para presentaciones de dirección y seguimiento operativo.'
              : 'A cleaner, more hierarchical surface designed for leadership briefings and operational oversight.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => scrollSlides(-1)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition-transform hover:-translate-y-0.5 hover:text-slate-950 cursor-pointer"
            aria-label={language === 'es' ? 'Desplazar a la izquierda' : 'Scroll left'}
          >
            <ArrowLeft size={16} />
          </button>
          <button
            type="button"
            onClick={() => scrollSlides(1)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-slate-950 text-white shadow-sm transition-transform hover:-translate-y-0.5 hover:bg-slate-900 cursor-pointer"
            aria-label={language === 'es' ? 'Desplazar a la derecha' : 'Scroll right'}
          >
            <ArrowRight size={16} />
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto pb-2 pr-1 snap-x snap-mandatory scroll-smooth hide-scrollbar"
      >
        {slides.map((slide, index) => {
          const Icon = slide.icon;

          return (
            <motion.article
              key={slide.label}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08, duration: 0.45, ease: 'easeOut' }}
              whileHover={{ y: -4, scale: 1.01 }}
              className={`relative min-w-[280px] sm:min-w-[320px] lg:min-w-[360px] snap-start overflow-hidden rounded-[24px] border border-white/10 bg-gradient-to-br ${slide.accent} p-5 text-white shadow-[0_20px_55px_-30px_rgba(15,23,42,0.8)]`}
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.16),transparent_42%),radial-gradient(circle_at_bottom_left,rgba(34,211,238,0.18),transparent_35%)]" />
              <div className="relative flex h-full flex-col justify-between gap-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span className="inline-flex items-center rounded-full border border-white/10 bg-white/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-white/75">
                      {slide.label}
                    </span>
                    <h3 className="mt-4 text-xl font-semibold tracking-tight leading-tight">
                      {slide.title}
                    </h3>
                    <p className="mt-3 text-sm leading-6 text-white/72 max-w-sm">
                      {slide.description}
                    </p>
                  </div>

                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/10 backdrop-blur-sm">
                    <Icon size={20} className="text-cyan-200" />
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/8 p-4 backdrop-blur-sm">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="text-[10px] font-semibold uppercase tracking-[0.24em] text-white/55">
                        {language === 'es' ? 'Indicador principal' : 'Primary indicator'}
                      </div>
                      <div className="mt-1 text-2xl font-semibold tracking-tight">
                        {slide.metric}
                      </div>
                    </div>
                    <div className="text-right text-[11px] uppercase tracking-[0.22em] text-white/50">
                      {target}
                    </div>
                  </div>

                  <div className="mt-4 h-1.5 rounded-full bg-white/10">
                    <div className="h-1.5 w-2/3 rounded-full bg-gradient-to-r from-cyan-300 via-white to-cyan-200 shadow-[0_0_18px_rgba(255,255,255,0.45)]" />
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => onNavigate(slide.actionTarget)}
                    className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-semibold text-slate-950 shadow-sm transition-transform hover:-translate-y-0.5 cursor-pointer"
                  >
                    {slide.actionLabel}
                    <ArrowRight size={14} />
                  </button>
                  <div className="text-[10px] uppercase tracking-[0.24em] text-white/45">
                    {isRunning && index === 0 ? (language === 'es' ? 'En ejecución' : 'Running') : language === 'es' ? 'Listo para dirección' : 'Leadership ready'}
                  </div>
                </div>
              </div>
            </motion.article>
          );
        })}
      </div>
    </section>
  );
};
