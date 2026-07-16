import React, { useRef, useState } from 'react';
import { motion, useScroll, useTransform, useInView } from 'framer-motion';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, Sparkles, Float } from '@react-three/drei';
import { EffectComposer, Bloom, ChromaticAberration } from '@react-three/postprocessing';
import { ReactLenis } from 'lenis/react';
import { ArrowDown, Flame, Waves, Replace, Shield, Scissors, Activity, ArrowRight, ClipboardCheck, Zap, ShieldAlert, Thermometer, Gauge, ActivitySquare } from 'lucide-react';
import * as THREE from 'three';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// --- ReactBits Animated Components ---
const SplitText = ({ text, className }) => {
  const words = text.split(" ");
  return (
    <div className={className} style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center' }}>
      {words.map((word, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, y: 50, rotateX: -90 }}
          whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
          viewport={{ once: false, margin: "-20%" }}
          transition={{ duration: 0.8, delay: i * 0.1, type: "spring", bounce: 0.4 }}
          style={{ marginRight: "0.25em", display: "inline-block" }}
        >
          {word}
        </motion.span>
      ))}
    </div>
  );
};

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

// "Digital Twin" Floating Data Widget
const DataWidget = ({ title, value, unit, icon: Icon, colorClass, delay = 0, extraClass = "" }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { margin: "-20%" });

  return (
    <motion.div 
      ref={ref}
      initial={{ opacity: 0, x: 50, filter: "blur(10px)" }}
      animate={isInView ? { opacity: 1, x: 0, filter: "blur(0px)" } : { opacity: 0, x: 50, filter: "blur(10px)" }}
      transition={{ duration: 0.6, delay, type: "spring" }}
      className={`flex items-center gap-4 rounded-xl border bg-black/40 p-4 backdrop-blur-2xl shadow-2xl w-full ${colorClass} ${extraClass}`}
    >
      <div className="rounded-lg bg-black/60 p-3 border border-inherit border-opacity-50 shrink-0">
        <Icon className="h-6 w-6" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-70 truncate">{title}</p>
        <p className="font-display text-xl sm:text-2xl font-black tracking-tighter truncate">
          {value} <span className="text-sm font-medium opacity-50">{unit}</span>
        </p>
      </div>
    </motion.div>
  );
};

// --- Animated Feature UI Components ---
const AnimatedGraph = ({ color = "#0ea5e9" }) => {
  return (
    <div className="h-16 w-full mt-4 flex items-end gap-1.5 opacity-80">
      {[30, 50, 40, 70, 55, 90, 75, 100, 85].map((h, i) => (
        <motion.div
          key={i}
          initial={{ height: 0 }}
          whileInView={{ height: `${h}%` }}
          viewport={{ once: false }}
          transition={{ duration: 0.8, delay: i * 0.05, type: "spring", bounce: 0.2 }}
          className="w-full rounded-t-sm"
          style={{ backgroundColor: color, boxShadow: `0 0 10px ${color}40` }}
        />
      ))}
    </div>
  );
};

const FeatureCard = ({ title, desc, icon: Icon, color, delay }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: false }}
      transition={{ duration: 0.6, delay }}
      className="flex flex-col p-6 rounded-2xl bg-black/40 border border-white/10 backdrop-blur-md relative overflow-hidden group hover:border-white/20 transition-colors h-full"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="flex items-center gap-3 mb-4 relative z-10">
        <div className="p-2 rounded-lg bg-black/60 border shadow-lg shrink-0" style={{ borderColor: `${color}40`, color, boxShadow: `0 0 15px ${color}20` }}>
          <Icon className="h-5 w-5" />
        </div>
        <h3 className="text-lg sm:text-xl font-bold text-white tracking-wide">{title}</h3>
      </div>
      <p className="text-xs sm:text-sm text-slate-400 leading-relaxed font-light z-10 flex-grow">{desc}</p>
      <div className="relative z-10 mt-4">
        <AnimatedGraph color={color} />
      </div>
    </motion.div>
  );
};

