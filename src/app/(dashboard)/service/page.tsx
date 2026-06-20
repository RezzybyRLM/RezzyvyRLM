'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { resolveSessionUser } from '@/lib/auth/session'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, CalendarClock, ClipboardList, UserRound, ExternalLink } from 'lucide-react'

type ServiceOrder = {
  id: string
  client_user_id: string | null
  assigned_to: string | null
  service_type: string
  title: string
  status: 'new' | 'in_progress' | 'delivered' | 'cancelled'
  notes: string | null
  deliverable_url: string | null
  scheduled_at: string | null
  created_at: string
}

const SERVICE_LABELS: Record<string, string> = {
  resume: 'Resume',
  cover_letter: 'Cover letter',
  bio: 'Bio',
  templates: 'Templates',
  coaching: 'Coaching',
  vcard: 'vCard + QR',
  linkedin: 'LinkedIn',
  application_processing: 'Apply-for-you',
}

const COLUMNS: { key: ServiceOrder['status']; label: string }[] = [
  { key: 'new', label: 'New' },
  { key: 'in_progress', label: 'In progress' },
  { key: 'delivered', label: 'Delivered' },
]

export default function ServiceQueuePage() {
  const supabase = createClient()
  const [orders, setOrders] = useState<ServiceOrder[]>([])
  const [clients, setClients] = useState<Record<string, { full_name: string | null; email: string | null }>>({})
  const [loading, setLoading] = useState(true)

  const fetchOrders = useCallback(async () => {
    const { data } = await supabase
      .from('service_orders')
      .select('*')
      .order('created_at', { ascending: false })
    const rows = (data as ServiceOrder[]) || []
    setOrders(rows)

    const clientIds = Array.from(new Set(rows.map((o) => o.client_user_id).filter(Boolean))) as string[]
    if (clientIds.length) {
      const { data: users } = await supabase
        .from('users')
        .select('id, full_name, email')
        .in('id', clientIds)
      const map: Record<string, { full_name: string | null; email: string | null }> = {}
      ;(users || []).forEach((u: { id: string; full_name: string | null; email: string | null }) => {
        map[u.id] = { full_name: u.full_name, email: u.email }
      })
      setClients(map)
    }
  }, [supabase])

  useEffect(() => {
    let mounted = true
    ;(async () => {
      const user = await resolveSessionUser(supabase)
      if (!mounted || !user) {
        setLoading(false)
        return
      }
      await fetchOrders()
      if (mounted) setLoading(false)
    })()
    return () => {
      mounted = false
    }
  }, [supabase, fetchOrders])

  const advance = async (order: ServiceOrder, status: ServiceOrder['status']) => {
    // Optimistic; refresh in the background.
    setOrders((prev) => prev.map((o) => (o.id === order.id ? { ...o, status } : o)))
    await supabase
      .from('service_orders')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', order.id)
  }

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden />
      </div>
    )
  }

  const counts = {
    new: orders.filter((o) => o.status === 'new').length,
    in_progress: orders.filter((o) => o.status === 'in_progress').length,
    delivered: orders.filter((o) => o.status === 'delivered').length,
    coaching: orders.filter((o) => o.service_type === 'coaching' && o.scheduled_at).length,
  }

  const clientName = (id: string | null) =>
    (id && (clients[id]?.full_name || clients[id]?.email)) || 'Client'

  return (
    <div className="space-y-8">
      {/* Operator console header */}
      <div className="rounded-3xl border border-border bg-white p-6 shadow-card md:p-7">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">RezzyMeUp · Fulfillment</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-text md:text-3xl">Service queue</h1>
            <p className="mt-1.5 text-sm text-text/55">
              {orders.length} order{orders.length === 1 ? '' : 's'} in your queue · {counts.coaching} coaching booked
            </p>
          </div>
          <div className="flex gap-6">
            {[
              { label: 'New', value: counts.new },
              { label: 'In progress', value: counts.in_progress },
              { label: 'Delivered', value: counts.delivered },
            ].map((m) => (
              <div key={m.label} className="text-right">
                <p className="text-2xl font-bold tabular-nums text-text">{m.value}</p>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-text/45">{m.label}</p>
              </div>
            ))}
          </div>
        </div>

        {orders.length > 0 && (
          <div className="mt-5">
            <div className="flex h-2.5 overflow-hidden rounded-full bg-background">
              <div className="bg-primary/40" style={{ width: `${(counts.new / orders.length) * 100}%` }} />
              <div className="bg-primary" style={{ width: `${(counts.in_progress / orders.length) * 100}%` }} />
              <div className="bg-emerald-500" style={{ width: `${(counts.delivered / orders.length) * 100}%` }} />
            </div>
            <div className="mt-2 flex flex-wrap gap-4 text-[11px] text-text/50">
              <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-primary/40" /> New</span>
              <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-primary" /> In progress</span>
              <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Delivered</span>
            </div>
          </div>
        )}
      </div>

      {orders.length === 0 ? (
        <Card className="glass-card border-0 shadow-sm">
          <CardContent className="flex flex-col items-center gap-2 p-12 text-center">
            <ClipboardList className="h-10 w-10 text-text/25" aria-hidden />
            <p className="font-medium text-text/70">No orders in the queue yet</p>
            <p className="max-w-sm text-sm text-text/45">
              When clients purchase RezzyMeUp services, their orders appear here to assign, fulfill, and deliver.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          {COLUMNS.map((col) => {
            const colOrders = orders.filter((o) => o.status === col.key)
            return (
              <div key={col.key} className="space-y-3">
                <div className="flex items-center justify-between px-1">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-text/45">{col.label}</p>
                  <span className="rounded-full bg-background px-2 py-0.5 text-xs font-medium text-text/55">{colOrders.length}</span>
                </div>
                {colOrders.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-border/70 p-6 text-center text-xs text-text/40">
                    Nothing here
                  </div>
                ) : (
                  colOrders.map((order) => (
                    <div
                      key={order.id}
                      className="rounded-xl border border-border/70 bg-white/70 p-4 shadow-card backdrop-blur-xl transition-all hover:-translate-y-0.5 hover:shadow-card-hover"
                    >
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                          {SERVICE_LABELS[order.service_type] || order.service_type}
                        </span>
                        {order.scheduled_at && (
                          <span className="inline-flex items-center gap-1 text-[11px] text-text/50">
                            <CalendarClock className="h-3.5 w-3.5" />
                            {new Date(order.scheduled_at).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      <h3 className="font-semibold leading-snug text-text">{order.title}</h3>
                      <p className="mt-1 flex items-center gap-1.5 text-sm text-text/55">
                        <UserRound className="h-3.5 w-3.5" /> {clientName(order.client_user_id)}
                      </p>
                      {order.deliverable_url && (
                        <a
                          href={order.deliverable_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                        >
                          Deliverable <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                      <div className="mt-3 flex gap-2">
                        {order.status !== 'in_progress' && order.status !== 'delivered' && (
                          <Button size="sm" variant="outline" className="h-8 border-border text-xs" onClick={() => advance(order, 'in_progress')}>
                            Start
                          </Button>
                        )}
                        {order.status !== 'delivered' && (
                          <Button size="sm" className="h-8 bg-primary text-xs text-white hover:bg-primary/90" onClick={() => advance(order, 'delivered')}>
                            Mark delivered
                          </Button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
