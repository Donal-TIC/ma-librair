'use client'

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

export default function GraphiqueVentesJour({ donnees }: { donnees: { jour: string; ca: number }[] }) {
  if (donnees.length === 0) {
    return <p className="text-gray-400 text-sm text-center py-12">Aucune vente sur les 30 derniers jours.</p>
  }

  return (
    <div className="w-full h-56">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={donnees}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
          <XAxis dataKey="jour" tickFormatter={(j) => new Date(j).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })} fontSize={11} />
          <YAxis fontSize={11} width={60} tickFormatter={(v) => v.toLocaleString('fr-FR')} />
          <Tooltip labelFormatter={(j) => new Date(j as string).toLocaleDateString('fr-FR')} formatter={(v: number) => `${v.toLocaleString('fr-FR')} FCFA`} />
          <Bar dataKey="ca" name="Chiffre d'affaires" fill="#7c3aed" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
