'use client'

import { useEffect, useRef } from 'react'

interface FluidBackgroundProps {
  /** Palette of soft/pastel colours (hex). Up to 5 are used. */
  colors?: string[]
  /** Drift speed multiplier. Default 1. */
  speed?: number
  className?: string
}

const DEFAULT_COLORS = ['#ffd1dc', '#c1e7ff', '#d4f8e8', '#e6d6ff', '#fff1c1']
const MAX_COLORS = 5

/** Parse a #rgb or #rrggbb hex string into [r,g,b] floats in 0..1. */
function hexToRgb(hex: string): [number, number, number] {
  let h = hex.replace('#', '').trim()
  if (h.length === 3) {
    h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2]
  }
  const int = parseInt(h, 16)
  if (Number.isNaN(int) || h.length !== 6) return [1, 1, 1]
  return [((int >> 16) & 255) / 255, ((int >> 8) & 255) / 255, (int & 255) / 255]
}

const VERTEX_SRC = `
attribute vec2 a_position;
void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`

const FRAGMENT_SRC = `
precision highp float;

uniform vec2 u_resolution;
uniform float u_time;
uniform vec2 u_mouse;        // normalised 0..1, y up
uniform vec3 u_colors[${MAX_COLORS}];
uniform int u_colorCount;

// --- Ashima 2D simplex noise ---
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec3 permute(vec3 x) { return mod289(((x * 34.0) + 1.0) * x); }

float snoise(vec2 v) {
  const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                     -0.577350269189626, 0.024390243902439);
  vec2 i  = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod289(i);
  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0))
                          + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy),
                          dot(x12.zw, x12.zw)), 0.0);
  m = m * m; m = m * m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
  vec3 g;
  g.x  = a0.x  * x0.x  + h.x  * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 5; i++) {
    v += a * snoise(p);
    p *= 2.0;
    a *= 0.5;
  }
  return v;
}

// Blend across the palette using a 0..1 selector. Loop index is constant
// so u_colors[i] stays a valid constant-index expression for WebGL1.
vec3 pickColor(float n) {
  vec3 col = u_colors[0];
  float denom = max(float(u_colorCount - 1), 1.0);
  for (int i = 1; i < ${MAX_COLORS}; i++) {
    if (i < u_colorCount) {
      float pos  = float(i) / denom;
      float prev = float(i - 1) / denom;
      col = mix(col, u_colors[i], smoothstep(prev, pos, n));
    }
  }
  return col;
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution.xy;
  float aspect = u_resolution.x / u_resolution.y;

  vec2 p = uv;
  p.x *= aspect;

  vec2 m = u_mouse;
  m.x *= aspect;

  float t = u_time * 0.05;

  // base domain warp (idle drift)
  vec2 q;
  q.x = fbm(p + vec2(0.0, t));
  q.y = fbm(p + vec2(5.2, 1.3) - t);

  // cursor swirl: stronger near the pointer, rotates the field around it
  vec2 toMouse = p - m;
  float infl = exp(-dot(toMouse, toMouse) * 3.0);
  vec2 swirl = vec2(-toMouse.y, toMouse.x) * infl * 1.6;

  vec2 r;
  r.x = fbm(p + 1.8 * q + swirl + vec2(1.7, 9.2) + 0.15 * t);
  r.y = fbm(p + 1.8 * q + swirl + vec2(8.3, 2.8) - 0.13 * t);

  float f = fbm(p + r);
  float n = clamp(f * 0.5 + 0.5, 0.0, 1.0);

  vec3 color = pickColor(n);
  // soften toward white for a pastel / soap-bubble feel
  color = mix(color, vec3(1.0), 0.22);
  // faint iridescent highlight
  color += 0.05 * vec3(q.x, r.y, f);

  gl_FragColor = vec4(clamp(color, 0.0, 1.0), 1.0);
}
`

function compileShader(gl: WebGLRenderingContext, type: number, src: string) {
  const shader = gl.createShader(type)
  if (!shader) return null
  gl.shaderSource(shader, src)
  gl.compileShader(shader)
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error('FluidBackground shader error:', gl.getShaderInfoLog(shader))
    gl.deleteShader(shader)
    return null
  }
  return shader
}

export function FluidBackground({
  colors = DEFAULT_COLORS,
  speed = 1,
  className = '',
}: FluidBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  // refs so the animation loop always reads the latest prop values
  const colorsRef = useRef(colors)
  const speedRef = useRef(speed)
  colorsRef.current = colors
  speedRef.current = speed

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const gl = canvas.getContext('webgl', {
      alpha: false,
      antialias: true,
      premultipliedAlpha: false,
    })
    if (!gl) return // graceful no-op when WebGL is unavailable

    const vert = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SRC)
    const frag = compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SRC)
    if (!vert || !frag) return

    const program = gl.createProgram()!
    gl.attachShader(program, vert)
    gl.attachShader(program, frag)
    gl.linkProgram(program)
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('FluidBackground link error:', gl.getProgramInfoLog(program))
      return
    }
    gl.useProgram(program)

    // full-screen triangle
    const buffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
    const posLoc = gl.getAttribLocation(program, 'a_position')
    gl.enableVertexAttribArray(posLoc)
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0)

    const uResolution = gl.getUniformLocation(program, 'u_resolution')
    const uTime = gl.getUniformLocation(program, 'u_time')
    const uMouse = gl.getUniformLocation(program, 'u_mouse')
    const uColors = gl.getUniformLocation(program, 'u_colors[0]')
    const uColorCount = gl.getUniformLocation(program, 'u_colorCount')

    const setColors = () => {
      const list = (colorsRef.current?.length ? colorsRef.current : DEFAULT_COLORS).slice(0, MAX_COLORS)
      const flat: number[] = []
      for (const c of list) flat.push(...hexToRgb(c))
      gl.uniform3fv(uColors, new Float32Array(flat))
      gl.uniform1i(uColorCount, list.length)
    }
    setColors()

    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const resize = () => {
      const w = Math.floor(window.innerWidth * dpr)
      const h = Math.floor(window.innerHeight * dpr)
      canvas.width = w
      canvas.height = h
      gl.viewport(0, 0, w, h)
      gl.uniform2f(uResolution, w, h)
    }
    resize()
    window.addEventListener('resize', resize)

    // pointer tracking with eased follow (inertia)
    const target = { x: 0.5, y: 0.5 }
    const current = { x: 0.5, y: 0.5 }
    const setTarget = (clientX: number, clientY: number) => {
      target.x = clientX / window.innerWidth
      target.y = 1 - clientY / window.innerHeight
    }
    const onMouseMove = (e: MouseEvent) => setTarget(e.clientX, e.clientY)
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length) setTarget(e.touches[0].clientX, e.touches[0].clientY)
    }
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('touchmove', onTouchMove, { passive: true })

    let raf = 0
    const start = performance.now()
    const render = (now: number) => {
      current.x += (target.x - current.x) * 0.05
      current.y += (target.y - current.y) * 0.05
      setColors()
      gl.uniform1f(uTime, ((now - start) / 1000) * speedRef.current)
      gl.uniform2f(uMouse, current.x, current.y)
      gl.drawArrays(gl.TRIANGLES, 0, 3)
      raf = requestAnimationFrame(render)
    }
    raf = requestAnimationFrame(render)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('touchmove', onTouchMove)
      gl.deleteProgram(program)
      gl.deleteShader(vert)
      gl.deleteShader(frag)
      gl.deleteBuffer(buffer)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={`fixed inset-0 w-full h-full z-0 pointer-events-none ${className}`}
    />
  )
}
