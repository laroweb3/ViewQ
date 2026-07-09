import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Logo } from './Logo';
import { 
  User, 
  Globe, 
  CreditCard, 
  Award, 
  MapPin, 
  Phone, 
  Mail, 
  CheckCircle, 
  ArrowRight, 
  ArrowLeft,
  Shield,
  HelpCircle
} from 'lucide-react';
import { UserProfile } from '../types';

export const ProfileWizard: React.FC = () => {
  const { updateUserProfile, language, setLanguage, logout, user } = useApp();
  
  // Steps: 1 (Personal Info), 2 (Professional Info), 3 (Contact Info), 4 (Review & Seal)
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);
  
  // Profile form state
  const [formData, setFormData] = useState<UserProfile>({
    nombres: '',
    apellidos: '',
    nacionalidad: language === 'es' ? 'Argentina' : 'United States',
    dni: '',
    matricula: '',
    jurisdiccion: '',
    contacto: '',
    email: user?.username.includes('@') ? user.username : ''
  });

  const [errors, setErrors] = useState<Partial<Record<keyof UserProfile, string>>>({});

  // Translation helpers
  const t = {
    es: {
      wizardTitle: 'Registro de Identidad Digital Forense',
      wizardSub: 'Complete su perfil oficial para asociar su firma certificada y credenciales de peritaje judicial a todos sus sellados e inyecciones cuánticas.',
      step1: 'Datos Personales',
      step2: 'Credenciales',
      step3: 'Contacto',
      step4: 'Verificar y Firmar',
      nombres: 'Nombres',
      apellidos: 'Apellidos',
      nacionalidad: 'Nacionalidad',
      dni: 'DNI / Pasaporte / ID Nacional',
      matricula: 'Matrícula Profesional / Registro',
      jurisdiccion: 'Jurisdicción / Tribunal / Fiscalía',
      contacto: 'Teléfono de Contacto',
      email: 'Correo Electrónico Oficial',
      next: 'Siguiente Paso',
      prev: 'Paso Anterior',
      finish: 'Confirmar y Vincular Identidad',
      validationReq: 'Este campo es obligatorio.',
      validationEmail: 'Ingrese un correo electrónico válido.',
      reviewTitle: 'Confirmación de Matrícula y Firma',
      reviewDesc: 'Al vincular estos datos, toda evidencia blindada o descargada en esta sesión se sellará inmutablemente en el ledger de Stellar con su certificación pericial.',
      logoutBtn: 'Cerrar Sesión',
      welcomeUser: 'Bienvenido, fiscal/perito',
      securityEnclave: 'Enclave de Seguridad Activo'
    },
    en: {
      wizardTitle: 'Forensic Digital Identity Registration',
      wizardSub: 'Complete your official profile to associate your certified signature and judicial expert credentials with all your quantum seals and injections.',
      step1: 'Personal Info',
      step2: 'Credentials',
      step3: 'Contact',
      step4: 'Verify & Sign',
      nombres: 'First Name',
      apellidos: 'Last Name',
      nacionalidad: 'Nationality',
      dni: 'DNI / Passport / National ID',
      matricula: 'Professional License / ID',
      jurisdiccion: 'Jurisdiction / Court / Prosecutor Office',
      contacto: 'Contact Phone Number',
      email: 'Official Email Address',
      next: 'Next Step',
      prev: 'Previous Step',
      finish: 'Confirm & Link Identity',
      validationReq: 'This field is required.',
      validationEmail: 'Please enter a valid email address.',
      reviewTitle: 'License & Signature Confirmation',
      reviewDesc: 'By linking this data, all evidence armored or downloaded in this session will be immutably sealed on the Stellar ledger with your expert credentials.',
      logoutBtn: 'Log Out',
      welcomeUser: 'Welcome, prosecutor/expert',
      securityEnclave: 'Security Enclave Active'
    }
  }[language];

  const validateStep = (stepNum: number): boolean => {
    const newErrors: Partial<Record<keyof UserProfile, string>> = {};
    let isValid = true;

    if (stepNum === 1) {
      if (!formData.nombres.trim()) {
        newErrors.nombres = t.validationReq;
        isValid = false;
      }
      if (!formData.apellidos.trim()) {
        newErrors.apellidos = t.validationReq;
        isValid = false;
      }
      if (!formData.dni.trim()) {
        newErrors.dni = t.validationReq;
        isValid = false;
      }
    } else if (stepNum === 2) {
      if (!formData.matricula.trim()) {
        newErrors.matricula = t.validationReq;
        isValid = false;
      }
      if (!formData.jurisdiccion.trim()) {
        newErrors.jurisdiccion = t.validationReq;
        isValid = false;
      }
    } else if (stepNum === 3) {
      if (!formData.contacto.trim()) {
        newErrors.contacto = t.validationReq;
        isValid = false;
      }
      if (!formData.email.trim()) {
        newErrors.email = t.validationReq;
        isValid = false;
      } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
        newErrors.email = t.validationEmail;
        isValid = false;
      }
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep < 4) {
        setCurrentStep((prev) => (prev + 1) as any);
      }
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as any);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentStep === 4) {
      updateUserProfile(formData);
    }
  };

  return (
    <div className="min-h-screen bg-[#fafafa] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8" id="profile-wizard-container">
      <div className="max-w-xl w-full bg-white border border-[#eaeaea] rounded-sm p-8 shadow-xs relative">
        
        {/* Language & LogOut buttons */}
        <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
          <button
            onClick={() => setLanguage(language === 'es' ? 'en' : 'es')}
            className="px-2 py-1 text-[9px] font-sans font-bold border border-[#eaeaea] rounded-sm bg-white hover:border-black cursor-pointer transition-colors"
          >
            {language === 'es' ? 'EN' : 'ES'}
          </button>
          <button
            onClick={logout}
            className="px-2 py-1 text-[9px] font-sans font-bold border border-red-200 text-red-600 rounded-sm bg-red-50/50 hover:bg-red-50 cursor-pointer transition-colors"
          >
            {t.logoutBtn}
          </button>
        </div>

        {/* Header */}
        <div className="text-center space-y-2 mb-8">
          <Logo size={42} className="mx-auto mb-3" />
          <div className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 rounded-sm text-[9px] font-mono font-bold uppercase tracking-wider">
            <Shield size={10} />
            {t.securityEnclave}
          </div>
          <p className="text-xs font-mono text-gray-400 mt-1">
            {t.welcomeUser}: <strong className="text-black">{user?.username}</strong>
          </p>
          <h2 className="font-sans font-bold text-lg text-gray-900 tracking-tight mt-3">
            {t.wizardTitle}
          </h2>
          <p className="text-xs text-gray-500 font-sans leading-relaxed max-w-sm mx-auto">
            {t.wizardSub}
          </p>
        </div>

        {/* Step Indicator */}
        <div className="mb-8 border-b border-[#eaeaea] pb-4">
          <div className="grid grid-cols-4 gap-2 text-center">
            {[1, 2, 3, 4].map((num) => (
              <div key={num} className="space-y-2">
                <div className={`h-1 rounded-full transition-all ${
                  currentStep >= num ? 'bg-black' : 'bg-gray-100'
                }`} />
                <span className={`text-[9px] font-mono font-bold tracking-wider uppercase block truncate ${
                  currentStep === num ? 'text-black' : 'text-gray-400'
                }`}>
                  {num === 1 && '01 ' + t.step1}
                  {num === 2 && '02 ' + t.step2}
                  {num === 3 && '03 ' + t.step3}
                  {num === 4 && '04 ' + t.step4}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {currentStep === 1 && (
            <div className="space-y-4 text-left animate-fade-in">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-gray-600 uppercase tracking-wide flex items-center gap-1.5">
                    <User size={12} className="text-gray-400" />
                    {t.nombres}
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.nombres}
                    onChange={(e) => setFormData({ ...formData, nombres: e.target.value })}
                    className={`w-full text-xs font-sans px-3 py-2.5 border rounded-sm bg-[#fafafa] text-[#111111] focus:outline-none focus:border-black focus:bg-white transition-all ${
                      errors.nombres ? 'border-red-400' : 'border-[#eaeaea]'
                    }`}
                    placeholder="E.g., Luis Carlos"
                  />
                  {errors.nombres && <p className="text-[10px] text-red-600 font-sans">{errors.nombres}</p>}
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-gray-600 uppercase tracking-wide flex items-center gap-1.5">
                    <User size={12} className="text-gray-400" />
                    {t.apellidos}
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.apellidos}
                    onChange={(e) => setFormData({ ...formData, apellidos: e.target.value })}
                    className={`w-full text-xs font-sans px-3 py-2.5 border rounded-sm bg-[#fafafa] text-[#111111] focus:outline-none focus:border-black focus:bg-white transition-all ${
                      errors.apellidos ? 'border-red-400' : 'border-[#eaeaea]'
                    }`}
                    placeholder="E.g., Rodríguez"
                  />
                  {errors.apellidos && <p className="text-[10px] text-red-600 font-sans">{errors.apellidos}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-gray-600 uppercase tracking-wide flex items-center gap-1.5">
                    <Globe size={12} className="text-gray-400" />
                    {t.nacionalidad}
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.nacionalidad}
                    onChange={(e) => setFormData({ ...formData, nacionalidad: e.target.value })}
                    className="w-full text-xs font-sans px-3 py-2.5 border border-[#eaeaea] rounded-sm bg-[#fafafa] text-[#111111] focus:outline-none focus:border-black focus:bg-white transition-all"
                    placeholder="E.g., Argentina"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-gray-600 uppercase tracking-wide flex items-center gap-1.5">
                    <CreditCard size={12} className="text-gray-400" />
                    {t.dni}
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.dni}
                    onChange={(e) => setFormData({ ...formData, dni: e.target.value })}
                    className={`w-full text-xs font-mono px-3 py-2.5 border rounded-sm bg-[#fafafa] text-[#111111] focus:outline-none focus:border-black focus:bg-white transition-all ${
                      errors.dni ? 'border-red-400' : 'border-[#eaeaea]'
                    }`}
                    placeholder="E.g., DNI 38.411.201 o Pasaporte"
                  />
                  {errors.dni && <p className="text-[10px] text-red-600 font-sans">{errors.dni}</p>}
                </div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-4 text-left animate-fade-in">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-600 uppercase tracking-wide flex items-center gap-1.5">
                  <Award size={12} className="text-gray-400" />
                  {t.matricula}
                </label>
                <input
                  type="text"
                  required
                  value={formData.matricula}
                  onChange={(e) => setFormData({ ...formData, matricula: e.target.value })}
                  className={`w-full text-xs font-mono px-3 py-2.5 border rounded-sm bg-[#fafafa] text-[#111111] focus:outline-none focus:border-black focus:bg-white transition-all ${
                    errors.matricula ? 'border-red-400' : 'border-[#eaeaea]'
                  }`}
                  placeholder="E.g., MP-4091/B o Registro Pericial Nacional Nro 120"
                />
                {errors.matricula && <p className="text-[10px] text-red-600 font-sans">{errors.matricula}</p>}
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-600 uppercase tracking-wide flex items-center gap-1.5">
                  <MapPin size={12} className="text-gray-400" />
                  {t.jurisdiccion}
                </label>
                <input
                  type="text"
                  required
                  value={formData.jurisdiccion}
                  onChange={(e) => setFormData({ ...formData, jurisdiccion: e.target.value })}
                  className={`w-full text-xs font-sans px-3 py-2.5 border rounded-sm bg-[#fafafa] text-[#111111] focus:outline-none focus:border-black focus:bg-white transition-all ${
                    errors.jurisdiccion ? 'border-red-400' : 'border-[#eaeaea]'
                  }`}
                  placeholder="E.g., Fuero Penal y Forense - Jurisdicción Federal de Buenos Aires"
                />
                {errors.jurisdiccion && <p className="text-[10px] text-red-600 font-sans">{errors.jurisdiccion}</p>}
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-4 text-left animate-fade-in">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-600 uppercase tracking-wide flex items-center gap-1.5">
                  <Phone size={12} className="text-gray-400" />
                  {t.contacto}
                </label>
                <input
                  type="text"
                  required
                  value={formData.contacto}
                  onChange={(e) => setFormData({ ...formData, contacto: e.target.value })}
                  className={`w-full text-xs font-sans px-3 py-2.5 border rounded-sm bg-[#fafafa] text-[#111111] focus:outline-none focus:border-black focus:bg-white transition-all ${
                    errors.contacto ? 'border-red-400' : 'border-[#eaeaea]'
                  }`}
                  placeholder="E.g., +54 9 11 5002-1922"
                />
                {errors.contacto && <p className="text-[10px] text-red-600 font-sans">{errors.contacto}</p>}
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-600 uppercase tracking-wide flex items-center gap-1.5">
                  <Mail size={12} className="text-gray-400" />
                  {t.email}
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className={`w-full text-xs font-sans px-3 py-2.5 border rounded-sm bg-[#fafafa] text-[#111111] focus:outline-none focus:border-black focus:bg-white transition-all ${
                    errors.email ? 'border-red-400' : 'border-[#eaeaea]'
                  }`}
                  placeholder="E.g., luis.rodriguez@fiscalia.gob.ar"
                />
                {errors.email && <p className="text-[10px] text-red-600 font-sans">{errors.email}</p>}
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-5 text-left animate-fade-in">
              <div className="bg-[#fafafa] border border-emerald-200 rounded-sm p-4 flex items-start gap-3">
                <CheckCircle className="text-emerald-600 flex-shrink-0 mt-0.5" size={18} />
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-emerald-950 uppercase tracking-wider">{t.reviewTitle}</h4>
                  <p className="text-[11px] text-emerald-800 leading-relaxed font-sans">{t.reviewDesc}</p>
                </div>
              </div>

              <div className="border border-[#eaeaea] rounded-sm overflow-hidden text-xs">
                <div className="bg-gray-50 border-b border-[#eaeaea] px-4 py-2 flex items-center gap-2">
                  <Shield size={12} className="text-black" />
                  <span className="font-mono font-bold text-[10px] text-[#111111] uppercase tracking-wider">
                    Certificación de Firma Digital viewQ
                  </span>
                </div>
                <div className="p-4 space-y-2.5 bg-white font-sans text-gray-700">
                  <div className="grid grid-cols-2 gap-2 border-b border-gray-100 pb-2">
                    <div>
                      <span className="text-[9px] font-mono text-gray-400 block uppercase font-bold">{t.nombres} y {t.apellidos}</span>
                      <span className="font-semibold text-gray-950 text-[11px]">{formData.nombres} {formData.apellidos}</span>
                    </div>
                    <div>
                      <span className="text-[9px] font-mono text-gray-400 block uppercase font-bold">{t.dni}</span>
                      <span className="font-semibold text-gray-950 text-[11px] font-mono">{formData.dni}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 border-b border-gray-100 pb-2">
                    <div>
                      <span className="text-[9px] font-mono text-gray-400 block uppercase font-bold">{t.matricula}</span>
                      <span className="font-semibold text-gray-950 text-[11px] font-mono text-emerald-700">{formData.matricula}</span>
                    </div>
                    <div>
                      <span className="text-[9px] font-mono text-gray-400 block uppercase font-bold">{t.jurisdiccion}</span>
                      <span className="font-semibold text-gray-950 text-[11px] truncate block" title={formData.jurisdiccion}>{formData.jurisdiccion}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[9px] font-mono text-gray-400 block uppercase font-bold">{t.contacto}</span>
                      <span className="font-semibold text-gray-950 text-[11px]">{formData.contacto}</span>
                    </div>
                    <div>
                      <span className="text-[9px] font-mono text-gray-400 block uppercase font-bold">{t.email}</span>
                      <span className="font-semibold text-gray-950 text-[11px] truncate block font-mono" title={formData.email}>{formData.email}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation controls */}
          <div className="flex items-center justify-between gap-3 pt-4 border-t border-[#eaeaea]">
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={handlePrev}
                className="px-4 py-2.5 border border-[#eaeaea] text-gray-700 hover:bg-gray-50 text-[11px] font-sans font-bold uppercase tracking-wider rounded-sm flex items-center gap-1 cursor-pointer transition-colors"
              >
                <ArrowLeft size={12} />
                {t.prev}
              </button>
            ) : (
              <div />
            )}

            {currentStep < 4 ? (
              <button
                type="button"
                onClick={handleNext}
                className="px-5 py-2.5 bg-black text-white hover:bg-zinc-800 text-[11px] font-sans font-bold uppercase tracking-wider rounded-sm flex items-center gap-1 cursor-pointer transition-colors ml-auto"
              >
                {t.next}
                <ArrowRight size={12} />
              </button>
            ) : (
              <button
                type="submit"
                className="px-6 py-2.5 bg-black text-white hover:bg-emerald-800 hover:shadow-emerald-50 text-[11px] font-sans font-bold uppercase tracking-wider rounded-sm flex items-center gap-1.5 cursor-pointer transition-all ml-auto"
              >
                <CheckCircle size={13} />
                {t.finish}
              </button>
            )}
          </div>

        </form>

        {/* Footprint Powered By VibeDesk */}
        <div className="mt-8 pt-4 border-t border-[#eaeaea]/50 text-center">
          <span className="text-[9px] font-sans font-semibold tracking-widest text-gray-400 uppercase">
            POWERED BY VIBEDESK
          </span>
        </div>

      </div>
    </div>
  );
};
