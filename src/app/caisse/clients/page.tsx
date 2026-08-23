import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import PageClients from './PageClients'

export default async function Clients() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login/caissier')

  const { data: profil } = await supabase.from('profils').select('boutique_id').eq('id', user.id).single()

  return <PageClients boutiqueId={profil?.boutique_id ?? ''} />
}
