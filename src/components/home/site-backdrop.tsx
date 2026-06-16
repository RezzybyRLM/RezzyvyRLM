'use client'

import { Canvas, useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'

/**
 * Corporate "Plexus" backdrop — an interconnected vector network of slow-drifting
 * nodes whose nearby neighbours are joined by fading lines. The field parts
 * organically around the cursor (proximity repulsion) for an elegant, living feel.
 *
 * Performance / lifecycle:
 * - Single shared RAF loop via R3F `useFrame`; R3F disposes geometry/material and
 *   tears down the loop + resize observer automatically on unmount (no leaks).
 * - Line + point buffers are preallocated once and mutated in place each frame
 *   (only draw-range + needsUpdate change) — no per-frame allocation → stable 60fps.
 * - R3F resizes the renderer/camera to the canvas via ResizeObserver.
 * - Honors prefers-reduced-motion (freezes drift + cursor reaction).
 */

const NODE_COUNT = 88
const BOUNDS_X = 9
const BOUNDS_Y = 5.2
const BOUNDS_Z = 4
const MAX_DIST = 2.5 // connection threshold
const MAX_DIST_SQ = MAX_DIST * MAX_DIST
const CURSOR_RADIUS = 3.2
const CURSOR_FORCE = 0.045
const LINE_COLOR = new THREE.Color('#94a3b8') // slate-400

function prefersReducedMotion() {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function Plexus() {
  const reduced = useMemo(prefersReducedMotion, [])
  const pointsRef = useRef<THREE.Points>(null)
  const linesRef = useRef<THREE.LineSegments>(null)
  const cursor = useRef(new THREE.Vector3(9999, 9999, 0))

  const data = useMemo(() => {
    const positions = new Float32Array(NODE_COUNT * 3)
    const velocities = new Float32Array(NODE_COUNT * 3)
    for (let i = 0; i < NODE_COUNT; i++) {
      positions[i * 3] = (Math.random() * 2 - 1) * BOUNDS_X
      positions[i * 3 + 1] = (Math.random() * 2 - 1) * BOUNDS_Y
      positions[i * 3 + 2] = (Math.random() * 2 - 1) * BOUNDS_Z
      velocities[i * 3] = (Math.random() * 2 - 1) * 0.12
      velocities[i * 3 + 1] = (Math.random() * 2 - 1) * 0.12
      velocities[i * 3 + 2] = (Math.random() * 2 - 1) * 0.08
    }
    // Upper bound for line vertices: every pair, twice
    const maxVerts = NODE_COUNT * (NODE_COUNT - 1)
    const linePositions = new Float32Array(maxVerts * 3)
    const lineColors = new Float32Array(maxVerts * 3)
    return { positions, velocities, linePositions, lineColors, maxVerts }
  }, [])

  useFrame((state, delta) => {
    const pts = pointsRef.current
    const lines = linesRef.current
    if (!pts || !lines) return
    const dt = Math.min(delta, 0.05)
    const { positions, velocities, linePositions, lineColors } = data

    // Map pointer (NDC -1..1) into node space
    if (!reduced) {
      cursor.current.set(state.pointer.x * BOUNDS_X, state.pointer.y * BOUNDS_Y, 0)
    }

    // 1) Integrate node motion (drift, bounds bounce, gentle cursor repulsion)
    for (let i = 0; i < NODE_COUNT; i++) {
      const ix = i * 3
      if (!reduced) {
        positions[ix] += velocities[ix] * dt
        positions[ix + 1] += velocities[ix + 1] * dt
        positions[ix + 2] += velocities[ix + 2] * dt

        const dx = positions[ix] - cursor.current.x
        const dy = positions[ix + 1] - cursor.current.y
        const distSq = dx * dx + dy * dy
        if (distSq < CURSOR_RADIUS * CURSOR_RADIUS && distSq > 0.001) {
          const dist = Math.sqrt(distSq)
          const push = (1 - dist / CURSOR_RADIUS) * CURSOR_FORCE
          positions[ix] += (dx / dist) * push
          positions[ix + 1] += (dy / dist) * push
        }
      }
      // Bounce within bounds
      if (positions[ix] > BOUNDS_X || positions[ix] < -BOUNDS_X) velocities[ix] *= -1
      if (positions[ix + 1] > BOUNDS_Y || positions[ix + 1] < -BOUNDS_Y) velocities[ix + 1] *= -1
      if (positions[ix + 2] > BOUNDS_Z || positions[ix + 2] < -BOUNDS_Z) velocities[ix + 2] *= -1
    }

    const pointAttr = pts.geometry.getAttribute('position') as THREE.BufferAttribute
    ;(pointAttr.array as Float32Array).set(positions)
    pointAttr.needsUpdate = true

    // 2) Rebuild connection lines (fade colour by closeness)
    let v = 0
    for (let i = 0; i < NODE_COUNT; i++) {
      const ix = i * 3
      for (let j = i + 1; j < NODE_COUNT; j++) {
        const jx = j * 3
        const dx = positions[ix] - positions[jx]
        const dy = positions[ix + 1] - positions[jx + 1]
        const dz = positions[ix + 2] - positions[jx + 2]
        const dSq = dx * dx + dy * dy + dz * dz
        if (dSq < MAX_DIST_SQ) {
          const intensity = 1 - Math.sqrt(dSq) / MAX_DIST
          linePositions[v * 3] = positions[ix]
          linePositions[v * 3 + 1] = positions[ix + 1]
          linePositions[v * 3 + 2] = positions[ix + 2]
          linePositions[(v + 1) * 3] = positions[jx]
          linePositions[(v + 1) * 3 + 1] = positions[jx + 1]
          linePositions[(v + 1) * 3 + 2] = positions[jx + 2]
          const c = intensity * 0.9
          lineColors[v * 3] = LINE_COLOR.r * c
          lineColors[v * 3 + 1] = LINE_COLOR.g * c
          lineColors[v * 3 + 2] = LINE_COLOR.b * c
          lineColors[(v + 1) * 3] = LINE_COLOR.r * c
          lineColors[(v + 1) * 3 + 1] = LINE_COLOR.g * c
          lineColors[(v + 1) * 3 + 2] = LINE_COLOR.b * c
          v += 2
        }
      }
    }

    const linePosAttr = lines.geometry.getAttribute('position') as THREE.BufferAttribute
    const lineColAttr = lines.geometry.getAttribute('color') as THREE.BufferAttribute
    ;(linePosAttr.array as Float32Array).set(linePositions)
    ;(lineColAttr.array as Float32Array).set(lineColors)
    linePosAttr.needsUpdate = true
    lineColAttr.needsUpdate = true
    lines.geometry.setDrawRange(0, v)

    // Subtle whole-field drift for depth
    if (!reduced) {
      pts.rotation.y = lines.rotation.y = pts.rotation.y + dt * 0.01
    }
  })

  return (
    <group>
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[data.positions, 3]} />
        </bufferGeometry>
        <pointsMaterial color="#cbd5e1" size={0.055} sizeAttenuation transparent opacity={0.7} depthWrite={false} />
      </points>
      <lineSegments ref={linesRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[data.linePositions, 3]} />
          <bufferAttribute attach="attributes-color" args={[data.lineColors, 3]} />
        </bufferGeometry>
        <lineBasicMaterial vertexColors transparent opacity={0.55} depthWrite={false} />
      </lineSegments>
    </group>
  )
}

export default function SiteBackdrop() {
  return (
    <Canvas
      camera={{ position: [0, 0, 12], fov: 60 }}
      dpr={[1, 1.5]}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      style={{ pointerEvents: 'none' }}
    >
      <Plexus />
    </Canvas>
  )
}
