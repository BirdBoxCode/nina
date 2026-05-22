'use client'

import React, { useRef, useEffect, useState } from 'react'
import { Canvas, useFrame, extend, ThreeElement } from '@react-three/fiber'
import { Float, PerspectiveCamera, useTexture, shaderMaterial } from '@react-three/drei'
import * as THREE from 'three'
import { motion, useMotionValue, useSpring, animate, type MotionValue } from 'framer-motion'
import Image from 'next/image'
import { PaperCrinkle } from '@/components/PaperCrinkle'

// --- Custom Shimmer Material ---
const ShimmerMaterial = shaderMaterial(
  {
    uTime: 0,
    uMouse: new THREE.Vector2(0, 0),
    uMap: null,
  },
  `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
  `,
  `
  uniform sampler2D uMap;
  uniform float uTime;
  uniform vec2 uMouse;
  varying vec2 vUv;

  void main() {
    vec4 tex = texture2D(uMap, vUv);
    if (tex.a < 0.01) discard;

    float angle = vUv.x + vUv.y;
    float speed = uTime * 0.5;
    float mouseInfluence = (uMouse.x + uMouse.y) * 2.0;

    float shimmer = sin(angle * 4.0 - speed - mouseInfluence);
    shimmer = smoothstep(0.88, 1.0, shimmer);

    vec3 highlight = vec3(1.0, 1.0, 1.0) * shimmer * 0.12;

    float glint = 1.0 - distance(vUv, uMouse * 0.5 + 0.5);
    glint = pow(max(0.0, glint), 8.0) * 0.18;

    vec3 finalColor = tex.rgb + highlight + vec3(glint);

    gl_FragColor = vec4(finalColor, tex.a);
  }
  `
)

extend({ ShimmerMaterial })

declare module '@react-three/fiber' {
  interface ThreeElements {
    shimmerMaterial: ThreeElement<typeof ShimmerMaterial> & {
      uMap?: THREE.Texture | null
    }
  }
}

