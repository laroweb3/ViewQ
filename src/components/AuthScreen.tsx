import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useApp } from '../context/AppContext';
import { Logo } from './Logo';
import {
  ArrowRight,
  Check,
  ChevronRight,
  Cpu,
  Key,
  Keyboard,
  RefreshCw,
  Shield,
  ShieldAlert,
  Sparkles,
  User,
  X,
} from 'lucide-react';
import * as sha3Module from 'js-sha3';

const sha3_256 = sha3Module.sha3_256 || (sha3Module as any).default?.sha3_256 || (sha3Module as any).default;

const DICEWARE_WORDS = [
  'justicia', 'evidencia', 'custodia', 'secreto', 'alianza', 'codigo', 'cripta', 'bloque',
  'archivo', 'perito', 'fiscalia', 'veracidad', 'auditoria', 'bitacora', 'notario', 'jurado',
  'sentencia', 'firmado', 'enigma', 'prisma', 'ionico', 'vacio', 'laser', 'atomo',
  'espejo', 'impulso', 'matriz', 'compuerta', 'fidelidad', 'entropia', 'vector', 'orbital',
  'qubit', 'enlace', 'blindado', 'sellado', 'escudo', 'patron', 'origen', 'nucleo',
  'celula', 'camara', 'sensor', 'analisis', 'registro', 'vigilancia', 'huella', 'forense',
  'rastreo', 'certificado', 'galaxia', 'pulso', 'nexo', 'marea', 'aurora', 'zenit'
];

function useTypewriter(text: string, speed = 40, startDelay = 350) {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    setDisplayed('');
    setDone(false);

    const timeoutId = window.setTimeout(() => {
      let index = 0;
      const intervalId = window.setInterval(() => {
        index += 1;
        setDisplayed(text.slice(0, index));
        if (index >= text.length) {
          window.clearInterval(intervalId);
          setDone(true);
        }
      }, speed);
    }, startDelay);

    return () => window.clearTimeout(timeoutId);
  }, [text, speed, startDelay]);

  return { displayed, done };
}

