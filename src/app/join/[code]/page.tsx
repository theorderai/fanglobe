import { redirect } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase-server'

interface Props { params: Promise<{ code: string }> }

export default async function JoinSquadPage({ params }: Props) {
  const { code } = await params

  try {
    const supabase = createServiceClient()
    const { data: squad } = await supabase
      .from('squads').select('match_id')
      .eq('code', code.toUpperCase()).single()

    if (squad) {
      // Redirect to globe with squad context
      redirect(`/globe?match=${squad.match_id}&squad=${code.toUpperCase()}`)
    }
  } catch {}

  // Squad not found — redirect to globe
  redirect('/globe')
}
