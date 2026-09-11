# Relancer plusieurs missions le même jour

## Objectif
Permettre de démarrer une nouvelle mission immédiatement après la précédente, même si les cartes concernées sont planifiées pour un autre jour.

## Modifications
- Conserver la composition normale et toutes les règles de progression existantes.
- Ajouter un mode de continuation uniquement lorsque la composition normale ne trouve aucune question.
- Dans ce cas, proposer d’abord les cartes fragiles à revalider, puis compléter avec les cartes déjà vues les moins récemment travaillées.
- Éviter que le bouton reste silencieux si aucun contenu n’est réellement disponible.

## Vérification
- Simuler une première mission terminée avec des cartes reportées au lendemain.
- Vérifier qu’une deuxième mission peut démarrer le même jour.
- Vérifier que la réussite du premier coup dans cette nouvelle mission valide bien les cartes fragiles.
