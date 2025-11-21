import { createClient } from '@/lib/supabase/server'

export interface OnboardingStatus {
  completed: boolean
  step: number
  completedAt: string | null
}

/**
 * Check if user has completed onboarding
 */
export async function checkOnboardingStatus(userId: string): Promise<boolean> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('users')
    .select('onboarding_completed')
    .eq('id', userId)
    .single()

  if (error || !data) {
    return false
  }

  return data.onboarding_completed ?? false
}

/**
 * Get current onboarding step
 */
export async function getOnboardingStep(userId: string): Promise<number> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('users')
    .select('onboarding_step')
    .eq('id', userId)
    .single()

  if (error || !data) {
    return 0
  }

  return data.onboarding_step ?? 0
}

/**
 * Update onboarding step
 */
export async function updateOnboardingStep(userId: string, step: number): Promise<void> {
  const supabase = await createClient()
  
  await supabase
    .from('users')
    .update({ onboarding_step: step })
    .eq('id', userId)
}

/**
 * Mark onboarding as complete
 */
export async function markOnboardingComplete(userId: string): Promise<void> {
  const supabase = await createClient()
  
  await supabase
    .from('users')
    .update({
      onboarding_completed: true,
      onboarding_completed_at: new Date().toISOString(),
      onboarding_step: 4
    })
    .eq('id', userId)
}

/**
 * Get full onboarding status
 */
export async function getOnboardingStatus(userId: string): Promise<OnboardingStatus> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('users')
    .select('onboarding_completed, onboarding_step, onboarding_completed_at')
    .eq('id', userId)
    .single()

  if (error || !data) {
    return {
      completed: false,
      step: 0,
      completedAt: null
    }
  }

  return {
    completed: data.onboarding_completed ?? false,
    step: data.onboarding_step ?? 0,
    completedAt: data.onboarding_completed_at ?? null
  }
}

