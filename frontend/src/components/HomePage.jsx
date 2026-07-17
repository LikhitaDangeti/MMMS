import React from 'react';
import { ArrowRight, ClipboardCheck, Zap, ShieldAlert } from 'lucide-react';

export default function HomePage({ onLaunch }) {
  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-slate-950 p-6 text-center text-slate-100 relative z-10">
      
      {/* Background Glow */}
      <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_center,rgba(14,165,233,0.15)_0%,transparent_50%)] pointer-events-none" />

      <div className="relative z-10 mb-12 max-w-3xl mt-12">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-brand/30 bg-black/60 px-5 py-2 text-xs font-bold uppercase tracking-widest text-brand backdrop-blur-xl shadow-[0_0_20px_rgba(13,148,136,0.2)]">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-brand"></span>
          </span>
          System Online
        </div>
        
        <h1 className="mb-6 text-5xl font-black text-white sm:text-7xl tracking-tighter drop-shadow-xl">
          Digital Twin <span className="text-brand">Synced.</span>
        </h1>
        <p className="text-xl font-light text-slate-400">
          We've mapped this entire complex physical process into a seamless digital workflow. The mill is now intelligent.
        </p>
      </div>

      <div className="relative z-10 mb-16 grid max-w-5xl gap-6 sm:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-left backdrop-blur-md shadow-xl transition-colors hover:border-white/20 hover:bg-white/10">
          <div className="mb-4 inline-flex rounded-lg bg-black/40 p-3 shadow-inner">
            <ClipboardCheck className="h-6 w-6 text-brand" />
          </div>
          <h3 className="mb-2 text-xl font-bold">13 Digital Checklists</h3>
          <p className="text-sm text-slate-400 font-light">Paper eliminated. Complete mobile-first data entry for all shift logs with real-time validation.</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-left backdrop-blur-md shadow-xl transition-colors hover:border-white/20 hover:bg-white/10">
          <div className="mb-4 inline-flex rounded-lg bg-black/40 p-3 shadow-inner">
            <Zap className="h-6 w-6 text-blue-400" />
          </div>
          <h3 className="mb-2 text-xl font-bold">Live Cloud Sync</h3>
          <p className="text-sm text-slate-400 font-light">High-performance PostgreSQL backend. No more lost data at the end of shifts. Zero latency.</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-left backdrop-blur-md shadow-xl transition-colors hover:border-white/20 hover:bg-white/10">
          <div className="mb-4 inline-flex rounded-lg bg-black/40 p-3 shadow-inner">
            <ShieldAlert className="h-6 w-6 text-rose-400" />
          </div>
          <h3 className="mb-2 text-xl font-bold">Smart Anomalies</h3>
          <p className="text-sm text-slate-400 font-light">Automated AI-driven alerts for out-of-bounds pressure and temperature readings.</p>
        </div>
      </div>

      <button
        onClick={onLaunch}
        className="relative z-10 group flex items-center justify-center gap-3 rounded-full bg-brand px-12 py-5 text-lg font-black text-white shadow-[0_0_40px_rgba(13,148,136,0.3)] transition-all hover:scale-105 hover:bg-brand-dark hover:shadow-[0_0_60px_rgba(13,148,136,0.5)]"
      >
        Initialize Dashboard
        <ArrowRight className="h-6 w-6 transition-transform group-hover:translate-x-2" />
      </button>
    </div>
  );
}
