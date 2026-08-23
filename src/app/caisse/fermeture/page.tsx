import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import PageFermetureCaisse from './PageFermetureCaisse'

export default async function FermetureCaisse() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login/caissier')

  const { data: session } = await supabase
    .from('sessions_caisse')
    .select('id')
    .eq('caissier_id', user.id)
    .eq('statut', 'ouverte')
    .maybeSingle()

  if (!session) redirect('/caisse/ouverture')

  return <PageFermetureCaisse sessionId={session.id} />
}
