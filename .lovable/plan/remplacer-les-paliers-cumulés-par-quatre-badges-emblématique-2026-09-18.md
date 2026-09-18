# Remplacer les paliers cumulés par quatre badges emblématiques

## Résultat attendu
- Recréer dans l’application les quatre badges de référence sous forme de médailles en engrenage : **Bronze**, **Argent**, **Or** et **Spécial**.
- La capture sert uniquement de direction visuelle : le rendu sera redessiné dans l’interface pour rester net sur mobile et cohérent avec les couleurs existantes.
- Conserver tous les paliers actuels et leur logique de déblocage. Seule leur représentation change.

## Accueil
- Supprimer la grille qui affiche actuellement tous les paliers cumulés 10, 25, 50, etc.
- Lorsqu’au moins 10 questions sont validées, afficher uniquement le dernier palier atteint.
- Afficher son nombre à la fois au centre du badge et sous celui-ci, par exemple **« 250 questions »**.
- Ne rien afficher dans cette zone avant le premier palier de 10 questions.
- Conserver les badges de maîtrise par catégorie et le reste de l’accueil sans changement.

## Familles visuelles
- **Bronze** : paliers de 10 à 250 inclus.
- **Argent** : paliers de 300 à 650 inclus.
- **Or** : paliers de 700 à 900 inclus.
- **Spécial** : paliers supérieurs à 900, jusqu’au corpus complet.
- Chaque famille aura une composition distinctive inspirée de l’image : engrenage gravé, symbole central propre, nom de famille et finition métallique correspondante.

## Animation de déblocage
- Pour un palier cumulé `rep-*`, faire apparaître le grand badge correspondant pendant la célébration.
- Ajouter ensuite sous le badge un tampon incliné animé indiquant clairement le niveau atteint, par exemple **« PALIER 350 »**.
- Garder les effets de célébration déjà associés au bronze, à l’argent, à l’or et au spécial.
- Les récompenses de catégorie et de régularité conservent leur fonctionnement et leur présentation actuels.

## Vérification
- Contrôler sur mobile l’absence de badge avant 10, puis le dernier badge seul après un palier atteint.
- Vérifier les limites 250/300, 650/700 et 900/950.
- Vérifier que le numéro est lisible dans et sous le badge, et que le tampon apparaît seulement lors du déblocage d’un palier cumulé.
- Vérifier le typage et le rendu sans erreur dans l’aperçu.
