import { createClient } from '@/lib/supabase/server'
import ArticleForm from '@/components/ArticleForm'
import { creerArticle, type ArticleFormData } from '../actions'

export default async function NouvelArticle() {
  const supabase = createClient()

  const [{ data: boutiques }, { data: categories }, { data: fournisseurs }] = await Promise.all([
    supabase.from('boutiques').select('id, nom').eq('actif', true),
    supabase.from('categories').select('id, nom'),
    supabase.from('fournisseurs').select('id, nom'),
  ])

  async function valider(donnees: ArticleFormData) {
    'use server'
    await creerArticle(donnees)
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Nouvel article</h2>
      <ArticleForm
        boutiques={boutiques ?? []}
        categories={categories ?? []}
        fournisseurs={fournisseurs ?? []}
        onValider={valider}
        libelleBouton="Créer l'article"
      />
    </div>
  )
}
