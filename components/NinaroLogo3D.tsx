'use client'

import React, { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useLoader, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader.js'

/* The outline is traced from the PNG on the same pixel grid, so the artwork maps straight
   onto the letter faces and the 3D logo lands exactly where the flat one sits. */
const ART = '/images/assets/ninaro.png'
const OUTLINE = '/images/assets/ninaro-outline.svg'
const ART_W = 1252
const ART_H = 463

/* Canvas overhang past the logo box on every side (fraction of its size), so the letters'
   sides and the turn are never clipped. The camera frames the logo to the inner box. */
const BLEED = 0.18
const FOV = 30
const DISTANCE = (ART_H * (1 + BLEED * 2)) / 2 / Math.tan(THREE.MathUtils.degToRad(FOV / 2))

/* Letter body, in artwork pixels. Bevel is kept under half the thinnest stroke. */
const DEPTH = 34
const BEVEL_THICKNESS = 12
const BEVEL_SIZE = 2.4

/* Turn toward the cursor, in radians at full glide, and how fast it settles. */
const TURN = 0.2
const DAMP = 6

/* Pale lavender side walls, a shade under the painted face so the edge reads. */
const SIDE = '#9da0d6'

type Glide = { x: number; y: number }

/* Front faces sample the artwork at their own position; side walls take the colour at the
   contour, so the painted edge wraps a little way round. */
const ART_UV: THREE.UVGenerator = {
  generateTopUV(_g, v, a, b, c) {
    return [a, b, c].map((i) => new THREE.Vector2(v[i * 3] / ART_W, 1 - v[i * 3 + 1] / ART_H))
  },
  generateSideWallUV(_g, v, a, b, c, d) {
    return [a, b, c, d].map((i) => new THREE.Vector2(v[i * 3] / ART_W, 1 - v[i * 3 + 1] / ART_H))
  },
}

function Wordmark({ glide, drift, onReady }: { glide: Glide; drift: boolean; onReady: () => void }) {
  const svg = useLoader(SVGLoader, OUTLINE)
  const art = useLoader(THREE.TextureLoader, ART)
  const group = useRef<THREE.Group>(null)
  const light = useRef<THREE.PointLight>(null)
  const target = useRef(glide)
  const invalidate = useThree((s) => s.invalidate)

  const geometry = useMemo(() => {
    const shapes = svg.paths.flatMap((p) => SVGLoader.createShapes(p))
    const g = new THREE.ExtrudeGeometry(shapes, {
      depth: DEPTH,
      bevelEnabled: true,
      bevelThickness: BEVEL_THICKNESS,
      bevelSize: BEVEL_SIZE,
      bevelSegments: 6,
      curveSegments: 6,
      UVGenerator: ART_UV,
    })
    // Centre on the artwork box with the front face at z = 0.
    g.translate(-ART_W / 2, -ART_H / 2, -(DEPTH + BEVEL_THICKNESS))
    return g
  }, [svg])

  // A copy to configure: the loader's texture is cached and shared.
  const map = useMemo(() => {
    const t = art.clone()
    t.colorSpace = THREE.SRGBColorSpace
    t.anisotropy = 4
    t.needsUpdate = true
    return t
  }, [art])

  const materials = useMemo(() => {
    // Face: the artwork shown as-is (emissive, so lighting never shifts its colours), with
    // a clear coat on top that picks up the moving light.
    const face = new THREE.MeshPhysicalMaterial({
      color: 0x000000,
      emissive: 0xffffff,
      emissiveMap: map,
      roughness: 0.6,
      clearcoat: 1,
      clearcoatRoughness: 0.32,
    })
    const side = new THREE.MeshPhysicalMaterial({
      color: SIDE,
      roughness: 0.45,
      clearcoat: 1,
      clearcoatRoughness: 0.2,
    })
    return [face, side]
  }, [map])

  useEffect(() => () => geometry.dispose(), [geometry])
  useEffect(() => () => materials.forEach((m) => m.dispose()), [materials])
  useEffect(() => () => map.dispose(), [map])

  useEffect(() => {
    target.current = glide
    invalidate()
  }, [glide, invalidate])

  // Reveal once the first frame with the letters has been drawn.
  useEffect(() => {
    const id = requestAnimationFrame(() => requestAnimationFrame(onReady))
    return () => cancelAnimationFrame(id)
  }, [onReady])

  useFrame((state, delta) => {
    const g = group.current
    const l = light.current
    if (!g || !l) return
    // No cursor (touch): the light drifts on its own in a slow loop.
    const t = drift
      ? { x: Math.sin(state.clock.elapsedTime * 0.35) * 0.8, y: Math.cos(state.clock.elapsedTime * 0.27) * 0.5 }
      : target.current
    const step = Math.min(delta, 0.05)
    g.rotation.y = THREE.MathUtils.damp(g.rotation.y, drift ? 0 : t.x * TURN, DAMP, step)
    g.rotation.x = THREE.MathUtils.damp(g.rotation.x, drift ? 0 : t.y * TURN * 0.6, DAMP, step)
    l.position.x = THREE.MathUtils.damp(l.position.x, t.x * ART_W * 0.6, DAMP, step)
    l.position.y = THREE.MathUtils.damp(l.position.y, -t.y * ART_H * 0.9, DAMP, step)
    // On demand rendering: keep drawing until everything has settled.
    const settled =
      Math.abs(g.rotation.y - t.x * TURN) < 1e-4 &&
      Math.abs(l.position.x - t.x * ART_W * 0.6) < 0.05 &&
      Math.abs(l.position.y + t.y * ART_H * 0.9) < 0.05
    if (!drift && !settled) invalidate()
  })

  return (
    <>
      <ambientLight intensity={0.9} />
      <directionalLight position={[-400, 500, 600]} intensity={1.1} />
      <pointLight ref={light} position={[0, 0, 520]} intensity={1.1} decay={0} />
      <group ref={group}>
        {/* SVG space runs y-down; flip it to three's y-up. */}
        <mesh geometry={geometry} material={materials} scale={[1, -1, 1]} />
      </group>
    </>
  )
}

/**
 * NINARÒ wordmark as a real 3D object. Sits over the flat PNG (which keeps the layout box)
 * and calls `onReady` once drawn, so the page can cross-fade from one to the other.
 */
export function NinaroLogo3D({
  glide,
  drift,
  visible,
  onReady,
}: {
  glide: Glide
  /** No cursor to follow: let the light wander on its own. */
  drift: boolean
  visible: boolean
  onReady: () => void
}) {
  const wrap = useRef<HTMLDivElement | null>(null)
  // Client only (loaded with ssr: false), so the probe can run during the first render.
  const [supported] = useState(() => {
    const probe = document.createElement('canvas')
    return !!(probe.getContext('webgl2') || probe.getContext('webgl'))
  })
  const [onScreen, setOnScreen] = useState(true)

  // Stop drawing while the hero is scrolled away.
  useEffect(() => {
    const el = wrap.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => setOnScreen(e.isIntersecting))
    io.observe(el)
    return () => io.disconnect()
  }, [supported])

  if (!supported) return null

  return (
    <div
      ref={wrap}
      aria-hidden="true"
      className="pointer-events-none absolute"
      style={{
        inset: `-${BLEED * 100}%`,
        opacity: visible ? 1 : 0,
        transition: 'opacity .6s ease',
        // Stands in for the drop shadow painted into the PNG, which the trace leaves out.
        filter: 'drop-shadow(1.5px 3px 3px rgba(60,60,75,.5))',
      }}
    >
      <Canvas
        flat
        dpr={[1, 2]}
        frameloop={!onScreen ? 'never' : drift ? 'always' : 'demand'}
        gl={{ antialias: true, alpha: true }}
        camera={{ fov: FOV, position: [0, 0, DISTANCE], near: 10, far: DISTANCE * 4 }}
      >
        <Suspense fallback={null}>
          <Wordmark glide={glide} drift={drift} onReady={onReady} />
        </Suspense>
      </Canvas>
    </div>
  )
}
