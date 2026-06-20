'use client'

import { Suspense, lazy, useState } from 'react'

/**
 * Progressive-enhancement Spline 3D scene.
 *
 * Spline ships a large client runtime, so it is lazy-loaded and never rendered
 * on the server (this whole module is a client island, imported with `ssr:false`
 * at the call site). If the scene URL is missing or fails to load, we render the
 * optional `fallback` instead (typically the three.js WebGL canvas) so the page
 * is never blank and the build/runtime never depends on a remote asset.
 */
const Spline = lazy(() => import('@splinetool/react-spline'))

export default function SplineScene({
  scene,
  className,
  fallback = null,
}: {
  scene?: string | null
  className?: string
  fallback?: React.ReactNode
}) {
  const [failed, setFailed] = useState(false)

  if (!scene || failed) return <>{fallback}</>

  return (
    <Suspense fallback={<>{fallback}</>}>
      <Spline scene={scene} className={className} onError={() => setFailed(true)} />
    </Suspense>
  )
}
