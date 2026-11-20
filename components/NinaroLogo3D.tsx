'use client'

import React, { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useLoader, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader.js'

/* Canvas overhang past the art box on every side (fraction of its size), so the sides and
   the turn are never clipped. The camera frames the art to the inner box. */
const BLEED = 0.18
const FOV = 30

/* How fast a turn settles. Later parts settle slower, so a column ripples rather than
   moving as one block. */
const DAMP = 6
const PART_LAG = 0.6

type Glide = { x: number; y: number }

/** What to extrude. Outlines are traced from the art on the same grid (`w`×`h` units), so
    the artwork maps straight onto the faces and the 3D art lands where the flat one sits. */
type Extrusion = {
  art: string
  outline: string
  w: number
  h: number
  /** Body depth, bevel thickness and bevel size, in outline units. */
  depth: number
  bevelThickness: number
  bevelSize: number
  /** Side wall colour, a shade under the painted face so the edge reads. */
  side: string
  /** Turn toward the cursor, in radians at full glide. */
  turn: number
}

/* The outline is traced from ninaro.png; bevel is kept under half the thinnest stroke. */
const WORDMARK: Extrusion = {
  art: '/images/assets/ninaro.png',
  outline: '/images/assets/ninaro-outline.svg',
  w: 1252,
  h: 463,
  depth: 34,
  bevelThickness: 12,
  bevelSize: 2.4,
  side: '#9da0d6',
  turn: 0.2,
}

/* Traced at 4× the 77×247 PNG, one path per flower (top to bottom). */
const MENU_ICONS: Extrusion = {
  art: '/images/assets/icons/purple-icons.png',
  outline: '/images/assets/icons/purple-icons-outline.svg',
  w: 308,
  h: 988,
  depth: 40,
  bevelThickness: 16,
  bevelSize: 4,
  side: '#8e90c4',
  turn: 0.32,
}

function Extruded({
  spec,
  target,
  drift,
  onReady,
}: {
  spec: Extrusion
  target: React.RefObject<Glide>
  drift: boolean
  onReady: () => void
}) {
  const svg = useLoader(SVGLoader, spec.outline)
  const art = useLoader(THREE.TextureLoader, spec.art)
  const parts = useRef<(THREE.Group | null)[]>([])
  const light = useRef<THREE.PointLight>(null)
  const invalidate = useThree((s) => s.invalidate)
  const distance = (spec.h * (1 + BLEED * 2)) / 2 / Math.tan(THREE.MathUtils.degToRad(FOV / 2))

  // Front faces sample the artwork at their own position; side walls take the colour at
  // the contour, so the painted edge wraps a little way round.
  const geometries = useMemo(() => {
    const uv = (v: number[], i: number) => new THREE.Vector2(v[i * 3] / spec.w, 1 - v[i * 3 + 1] / spec.h)
    const generator: THREE.UVGenerator = {
      generateTopUV: (_g, v, a, b, c) => [a, b, c].map((i) => uv(v, i)),
      generateSideWallUV: (_g, v, a, b, c, d) => [a, b, c, d].map((i) => uv(v, i)),
    }
    // One part per SVG path, each turning about its own centre.
    return svg.paths.map((p) => {
      const g = new THREE.ExtrudeGeometry(SVGLoader.createShapes(p), {
        depth: spec.depth,
        bevelEnabled: true,
        bevelThickness: spec.bevelThickness,
        bevelSize: spec.bevelSize,
        bevelSegments: 6,
        curveSegments: 6,
        UVGenerator: generator,
      })
      g.computeBoundingBox()
      const centre = new THREE.Vector3()
      g.boundingBox!.getCenter(centre)
      // Pivot at the part's centre, front face at z = 0.
      g.translate(-centre.x, -centre.y, -(spec.depth + spec.bevelThickness))
      // SVG space runs y-down; three's runs y-up.
      return { geometry: g, at: [centre.x - spec.w / 2, spec.h / 2 - centre.y, 0] as const }
    })
  }, [svg, spec])

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
      color: spec.side,
      roughness: 0.45,
      clearcoat: 1,
      clearcoatRoughness: 0.2,
    })
    return [face, side]
  }, [map, spec])

  useEffect(() => () => geometries.forEach((g) => g.geometry.dispose()), [geometries])
  useEffect(() => () => materials.forEach((m) => m.dispose()), [materials])
  useEffect(() => () => map.dispose(), [map])

  // Reveal once the first frame with the art has been drawn.
  useEffect(() => {
    const id = requestAnimationFrame(() => requestAnimationFrame(onReady))
    return () => cancelAnimationFrame(id)
  }, [onReady])

  useFrame((state, delta) => {
    const l = light.current
    if (!l) return
    // No cursor (touch): the light drifts on its own in a slow loop.
    const t = drift
      ? { x: Math.sin(state.clock.elapsedTime * 0.35) * 0.8, y: Math.cos(state.clock.elapsedTime * 0.27) * 0.5 }
      : target.current
    const step = Math.min(delta, 0.05)
    const ry = drift ? 0 : t.x * spec.turn
    const rx = drift ? 0 : t.y * spec.turn * 0.6
    let settled = true
    parts.current.forEach((g, i) => {
      if (!g) return
      const rate = DAMP / (1 + i * PART_LAG)
      g.rotation.y = THREE.MathUtils.damp(g.rotation.y, ry, rate, step)
      g.rotation.x = THREE.MathUtils.damp(g.rotation.x, rx, rate, step)
      if (Math.abs(g.rotation.y - ry) > 1e-4 || Math.abs(g.rotation.x - rx) > 1e-4) settled = false
    })
    const lx = t.x * spec.w * 0.6
    const ly = -t.y * spec.h * 0.9
    l.position.x = THREE.MathUtils.damp(l.position.x, lx, DAMP, step)
    l.position.y = THREE.MathUtils.damp(l.position.y, ly, DAMP, step)
    if (Math.abs(l.position.x - lx) > 0.05 || Math.abs(l.position.y - ly) > 0.05) settled = false
    // On demand rendering: keep drawing until everything has settled.
    if (!drift && !settled) invalidate()
  })

  return (
    <>
      <ambientLight intensity={0.9} />
      <directionalLight position={[-spec.w * 0.3, spec.h, distance * 0.5]} intensity={1.1} />
      <pointLight ref={light} position={[0, 0, distance * 0.44]} intensity={1.1} decay={0} />
      {geometries.map(({ geometry, at }, i) => (
        <group
          key={i}
          position={at}
          ref={(g) => {
            parts.current[i] = g
          }}
        >
          <mesh geometry={geometry} material={materials} scale={[1, -1, 1]} />
        </group>
      ))}
    </>
  )
}

