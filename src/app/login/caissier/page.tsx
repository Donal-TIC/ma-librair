import FormulaireConnexion from '@/components/FormulaireConnexion'

export default function LoginCaissier() {
  return (
    <FormulaireConnexion
      roleAttendu="caissier"
      titre="Connexion — Espace caisse"
      destination="/caisse"
      libelleAutreRole="Je suis administrateur →"
      lienAutreRole="/login/admin"
    />
  )
}
