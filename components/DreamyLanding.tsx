'use client'

import React, { useRef, useEffect } from 'react'
import { Canvas, useFrame, extend, ThreeElement } from '@react-three/fiber'
import { Float, PerspectiveCamera, useTexture, shaderMaterial } from '@react-three/drei'
import * as THREE from 'three'
import { motion, useMotionValue, useSpring, animate } from 'framer-motion'
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

  // shaderMaterial infers uMap from its null default, so the texture needs a loose cast.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const uMap = texture as any

  return (
    <mesh ref={meshRef}>
      <planeGeometry args={[LOGO_WIDTH, LOGO_HEIGHT]} />
      <shimmerMaterial
        ref={materialRef}
        uMap={uMap}
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

// Mist gradient that dissolves the green into the grey gallery from the top
const GALLERY_MIST =
  'linear-gradient(0deg, rgba(255, 255, 255, 0.00) -0.68%, rgba(234, 255, 178, 0.00) 12.4%, #EAFFB2 89.99%)'

function IconButton({ n }: { n: number }) {
  const rotation = useMotionValue(0)

  const handleHoverStart = () => {
    animate(rotation, rotation.get() + 720, {
      duration: 0.7,
      ease: [0.22, 1, 0.36, 1],
    })
  }

  return (
    <motion.div
      onHoverStart={handleHoverStart}
      style={{ rotate: rotation }}
      className="pointer-events-auto"
      aria-hidden="true"
    >
      <Image
        src={`/images/assets/icons/icon ${n}.png`}
        alt=""
        width={18}
        height={18}
        className="w-[18px] h-[18px] sm:w-[38px] sm:h-[38px] md:w-[54px] md:h-[54px]"
      />
    </motion.div>
  )
}

// Zone 3 gallery card: reveals on enter + tilts in 3D toward the cursor on hover
function GalleryCard({ priority }: { priority?: boolean }) {
  const rotateX = useMotionValue(0)
  const rotateY = useMotionValue(0)
  const springX = useSpring(rotateX, { stiffness: 150, damping: 15 })
  const springY = useSpring(rotateY, { stiffness: 150, damping: 15 })

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const px = (e.clientX - rect.left) / rect.width - 0.5
    const py = (e.clientY - rect.top) / rect.height - 0.5
    rotateY.set(px * 12)
    rotateX.set(-py * 12)
  }

  const reset = () => {
    rotateX.set(0)
    rotateY.set(0)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
      style={{ perspective: 1000 }}
      className="shrink-0"
    >
      <motion.div
        onMouseMove={handleMouseMove}
        onMouseLeave={reset}
        style={{ rotateX: springX, rotateY: springY, transformStyle: 'preserve-3d' }}
        className="relative w-[260px] h-[340px] md:w-[300px] md:h-[400px] overflow-hidden bg-neutral-200 shadow-[0_20px_40px_-20px_rgba(0,0,0,0.35)]"
      >
        <Image
          src="/images/hero-art.jpg"
          alt=""
          fill
          priority={priority}
          sizes="(max-width: 768px) 260px, 300px"
          className="object-cover transition-transform duration-700 ease-out hover:scale-105"
        />
      </motion.div>
    </motion.div>
  )
}

