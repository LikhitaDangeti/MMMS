import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, Sparkles } from '@react-three/drei';
import { EffectComposer, Bloom, ChromaticAberration } from '@react-three/postprocessing';
import { ClipboardCheck, Zap, ShieldAlert, ArrowRight } from 'lucide-react';
import * as THREE from 'three';

const AnimatedGraph = ({ color = "#0ea5e9" }) => (
  <div className="h-16 w-full mt-4 flex items-end gap-1.5 opacity-80">
    {[30, 50, 40, 70, 55, 90, 75, 100, 85].map((h, i) => (
      <motion.div
        key={i}
        initial={{ height: 0 }}
        animate={{ height: `${h}%` }}
        transition={{ duration: 0.8, delay: i * 0.05, type: "spring", bounce: 0.2 }}
        className="w-full rounded-t-sm"
        style={{ backgroundColor: color, boxShadow: `0 0 10px ${color}40` }}
      />
    ))}
  </div>
);

const FeatureCard = ({ title, desc, icon: Icon, color, delay }) => (
  <motion.div 
    initial={{ opacity: 0, y: 30 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.6, delay }}
    className="flex flex-col p-6 rounded-2xl bg-black/40 border border-white/10 backdrop-blur-md relative overflow-hidden group hover:border-white/20 transition-colors h-full text-left"
  >
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

const Scene = () => {
  const slabRef = useRef();
  const shaderRef = useRef();

  useFrame((state) => {
    if (slabRef.current && shaderRef.current) {
      slabRef.current.scale.set(3, 0.4, 15);
      slabRef.current.position.z = 5;
      shaderRef.current.uniforms.uTime.value = state.clock.elapsedTime;
    }
  });

  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={2} color="#ffffff" />
      <Environment preset="studio" />
      <EffectComposer>
        <Bloom luminanceThreshold={1} luminanceSmoothing={0.9} intensity={2.0} />
        <ChromaticAberration offset={[0.001, 0.001]} />
      </EffectComposer>
      <group position={[0, -4, 0]}>
        <mesh rotation={[-Math.PI/2, 0, 0]} position={[0, -0.1, 0]}>
          <planeGeometry args={[100, 100]} />
          <meshStandardMaterial color="#050505" roughness={0.2} metalness={0.8} />
        </mesh>
      </group>
      <Sparkles count={300} scale={30} size={1} speed={0.2} color="#0ea5e9" opacity={0.3} />
      <mesh ref={slabRef} position={[0, 0, 0]}>
        <boxGeometry args={[1, 1, 1, 32, 4, 32]} />
        <meshStandardMaterial 
          metalness={0.6}
          roughness={0.4}
          onBeforeCompile={(shader) => {
            shader.uniforms.uTime = { value: 0 };
            shaderRef.current = shader;
            shader.vertexShader = `varying vec2 vUv; varying vec3 vPos;\n` + shader.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>\nvUv = uv;\nvPos = position;`);
            shader.fragmentShader = `
              uniform float uTime;
              varying vec2 vUv;
              varying vec3 vPos;
              float random(vec2 st) { return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123); }
              float noise(vec2 st) {
                  vec2 i = floor(st); vec2 f = fract(st);
                  float a = random(i); float b = random(i + vec2(1.0, 0.0));
                  float c = random(i + vec2(0.0, 1.0)); float d = random(i + vec2(1.0, 1.0));
                  vec2 u = f * f * (3.0 - 2.0 * f);
                  return mix(a, b, u.x) + (c - a)* u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
              }
            ` + shader.fragmentShader.replace('#include <emissivemap_fragment>', `
              #include <emissivemap_fragment>
              float heat = (noise(vPos.xz * 15.0 + uTime * 2.0) + noise(vPos.xz * 30.0 - uTime * 3.0) * 0.5) / 1.5;
              float edge = smoothstep(0.0, 0.2, vUv.x) * smoothstep(1.0, 0.8, vUv.x) * smoothstep(0.0, 0.2, vUv.y) * smoothstep(1.0, 0.8, vUv.y);
              float finalHeat = heat * (0.6 + 0.4 * edge);
              vec3 heatColor = vec3(0.1, 0.1, 0.12);
              if (finalHeat > 0.6) heatColor = mix(vec3(0.9, 0.3, 0.05), vec3(1.0, 0.7, 0.2), (finalHeat - 0.6) / 0.4);
              else if (finalHeat > 0.3) heatColor = mix(vec3(0.4, 0.0, 0.0), vec3(0.9, 0.3, 0.05), (finalHeat - 0.3) / 0.3);
              else if (finalHeat > 0.0) heatColor = mix(vec3(0.1, 0.1, 0.12), vec3(0.4, 0.0, 0.0), finalHeat / 0.3);
              totalEmissiveRadiance = heatColor * 2.0;
              diffuseColor.rgb = heatColor * 0.4 + vec3(0.1, 0.1, 0.12);
            `);
          }}
        />
      </mesh>
    </>
  );
};

// ponytail: deleted ~400 lines of GSAP scroll story logic and useless extra wrappers. The best code is the code you never wrote.
export default function HomePage({ onLaunch }) {
  return (
    <div className="bg-black font-sans text-slate-100 min-h-screen flex items-center justify-center overflow-hidden selection:bg-[#0ea5e9] selection:text-black">
      <div className="fixed inset-0 z-0 pointer-events-none">
        <Canvas camera={{ position: [6, 3, 10], fov: 45 }}>
          <Scene />
        </Canvas>
      </div>
      <div className="fixed inset-0 z-0 bg-[radial-gradient(circle_at_center,transparent_0%,#000000_100%)] pointer-events-none opacity-80" />
      
      <div className="relative z-10 w-full px-6 sm:px-12 md:px-24 mx-auto max-w-[1400px]">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 50 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 1, type: "spring", bounce: 0.3 }}
          className="w-full max-w-6xl mx-auto rounded-[2rem] bg-black/80 backdrop-blur-3xl border border-[#0ea5e9]/30 p-6 sm:p-10 md:p-16 shadow-[0_0_100px_rgba(0,255,204,0.15)] relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-b from-[#0ea5e9]/10 via-transparent to-transparent pointer-events-none" />
          
          <div className="relative z-10 mb-12 sm:mb-16 text-center">
            <h2 className="text-4xl sm:text-6xl md:text-7xl font-black text-white mb-4 sm:mb-6 drop-shadow-[0_0_20px_rgba(255,255,255,0.2)]">
              Digital Twin Synced.
            </h2>
            <p className="text-lg sm:text-xl md:text-2xl text-slate-400 max-w-3xl mx-auto font-light">
              We've mapped this entire complex physical process into a seamless digital workflow. The mill is now intelligent.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mb-12 sm:mb-16 relative z-10">
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

          <div className="relative z-10 flex justify-center">
            <button onClick={onLaunch} className="group rounded-full bg-[#0ea5e9] px-8 sm:px-16 py-4 sm:py-6 font-black text-black shadow-[0_0_40px_rgba(0,255,204,0.5)] transition-all hover:scale-105 hover:shadow-[0_0_60px_rgba(0,255,204,0.8)] flex items-center justify-center gap-3 text-lg sm:text-xl tracking-tight">
              Initialize Dashboard
              <ArrowRight className="h-6 w-6 transition-transform group-hover:translate-x-2" />
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
