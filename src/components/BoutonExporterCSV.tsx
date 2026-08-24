'use client'

function echapperCSV(valeur: unknown): string {
  const texte = String(valeur ?? '')
  if (texte.includes(',') || texte.includes('"') || texte.includes('\n')) {
    return `"${texte.replace(/"/g, '""')}"`
  }
  return texte
}

export default function BoutonExporterCSV({ donnees, nomFichier }: { donnees: Record<string, unknown>[]; nomFichier: string }) {
  function exporter() {
    if (donnees.length === 0) return
    const colonnes = Object.keys(donnees[0])
    const lignes = [
      colonnes.join(','),
      ...donnees.map((ligne) => colonnes.map((c) => echapperCSV(ligne[c])).join(',')),
    ]
    // \uFEFF (BOM) pour que les accents s'affichent correctement dans Excel
    const contenu = '\uFEFF' + lignes.join('\n')
    const blob = new Blob([contenu], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const lien = document.createElement('a')
    lien.href = url
    lien.download = `${nomFichier}-${new Date().toISOString().slice(0, 10)}.csv`
    lien.click()
    URL.revokeObjectURL(url)
  }

  return (
    <button onClick={exporter} disabled={donnees.length === 0} className="btn-secondary text-sm disabled:opacity-40">
      Exporter en CSV
    </button>
  )
}