function ButterflyLogo() {
  const texture = useTexture('/images/assets/opera-senza.png')
  const meshRef = useRef<THREE.Mesh>(null!)
  const materialRef = useRef<THREE.ShaderMaterial>(null!)
  const windowMouse = useRef(new THREE.Vector2(0, 0))

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      windowMouse.current.set(
        (e.clientX / window.innerWidth) * 2 - 1,
        -((e.clientY / window.innerHeight) * 2 - 1)
      )
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  useFrame((state) => {
    const x = windowMouse.current.x
    const y = windowMouse.current.y
    meshRef.current.rotation.y = THREE.MathUtils.lerp(meshRef.current.rotation.y, x * 0.25, 0.1)
    meshRef.current.rotation.x = THREE.MathUtils.lerp(meshRef.current.rotation.x, -y * 0.25, 0.1)

    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.getElapsedTime()
      materialRef.current.uniforms.uMouse.value.lerp(new THREE.Vector2(x, y), 0.1)
    }

    const t = state.clock.getElapsedTime()
    meshRef.current.position.y = Math.sin(t * 0.8) * 0.06
  })

  const LOGO_HEIGHT = 4
  const LOGO_WIDTH = LOGO_HEIGHT * (487 / 543)

  return (
    <mesh ref={meshRef}>
      <planeGeometry args={[LOGO_WIDTH, LOGO_HEIGHT]} />
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

const NAV_ITEMS = [
  { label: 'murals', href: '/walls' },
  { label: 'paintings', href: '/paintings' },
  { label: 'illustrations', href: '/illustration' },
  { label: 'installations', href: '/installations' },
  { label: 'about me', href: '/bio-contact' },
  { label: 'shop', href: '/shop' },
  { label: 'contact', href: '/contact' },
  { label: 'tattoos', href: '/?v=tattoo' },
  { label: 'do your own', href: '/workshops' },
]

// Torn paper left-edge clip-path (irregular points simulate torn paper)
const TORN_CLIP =
  'polygon(6% 0%, 2% 3%, 7% 7%, 1% 11%, 5% 15%, 0% 19%, 4% 23%, 7% 27%, 1% 31%, 5% 35%, 2% 39%, 6% 43%, 0% 47%, 4% 51%, 7% 55%, 1% 59%, 5% 63%, 2% 67%, 6% 71%, 0% 75%, 4% 79%, 7% 83%, 1% 87%, 5% 91%, 2% 95%, 6% 100%, 100% 100%, 100% 0%)'

function IconButton({
  n,
  scale,
  onToggleNav,
}: {
  n: number
  scale: MotionValue<number>
  onToggleNav: () => void
}) {
  const rotation = useMotionValue(0)

  const handleHoverStart = () => {
    animate(rotation, rotation.get() + 720, {
      duration: 0.7,
      ease: [0.22, 1, 0.36, 1],
    })
  }

  return (
    <motion.button
      onClick={onToggleNav}
      onHoverStart={handleHoverStart}
      style={{ scale, rotate: rotation }}
      className="cursor-pointer focus:outline-none"
      aria-label="Toggle navigation"
    >
      <Image
        src={`/images/assets/icons/icon ${n}.png`}
        alt=""
        width={14}
        height={14}
        className="w-8 h-8 sm:w-12 sm:h-12 md:w-16 md:h-16"
      />
    </motion.button>
  )
}

export function DreamyLanding() {
  const [navOpen, setNavOpen] = useState(false)
  const [edgeHovered, setEdgeHovered] = useState(false)
  const iconWrapperRef = useRef<HTMLDivElement>(null)
  const proximityScale = useMotionValue(1)
  const springScale = useSpring(proximityScale, { stiffness: 200, damping: 25 })

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!iconWrapperRef.current) return
      const rect = iconWrapperRef.current.getBoundingClientRect()
      const dx = Math.max(rect.left - e.clientX, 0, e.clientX - rect.right)
      const dy = Math.max(rect.top - e.clientY, 0, e.clientY - rect.bottom)
      const distance = Math.sqrt(dx * dx + dy * dy)
      const t = Math.max(0, 1 - distance / 150)
      proximityScale.set(1 + 0.2 * t)
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [proximityScale])

  return (
    <div className="relative w-full min-h-screen flex items-center justify-center bg-[#FBFFFF]">
      {/* ambient breathing shadow — slow warm vignette that pulses */}
      <div
        className="absolute inset-0 pointer-events-none z-0"
        style={{
          background:
            'radial-gradient(ellipse 85% 75% at 50% 50%, rgba(255,252,248,0) 0%, rgba(148,136,124,0.07) 55%, rgba(110,98,86,0.2) 100%)',
          animation: 'breath-shadow 8s ease-in-out infinite',
        }}
      />
      <PaperCrinkle />
      {/* section-hero */}
      <div className="flex flex-col items-center gap-[10px] max-w-[1100px] w-full">
        {/* HERO-WRAPPER */}
        <div className="relative flex flex-col items-center justify-center min-h-[987px] px-[30px] py-[10px] self-stretch">

          {/* icon-wrapper */}
          <div ref={iconWrapperRef} className="flex flex-row gap-4 z-50 md:absolute md:flex-col md:left-[30px] md:top-[99px] md:items-start md:py-[1px] md:gap-[10px]">
            {[1, 2, 3].map((n) => (
              <IconButton
                key={n}
                n={n}
                scale={springScale}
                onToggleNav={() => setNavOpen((v) => !v)}
              />
            ))}
          </div>

          {/* logo-wrapper */}
          <div className="flex flex-col justify-center items-center">
            {/* Main Logo — shimmer + float animation preserved */}
            <div className="w-[487px] h-[543px]">
              <Canvas gl={{ antialias: true, alpha: true }}>
                <PerspectiveCamera makeDefault position={[0, 0, 5]} fov={50} />
                <ambientLight intensity={0.5} />
                <pointLight position={[10, 10, 10]} intensity={1} />
                <Float speed={1.5} rotationIntensity={0.3} floatIntensity={0.3}>
                  <ButterflyLogo />
                </Float>
              </Canvas>
            </div>

            {/* NINARO Logo — opacity/scale pulse animation preserved */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{
                opacity: [0.7, 1, 0.7],
                y: 0,
                scale: [0.98, 1, 0.98],
              }}
              transition={{
                opacity: { duration: 4, repeat: Infinity, ease: 'easeInOut' },
                scale: { duration: 4, repeat: Infinity, ease: 'easeInOut' },
                y: { duration: 1.5, ease: 'easeOut' },
              }}
              className="relative w-[400px] h-[135px] -mt-[40px]"
            >
              <Image
                src="/images/assets/ninaro.png"
                alt="NINARÒ"
                fill
                className="object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]"
                priority
              />
            </motion.div>
          </div>

          {/* Click-outside overlay */}
          {navOpen && (
            <div
              className="fixed inset-0 z-30"
              onClick={() => setNavOpen(false)}
            />
          )}

          {/* Nav drawer */}
          <motion.div
            className={`fixed top-0 h-full w-[284px] z-40${!navOpen ? ' cursor-pointer' : ''}`}
            animate={{ x: navOpen ? 0 : edgeHovered ? 'calc(100% - 88px)' : 'calc(100% - 58px)' }}
            initial={{ x: 'calc(100% - 58px)' }}
            transition={{ type: 'spring', stiffness: 260, damping: 28 }}
            onMouseEnter={() => { if (!navOpen) setEdgeHovered(true) }}
            onMouseLeave={() => setEdgeHovered(false)}
            onClick={() => { if (!navOpen) { setNavOpen(true); setEdgeHovered(false) } }}
            style={{
              right: '-4px',
              filter: 'drop-shadow(-5px 0px 6px rgba(0,0,0,0.35))',
            }}
          >
            <div
              className="w-full h-full"
              style={{
                backgroundImage: "url('/images/assets/paper-bg.png')",
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                clipPath: TORN_CLIP,
              }}
            >
            <nav className="flex flex-col items-end justify-center h-full pr-6 gap-[10px]">
              {NAV_ITEMS.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="font-[family-name:var(--font-dancing-script)] text-[32px] leading-tight text-neutral-800 hover:text-neutral-500 transition-colors"
                >
                  {item.label}
                </a>
              ))}
            </nav>
            </div>
          </motion.div>

        </div>
      </div>
    </div>
  )
}