export function DreamyLanding() {
  return (
    <div className="relative w-full">
      {/* === HERO: Zone 1 + Zone 2 — together fill the viewport height === */}
      <div className="relative flex flex-col md:flex-row w-full md:h-screen">

        {/* === Zone 1 — Hero Left (transparent so the global fluid marbled bg shows through) === */}
        <section className="relative w-full md:w-1/2 min-h-[60vh] md:min-h-0 md:h-full flex items-center justify-center overflow-hidden py-16 md:py-0">
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

          {/* decorative cross/flower icons — vertical column, left side */}
          <div className="absolute left-[6%] top-1/2 -translate-y-1/2 z-20 flex flex-col items-start gap-0 pointer-events-none">

            {[1, 2, 3].map((n) => (
              <IconButton key={n} n={n} />
            ))}
          </div>

          {/* logo group — vertically + horizontally centred within the zone */}
          <div className="relative z-10 flex flex-col justify-center items-center">
            {/* Main Logo — shimmer + float animation preserved */}
            <div className="w-[340px] h-[379px] md:w-[487px] md:h-[543px]">
              <Canvas gl={{ antialias: true, alpha: true }}>
                <PerspectiveCamera makeDefault position={[0, 0, 5]} fov={50} />
                <ambientLight intensity={0.5} />
                <pointLight position={[10, 10, 10]} intensity={1} />
                <Float speed={1.5} rotationIntensity={0.3} floatIntensity={0.3}>
                  <ButterflyLogo />
                </Float>
              </Canvas>
            </div>

            {/* NINARO Logo — opacity/scale pulse animation preserved; id is the intro's landing target */}
            <motion.div
              id="homepage-ninaro"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ y: { duration: 1.5, ease: 'easeOut' }, opacity: { duration: 1.5, ease: 'easeOut' } }}
              className="relative w-[280px] h-[95px] md:w-[400px] md:h-[135px] -mt-[40px]"
            >
              <Image
                src="/images/assets/ninaro.png"
                alt="NINARÒ"
                fill
                className="object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]"
                priority
              />
            </motion.div>

            {/* Coming soon — matches intro subtitle type treatment */}
            <motion.span
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ y: { duration: 1.5, ease: 'easeOut' }, opacity: { duration: 1.5, ease: 'easeOut' } }}
              className="mt-[10px] font-[family-name:var(--font-dancing-script)] font-light text-[18px] tracking-[0.25em] text-neutral-800 uppercase"
            >
              Coming Soon
            </motion.span>
          </div>
        </section>

        {/* === Zone 2 — Navigation Right (always-visible grid paper panel with torn left edge) === */}
        <aside
          className="relative w-full md:w-1/2 min-h-[50vh] md:min-h-0 md:h-full z-10"
          style={{ filter: 'drop-shadow(-5px 0px 6px rgba(0,0,0,0.35))' }}
        >
          <div
            className="w-full h-full"
            style={{
              backgroundColor: '#ffffff',
              backgroundImage:
                'linear-gradient(to right, #cbcbcb 1px, transparent 1px), ' +
                'linear-gradient(to bottom, #cbcbcb 1px, transparent 1px)',
              backgroundSize: '72px 72px',
            }}
          >
            <nav className="flex flex-col items-end justify-center h-full pr-8 md:pr-12 gap-[6px]">
              {NAV_ITEMS.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="group relative font-[family-name:var(--font-dancing-script)] text-[28px] md:text-[32px] leading-tight text-neutral-800 transition-colors duration-500 hover:text-neutral-500"
                >
                  {item.label}
                  <span className="pointer-events-none absolute right-0 -bottom-0.5 h-px w-0 bg-current transition-all duration-500 ease-out group-hover:w-full" />
                </a>
              ))}
            </nav>
          </div>
        </aside>
      </div>

      {/* === Zone 3 — Scrollable Gallery (revealed below the fold) === */}
      <section
        className="relative w-full overflow-hidden"
        style={{ height: '60vh', backgroundColor: '#A2A7B4' }}
      >
        {/* coloured mist dissolving into the grey from the top */}
        <div
          className="absolute inset-x-0 top-0 h-[45%] pointer-events-none z-0"
          style={{ background: GALLERY_MIST }}
        />

        {/* editorial strip — tilt-on-hover cards, horizontally scrollable */}
        <div className="relative z-10 h-full flex items-center">
          <div className="flex items-center gap-8 md:gap-10 h-full px-8 md:px-16 overflow-x-auto overflow-y-hidden no-scrollbar">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <GalleryCard key={i} priority={i === 0} />
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
