/**
 * Admin-scoped job board.
 *
 * Renders the exact same job-board experience, but because it lives under the
 * `/admin` route segment it stays inside the AdminShell chrome — so staff keep
 * their admin sidebar instead of being thrown into the member dashboard shell
 * when they open the board from the admin nav. The board component itself reads
 * the user's role and hides the member-only upgrade/upsell surfaces for staff.
 */
export { default } from '@/app/(dashboard)/job-board/page'
