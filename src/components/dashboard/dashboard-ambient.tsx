'use client'

import { Canvas, useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'

/**
 * Subtle WebGL ambient backdrop for the dashboard workspace.
 *
 * A lightweight, low-density drifting particle haze in the Rezzy logo palette
 * (coral / warm-brown / salmon). It sits *behind* page content at low opacity so
 * every user type gets a designed, branded canvas without hurting readability or
 * scroll performance:
 *   - density is intentionally small (a fraction of the marketing hero) and the
 *     canvas is capped at a low DPR;
 *   - `prefers-reduced-motion` freezes all motion;
 *   - R3F tears down the RAF loop + GPU resources on unmount (no leaks).
 */

const COUNT = 320
const SPREAD = 9

// Logo-derived palette: coral lettering, warm brown coat/boots, salmon hat.
const PALETTE = [
  new THREE.Color('#FF6B6B'), // coral
  new THREE.Color('#FF8475'), // light coral
  new THREE.Color('#F0463F'), // deep coral / red
  new THREE.Color('#8D6E63'), // warm brown
  new THREE.Color('#FFC9C0'), // salmon
]

function prefersReducedMotion() {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function Haze() {
  const ref = useRef<THREE.Points>(null)
  const reduced = useMemo(prefersReducedMotion, [])

  const { positions, colors } = useMemo(() => {
    const positions = new Float32Array(COUNT * 3)
    const colors = new Float32Array(COUNT * 3)
    for (let i = 0; i < COUNT; i++) {
      positions[i * 3] = (Math.random() - 0.5) * SPREAD * 2
      positions[i * 3 + 1] = (Math.random() - 0.5) * SPREAD
      positions[i * 3 + 2] = (Math.random() - 0.5) * SPREAD
      const c = PALETTE[Math.floor(Math.random() * PALETTE.length)]
      colors[i * 3] = c.r
      colors[i * 3 + 1] = c.g
      colors[i * 3 + 2] = c.b
    }
    return { positions, colors }
  }, [])

  useFrame((_, delta) => {
    if (reduced || !ref.current) return
    ref.current.rotation.y += delta * 0.025
    ref.current.rotation.x += delta * 0.008
  })

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial
        vertexColors
        size={0.08}
        sizeAttenuation
        transparent
        opacity={0.9}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}

export default function DashboardAmbient() {
  return (
    <Canvas
      camera={{ position: [0, 0, 8], fov: 60 }}
      dpr={[1, 1.4]}
      gl={{ antialias: true, alpha: true, powerPreference: 'low-power' }}
      style={{ pointerEvents: 'none' }}
      frameloop="always"
    >
      <Haze />
    </Canvas>
  )
}
