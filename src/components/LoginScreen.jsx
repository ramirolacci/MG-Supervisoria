import React, { useState, useRef, useEffect } from 'react';
import { Lock, Mail, Eye, EyeOff, AlertCircle, ArrowRight } from 'lucide-react';
import { authenticateSupervisorAsync } from '../lib/auth';
import { gsap, useGSAP } from '../lib/animations';
import { Footer } from './Footer';

export function LoginScreen({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const containerRef = useRef(null);
  const cardRef = useRef(null);
  const brandRef = useRef(null);
  const formRef = useRef(null);
  const errorRef = useRef(null);
  const glowTopRef = useRef(null);
  const glowBottomRef = useRef(null);

  // GSAP Entrance Animation
  useGSAP(() => {
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

    // Smooth subtle card entrance
    tl.fromTo(
      cardRef.current,
      { opacity: 0, y: 24, scale: 0.98 },
      { opacity: 1, y: 0, scale: 1, duration: 0.65 }
    );

    // Stagger brand logo & text
    if (brandRef.current) {
      tl.fromTo(
        brandRef.current.children,
        { opacity: 0, y: 12 },
        { opacity: 1, y: 0, duration: 0.45, stagger: 0.08 },
        '-=0.35'
      );
    }

    // Stagger form fields & button
    if (formRef.current) {
      tl.fromTo(
        formRef.current.children,
        { opacity: 0, y: 12 },
        { opacity: 1, y: 0, duration: 0.45, stagger: 0.06 },
        '-=0.3'
      );
    }

    // Ambient subtle pulse for glows
    if (glowTopRef.current && glowBottomRef.current) {
      gsap.to(glowTopRef.current, {
        scale: 1.15,
        opacity: 0.22,
        duration: 5,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      });
      gsap.to(glowBottomRef.current, {
        scale: 1.2,
        opacity: 0.15,
        duration: 7,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
        delay: 1,
      });
    }
  }, { scope: containerRef });

  // Error message animation when it appears
  useEffect(() => {
    if (errorMsg && errorRef.current) {
      gsap.fromTo(
        errorRef.current,
        { opacity: 0, y: -8, scale: 0.97 },
        { opacity: 1, y: 0, scale: 1, duration: 0.35, ease: 'back.out(1.4)' }
      );
    }
  }, [errorMsg]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    try {
      const res = await authenticateSupervisorAsync(email, password);
      setIsLoading(false);
      if (res.success) {
        onLoginSuccess(res.user);
      } else {
        setErrorMsg(res.error);
      }
    } catch (err) {
      setIsLoading(false);
      setErrorMsg('Error al verificar credenciales.');
    }
  };

  return (
    <div
      ref={containerRef}
      className="min-h-screen bg-slate-950 flex flex-col justify-between items-center relative overflow-hidden"
    >
      {/* Background glow effects with GSAP subtle breathing */}
      <div
        ref={glowTopRef}
        className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"
      />
      <div
        ref={glowBottomRef}
        className="absolute bottom-10 left-10 w-72 h-72 bg-orange-600/5 rounded-full blur-3xl pointer-events-none"
      />

      {/* Main Content / Login Card */}
      <div className="flex-1 flex items-center justify-center w-full p-4">
        <div
          ref={cardRef}
          className="w-full max-w-md bg-slate-900/80 border border-slate-800/90 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl relative z-10"
        >
          {/* Brand */}
          <div ref={brandRef} className="flex flex-col items-center text-center mb-6">
            <img
              src={`${import.meta.env.BASE_URL}Logo_Mi_Gusto_2025.png`}
              alt="Mi Gusto"
              className="h-10 sm:h-12 w-auto object-contain brightness-110 mb-2 drop-shadow-[0_2px_12px_rgba(245,158,11,0.2)]"
            />
            <h2 className="text-xl font-black text-white tracking-tight mt-1">
              Bienvenidos
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Ingresá con tu cuenta corporativa para gestionar las cargas de tus locales
            </p>
          </div>

          {/* Form */}
          <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
            {errorMsg && (
              <div
                ref={errorRef}
                className="p-3.5 rounded-2xl bg-rose-950/50 border border-rose-800/70 text-rose-300 text-xs flex items-start gap-2.5"
              >
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Correo Institucional <span className="text-red-500 font-bold">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  placeholder="ejemplo@migusto.com.ar"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-2xl pl-10 pr-4 py-3 text-white text-sm focus:outline-none transition-colors duration-200"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Contraseña <span className="text-red-500 font-bold">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-2xl pl-10 pr-11 py-3 text-white text-sm focus:outline-none transition-colors duration-200 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex justify-center pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-auto px-7 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black rounded-2xl transition-all shadow-lg shadow-amber-500/20 gsap-button flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                <span>{isLoading ? 'Verificando...' : 'Iniciar Sesión'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>

          {/* Card session note */}
          <div className="mt-6 pt-5 border-t border-slate-800/60 text-center">
            <p className="text-[11px] text-slate-500">
              Tu sesión se mantendrá iniciada en este dispositivo de forma permanente hasta que decidas cerrar sesión.
            </p>
          </div>
        </div>
      </div>

      {/* Screen Footer */}
      <Footer />
    </div>
  );
}