/**
 * Art as a real 3D object. Sits over the flat PNG (which keeps the layout box) and calls
 * `onReady` once drawn, so the page can cross-fade from one to the other. Renders nothing
 * without WebGL or with reduced motion, leaving the PNG in place.
 */
function Extruded3D({
  spec,
  glide,
  visible,
  shadow,
  onReady,
}: {
  spec: Extrusion
  /** Cursor offset, -1..1. Omit to have the art track the cursor against its own centre. */
  glide?: Glide
  visible: boolean
  /** CSS drop-shadow filter for the lift off the paper. */
  shadow?: string
  onReady: () => void
}) {
  const wrap = useRef<HTMLDivElement | null>(null)
  const target = useRef<Glide>(glide ?? { x: 0, y: 0 })
  const [onScreen, setOnScreen] = useState(true)
  // Client only (loaded with ssr: false), so these can be read during the first render.
  const [supported] = useState(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false
    const probe = document.createElement('canvas')
    return !!(probe.getContext('webgl2') || probe.getContext('webgl'))
  })
  // No cursor to follow: the light wanders on its own instead.
  const [drift] = useState(() => !window.matchMedia('(hover: hover) and (pointer: fine)').matches)
  const [frame, setFrame] = useState<(() => void) | null>(null)

  useEffect(() => {
    if (!glide) return
    target.current = glide
    frame?.()
  }, [glide, frame])

  // Self-tracking: offset from this art's centre, against the viewport half-extent.
  useEffect(() => {
    if (glide || drift || !supported) return
    let raf = 0
    const onMove = (e: PointerEvent) => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        const box = wrap.current?.getBoundingClientRect()
        if (!box) return
        const cx = box.left + box.width / 2
        const cy = box.top + box.height / 2
        target.current = {
          x: Math.max(-1, Math.min(1, (e.clientX - cx) / (window.innerWidth / 2))),
          y: Math.max(-1, Math.min(1, (e.clientY - cy) / (window.innerHeight / 2))),
        }
        frame?.()
      })
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('pointermove', onMove)
    }
  }, [glide, drift, supported, frame])

  // Stop drawing while scrolled away.
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
        filter: shadow,
        transition: 'opacity .6s ease, filter .9s cubic-bezier(.2,.7,.2,1)',
      }}
    >
      <Canvas
        flat
        dpr={[1, 2]}
        frameloop={!onScreen ? 'never' : drift ? 'always' : 'demand'}
        // Size from layout, not the on-screen box: parents scale and tilt this art with CSS,
        // and measuring through those transforms would feed them back into the canvas size.
        // No re-measure on scroll either; nothing inside takes pointer events.
        resize={{ scroll: false, offsetSize: true }}
        gl={{ antialias: true, alpha: true }}
        camera={{
          fov: FOV,
          position: [0, 0, (spec.h * (1 + BLEED * 2)) / 2 / Math.tan(THREE.MathUtils.degToRad(FOV / 2))],
          near: 10,
          far: spec.h * 10,
        }}
        onCreated={(s) => setFrame(() => s.invalidate)}
      >
        <Suspense fallback={null}>
          <Extruded spec={spec} target={target} drift={drift} onReady={onReady} />
        </Suspense>
      </Canvas>
    </div>
  )
}

/** NINARÒ wordmark in 3D. */
export function NinaroLogo3D(props: {
  glide: Glide
  visible: boolean
  shadow?: string
  onReady: () => void
}) {
  return <Extruded3D spec={WORDMARK} {...props} />
}

/** The three-flower menu icon column in 3D; each flower turns on its own. */
export function MenuIcons3D(props: { visible: boolean; shadow?: string; onReady: () => void }) {
  return <Extruded3D spec={MENU_ICONS} {...props} />
}
