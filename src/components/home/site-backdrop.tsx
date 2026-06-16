'use client'

import { Canvas, useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'

/**
 * Continuous, page-wide ambient particle field. Rendered once in a fixed,
 * full-viewport layer so depth flows seamlessly behind every section.
 *
 * - Single shared RAF loop via R3F `useFrame`; auto-disposed on unmount.
 * - Tuned for "always on": modest count, capped dpr, gentle drift.
 * - Honors prefers-reduced-motion (freezes motion).
 */

const COUNT = 1000
const RADIUS = 7

const PALETTE = [
  new THREE.Color('#FF6B6B'),
  new THREE.Color('#FF8475'),
  new THREE.Color('#FFC9C0'),
  new THREE.Color('#D32F2A'),
  new THREE.Color('#FFFFFF'),
]

function prefersReducedMotion() {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function Field() {
  const ref = useRef<THREE.Points>(null)
  const reduced = useMemo(prefersReducedMotion, [])

  const { positions, colors } = useMemo(() => {
    const positions = new Float32Array(COUNT * 3)
    const colors = new Float32Array(COUNT * 3)
    for (let i = 0; i < COUNT; i++) {
      const r = RADIUS * Math.cbrt(Math.random())
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta)
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
      positions[i * 3 + 2] = r * Math.cos(phi)
      const c = PALETTE[Math.floor(Math.random() * PALETTE.length)]
      colors[i * 3] = c.r
      colors[i * 3 + 1] = c.g
      colors[i * 3 + 2] = c.b
    }
    return { positions, colors }
  }, [])

  useFrame((_, delta) => {
    if (reduced || !ref.current) return
    ref.current.rotation.y += delta * 0.018
    ref.current.rotation.x += delta * 0.006
  })

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial
        vertexColors
        size={0.05}
        sizeAttenuation
        transparent
        opacity={0.9}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}

function PointerRig() {
  const target = useRef(new THREE.Vector3())
  useFrame((state) => {
    const { pointer, camera } = state
    target.current.set(pointer.x * 1.1, pointer.y * 0.7, camera.position.z)
    camera.position.lerp(target.current, 0.03)
    camera.lookAt(0, 0, 0)
  })
  return null
}

export default function SiteBackdrop() {
  return (
    <Canvas
      camera={{ position: [0, 0, 9], fov: 60 }}
      dpr={[1, 1.5]}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      style={{ pointerEvents: 'none' }}
    >
      <Field />
      <PointerRig />
    </Canvas>
  )
}
