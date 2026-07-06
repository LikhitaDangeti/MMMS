import React, { useRef, useState } from 'react';
import { motion, useScroll, useTransform, useInView } from 'framer-motion';
import { ClipboardCheck, Zap, ShieldAlert, ArrowRight, ArrowDown } from 'lucide-react';

// --- Animated ReactBits-style Components ---

// 1. Split Text Reveal
const SplitText = ({ text, className }) => {
  const words = text.split(" ");
  return (
    <div className={className} style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center' }}>
      {words.map((word, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, y: 50, rotateX: -90 }}
          animate={{ opacity: 1, y: 0, rotateX: 0 }}
          transition={{ duration: 0.8, delay: i * 0.1, type: "spring", bounce: 0.4 }}
          style={{ marginRight: "0.25em", display: "inline-block" }}
        >
          {word}
        </motion.span>
      ))}
    </div>
  );
};

// 2. Magnetic Button Effect
const MagneticButton = ({ children, onClick, className }) => {
  const buttonRef = useRef(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleMouse = (e) => {
    const { clientX, clientY } = e;
    const { height, width, left, top } = buttonRef.current.getBoundingClientRect();
    const middleX = clientX - (left + width / 2);
    const middleY = clientY - (top + height / 2);
    setPosition({ x: middleX * 0.3, y: middleY * 0.3 });
  };

  const reset = () => setPosition({ x: 0, y: 0 });

  return (
    <motion.button
      ref={buttonRef}
      onMouseMove={handleMouse}
      onMouseLeave={reset}
      animate={{ x: position.x, y: position.y }}
      transition={{ type: "spring", stiffness: 150, damping: 15, mass: 0.1 }}
      onClick={onClick}
      className={className}
    >
      {children}
    </motion.button>
  );
};

// 3. Scroll Reveal Section
const ScrollSection = ({ children, direction = "up" }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-15%" });
  
  const variants = {
    hidden: { 
      opacity: 0, 
      y: direction === "up" ? 100 : direction === "down" ? -100 : 0,
      x: direction === "left" ? 100 : direction === "right" ? -100 : 0,
      scale: 0.9
    },
    visible: { 
      opacity: 1, 
      y: 0, 
      x: 0, 
      scale: 1,
      transition: { duration: 0.8, type: "spring", bounce: 0.3 }
    }
  };

  return (
    <motion.div ref={ref} variants={variants} initial="hidden" animate={isInView ? "visible" : "hidden"}>
      {children}
    </motion.div>
  );
};

// --- Main Page Component ---

export default function HomePage({ onLaunch }) {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: containerRef });
  
  // Parallax mappings
  const yBg = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
  const opacityHero = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  const scaleHero = useTransform(scrollYProgress, [0, 0.2], [1, 0.8]);

  return (
    <div ref={containerRef} className="bg-slate-950 font-sans text-slate-100 overflow-x-hidden selection:bg-brand selection:text-white">
      
      {/* 
        ========================================
        HERO SECTION (Full Screen)
        ========================================
      */}
      <motion.section 
        style={{ opacity: opacityHero, scale: scaleHero }}
        className="relative min-h-screen w-full flex flex-col justify-center items-center px-6 overflow-hidden"
      >
        {/* Deep Glow Background */}
        <div className="absolute inset-0 pointer-events-none mix-blend-screen">
          <motion.div 
            animate={{ rotate: 360, scale: [1, 1.2, 1] }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute top-[-20%] left-[-10%] h-[80vw] w-[80vw] rounded-full bg-brand/10 blur-[120px]"
          />
          <motion.div 
            animate={{ rotate: -360, scale: [1, 1.5, 1] }}
            transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
            className="absolute bottom-[-20%] right-[-10%] h-[60vw] w-[60vw] rounded-full bg-blue-600/10 blur-[120px]"
          />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center text-center">
          <motion.div 
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.5, type: "spring" }}
            className="mb-8 inline-flex items-center gap-2 rounded-full border border-slate-700/50 bg-slate-800/30 px-5 py-2 text-sm font-semibold text-slate-300 backdrop-blur-xl"
          >
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-brand"></span>
            </span>
            Hackathon V1.0 - Ready
          </motion.div>

          <SplitText 
            text="Digitizing the Hot Strip Mill" 
            className="font-display text-6xl font-extrabold tracking-tighter sm:text-8xl lg:text-9xl mb-6 bg-gradient-to-b from-white via-white to-slate-500 bg-clip-text text-transparent max-w-6xl"
          />

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 1 }}
            className="max-w-2xl text-xl sm:text-2xl text-slate-400 mb-12 font-medium"
          >
            Ghost in the shell script. Zero paper. Infinite cloud. 
            Real-time anomaly detection for all 13 critical shift sheets.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 1.2 }}
          >
            <MagneticButton onClick={onLaunch} className="relative group overflow-hidden rounded-2xl bg-brand px-10 py-5 font-bold text-white shadow-2xl transition-transform hover:shadow-brand/50">
              <span className="relative z-10 flex items-center gap-3 text-lg">
                Initialize System
                <ArrowRight className="h-6 w-6 transition-transform group-hover:translate-x-2" />
              </span>
              <div className="absolute inset-0 z-0 bg-gradient-to-r from-blue-600 to-cyan-400 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            </MagneticButton>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div 
          animate={{ y: [0, 15, 0], opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 text-slate-500 flex flex-col items-center gap-2"
        >
          <span className="text-xs font-bold uppercase tracking-widest">Scroll to explore</span>
          <ArrowDown className="h-5 w-5" />
        </motion.div>
      </motion.section>

      {/* 
        ========================================
        INFINITE MARQUEE SECTION
        ========================================
      */}
      <div className="w-full overflow-hidden bg-slate-900 border-y border-slate-800 py-6 transform -skew-y-2">
        <motion.div 
          animate={{ x: ["0%", "-50%"] }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="flex whitespace-nowrap text-4xl sm:text-6xl font-black tracking-tighter text-slate-800"
        >
          {Array(4).fill("13 SHIFTS • ZERO PAPER • CLOUD NATIVE • REAL TIME • ").map((text, i) => (
            <span key={i} className="mr-4">{text}</span>
          ))}
        </motion.div>
      </div>

      {/* 
        ========================================
        SCROLL PARALLAX FEATURE CARDS
        ========================================
      */}
      <section className="relative w-full py-40 px-6 sm:px-12 max-w-7xl mx-auto flex flex-col gap-32">
        
        {/* Feature 1 - Slides from Left */}
        <ScrollSection direction="left">
          <div className="flex flex-col md:flex-row items-center gap-12 group">
            <div className="flex-1 space-y-6">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-brand/10 text-brand ring-1 ring-brand/20 group-hover:scale-110 group-hover:bg-brand group-hover:text-white transition-all duration-500">
                <ClipboardCheck className="h-8 w-8" />
              </div>
              <h2 className="text-4xl sm:text-6xl font-bold tracking-tight text-white">13 Digital Checklists</h2>
              <p className="text-xl text-slate-400 max-w-lg leading-relaxed">
                We mapped every single physical Excel sheet into a highly optimized, mobile-first interface. Operators can log data in seconds, not hours.
              </p>
            </div>
            <div className="flex-1 relative w-full aspect-video rounded-3xl overflow-hidden border border-slate-800 bg-slate-900/50 backdrop-blur-3xl shadow-2xl">
              <motion.div 
                style={{ y: useTransform(scrollYProgress, [0.3, 0.6], [50, -50]) }}
                className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-3/4 h-3/4 bg-slate-800 rounded-xl shadow-2xl border border-slate-700 p-4 transform rotate-3 group-hover:rotate-0 transition-transform duration-700">
                  <div className="w-1/3 h-4 bg-slate-700 rounded mb-4" />
                  <div className="space-y-2">
                    <div className="w-full h-8 bg-slate-700/50 rounded" />
                    <div className="w-full h-8 bg-slate-700/50 rounded" />
                    <div className="w-5/6 h-8 bg-slate-700/50 rounded" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </ScrollSection>

        {/* Feature 2 - Slides from Right */}
        <ScrollSection direction="right">
          <div className="flex flex-col md:flex-row-reverse items-center gap-12 group">
            <div className="flex-1 space-y-6 md:text-right flex flex-col md:items-end">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-500 ring-1 ring-blue-500/20 group-hover:scale-110 group-hover:bg-blue-500 group-hover:text-white transition-all duration-500">
                <Zap className="h-8 w-8" />
              </div>
              <h2 className="text-4xl sm:text-6xl font-bold tracking-tight text-white">Live Cloud Sync</h2>
              <p className="text-xl text-slate-400 max-w-lg leading-relaxed">
                Powered by a high-performance PostgreSQL backend. Data is synced in real-time. No more lost clipboards. No more end-of-shift data entry.
              </p>
            </div>
            <div className="flex-1 relative w-full aspect-video rounded-3xl overflow-hidden border border-slate-800 bg-slate-900/50 backdrop-blur-3xl shadow-2xl">
              <motion.div 
                style={{ y: useTransform(scrollYProgress, [0.5, 0.8], [-50, 50]) }}
                className="absolute inset-0 opacity-50 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-slate-900/0 to-slate-900/0"
              />
               <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-3/4 h-3/4 bg-slate-800 rounded-xl shadow-2xl border border-slate-700 p-6 flex flex-col gap-4 transform -rotate-3 group-hover:rotate-0 transition-transform duration-700">
                   <div className="flex items-end gap-2 h-full">
                     {[40, 70, 45, 90, 65, 100].map((h, i) => (
                       <motion.div 
                         key={i} 
                         initial={{ height: 0 }}
                         whileInView={{ height: `${h}%` }}
                         transition={{ duration: 1, delay: i * 0.1 }}
                         className="flex-1 bg-blue-500 rounded-t-sm" 
                        />
                     ))}
                   </div>
                </div>
              </div>
            </div>
          </div>
        </ScrollSection>

        {/* Feature 3 - Slides from Bottom */}
        <ScrollSection direction="up">
          <div className="flex flex-col md:flex-row items-center gap-12 group">
            <div className="flex-1 space-y-6">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-500 ring-1 ring-rose-500/20 group-hover:scale-110 group-hover:bg-rose-500 group-hover:text-white transition-all duration-500">
                <ShieldAlert className="h-8 w-8" />
              </div>
              <h2 className="text-4xl sm:text-6xl font-bold tracking-tight text-white">Smart Anomalies</h2>
              <p className="text-xl text-slate-400 max-w-lg leading-relaxed">
                The system knows the operational limits. If an operator enters a pressure or temperature reading out of bounds, management is alerted instantly.
              </p>
            </div>
            <div className="flex-1 relative w-full aspect-video rounded-3xl overflow-hidden border border-rose-900/30 bg-slate-900/50 backdrop-blur-3xl shadow-2xl">
               <div className="absolute inset-0 bg-rose-500/5 mix-blend-overlay" />
               <div className="absolute inset-0 flex items-center justify-center">
                  <motion.div 
                    animate={{ scale: [1, 1.05, 1], borderColor: ['rgba(225,29,72,0.2)', 'rgba(225,29,72,0.8)', 'rgba(225,29,72,0.2)'] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="p-6 rounded-2xl border-2 bg-slate-950 shadow-[0_0_50px_rgba(225,29,72,0.2)]"
                  >
                    <div className="flex items-center gap-4 text-rose-500 text-2xl font-bold">
                      <ShieldAlert className="h-10 w-10 animate-pulse" />
                      CRITICAL VARIANCE DETECTED
                    </div>
                  </motion.div>
               </div>
            </div>
          </div>
        </ScrollSection>

      </section>

      {/* 
        ========================================
        FINAL CTA
        ========================================
      */}
      <section className="relative w-full py-40 px-6 flex justify-center items-center overflow-hidden">
        <motion.div 
          style={{ scale: useTransform(scrollYProgress, [0.8, 1], [0.8, 1]) }}
          className="relative w-full max-w-5xl rounded-[3rem] bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 p-12 sm:p-24 text-center shadow-2xl"
        >
          <h2 className="text-5xl sm:text-7xl font-bold text-white mb-8">Ready to upgrade?</h2>
          <p className="text-xl text-slate-400 mb-12 max-w-2xl mx-auto">
            Stop losing data. Start predicting failures. Enter the application now to see the future of Mill operations.
          </p>
          <MagneticButton onClick={onLaunch} className="relative group inline-block overflow-hidden rounded-2xl bg-white px-12 py-6 font-bold text-slate-950 shadow-2xl transition-transform">
            <span className="relative z-10 flex items-center gap-3 text-xl">
              Launch Application
              <ArrowRight className="h-6 w-6 transition-transform group-hover:translate-x-2" />
            </span>
            <div className="absolute inset-0 z-0 bg-slate-200 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
          </MagneticButton>
        </motion.div>
      </section>

    </div>
  );
}
