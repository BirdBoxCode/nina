'use client'

import React, { useRef, useState, useEffect } from 'react'
import { Canvas, useFrame, extend, ThreeElement } from '@react-three/fiber'
import { Points, PointMaterial, Float, PerspectiveCamera, useTexture, shaderMaterial } from '@react-three/drei'
import * as THREE from 'three'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

import Image from 'next/image'

// --- Custom Shimmer Material ---
const ShimmerMaterial = shaderMaterial(
  {
    uTime: 0,
    uMouse: new THREE.Vector2(0, 0),
    uMap: null,
  },
  // Vertex Shader
  `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
  `,
  // Fragment Shader
  `
  uniform sampler2D uMap;
  uniform float uTime;
  uniform vec2 uMouse;
  varying vec2 vUv;

  void main() {
    vec4 tex = texture2D(uMap, vUv);
    if (tex.a < 0.01) discard;

    // Create a diagonal reflective shimmer band
    // The band position is influenced by both time and mouse movement
    float angle = vUv.x + vUv.y;
    float spread = 0.3;
    float speed = uTime * 0.5;
    float mouseInfluence = (uMouse.x + uMouse.y) * 2.0;
    
    float shimmer = sin(angle * 4.0 - speed - mouseInfluence);
    shimmer = smoothstep(0.7, 1.0, shimmer);
    
    // Soften the shimmer and apply it as a white highlight
    vec3 highlight = vec3(1.0, 1.0, 1.0) * shimmer * 0.4;
    
    // Add a slight "glint" based on mouse position
    float glint = 1.0 - distance(vUv, uMouse * 0.5 + 0.5);
    glint = pow(max(0.0, glint), 8.0) * 0.3;
    
    vec3 finalColor = tex.rgb + highlight + vec3(glint);
    
    gl_FragColor = vec4(finalColor, tex.a);
  }
  `
)

extend({ ShimmerMaterial })

// Add type safety for the custom material
declare module '@react-three/fiber' {
  interface ThreeElements {
    shimmerMaterial: ThreeElement<typeof ShimmerMaterial> & {
      uMap?: THREE.Texture | null
    }
  }
}

// --- Particle System ---
function ParticleEmitter({ count = 800 }) {
  const points = useRef<THREE.Points>(null!)
  
  // Create the arrays once and keep them stable.
  // We use useState with a factory function to ensure they are only created once.
  const [positions] = useState(() => new Float32Array(count * 3))
  const [velocities] = useState(() => new Float32Array(count * 3))
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    // We ignore the immutability rule here because we are intentionally 
    // initializing the TypedArray content once on mount.
    /* eslint-disable react-hooks/immutability */
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 5
      positions[i * 3 + 1] = (Math.random() - 0.5) * 5
      positions[i * 3 + 2] = (Math.random() - 0.5) * 2
      
      velocities[i * 3] = (Math.random() - 0.5) * 0.01
      velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.01
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.01
    }
    /* eslint-enable react-hooks/immutability */
    setInitialized(true)
  }, [count, positions, velocities])

  useFrame((state) => {
    if (!initialized) return
    const time = state.clock.getElapsedTime()
    const { x, y } = state.mouse
    
    /* eslint-disable react-hooks/immutability */
    for (let i = 0; i < count; i++) {
      const idx = i * 3
      // Drift outward
      positions[idx] += velocities[idx] + Math.sin(time + i) * 0.001
      positions[idx + 1] += velocities[idx + 1] + Math.cos(time + i) * 0.001
      
      // Reactive to mouse
      const dx = positions[idx] - x * 5
      const dy = positions[idx + 1] - y * 5
      const dist = Math.sqrt(dx * dx + dy * dy)
      if (dist < 1) {
        positions[idx] += dx * 0.01
        positions[idx + 1] += dy * 0.01
      }

      // Reset if too far
      if (Math.abs(positions[idx]) > 6 || Math.abs(positions[idx + 1]) > 6) {
        positions[idx] = (Math.random() - 0.5) * 0.5
        positions[idx + 1] = (Math.random() - 0.5) * 0.5
      }
    }
    /* eslint-enable react-hooks/immutability */
    points.current.geometry.attributes.position.needsUpdate = true
  })

  return (
    <Points ref={points} positions={positions} stride={3} frustumCulled={false}>
      <PointMaterial
        transparent
        color="#ffffff"
        size={0.015}
        sizeAttenuation={true}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        opacity={0.6}
      />
    </Points>
  )
}