// --- 3D Digital Twin HUD Scene Component ---
const Scene = ({ scrollYProgress }) => {
  const slabRef = useRef();
  const shaderRef = useRef();

  useFrame((state) => {
    const scroll = scrollYProgress.get(); 
    const time = state.clock.elapsedTime;

    // --- REALISTIC SLAB ANIMATION & HEAT PHYSICS ---
    if (slabRef.current) {
      let thickness = 1.5;
      let length = 4;
      let zPos = 0;

      if (scroll > 0.2 && scroll <= 0.4) {
        const p2Progress = (scroll - 0.2) / 0.2;
        thickness = THREE.MathUtils.lerp(1.5, 0.4, p2Progress);
        length = THREE.MathUtils.lerp(4, 15, p2Progress);
        zPos = THREE.MathUtils.lerp(0, 5, p2Progress);
      } else if (scroll > 0.4 && scroll <= 0.6) {
        thickness = 0.4;
        length = 15;
        zPos = 5;
      } else if (scroll > 0.6) {
        const p4Progress = Math.min((scroll - 0.6) / 0.2, 1);
        thickness = THREE.MathUtils.lerp(0.4, 0.02, p4Progress);
        length = THREE.MathUtils.lerp(15, 60, p4Progress);
        zPos = THREE.MathUtils.lerp(5, 20, p4Progress);
      }

      slabRef.current.scale.set(3, Math.max(thickness, 0.02), length);
      slabRef.current.position.z = zPos;

      if (shaderRef.current) {
        shaderRef.current.uniforms.uTime.value = time;
        shaderRef.current.uniforms.uScroll.value = scroll;
      }
    }
  });

  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={2} color="#ffffff" />
      <Environment preset="studio" />
      
      {/* Post Processing for the Glow */}
      <EffectComposer>
        <Bloom luminanceThreshold={1} luminanceSmoothing={0.9} intensity={2.0} />
        <ChromaticAberration offset={[0.001, 0.001]} />
      </EffectComposer>

      {/* Floor reflection plane */}
      <group position={[0, -4, 0]}>
        <mesh rotation={[-Math.PI/2, 0, 0]} position={[0, -0.1, 0]}>
          <planeGeometry args={[100, 100]} />
          <meshStandardMaterial color="#050505" roughness={0.2} metalness={0.8} />
        </mesh>
      </group>

      {/* Floating Data Particles */}
      <Sparkles count={300} scale={30} size={1} speed={0.2} color="#0ea5e9" opacity={0.3} />

      {/* The Procedural Hot Steel Slab */}
      <mesh ref={slabRef} position={[0, 0, 0]}>
        <boxGeometry args={[1, 1, 1, 32, 4, 32]} />
        <meshStandardMaterial 
          metalness={0.6}
          roughness={0.4}
          onBeforeCompile={(shader) => {
            shader.uniforms.uTime = { value: 0 };
            shader.uniforms.uScroll = { value: 0 };
            shaderRef.current = shader;

            shader.vertexShader = `
              varying vec2 vUv;
              varying vec3 vPos;
            ` + shader.vertexShader.replace(
              '#include <begin_vertex>',
              `
              #include <begin_vertex>
              vUv = uv;
              vPos = position;
              `
            );

            shader.fragmentShader = `
              uniform float uTime;
              uniform float uScroll;
              varying vec2 vUv;
              varying vec3 vPos;

              float random(vec2 st) { return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123); }
              float noise(vec2 st) {
                  vec2 i = floor(st);
                  vec2 f = fract(st);
                  float a = random(i);
                  float b = random(i + vec2(1.0, 0.0));
                  float c = random(i + vec2(0.0, 1.0));
                  float d = random(i + vec2(1.0, 1.0));
                  vec2 u = f * f * (3.0 - 2.0 * f);
                  return mix(a, b, u.x) + (c - a)* u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
              }
            ` + shader.fragmentShader.replace(
              '#include <emissivemap_fragment>',
              `
              #include <emissivemap_fragment>
              
              // Base noise for uneven heating
              float n = noise(vPos.xz * 15.0 + uTime * 2.0);
              float n2 = noise(vPos.xz * 30.0 - uTime * 3.0);
              float heat = (n + n2 * 0.5) / 1.5;
              
              // Darken edges slightly (simulating cooler mill scale)
              float edgeX = smoothstep(0.0, 0.2, vUv.x) * smoothstep(1.0, 0.8, vUv.x);
              float edgeY = smoothstep(0.0, 0.2, vUv.y) * smoothstep(1.0, 0.8, vUv.y);
              float edge = edgeX * edgeY;
              
              // Global cooling based on scroll progress
              float globalHeat = max(0.0, 1.0 - (uScroll * 1.3));
              
              float finalHeat = heat * (0.6 + 0.4 * edge) * globalHeat;
              
              // Soft realistic fire colors (not blinding)
              vec3 colYellow = vec3(1.0, 0.7, 0.2); 
              vec3 colOrange = vec3(0.9, 0.3, 0.05);
              vec3 colRed = vec3(0.4, 0.0, 0.0);
              vec3 colIron = vec3(0.1, 0.1, 0.12); // Dark cooled steel
              
              vec3 heatColor = colIron;
              if (finalHeat > 0.6) {
                 heatColor = mix(colOrange, colYellow, (finalHeat - 0.6) / 0.4);
              } else if (finalHeat > 0.3) {
                 heatColor = mix(colRed, colOrange, (finalHeat - 0.3) / 0.3);
              } else if (finalHeat > 0.0) {
                 heatColor = mix(colIron, colRed, finalHeat / 0.3);
              }
              
              totalEmissiveRadiance = heatColor * 2.0; // Moderate bloom
              diffuseColor.rgb = heatColor * 0.4 + colIron; 
              `
            );
          }}
        />
      </mesh>

      {/* Extraneous scene models removed to focus purely on the glowing realistic slab physics */}
    </>
  );
};

