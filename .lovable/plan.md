# Équilibrer la progression entre les chapitres

## Résultat attendu
- Une mission de 8 questions vise une question disponible par chapitre actif, puisque l’application compte 8 chapitres.
- Si un chapitre n’a momentanément aucune question disponible, sa place est redistribuée équitablement entre les autres chapitres.
- À l’intérieur de chaque chapitre, les thèmes continuent d’être mélangés selon leur poids réel.
- Les règles existantes restent inchangées : niveau actif, réussite du premier coup, cartes non validées disponibles et cartes acquises seulement à échéance.
- L’affichage du Guide revient à 10 % comme demandé.

## Mise en œuvre
- Remplacer la pondération globale par volume du corpus par une répartition d’abord égale entre chapitres, puis proportionnelle entre leurs thèmes.
- Conserver le mélange des formats et l’alternance des questions.
- Ajouter une vérification automatisée confirmant l’équilibre d’une mission et la redistribution lorsqu’un chapitre est indisponible.
- Vérifier le lancement de mission et les contrôles du projet.

## Détail technique
La sélection change uniquement dans la fonction de répartition utilisée par les missions. La planification espacée et la logique de déblocage ne sont pas réécrites.
