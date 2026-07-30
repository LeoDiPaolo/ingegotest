## Mon analyse honnête

### 1. Le décalage charte / application
Tes visuels définissent une identité claire : **fond clair (blanc cassé), bleu marine pour le mot-clé IngéGo, orange casque de chantier en accent, vert sauge pour les validations, cartes blanches à bords arrondis, mascotte castor**.

L'application actuelle est exactement l'inverse : **fond ardoise très sombre, accent braise, titres en serif Instrument Serif**. Ce n'est pas « presque bon », c'est une autre marque. Il faut donc trancher : la charte des visuels gagne, et le thème sombre devient une option secondaire (mode nuit), pas le défaut.

Point de vigilance : le castor est mignon, mais le concours d'ingénieur territorial est un public d'adultes cadres A. La bonne dose = mascotte présente aux moments d'émotion (accueil, réussite, erreur, fin de session), absente pendant la lecture d'un énoncé technique. Sinon on glisse vers le Duolingo enfantin et ça décrédibilise le contenu, qui est ta vraie valeur.

### 2. L'état du contenu — c'est solide
322 questions, 6 axes déjà colorés dans le corpus (A1 orange, A2 bleu, A3 vert, A4 violet, A5 turquoise, A6 rose), 9 types d'exercices (qcm, libre, vf, trous, tri, assoc, erreur, ordre, frise), traçabilité `famille` S/M/E + `derniereVerification`. C'est franchement du bon travail — bien meilleur que la moyenne des apps de révision concours.

### 3. Ce que je pense des maquettes — la partie où je ne suis pas d'accord
Je dois être direct : **les illustrations des maquettes sont des images générées par IA, et la quasi-totalité contient du texte faux ou du charabia**. Exemples relevés sur tes propres visuels :
- « 600 % / 204 % / 208 % » sur le graphique du décret tertiaire, alors que les vrais objectifs sont -40 % en 2030, -50 % en 2040, -60 % en 2050
- « Proveon DTU / Connant-Terrasses / Conmart PMR », « Comparaisom factuelle : cain quiz », « Tappazez les árats », « Diisgnez les termes de tontierne »
- des tableaux FPT/FPE/FPH avec des chiffres inventés

Intégrer ces images telles quelles serait **le pire choix possible pour une app de concours** : un candidat qui mémorise un graphique faux est pénalisé le jour J. Donc :
- ❌ pas d'images bitmap générées pour illustrer des données réglementaires
- ✅ des **visuels vectoriels (SVG) construits en code**, dont chaque chiffre et chaque libellé vient du corpus — vérifiables, corrigeables, nets sur tous les écrans, légers, accessibles, et adaptables au thème
- ✅ des illustrations bitmap uniquement pour le **décoratif non informatif** : mascotte, en-têtes d'axes, écrans de fin de session

En revanche, l'**intention** des maquettes est excellente : carte de France cliquable pour les compétences, camembert budgétaire, coupe de pont thermique, plan d'ERP, frise de marché public. Ça, on le fait — mais en SVG maîtrisé.

### 4. Faut-il un visuel sur chaque question ?
Non, et c'est important. Sur 322 questions, illustrer les 322 diluerait l'attention et allongerait la session. Ma règle : **un visuel quand il porte l'information, jamais en décoration**. Concrètement ~60 à 80 questions méritent un visuel (géographie, chiffres comparés, chronologies, plans, coupes, organigrammes). Les autres gardent un en-tête d'axe coloré et typographié, propre et rapide.

---

## Plan proposé

### Étape 1 — Charte graphique (fondations)
- Réécriture des tokens de `src/styles.css` en thème clair : fond blanc cassé, `primary` bleu marine IngéGo, `accent` orange casque, `success` vert sauge, bordures douces, cartes blanches ombrées.
- Mode sombre conservé en variante cohérente (`.dark`), plus le thème par défaut.
- Typographie : abandon d'Instrument Serif pour un couple sans-serif lisible et institutionnel (titres semi-bold, corps très lisible sur mobile).
- Couleurs d'axes du corpus (déjà présentes) intégrées comme tokens et utilisées partout : badges, barres de progression, en-têtes.

### Étape 2 — Logo et mascotte
- Extraction du logo IngéGo et de l'icône castor depuis les fichiers transmis, publiés comme assets, utilisés dans l'accueil, l'en-tête, la favicon et l'écran de connexion.
- Mascotte réservée à : accueil, session terminée, série de bonnes réponses, état vide.

### Étape 3 — Habillage de chaque question (les 322)
- Nouvelle carte d'exercice : bandeau d'axe coloré + pictogramme de sous-thème, badge de type d'exercice, indicateur de niveau, chip de famille S/M/E.
- Refonte des 9 types d'interaction pour le confort tactile : cibles plus grandes, glisser-déposer avec repli « tap-tap » sur mobile, feedback immédiat coloré, explication dépliée après réponse avec mise en forme (et non un pavé de texte).
- Barre de progression de session et transitions douces entre questions.

### Étape 4 — Nouveaux types d'exercices visuels (SVG)
Ajout de composants réutilisables, alimentés par des données vérifiées :
1. **Carte territoriale cliquable** — placer une compétence sur le bon échelon (commune / EPCI / département / région)
2. **Plan / coupe annotée** — points chauds à identifier (pont thermique, acrotère, relevé d'étanchéité)
3. **Plan d'ERP** — positionner issue de secours, extincteur, rampe PMR, alarme
4. **Frise de procédure** — remettre dans l'ordre les jalons d'un marché (DCE → AAPC → offres → attribution → OS → réception → GPA → DGD)
5. **Graphique comparé** — lire un histogramme ou un camembert (ACV béton/bois/paille, budget local, objectifs décret tertiaire) avec chiffres sourcés
6. **Curseur de seuil** — placer un montant sur l'échelle des seuils de la commande publique
7. **Organigramme à trous** — reconstituer une chaîne d'acteurs (MOA / MOE / SPS / CT / entreprise)

Chaque nouveau visuel s'appuie sur des questions existantes du corpus quand c'est possible, et les nouvelles questions créées sont écrites avec sources et champ `derniereVerification` renseigné.

### Étape 5 — Vérification
- Relecture factuelle de chaque chiffre affiché dans un visuel (seuils, dates, pourcentages) avant publication.
- Contrôle du rendu mobile 393 px et desktop, thème clair et sombre.

---

## Détails techniques
- Tokens sémantiques uniquement, aucune couleur en dur dans les composants.
- Visuels en composants React/SVG sous `src/components/ingego/visuels/`, pilotés par les données de la question — pas d'images pour les contenus porteurs d'information.
- Extension du type `TypeExo` dans `src/lib/ingego/corpus.ts` et du corpus JSON pour les nouveaux types (`carte`, `plan`, `graphe`, `seuil`, `organigramme`), avec rendu dédié dans `exercice.tsx`.
- Logo/mascotte publiés via les assets CDN du projet plutôt que copiés dans le dépôt.

---

## Ordre d'exécution suggéré
Je propose de livrer par lots pour que tu valides au fur et à mesure : **(1) charte + logo**, puis **(2) habillage des questions existantes**, puis **(3) les nouveaux exercices visuels un par un**. Ça évite un big-bang difficile à corriger.
