import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { getPlanLimits, hasQuotaRemaining, type PlanType } from './limitations'

export async function getAiInterviewUsageServer(userId: string): Promise<{
  used: number
  planType: PlanType
  limit: number
}> {
  const admin = createServiceRoleClient()
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const { data: planRow } = await admin.from('user_plans').select('plan_type').eq('user_id', userId).maybeSingle()
  const planType = ((planRow as { plan_type?: string } | null)?.plan_type as PlanType) || 'free'
  const limits = getPlanLimits(planType)

  const { count: sessionCount } = await admin
    .from('interview_sessions')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', startOfMonth.toISOString())

  const { count: turnCount } = await admin
    .from('api_usage_tracking')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('service', 'gemini')
    .eq('endpoint', '/api/ai/interview-turn')
    .gte('timestamp', startOfMonth.toISOString())

  const used = (sessionCount ?? 0) + (turnCount ?? 0)
  return {
    used,
    planType,
    limit: limits.aiInterviewSessions,
  }
}

export async function assertAiInterviewTurnAllowed(userId: string): Promise<{ ok: true } | { ok: false; reason: string }> {
  const { used, planType, limit } = await getAiInterviewUsageServer(userId)
  if (!hasQuotaRemaining(used, limit)) {
    return {
      ok: false,
      reason: `Monthly interview assistant limit reached (${limit} for ${planType}). Upgrade your plan to continue.`,
    }
  }
  return { ok: true }
}

export async function recordInterviewTurn(userId: string, metadata?: Record<string, unknown>): Promise<void> {
  const admin = createServiceRoleClient()
  await admin.from('api_usage_tracking').insert({
    user_id: userId,
    service: 'gemini',
    endpoint: '/api/ai/interview-turn',
    request_count: 1,
    metadata: metadata ?? {},
    timestamp: new Date().toISOString(),
  })
}