// --- Story Text Components ---
const StoryPhase = ({ title, subtitle, icon: Icon, children }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { margin: "-40% 0px -40% 0px" });

  return (
    <motion.div 
      ref={ref}
      animate={{ opacity: isInView ? 1 : 0.1, x: isInView ? 0 : -20 }}
      transition={{ duration: 0.6 }}
      className="min-h-screen flex flex-col justify-center max-w-2xl relative z-20 pointer-events-auto py-20 lg:py-0"
    >
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
        <div className="w-14 h-14 sm:w-auto sm:h-auto p-3 bg-black/40 text-[#0ea5e9] rounded-xl border border-[#0ea5e9]/30 shadow-[0_0_20px_rgba(0,255,204,0.2)] backdrop-blur-md flex items-center justify-center shrink-0">
          <Icon className="h-8 w-8" />
        </div>
        <div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight drop-shadow-2xl">{title}</h2>
          <h3 className="text-lg md:text-xl font-bold text-[#0ea5e9] uppercase tracking-[0.2em] drop-shadow-lg mt-1">{subtitle}</h3>
        </div>
      </div>
      <div className="p-6 md:p-8 rounded-2xl bg-black/40 backdrop-blur-xl border border-white/10 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-[#0ea5e9] to-transparent" />
        <p className="text-lg md:text-2xl text-slate-300 leading-relaxed font-light">
          {children}
        </p>
      </div>
    </motion.div>
  );
};

