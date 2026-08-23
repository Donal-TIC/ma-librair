'use client'

import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from 'recharts'

interface Props {
  donnees: { jour: string; ca: number; depenses: number }[]
}

export default function GraphiqueFinances({ donnees }: Props) {
  if (donnees.length === 0) {
    return <p className="text-gray-400 text-sm text-center py-12">Aucune donnée sur cette période.</p>
  }

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={donnees}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
          <XAxis
            dataKey="jour"
            tickFormatter={(j) => new Date(j).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}
            fontSize={12}
          />
          <YAxis fontSize={12} width={70} tickFormatter={(v) => v.toLocaleString('fr-FR')} />
          <Tooltip
            labelFormatter={(j) => new Date(j as string).toLocaleDateString('fr-FR')}
            formatter={(valeur: number) => `${valeur.toLocaleString('fr-FR')} FCFA`}
          />
          <Legend />
          <Bar dataKey="ca" name="Chiffre d'affaires" fill="#7c3aed" radius={[4, 4, 0, 0]} />
          <Bar dataKey="depenses" name="Dépenses" fill="#f97316" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
