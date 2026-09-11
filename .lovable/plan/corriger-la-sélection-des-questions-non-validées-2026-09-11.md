# Corriger la sélection des questions non validées

## Règles appliquées
- Une question non validée (`p = 0`) reste disponible dans le niveau actif de son chapitre, qu’elle soit neuve ou déjà ratée.
- Une question fragile n’a aucune priorité spéciale : elle suit le même mélange par thèmes que les autres questions non validées.
- Une question acquise (`p ≥ 1`) revient uniquement lorsque sa date de révision est atteinte.
- Le niveau suivant reste verrouillé jusqu’à la validation du premier coup de toutes les questions du niveau courant.
- Aucune question acquise n’est ajoutée artificiellement pour remplir une mission.

## Mise en œuvre
- Adapter la composition normale des missions pour inclure les cartes vues mais non validées du niveau actif.
- Supprimer le mécanisme de continuation ajouté précédemment.
- Vérifier l’enchaînement de deux missions, le blocage du niveau supérieur et le respect des échéances des cartes acquises.
