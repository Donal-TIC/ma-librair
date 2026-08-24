import { createClient } from '@/lib/supabase/server'
import { IconeNotification, IconeAlerte } from '@/components/icones'

interface Notif { niveau: 'info' | 'attention' | 'critique'; texte: string }

export default async function PageNotifications() {
  const supabase = createClient()

  const [
    { data: articles },
    { data: sessionsFermees },
    { data: transferts },
    { data: achats },
  ] = await Promise.all([
    supabase.from('articles').select('nom, quantite_stock, seuil_alerte, boutiques(nom)').eq('actif', true),
    supabase.from('sessions_caisse').select('ecart, fermee_at, boutiques(nom), profils:caissier_id(nom_complet)').eq('statut', 'fermee').not('ecart', 'is', null).order('fermee_at', { ascending: false }).limit(20),
    supabase.from('transferts').select('numero, statut, created_at, source:boutique_source_id(nom), destination:boutique_destination_id(nom)').in('statut', ['expedie', 'partiellement_recu']),
    supabase.from('achats').select('numero, statut, created_at, fournisseurs(nom)').in('statut', ['commandee', 'partiellement_recue']),
  ])

  const notifications: Notif[] = []

  for (const a of articles ?? []) {
    const boutiqueNom = (a as any).boutiques?.nom
    if (a.quantite_stock === 0) {
      notifications.push({ niveau: 'critique', texte: `Rupture : "${a.nom}" est en rupture dans ${boutiqueNom}.` })
    } else if (a.quantite_stock <= a.seuil_alerte) {
      notifications.push({ niveau: 'attention', texte: `Stock faible : "${a.nom}" (${a.quantite_stock} restant(s)) dans ${boutiqueNom}.` })
    }
  }

  for (const s of sessionsFermees ?? []) {
    const ecart = Number(s.ecart)
    if (ecart === 0) continue
    const niveau = Math.abs(ecart) >= 5000 ? 'critique' : 'attention'
    notifications.push({
      niveau,
      texte: `Écart de caisse : ${ecart > 0 ? '+' : ''}${ecart.toLocaleString('fr-FR')} FCFA — ${(s as any).profils?.nom_complet} (${(s as any).boutiques?.nom}), fermée le ${new Date(s.fermee_at!).toLocaleDateString('fr-FR')}.`,
    })
  }

  for (const t of transferts ?? []) {
    notifications.push({
      niveau: 'info',
      texte: `Transfert ${t.numero} (${(t as any).source?.nom} → ${(t as any).destination?.nom}) en attente de réception depuis le ${new Date(t.created_at).toLocaleDateString('fr-FR')}.`,
    })
  }

  for (const a of achats ?? []) {
    notifications.push({
      niveau: 'info',
      texte: `Commande ${a.numero} chez ${(a as any).fournisseurs?.nom} en attente de réception (passée le ${new Date(a.created_at).toLocaleDateString('fr-FR')}).`,
    })
  }

  const ordre = { critique: 0, attention: 1, info: 2 }
  notifications.sort((a, b) => ordre[a.niveau] - ordre[b.niveau])

  const styles: Record<string, string> = {
    critique: 'border-red-200 bg-red-50 text-red-700',
    attention: 'border-orange-200 bg-orange-50 text-orange-700',
    info: 'border-blue-200 bg-blue-50 text-blue-700',
  }

  return (
    <div className="max-w-2xl">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
        <IconeNotification className="w-6 h-6" /> Notifications
        {notifications.length > 0 && <span className="text-sm bg-red-100 text-red-600 rounded-full px-2 py-0.5">{notifications.length}</span>}
      </h2>

      <div className="space-y-2">
        {notifications.map((n, i) => (
          <div key={i} className={`card flex items-start gap-2 text-sm border ${styles[n.niveau]}`}>
            <IconeAlerte className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{n.texte}</span>
          </div>
        ))}
        {notifications.length === 0 && <p className="text-gray-400 text-sm text-center py-8">Aucune notification. Tout va bien 👍</p>}
      </div>
    </div>
  )
}
