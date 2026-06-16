'use client'

import { Canvas, useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'

/**
 * Interactive 3D particle network for the hero background.
 *
 * Performance / lifecycle notes:
 * - R3F drives a single shared requestAnimationFrame loop via `useFrame`;
 *   it is automatically torn down when <Canvas/> unmounts, and all GPU
 *   resources (geometry / material / textures) are disposed by R3F, so there
 *   are no leaked RAF callbacks or WebGL contexts.
 * - Geometry buffers are memoized so they are allocated once.
 * - Honors `prefers-reduced-motion` by freezing the animation.
 */

const COUNT = 1400
const RADIUS = 5.0

const PALETTE = [
  new THREE.Color('#FF6B6B'), // coral
  new THREE.Color('#FF8475'), // light coral
  new THREE.Color('#FFC9C0'), // soft
  new THREE.Color('#FFFFFF'), // sparkle
]

function prefersReducedMotion() {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function ParticleField() {
  const pointsRef = useRef<THREE.Points>(null)
  const reduced = useMemo(prefersReducedMotion, [])

  const { positions, colors } = useMemo(() => {
    const positions = new Float32Array(COUNT * 3)
    const colors = new Float32Array(COUNT * 3)
    for (let i = 0; i < COUNT; i++) {
      // Distribute inside a sphere shell for a "constellation" depth
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
    if (reduced || !pointsRef.current) return
    pointsRef.current.rotation.y += delta * 0.04
    pointsRef.current.rotation.x += delta * 0.012
  })

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial
        vertexColors
        size={0.06}
        sizeAttenuation
        transparent
        opacity={1}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}

function DepthWire() {
  const ref = useRef<THREE.Mesh>(null)
  const reduced = useMemo(prefersReducedMotion, [])
  useFrame((_, delta) => {
    if (reduced || !ref.current) return
    ref.current.rotation.y -= delta * 0.05
    ref.current.rotation.z += delta * 0.02
  })
  return (
    <mesh ref={ref}>
      <icosahedronGeometry args={[2.6, 3]} />
      <meshBasicMaterial color="#FF6B6B" wireframe transparent opacity={0.1} />
    </mesh>
  )
}

/** Smoothly drifts the camera toward the pointer for a parallax/tilt feel. */
function PointerRig() {
  const target = useRef(new THREE.Vector3())
  useFrame((state) => {
    const { pointer, camera } = state
    target.current.set(pointer.x * 0.9, pointer.y * 0.6, camera.position.z)
    camera.position.lerp(target.current, 0.045)
    camera.lookAt(0, 0, 0)
  })
  return null
}

export default function HeroCanvas() {
  return (
    <Canvas
      camera={{ position: [0, 0, 6.5], fov: 60 }}
      dpr={[1, 1.75]}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      style={{ pointerEvents: 'none' }}
    >
      <ParticleField />
      <DepthWire />
      <PointerRig />
    </Canvas>
  )
}
