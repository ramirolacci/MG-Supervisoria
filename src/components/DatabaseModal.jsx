import React, { useState, useRef, useEffect } from 'react';
import { Database, Copy, Check, ExternalLink, X, AlertCircle } from 'lucide-react';
import { getSupabaseCredentials, saveSupabaseCredentials, SUPABASE_SETUP_SQL } from '../lib/supabase';
import { animateModalEnter } from '../lib/animations';

export function DatabaseModal({ isOpen, onClose }) {
  const creds = getSupabaseCredentials();
  const [url, setUrl] = useState(creds.url);
  const [key, setKey] = useState(creds.key);
  const [copiedSql, setCopiedSql] = useState(false);
  const backdropRef = useRef(null);
  const modalRef = useRef(null);

  useEffect(() => {
    if (isOpen && modalRef.current && backdropRef.current) {
      animateModalEnter(modalRef.current, backdropRef.current);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = (e) => {
    e.preventDefault();
    saveSupabaseCredentials(url, key);
  };

  const copySql = () => {
    navigator.clipboard.writeText(SUPABASE_SETUP_SQL);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/45 backdrop-blur-sm"
    >
      <div
        ref={modalRef}
        className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Conexión con Supabase</h3>
              <p className="text-xs text-slate-400">Base de datos PostgreSQL en la nube para sincronización en tiempo real</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm">
          {/* Status info */}
          <div className={`p-4 rounded-xl border flex items-start gap-3 ${
            creds.isConfigured
              ? 'bg-emerald-950/30 border-emerald-800/40 text-emerald-300'
              : 'bg-amber-950/30 border-amber-800/40 text-amber-300'
          }`}>
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">
                {creds.isConfigured
                  ? 'Supabase está conectado activamente'
                  : 'Modo local activo (LocalStorage)'}
              </p>
              <p className="text-xs opacity-90 mt-0.5">
                {creds.isConfigured
                  ? 'Todas las cargas y cambios de estructura se sincronizan con la nube en Supabase.'
                  : 'Podés usar la app inmediatamente. Para sincronizar entre varios dispositivos de supervisoras y celular, completá tus credenciales de Supabase abajo.'}
              </p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Project URL
              </label>
              <input
                type="text"
                placeholder="https://xyzcompany.supabase.co"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-amber-500 font-mono text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Anon Public Key / API Key
              </label>
              <input
                type="password"
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                value={key}
                onChange={(e) => setKey(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-amber-500 font-mono text-xs"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => {
                  setUrl('');
                  setKey('');
                  saveSupabaseCredentials('', '');
                }}
                className="text-xs text-rose-400 hover:underline"
              >
                Desconectar y usar solo Local
              </button>
              <button
                type="submit"
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-5 py-2.5 rounded-xl transition shadow-lg shadow-amber-500/20"
              >
                Guardar credenciales
              </button>
            </div>
          </form>

          {/* SQL Setup Helper */}
          <div className="border-t border-slate-800 pt-5 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-slate-200 text-sm">Script SQL de Inicialización</h4>
                <p className="text-xs text-slate-400">Pegalo en el SQL Editor de tu proyecto en Supabase</p>
              </div>
              <button
                type="button"
                onClick={copySql}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium transition"
              >
                {copiedSql ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                {copiedSql ? '¡Copiado!' : 'Copiar SQL'}
              </button>
            </div>

            <pre className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-[11px] font-mono text-slate-400 overflow-x-auto max-h-40">
              {SUPABASE_SETUP_SQL}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
