import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import ArticleForm from '@/components/ArticleForm'
import BarcodeImage from '@/components/BarcodeImage'
import BoutonImprimer from '@/components/BoutonImprimer'
import { modifierArticle, type ArticleFormData } from '../actions'

export default async function ModifierArticle({ params }: { params: { id: string } }) {
  const supabase = createClient()

  const [{ data: article }, { data: boutiques }, { data: categories }, { data: fournisseurs }] = await Promise.all([
    supabase.from('articles').select('*').eq('id', params.id).single(),
    supabase.from('boutiques').select('id, nom').eq('actif', true),
    supabase.from('categories').select('id, nom'),
    supabase.from('fournisseurs').select('id, nom'),
  ])

  if (!article) notFound()

  async function valider(donnees: ArticleFormData) {
    'use server'
    await modifierArticle(params.id, donnees)
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-2">Modifier l'article</h2>

      <div className="card max-w-xl mb-4 flex items-center justify-between">
        <BarcodeImage value={article.code_barre} />
        <BoutonImprimer />
      </div>

      <ArticleForm
        boutiques={boutiques ?? []}
        categories={categories ?? []}
        fournisseurs={fournisseurs ?? []}
        valeursInitiales={article}
        codeBarre={article.code_barre}
        onValider={valider}
        libelleBouton="Enregistrer les modifications"
      />
    </div>
  )
}
