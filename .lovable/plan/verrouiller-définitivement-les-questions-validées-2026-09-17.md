# Verrouiller définitivement les questions validées

## Modifications
- Enregistrer un repère distinct au début de chaque mission, y compris lorsqu’il y en a plusieurs le même jour.
- Reconstituer les anciennes missions à partir des groupes de 8 questions et de leurs reprises, afin de retrouver les réussites au premier passage déjà présentes dans l’historique.
- Rendre une validation définitive irréversible lors des réponses et des synchronisations entre l’appareil et la sauvegarde distante.
- Conserver l’historique complet utilisé comme preuve et empêcher une ancienne session déjà ouverte de dévalider une carte.

## Vérifications
- Contrôler la question affichée `n1-46` et toutes les autres questions présentant le même historique.
- Tester plusieurs missions le même jour, une reprise après erreur et la fusion de deux états contradictoires.
- Vérifier qu’une carte définitivement validée ne peut plus être tirée ni rétrogradée.