// --- Central Logo ---
function ButterflyLogo() {
  const texture = useTexture('/images/assets/butterfly_1_cut.png')
  const meshRef = useRef<THREE.Mesh>(null!)
  const materialRef = useRef<THREE.ShaderMaterial>(null!)

  useFrame((state) => {
    const { x, y } = state.mouse
    // Subtle tilt
    meshRef.current.rotation.y = THREE.MathUtils.lerp(meshRef.current.rotation.y, x * 0.4, 0.1)
    meshRef.current.rotation.x = THREE.MathUtils.lerp(meshRef.current.rotation.x, -y * 0.4, 0.1)
    
    // Update shader uniforms
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.getElapsedTime()
      materialRef.current.uniforms.uMouse.value.lerp(new THREE.Vector2(x, y), 0.1)
    }

    // Floating motion
    const t = state.clock.getElapsedTime()
    meshRef.current.position.y = Math.sin(t * 0.8) * 0.1
  })

  return (
    <mesh ref={meshRef}>
      <planeGeometry args={[3, 3]} />
      <shimmerMaterial 
        ref={materialRef} 
        uMap={texture as any} 
        transparent 
        alphaTest={0.01} 
        side={THREE.DoubleSide} 
      />
    </mesh>
  )
}

export function DreamyLanding() {
  const [isMobile, setIsMobile] = useState(false)
  
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  return (
    <div className="relative h-screen max-h-screen w-screen overflow-hidden bg-neutral-950">
      {/* --- Background Layer --- */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center opacity-80"
        style={{ 
          backgroundImage: "url('/images/assets/bg2.png')",
          backgroundSize: 'cover',
        }}
      />
      
      {/* --- 3D Layer --- */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        <Canvas gl={{ antialias: true, alpha: true }}>
          <PerspectiveCamera makeDefault position={[0, 0, 5]} fov={isMobile ? 75 : 50} />
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} intensity={1} />
          
          <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5} position={[0, isMobile ? 1.2 : 0, 0]}>
            <ButterflyLogo />
          </Float>
          
          <ParticleEmitter count={isMobile ? 400 : 1000} />
        </Canvas>
      </div>

      {/* --- Text Layer --- */}
      <div className="absolute inset-0 z-20 flex flex-col items-center justify-center pointer-events-none">
        <div className="mt-0 md:mt-[400px] text-center flex flex-col items-center">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ 
              opacity: [0.7, 1, 0.7],
              y: 0,
              scale: [0.98, 1, 0.98]
            }}
            transition={{ 
              opacity: { duration: 4, repeat: Infinity, ease: "easeInOut" },
              scale: { duration: 4, repeat: Infinity, ease: "easeInOut" },
              y: { duration: 1.5, ease: "easeOut" }
            }}
            className="relative w-[300px] h-[100px] md:w-[500px] md:h-[160px] lg:w-[650px] lg:h-[200px]"
          >
            <Image
              src="/images/assets/ninaro.png"
              alt="NINARÒ"
              fill
              className="object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]"
              priority
            />
          </motion.div>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 2 }}
            className="text-xs md:text-sm tracking-[0.5em] font-light text-indigo-200 mt-4 uppercase bg-black/30 backdrop-blur-md border border-white/10 px-4 py-1.5 rounded-full"
          >
            Coming Soon
          </motion.p>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5, duration: 2 }}
            className="flex flex-wrap justify-center gap-x-6 gap-y-3 mt-8 pointer-events-auto"
          >
            {['Paintings', 'Bio', 'Tattoo', 'Shop', 'Contact'].map((label) => (
              <motion.span
                key={label}
                whileHover={{ scale: 1.1, color: '#fff' }}
                className="text-[16px] uppercase tracking-[0.3em] text-white/40 transition-colors"
              >
                {label}
              </motion.span>
            ))}
          </motion.div>
        </div>
      </div>
      
      {/* Decorative Overlays */}
      <div className="absolute inset-0 z-0 bg-radial-gradient from-transparent via-transparent to-black/40 pointer-events-none" />
    </div>
  )
}