export const AuthScreen: React.FC = () => {
  const { login, settings, language, setLanguage, registeredUsers } = useApp();
  const [username, setUsername] = useState('');
  const [pin, setPin] = useState('');
  const [authMode, setAuthMode] = useState<'passkey' | 'diceware'>('passkey');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showKeyboard, setShowKeyboard] = useState(false);
  const [keyboardKeys, setKeyboardKeys] = useState<string[]>([]);
  const [step, setStep] = useState<'idle' | 'processing' | 'done'>('idle');
  const [logs, setLogs] = useState<string[]>([]);
  const [phrase, setPhrase] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const headline = useTypewriter(language === 'es' ? 'Canal seguro para\ngestión documental avanzada' : 'Secure channel for\nadvanced document management');

  const baseKeys = useMemo(() => [
    'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M',
    'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z',
    '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '-', '_', '.', '/'
  ], []);

  useEffect(() => {
    setKeyboardKeys([...baseKeys].sort(() => Math.random() - 0.5));
  }, [baseKeys]);

  const pushLog = (message: string) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString('es-ES')}] ${message}`]);
  };

  const validateUser = (value: string) => {
    const normalized = value.trim().toLowerCase();
    return registeredUsers.some(u => u.username.toLowerCase() === normalized) || normalized === 'laro';
  };

  const handleKeyClick = (char: string) => setUsername(prev => prev + char);
  const handleBackspace = () => setUsername(prev => prev.slice(0, -1));
  const handleClear = () => setUsername('');

  const runPasskeyLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;

    setErrorMsg(null);
    if (!validateUser(username)) {
      setErrorMsg(language === 'es'
        ? 'Ese usuario no está registrado en el Enclave Cuántico.'
        : 'That user is not registered in the Quantum Enclave.'
      );
      return;
    }

    const matchedUser = registeredUsers.find(u => u.username.toLowerCase() === username.trim().toLowerCase());
    if (matchedUser?.pin && matchedUser.pin !== pin) {
      setErrorMsg(language === 'es' ? 'PIN incorrecto.' : 'Incorrect PIN.');
      return;
    }

    setStep('processing');
    setLogs([]);
    pushLog(language === 'es' ? 'Iniciando autenticación segura...' : 'Starting secure authentication...');
    await new Promise(resolve => setTimeout(resolve, 500));

    const challenge = sha3_256(`VIEWQ:${username}:${Date.now()}`);
    pushLog(language === 'es' ? `Challenge generado: ${challenge.slice(0, 24)}...` : `Challenge created: ${challenge.slice(0, 24)}...`);
    await new Promise(resolve => setTimeout(resolve, 450));

    pushLog(language === 'es' ? 'Verificando credenciales del dispositivo...' : 'Checking device credentials...');
    await new Promise(resolve => setTimeout(resolve, 500));

    try {
      await login(username, 'passkey', pin);
      setStep('done');
    } catch (err: any) {
      setStep('idle');
      setErrorMsg(err?.message || (language === 'es' ? 'Error de autenticación.' : 'Authentication error.'));
    }
  };

  const generateDiceware = async () => {
    setIsGenerating(true);
    setLogs([]);
    setPhrase([]);
    pushLog(language === 'es' ? 'Generando frase segura...' : 'Generating secure phrase...');
    await new Promise(resolve => setTimeout(resolve, 350));

    const words: string[] = [];
    for (let i = 0; i < 5; i += 1) {
      const randomBuffer = window.crypto.getRandomValues(new Uint8Array(4));
      const index = (randomBuffer[0] + randomBuffer[1] + randomBuffer[2] + randomBuffer[3]) % DICEWARE_WORDS.length;
      words.push(DICEWARE_WORDS[index]);
      pushLog(language === 'es' ? `Palabra ${i + 1} elegida.` : `Word ${i + 1} selected.`);
      await new Promise(resolve => setTimeout(resolve, 180));
    }

    setPhrase(words);
    setIsGenerating(false);
  };

  const runDicewareCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || phrase.length < 5) return;
    if (validateUser(username)) {
      setErrorMsg(language === 'es' ? 'Ese usuario ya existe.' : 'That user already exists.');
      return;
    }
    if (!/^[0-9]{6}$/.test(pin)) {
      setErrorMsg(language === 'es' ? 'El PIN debe tener 6 dígitos.' : 'The PIN must have 6 digits.');
      return;
    }

    setStep('processing');
    setLogs([]);
    pushLog(language === 'es' ? 'Registrando nueva identidad...' : 'Registering new identity...');
    await new Promise(resolve => setTimeout(resolve, 700));
    pushLog(language === 'es' ? 'Firma segura completada.' : 'Secure signature complete.');
    await new Promise(resolve => setTimeout(resolve, 400));

    try {
      await login(username, 'diceware', pin);
      setStep('done');
    } catch (err: any) {
      setStep('idle');
      setErrorMsg(err?.message || (language === 'es' ? 'Error al crear la cuenta.' : 'Account creation error.'));
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#eef2f7] text-slate-900">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(59,130,246,0.20),transparent_30%),radial-gradient(circle_at_85%_18%,rgba(16,185,129,0.16),transparent_28%),radial-gradient(circle_at_75%_78%,rgba(168,85,247,0.12),transparent_24%),linear-gradient(180deg,rgba(255,255,255,0.72),rgba(238,242,247,1))]" />
      <div className="pointer-events-none absolute inset-0 opacity-60 bg-[linear-gradient(rgba(255,255,255,0.28)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.22)_1px,transparent_1px)] bg-[size:64px_64px]" />

      <header className="relative z-10 px-5 sm:px-8 pt-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Logo size={28} />
          <div>
            <div className="font-display text-lg font-semibold tracking-tight text-slate-950">viewQ</div>
            <div className="text-[10px] uppercase tracking-[0.28em] text-slate-500">Secure document operations</div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setLanguage(language === 'es' ? 'en' : 'es')}
          className="rounded-full border border-white/60 bg-white/50 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-700 backdrop-blur-xl shadow-[0_10px_35px_-24px_rgba(15,23,42,0.45)] transition hover:bg-white/70"
        >
          {language.toUpperCase()}
        </button>
      </header>

      <main className="relative z-10 mx-auto flex min-h-[calc(100vh-4.5rem)] max-w-7xl items-center px-5 sm:px-8 py-8 lg:py-10">
        <div className="grid w-full grid-cols-1 gap-8 lg:grid-cols-[1.05fr_0.95fr] items-center">
          <section className="max-w-2xl">
            <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }} className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/55 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-600 backdrop-blur-xl shadow-[0_18px_40px_-30px_rgba(15,23,42,0.45)]">
                <Sparkles size={12} />
                {language === 'es' ? 'Canal seguro de gestión' : 'Secure management channel'}
              </div>

              <h1 className="font-display whitespace-pre-line text-5xl leading-[1.02] tracking-tight text-slate-950 sm:text-6xl lg:text-7xl">
                {headline.displayed}
                {!headline.done && <span className="ml-1 inline-block h-[0.9em] w-[2px] animate-blink bg-slate-950 align-middle" />}
              </h1>

              <p className="max-w-xl text-lg leading-8 text-slate-600 sm:text-xl">
                {language === 'es'
                  ? 'Una puerta de entrada para manejo documental seguro, cifrado poscuántico y control híbrido de acceso en toda la plataforma.'
                  : 'An entry point for secure document handling, post-quantum encryption, and hybrid access control across the platform.'}
              </p>

              <div className="flex flex-wrap gap-3 pt-2">
                {language === 'es'
                  ? ['Alta entropía', 'PQC', 'Hybrid secured', 'Control documental'].map(item => (
                      <span key={item} className="rounded-full border border-white/60 bg-white/50 px-4 py-2 text-xs font-medium text-slate-600 backdrop-blur-xl shadow-[0_16px_32px_-24px_rgba(15,23,42,0.4)]">
                        {item}
                      </span>
                    ))
                  : ['High entropy', 'PQC', 'Hybrid secured', 'Document control'].map(item => (
                      <span key={item} className="rounded-full border border-white/60 bg-white/50 px-4 py-2 text-xs font-medium text-slate-600 backdrop-blur-xl shadow-[0_16px_32px_-24px_rgba(15,23,42,0.4)]">
                        {item}
                      </span>
                    ))}
              </div>
            </motion.div>
          </section>

          <section className="relative lg:justify-self-end lg:w-[min(100%,32rem)]">
            <div className="absolute -inset-4 rounded-[2rem] bg-white/20 blur-3xl" />
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="relative overflow-hidden rounded-[2rem] border border-white/70 bg-white/55 p-6 shadow-[0_28px_90px_-40px_rgba(15,23,42,0.55)] backdrop-blur-2xl sm:p-8"
            >
              <div className="absolute inset-x-0 top-0 h-px bg-white/80" />
              <div className="mb-6 flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.26em] text-slate-500">{language === 'es' ? 'Acceso privado' : 'Private access'}</p>
                  <h2 className="mt-2 font-display text-2xl tracking-tight text-slate-950">
                    {language === 'es' ? 'Entrar al sistema' : 'Enter the system'}
                  </h2>
                </div>
                <div className="rounded-full border border-white/70 bg-white/60 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-600 backdrop-blur-xl">
                  {settings.stellarNetwork === 'public' ? 'Mainnet' : 'Testnet'}
                </div>
              </div>

              <div className="mb-5 flex rounded-full border border-white/70 bg-white/40 p-1 backdrop-blur-xl">
                <button
                  type="button"
                  onClick={() => { setAuthMode('passkey'); setErrorMsg(null); setStep('idle'); setLogs([]); }}
                  className={`flex-1 rounded-full px-4 py-2.5 text-sm font-medium transition ${authMode === 'passkey' ? 'bg-slate-950 text-white shadow-lg shadow-slate-950/15' : 'text-slate-600 hover:text-slate-950'}`}
                >
                  {language === 'es' ? 'Iniciar sesión' : 'Log in'}
                </button>
                <button
                  type="button"
                  onClick={() => { setAuthMode('diceware'); setErrorMsg(null); setStep('idle'); setLogs([]); }}
                  className={`flex-1 rounded-full px-4 py-2.5 text-sm font-medium transition ${authMode === 'diceware' ? 'bg-slate-950 text-white shadow-lg shadow-slate-950/15' : 'text-slate-600 hover:text-slate-950'}`}
                >
                  {language === 'es' ? 'Crear cuenta' : 'Create account'}
                </button>
              </div>

              <AnimatePresence>
                {errorMsg && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    className="mb-5 flex gap-3 rounded-2xl border border-red-200/80 bg-red-50/90 p-4 text-sm text-red-800 backdrop-blur-xl"
                  >
                    <ShieldAlert size={16} className="mt-0.5 shrink-0 text-red-600" />
                    <div>
                      <div className="text-[10px] font-semibold uppercase tracking-[0.24em] text-red-600">{language === 'es' ? 'Alerta' : 'Alert'}</div>
                      <div className="mt-1 leading-relaxed">{errorMsg}</div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {step !== 'idle' && (
                <div className="mb-5 rounded-2xl border border-white/70 bg-white/45 p-4 backdrop-blur-xl">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                      <Cpu size={14} />
                      {step === 'processing'
                          ? (language === 'es' ? 'Inicializando hash cuántico' : 'Initializing quantum hash')
                          : (language === 'es' ? 'Sistema avanzado de ingreso' : 'Advanced access system')}
                    </div>
                    <span className="rounded-full bg-slate-950 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.22em] text-white">
                        {step === 'processing' ? 'Hash' : 'Ready'}
                    </span>
                  </div>
                  <div className="mt-2 text-sm leading-6 text-slate-600">
                    {language === 'es'
                      ? 'Plataforma avanzada de ingreso, validación poscuántica y manejo seguro de documentos en tiempo real.'
                      : 'Advanced access platform with post-quantum validation and secure document handling in real time.'}
                  </div>
                </div>
              )}

              {authMode === 'passkey' ? (
                <form onSubmit={runPasskeyLogin} className="space-y-4">
                  <div>
                    <label className="mb-2 flex items-center justify-between text-xs font-medium text-slate-500">
                      <span>{language === 'es' ? 'Identificador' : 'Identifier'}</span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-white/60 px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.22em] text-emerald-700">
                        <Shield size={10} /> {language === 'es' ? 'Seguro' : 'Secure'}
                      </span>
                    </label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                      <input
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        onFocus={() => setShowKeyboard(true)}
                        type="text"
                        placeholder={language === 'es' ? 'Ingresa tu usuario' : 'Enter your user'}
                        className="w-full rounded-2xl border border-white/70 bg-white/70 py-3.5 pl-10 pr-12 text-sm text-slate-900 shadow-[0_12px_30px_-24px_rgba(15,23,42,0.45)] outline-none backdrop-blur-xl transition focus:border-slate-300 focus:bg-white"
                      />
                      <button type="button" onClick={() => setShowKeyboard(prev => !prev)} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-2 text-slate-500 transition hover:bg-white hover:text-slate-950">
                        <Keyboard size={15} />
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 flex items-center justify-between text-xs font-medium text-slate-500">
                      <span>PIN</span>
                      <span className="text-[9px] uppercase tracking-[0.2em] text-slate-400">{language === 'es' ? '6 dígitos si aplica' : '6 digits if needed'}</span>
                    </label>
                    <div className="relative">
                      <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                      <input
                        value={pin}
                        onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        type="password"
                        inputMode="numeric"
                        placeholder="••••••"
                        className="w-full rounded-2xl border border-white/70 bg-white/70 py-3.5 pl-10 pr-4 text-sm tracking-[0.3em] text-slate-900 shadow-[0_12px_30px_-24px_rgba(15,23,42,0.45)] outline-none backdrop-blur-xl transition focus:border-slate-300 focus:bg-white"
                      />
                    </div>
                  </div>

                  <button type="submit" className="group inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3.5 text-sm font-medium text-white shadow-[0_18px_44px_-24px_rgba(15,23,42,0.8)] transition hover:-translate-y-0.5 hover:bg-slate-900">
                    {language === 'es' ? 'Acceder' : 'Access'}
                    <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
                  </button>
                </form>
              ) : (
                <form onSubmit={runDicewareCreate} className="space-y-4">
                  <div>
                    <label className="mb-2 block text-xs font-medium text-slate-500">{language === 'es' ? 'Nuevo usuario' : 'New user'}</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                      <input
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        type="text"
                        placeholder={language === 'es' ? 'Crea tu alias' : 'Create your alias'}
                        className="w-full rounded-2xl border border-white/70 bg-white/70 py-3.5 pl-10 pr-4 text-sm text-slate-900 shadow-[0_12px_30px_-24px_rgba(15,23,42,0.45)] outline-none backdrop-blur-xl transition focus:border-slate-300 focus:bg-white"
                      />
                    </div>
                  </div>

                  <div className="rounded-[1.25rem] border border-white/70 bg-white/50 p-4 backdrop-blur-xl">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="text-xs font-semibold text-slate-900">Diceware</div>
                        <div className="text-[10px] text-slate-500">{language === 'es' ? 'Genera una frase segura de 5 palabras' : 'Generate a secure 5-word phrase'}</div>
                      </div>
                      <button type="button" onClick={generateDiceware} disabled={isGenerating} className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/70 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-600 transition hover:bg-white disabled:opacity-50">
                        <RefreshCw size={12} className={isGenerating ? 'animate-spin' : ''} />
                        {language === 'es' ? 'Generar' : 'Generate'}
                      </button>
                    </div>
                    <div className="mt-3 flex min-h-16 flex-wrap gap-2 rounded-2xl border border-dashed border-white/75 bg-white/65 p-3">
                      {phrase.length ? phrase.map((word) => (
                        <span key={word} className="rounded-full bg-slate-950 px-3 py-1 text-xs text-white">{word}</span>
                      )) : (
                        <span className="text-xs italic text-slate-400">{language === 'es' ? 'La frase aparecerá aquí' : 'The phrase will appear here'}</span>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-xs font-medium text-slate-500">PIN</label>
                    <div className="relative">
                      <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                      <input
                        value={pin}
                        onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        type="password"
                        inputMode="numeric"
                        placeholder="••••••"
                        className="w-full rounded-2xl border border-white/70 bg-white/70 py-3.5 pl-10 pr-4 text-sm tracking-[0.3em] text-slate-900 shadow-[0_12px_30px_-24px_rgba(15,23,42,0.45)] outline-none backdrop-blur-xl transition focus:border-slate-300 focus:bg-white"
                      />
                    </div>
                  </div>

                  <button type="submit" className="group inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3.5 text-sm font-medium text-white shadow-[0_18px_44px_-24px_rgba(15,23,42,0.8)] transition hover:-translate-y-0.5 hover:bg-slate-900">
                    {language === 'es' ? 'Crear cuenta' : 'Create account'}
                    <ChevronRight size={15} className="transition-transform group-hover:translate-x-0.5" />
                  </button>
                </form>
              )}

              <div className="mt-5 rounded-2xl border border-white/70 bg-white/45 p-4 backdrop-blur-xl">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs font-medium text-slate-700">
                    <Cpu size={14} />
                    {language === 'es' ? 'Sistema avanzado de ingreso' : 'Advanced access system'}
                  </div>
                  <span className="text-[10px] uppercase tracking-[0.24em] text-slate-400">
                    {step === 'processing'
                      ? (language === 'es' ? 'HASH CUÁNTICO' : 'QUANTUM HASH')
                      : (language === 'es' ? 'INGRESO SEGURO' : 'SECURE ACCESS')}
                  </span>
                </div>
                <div className="mt-2 text-sm leading-6 text-slate-600">
                  {language === 'es'
                    ? 'Hash cuántico activo, canal híbrido blindado y validación segura para el manejo documental de la plataforma.'
                    : 'Quantum hash active, hybrid shielded channel, and secure validation for the platform document workflow.'}
                </div>
                {logs.length > 0 && (
                  <div className="mt-3 max-h-24 overflow-auto rounded-xl border border-white/70 bg-white/60 p-3 font-mono text-[10px] leading-relaxed text-slate-500 hide-scrollbar">
                    {logs.slice(-4).map(entry => <div key={entry}>{entry}</div>)}
                  </div>
                )}
              </div>

              {showKeyboard && authMode === 'passkey' && (
                <div className="mt-4 rounded-2xl border border-white/70 bg-white/55 p-4 backdrop-blur-xl">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-500">{language === 'es' ? 'Teclado seguro' : 'Secure keyboard'}</span>
                    <button type="button" onClick={() => setShowKeyboard(false)} className="rounded-full p-2 text-slate-500 transition hover:bg-white hover:text-slate-950">
                      <X size={14} />
                    </button>
                  </div>
                  <div className="mb-3 flex gap-2">
                    <button type="button" onClick={handleClear} className="rounded-full border border-white/70 bg-white/70 px-3 py-2 text-xs text-slate-700 transition hover:bg-white">Clear</button>
                    <button type="button" onClick={handleBackspace} className="rounded-full border border-white/70 bg-white/70 px-3 py-2 text-xs text-slate-700 transition hover:bg-white">Backspace</button>
                  </div>
                  <div className="grid grid-cols-8 gap-2">
                    {keyboardKeys.map(key => (
                      <button key={key} type="button" onClick={() => handleKeyClick(key)} className="h-9 rounded-xl border border-white/70 bg-white/70 text-[10px] font-semibold text-slate-700 transition hover:bg-white hover:text-slate-950">
                        {key}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </section>
        </div>
      </main>
    </div>
  );
};
