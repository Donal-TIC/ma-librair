import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import PageVenteClient from './PageVenteClient'

export default async function PageVente() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login/caissier')

  const { data: profil } = await supabase.from('profils').select('boutique_id').eq('id', user.id).single()

  const { data: session } = await supabase
    .from('sessions_caisse')
    .select('id')
    .eq('caissier_id', user.id)
    .eq('statut', 'ouverte')
    .maybeSingle()

  if (!session) redirect('/caisse/ouverture')

  return <PageVenteClient sessionId={session.id} boutiqueId={profil?.boutique_id ?? ''} caissierId={user.id} />
}
