-- Covering indexes for unindexed foreign keys (perf: faster joins & lookups,
-- and avoids slow sequential scans on cascade/lookup paths). Hot dashboard
-- tables first (user_profiles, conversations, messages, cover_letters).
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON public.user_profiles (user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_created_by ON public.conversations (created_by);
CREATE INDEX IF NOT EXISTS idx_messages_deleted_by ON public.messages (deleted_by);
CREATE INDEX IF NOT EXISTS idx_messages_edited_by ON public.messages (edited_by);
CREATE INDEX IF NOT EXISTS idx_cover_letters_user_id ON public.cover_letters (user_id);
CREATE INDEX IF NOT EXISTS idx_certificates_user_id ON public.certificates (user_id);
CREATE INDEX IF NOT EXISTS idx_certificates_profile_id ON public.certificates (profile_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_user_id ON public.post_comments (user_id);
CREATE INDEX IF NOT EXISTS idx_social_posts_job_id ON public.social_posts (job_id);
CREATE INDEX IF NOT EXISTS idx_profile_certificates_certificate_id ON public.profile_certificates (certificate_id);
CREATE INDEX IF NOT EXISTS idx_profile_cover_letters_cover_letter_id ON public.profile_cover_letters (cover_letter_id);
CREATE INDEX IF NOT EXISTS idx_profile_resumes_resume_id ON public.profile_resumes (resume_id);
CREATE INDEX IF NOT EXISTS idx_employer_invites_created_by ON public.employer_invites (created_by);
CREATE INDEX IF NOT EXISTS idx_employer_invites_used_by_user_id ON public.employer_invites (used_by_user_id);
CREATE INDEX IF NOT EXISTS idx_service_invites_created_by ON public.service_invites (created_by);
CREATE INDEX IF NOT EXISTS idx_service_invites_used_by_user_id ON public.service_invites (used_by_user_id);
