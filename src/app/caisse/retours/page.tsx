import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import PageRetours from './PageRetours'

export default async function Retours() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login/caissier')

  return <PageRetours />
}