// --- Main Page Component ---
export default function HomePage({ onLaunch }) {
  const containerRef = useRef(null);
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: containerRef });
  
  // Background gradient shift to make HUD stand out
  const bgOpacity = useTransform(scrollYProgress, [0, 1], [0.8, 1]);

  // GSAP Epic Hero Timeline & Parallax
  useGSAP(() => {
    const tl = gsap.timeline();
    
    // Initial load cinematic stagger
    tl.fromTo(".gsap-hero-badge", 
      { opacity: 0, y: -30, scale: 0.8 }, 
      { opacity: 1, y: 0, scale: 1, duration: 1, ease: "expo.out", delay: 0.2 }
    )
    .fromTo(".gsap-hero-text",
      { opacity: 0, z: -200, rotationX: 45, y: 50 },
      { opacity: 1, z: 0, rotationX: 0, y: 0, duration: 1.5, ease: "power4.out", stagger: 0.2 },
      "-=0.5"
    )
    .fromTo(".gsap-hero-sub",
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 1, ease: "power2.out" },
      "-=1"
    )
    .fromTo(".gsap-scroll-indicator",
      { opacity: 0 },
      { opacity: 1, duration: 1 },
      "-=0.5"
    );

    // ScrollTrigger to parallax the hero away on scroll
    gsap.to(heroRef.current, {
      yPercent: 50,
      opacity: 0,
      ease: "none",
      scrollTrigger: {
        trigger: heroRef.current,
        start: "top top",
        end: "bottom top",
        scrub: true,
      }
    });

  }, { scope: containerRef });

  return (
    <ReactLenis root options={{ lerp: 0.05, smoothWheel: true }}>
      <div ref={containerRef} className="bg-black font-sans text-slate-100 overflow-x-hidden selection:bg-[#0ea5e9] selection:text-black">
        
        {/* Fixed 3D HUD Canvas Background */}
        <div className="fixed inset-0 z-0 pointer-events-none">
          <Canvas camera={{ position: [6, 3, 10], fov: 45 }}>
            <Scene scrollYProgress={scrollYProgress} />
          </Canvas>
        </div>
        
        {/* Vignette Overlay for cinematic feel */}
        <div className="fixed inset-0 z-0 bg-[radial-gradient(circle_at_center,transparent_0%,#000000_100%)] pointer-events-none opacity-80" />

        {/* CONTENT LAYER */}
        <div className="relative z-10 w-full px-6 sm:px-12 md:px-24 mx-auto max-w-[1400px] pointer-events-none">
          
          {/* HERO */}
          <div ref={heroRef} className="min-h-[100vh] flex flex-col justify-center items-start pt-20 perspective-1000">
            <div>
              <div className="gsap-hero-badge mb-6 inline-flex items-center gap-2 rounded-full border border-[#0ea5e9]/30 bg-black/60 px-4 sm:px-5 py-2 text-[10px] sm:text-xs font-bold uppercase tracking-widest text-[#0ea5e9] backdrop-blur-xl shadow-[0_0_20px_rgba(0,255,204,0.2)]">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#0ea5e9] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#0ea5e9]"></span>
                </span>
                HSM Digital Twin Active
              </div>
              
              <div className="gsap-hero-text text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-black tracking-tighter text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.3)] mb-0" style={{ transformStyle: 'preserve-3d' }}>
                The Mill.
              </div>
              <div className="gsap-hero-text text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-black tracking-tighter text-[#0ea5e9] drop-shadow-[0_0_30px_rgba(0,255,204,0.3)] mb-4" style={{ transformStyle: 'preserve-3d' }}>
                Digitized.
              </div>
              
              <p className="gsap-hero-sub mt-6 sm:mt-8 max-w-xl text-lg sm:text-xl md:text-2xl text-slate-400 font-light leading-relaxed">
                Scroll to trace a single slab from start to finish. Witness the physical process, powered by our digital intelligence.
              </p>
            </div>
            
            <div className="gsap-scroll-indicator absolute bottom-10 right-6 sm:right-12 text-[#0ea5e9] flex flex-col items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-[0.3em] drop-shadow-md">Scroll to Initialize</span>
              <motion.div animate={{ y: [0, 10, 0] }} transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}><ArrowDown className="h-5 w-5 drop-shadow-md" /></motion.div>
            </div>
          </div>

          {/* PHASE 1 */}
          <div className="relative min-h-[120vh] flex flex-col justify-center">
            <StoryPhase title="Heating & Cleaning" subtitle="Phase 01 • RHF & PDS" icon={Flame}>
              Slabs are heated to 1250°C in the Reheating Furnace. Upon exit, they are blasted with high-pressure water to wash away thick furnace scale.
              <br/><br/>
              <span className="text-[#0ea5e9] font-medium">App Integration:</span> Our application digitizes the manual furnace logs, instantly flagging any temperature drops below optimal forging thresholds.
            </StoryPhase>
            
            <div className="lg:absolute lg:right-0 lg:top-1/2 lg:-translate-y-1/2 flex flex-col sm:flex-row lg:flex-col gap-4 pointer-events-auto w-full lg:w-72 mt-8 lg:mt-0 relative z-20 pb-20 lg:pb-0">
              <DataWidget title="Furnace Zone 1" value="1,248" unit="°C" icon={Thermometer} colorClass="text-[#ff3300] border-[#ff3300]/30 shadow-[0_0_30px_rgba(255,51,0,0.15)]" delay={0.1} />
              <DataWidget title="Cloud Sync Status" value="Online" unit="" icon={Activity} colorClass="text-[#0ea5e9] border-[#0ea5e9]/30 shadow-[0_0_30px_rgba(0,255,204,0.15)]" delay={0.3} />
            </div>
          </div>

          {/* PHASE 2 */}
          <div className="relative min-h-[120vh] flex flex-col justify-center">
            <StoryPhase title="The Roughing Mill" subtitle="Phase 02 • Breaking it down" icon={Replace}>
              The clean, thick slab enters the <strong>2Hi-R1</strong> and <strong>4Hi-R2</strong> reversing stands. Massive backup rolls crush the slab's thickness into a 30–50 mm transfer bar.
              <br/><br/>
              <span className="text-[#0ea5e9] font-medium">App Integration:</span> Operators previously recorded these heavy passes on paper. Our mobile-first checklists allow them to log data in seconds from the pulpit.
            </StoryPhase>

            <div className="lg:absolute lg:right-0 lg:top-1/2 lg:-translate-y-1/2 flex flex-col sm:flex-row lg:flex-col gap-4 pointer-events-auto w-full lg:w-72 mt-8 lg:mt-0 relative z-20 pb-20 lg:pb-0">
              <DataWidget title="R1 Log Entry" value="Saved" unit="" icon={ClipboardCheck} colorClass="text-[#0ea5e9] border-[#0ea5e9]/30 shadow-[0_0_30px_rgba(0,255,204,0.15)]" delay={0.1} />
              <DataWidget title="Target Thickness" value="45.0" unit="mm" icon={Gauge} colorClass="text-slate-300 border-white/20" delay={0.3} />
            </div>
          </div>

          {/* PHASE 3 */}
          <div className="relative min-h-[120vh] flex flex-col justify-center">
            <StoryPhase title="Thermal Prep" subtitle="Phase 03 • Heat Shields & Shear" icon={Shield}>
              The long transfer bar travels under insulated hoods. Before rolling, the Crop Shear cleanly chops off the deformed front and back ends.
              <br/><br/>
              <span className="text-[#0ea5e9] font-medium">App Integration:</span> Using our real-time anomaly detection, any variance in crop shear timing or thermal loss is instantly pushed to the management dashboard.
            </StoryPhase>

            <div className="lg:absolute lg:right-0 lg:top-1/2 lg:-translate-y-1/2 flex flex-col sm:flex-row lg:flex-col gap-4 pointer-events-auto w-full lg:w-72 mt-8 lg:mt-0 relative z-20 pb-20 lg:pb-0">
               <DataWidget title="Anomaly Engine" value="Active" unit="" icon={ShieldAlert} colorClass="text-[#ff0055] border-[#ff0055]/30 shadow-[0_0_30px_rgba(255,0,85,0.15)]" delay={0.1} />
               <DataWidget title="Bar Temp Dev" value="±2.4" unit="°C" icon={Thermometer} colorClass="text-slate-300 border-white/20" delay={0.3} />
            </div>
          </div>

          {/* PHASE 4 */}
          <div className="relative min-h-[120vh] flex flex-col justify-center">
            <StoryPhase title="Precision Rolling" subtitle="Phase 04 • Finishing & Coiling" icon={Activity}>
              The steel rushes through 7 stands of 4-High CVC mills, exiting at its final gauge before wrapping into a heavy steel coil.
              <br/><br/>
              <span className="text-[#0ea5e9] font-medium">App Integration:</span> What used to be 13 disconnected spreadsheets is now a single, seamless, high-speed digital workflow. Zero paper. Infinite cloud.
            </StoryPhase>
            
            <div className="lg:absolute lg:right-0 lg:top-1/2 lg:-translate-y-1/2 flex flex-col sm:flex-row lg:flex-col gap-4 pointer-events-auto w-full lg:w-72 mt-8 lg:mt-0 relative z-20 pb-20 lg:pb-0">
               <DataWidget title="DB Transaction" value="Committed" unit="" icon={Zap} colorClass="text-[#0ea5e9] border-[#0ea5e9]/30 shadow-[0_0_30px_rgba(0,255,204,0.15)]" delay={0.1} />
               <DataWidget title="Final Gauge" value="2.00" unit="mm" icon={Gauge} colorClass="text-slate-300 border-white/20" delay={0.3} />
            </div>
          </div>

          {/* FINAL CTA / FEATURES */}
          <div className="min-h-[120vh] flex flex-col justify-center items-center text-center pb-20 pointer-events-auto relative z-20">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 50 }}
              whileInView={{ opacity: 1, scale: 1, y: 0 }}
              viewport={{ once: false }}
              transition={{ duration: 1, type: "spring", bounce: 0.3 }}
              className="w-full max-w-6xl rounded-[2rem] bg-black/80 backdrop-blur-3xl border border-[#0ea5e9]/30 p-6 sm:p-10 md:p-16 shadow-[0_0_100px_rgba(0,255,204,0.15)] relative overflow-hidden group"
            >
              {/* Animated Grid Background */}
              <div className="absolute inset-0 opacity-20 transition-opacity group-hover:opacity-40" 
                   style={{ backgroundImage: 'radial-gradient(#0ea5e9 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
              <div className="absolute inset-0 bg-gradient-to-b from-[#0ea5e9]/10 via-transparent to-transparent pointer-events-none" />
              
              {/* Sweeping Light Effect */}
              <motion.div 
                animate={{ x: ['-100%', '200%'] }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear", repeatDelay: 2 }}
                className="absolute top-0 left-0 w-1/2 h-full bg-gradient-to-r from-transparent via-[#0ea5e9]/10 to-transparent skew-x-12"
              />

              <div className="relative z-10 mb-12 sm:mb-16">
                <h2 className="text-4xl sm:text-6xl md:text-7xl font-black text-white mb-4 sm:mb-6 drop-shadow-[0_0_20px_rgba(255,255,255,0.2)]">
                  Digital Twin Synced.
                </h2>
                <p className="text-lg sm:text-xl md:text-2xl text-slate-400 max-w-3xl mx-auto font-light">
                  We've mapped this entire complex physical process into a seamless digital workflow. The mill is now intelligent.
                </p>
              </div>

              {/* Feature Grid with Animated Graphs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mb-12 sm:mb-16 relative z-10 text-left">
                <FeatureCard 
                  title="13 Digital Checklists" 
                  desc="Paper eliminated. Complete mobile-first data entry for all shift logs with real-time validation."
                  icon={ClipboardCheck} color="#0ea5e9" delay={0.1}
                />
                <FeatureCard 
                  title="Live Cloud Sync" 
                  desc="High-performance PostgreSQL backend. No more lost data at the end of shifts. Zero latency."
                  icon={Zap} color="#3b82f6" delay={0.3}
                />
                <FeatureCard 
                  title="Smart Anomalies" 
                  desc="Automated AI-driven alerts for out-of-bounds pressure and temperature readings."
                  icon={ShieldAlert} color="#ff0055" delay={0.5}
                />
              </div>

              {/* Upgraded Button */}
              <div className="relative z-10 flex justify-center">
                <MagneticButton onClick={onLaunch} className="group relative overflow-hidden rounded-full bg-[#0ea5e9] px-8 sm:px-16 py-4 sm:py-6 font-black text-black shadow-[0_0_40px_rgba(0,255,204,0.5)] transition-all hover:scale-105 sm:hover:scale-110 hover:shadow-[0_0_60px_rgba(0,255,204,0.8)] w-full sm:w-auto text-center flex justify-center items-center">
                  <span className="relative z-10 flex items-center justify-center gap-2 sm:gap-3 text-lg sm:text-xl tracking-tight">
                    Initialize Dashboard
                    <ArrowRight className="h-5 w-5 sm:h-6 sm:w-6 transition-transform group-hover:translate-x-2 shrink-0" />
                  </span>
                  {/* Button internal sweeping light */}
                  <motion.div 
                    animate={{ x: ['-100%', '200%'] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear", repeatDelay: 1 }}
                    className="absolute inset-0 z-0 bg-gradient-to-r from-transparent via-white/50 to-transparent skew-x-12"
                  />
                </MagneticButton>
              </div>
            </motion.div>
          </div>

        </div>
      </div>
    </ReactLenis>
  );
}
