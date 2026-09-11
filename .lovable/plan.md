# Généraliser les réponses interchangeables

## Modifications
- Faire accepter, pour toutes les questions à trous, chaque mot attendu dans n’importe quelle case, une seule fois.
- Lors d’une erreur, afficher dans la case un mot juste encore manquant plutôt que la réponse initialement attachée à cette case.
- Traiter les sept observations visibles : conserver les deux chronologies déjà corrigées, enrichir les explications demandées et retirer les indices trop révélateurs.
- Marquer uniquement ces observations comme traitées, sans retirer aucune validation ni modifier la progression.

## Vérifications
- Contrôler automatiquement les 81 questions à trous, y compris les mots répétés.
- Tester les réponses désordonnées et la correction par mot manquant.
- Vérifier l’affichage et le passage à la question suivante sur mobile.

## Détails techniques
- Centraliser la règle dans le validateur commun des textes à trous afin qu’elle couvre le corpus actuel et les futures questions.
- Conserver les données de permutation existantes pour compatibilité, mais ne plus en dépendre pour l’acceptation.
