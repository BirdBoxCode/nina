'use client'

import React, { useRef, useEffect } from 'react'
import { Canvas, useFrame, extend, ThreeElement } from '@react-three/fiber'
import { Float, PerspectiveCamera, useTexture, shaderMaterial } from '@react-three/drei'
import * as THREE from 'three'
import { motion } from 'framer-motion'
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
  const texture = useTexture('/images/assets/Opera_senza_titolo-4 2.png')
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

export function DreamyLanding() {
  return (
    <div className="relative w-full min-h-screen flex items-center justify-center bg-[#FBFFFF]">
      <PaperCrinkle />
      {/* section-hero */}
      <div className="flex flex-col items-center gap-[10px] w-[1100px] h-[987px] flex-shrink-0">
        {/* HERO-WRAPPER */}
        <div className="relative flex h-[987px] px-[30px] py-[10px] justify-center items-center flex-shrink-0 self-stretch">

          {/* icon-wrapper */}
          <div className="absolute left-[30px] top-[99px] flex flex-col items-start py-[1px] gap-[10px]">
            <Image src="/images/assets/icons/icon 1.png" alt="" width={70} height={70} />
            <Image src="/images/assets/icons/icon 2.png" alt="" width={70} height={70} />
            <Image src="/images/assets/icons/icon 3.png" alt="" width={70} height={70} />
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
                src="/images/assets/Opera_senza_titolo-5 2.png"
                alt="NINARÒ"
                fill
                className="object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]"
                priority
              />
            </motion.div>
          </div>

        </div>
      </div>
    </div>
  )
}
