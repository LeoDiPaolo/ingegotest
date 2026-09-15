# Corriger l’équilibrage réel des missions

## Constat
Le tirage ne compare pas seulement les pourcentages déjà acquis : il ajoute aussi fictivement les questions sélectionnées dans la mission en cours. Cela peut faire remonter GUIDE dans une mission alors qu’un autre chapitre reste réellement moins avancé.

## Modification
- Attribuer les places de la mission selon le pourcentage **déjà validé** de chaque chapitre actif.
- En cas d’égalité, répartir les places de façon déterministe entre les chapitres concernés.
- Conserver le verrouillage des niveaux propre à chaque chapitre et toutes les règles de validation existantes.
- Ne pas modifier le corpus ni la progression enregistrée.

## Vérification
- Ajouter des scénarios déterministes où GUIDE est plus avancé que d’autres chapitres et confirmer qu’il n’est pas sélectionné.
- Vérifier le cas d’égalité et le cas où le chapitre le moins avancé n’a pas assez de questions disponibles.
- Tester une mission complète de 8 questions dans l’aperçu mobile.

## Détail technique
Le correctif restera limité à la fonction de répartition entre chapitres. La composition des candidats, la priorité des niveaux, le repos des cartes ratées et la réinjection dans une mission resteront inchangés.
