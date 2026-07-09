import React from 'react';
import { motion } from 'motion/react';
import { Check, RefreshCw, Clock } from 'lucide-react';

export type ProcessEventItem = {
  id: string;
  title: string;
  description: string;
  stage: string;
  color: string;
  status: 'pending' | 'running' | 'success';
  glyph: string;
};

interface ProcessEventFeedProps {
  items: ProcessEventItem[];
  className?: string;
  variant?: 'light' | 'dark' | 'compact';
}

const statusLabel: Record<ProcessEventItem['status'], string> = {
  pending: 'Queued',
  running: 'Live',
  success: 'Stamped',
};

export const ProcessEventFeed: React.FC<ProcessEventFeedProps> = ({
  items,
  className = 'h-[420px]',
  variant = 'light'
}) => {
  const isDark = variant === 'dark';
  const isCompact = variant === 'compact';

  const wrapperClass = isDark
    ? 'rounded-[24px] border border-white/8 bg-slate-950/55'
    : variant === 'compact'
      ? 'rounded-[22px] border border-white/70 bg-white/45'
      : '';

  const cardClass = isDark
    ? 'border-white/10 bg-white/6 shadow-[0_20px_55px_-38px_rgba(0,0,0,0.65)] backdrop-blur-xl'
    : isCompact
      ? 'border-white/75 bg-white/72 shadow-[0_18px_42px_-34px_rgba(15,23,42,0.3)] backdrop-blur-xl'
      : 'border-white/80 bg-white/80 shadow-[0_20px_55px_-38px_rgba(15,23,42,0.42)] backdrop-blur-xl';

  const titleClass = isDark ? 'text-white' : 'text-slate-950';
  const stageClass = isDark ? 'text-slate-300' : 'text-slate-500';
  const descClass = isDark ? 'text-white/65' : 'text-slate-600';
  const badgeClass = isDark
    ? 'border-white/10 bg-white/8 text-slate-200'
    : 'border-white/80 bg-white/85 text-slate-500';
  const gradientClass = isDark
    ? 'from-slate-950/90 via-slate-950/35 to-transparent'
    : 'from-white/85 via-white/40 to-transparent';

  return (
    <div className={`relative flex w-full flex-col overflow-hidden p-2 ${wrapperClass} ${className}`}>
      <div className="space-y-3">
        {items.map((item, index) => (
          <motion.div
            key={item.id}
            layout
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: index * 0.06, duration: 0.35, ease: 'easeOut' }}
            className={`relative mx-auto min-h-fit w-full cursor-pointer overflow-hidden rounded-[22px] border p-4 transition-all duration-200 ease-in-out hover:scale-[1.015] ${cardClass}`}
          >
            {item.status === 'running' && (
              <motion.div
                className="pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.55),transparent)]"
                animate={{ x: ['0%', '420%'] }}
                transition={{ duration: 1.6, repeat: Infinity, ease: 'linear' }}
              />
            )}

            <div className="relative flex flex-row items-start gap-3">
              <div
                className="flex size-10 items-center justify-center rounded-2xl text-lg shadow-[0_12px_30px_-18px_rgba(15,23,42,0.35)]"
                style={{ backgroundColor: item.color }}
              >
                <span>{item.glyph}</span>
              </div>

              <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
                <figcaption className={`flex flex-wrap items-center ${isCompact ? 'text-[13px]' : 'text-sm'} font-semibold ${titleClass}`}>
                  <span>{item.title}</span>
                  <span className={`mx-1 ${isDark ? 'text-slate-600' : 'text-slate-300'}`}>·</span>
                  <span className={`text-[11px] font-mono uppercase tracking-[0.16em] ${stageClass}`}>{item.stage}</span>
                </figcaption>
                <p className={`mt-1 ${isCompact ? 'text-[10px]' : 'text-[11px]'} leading-relaxed ${descClass}`}>{item.description}</p>
              </div>

              <div className={`flex flex-shrink-0 items-center gap-1 rounded-full border px-2 py-1 text-[10px] font-mono uppercase tracking-[0.16em] ${badgeClass}`}>
                {item.status === 'running' ? (
                  <RefreshCw size={11} className="animate-spin text-emerald-600" />
                ) : item.status === 'success' ? (
                  <Check size={11} className="text-emerald-600" />
                ) : (
                  <Clock size={11} className="text-slate-400" />
                )}
                <span>{statusLabel[item.status]}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className={`pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t ${gradientClass}`} />
    </div>
  );
};
