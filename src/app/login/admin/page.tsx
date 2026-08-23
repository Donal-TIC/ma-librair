import FormulaireConnexion from '@/components/FormulaireConnexion'

export default function LoginAdmin() {
  return (
    <FormulaireConnexion
      roleAttendu="admin"
      titre="Connexion — Espace administrateur"
      destination="/admin"
      libelleAutreRole="Je suis caissier →"
      lienAutreRole="/login/caissier"
    />
  )
}
