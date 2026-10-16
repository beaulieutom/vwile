# VWILE TCG

L’onglet **Mon deck** permet d’ajouter et de retirer des cartes possédées, de choisir la carte d’ouverture et de lancer un duel. Trois cartes différentes sont autorisées ; les changements sont sauvegardés immédiatement. Un duel actif bloque les changements de deck. Le Maire demeure à collectionner.

Les boosters s’ouvrent avec une animation dont la lueur correspond à la plus haute rareté des cinq cartes effectivement tirées : rouge pour Mythique/Mystique, doré pour Légendaire, violet pour Héroïque. Les cartes et le débit sont sauvegardés avant l’animation. La fermeture conserve le tirage ; le bouton « Passer l’animation » révèle immédiatement les résultats. La préférence de réduction des animations est respectée. Une ouverture active bloque les achats supplémentaires jusqu’à sa fermeture ou au choix explicite d’un autre booster.

Le samouraï rosé se nomme désormais **Tom U7**. Cette mise à jour s’applique également aux anciennes sauvegardes, sans changer l’identifiant de la carte, ses exemplaires, son titre, sa rareté ni ses caractéristiques.

Application de démonstration en français, sans dépendance : `npm run dev`, puis http://127.0.0.1:4173.

ZG est la première légendaire. L’atelier permet de personnaliser les cartes et d’ajouter ses amis avec des illustrations vectorielles originales. Collection, boosters à probabilités affichées, doublons, enchères locales avec crédits réservés, deck de trois cartes et duel contre une IA sont jouables. La progression est enregistrée en localStorage dans le navigateur.

Cette version est un prototype local : pas de comptes partagés, de serveur multijoueur ni d’argent réel. Le marché ne contient aucune annonce de démonstration. Les ventes personnelles peuvent être retirées et n’ont pas d’acheteur automatique. Pour jouer ensemble, il faudra ajouter une authentification, une base de données partagée, la validation des tirages et enchères côté serveur ainsi qu’un moteur de duel synchronisé.

Les règles détaillées sont accessibles dans l’application. Huit types forment un cycle d’avantages (×1,25) et de faiblesses (×0,80). Les budgets ATK + DEF vont de 3 200 à 4 000 suivant la rareté. Une victoire rapporte 100 crédits fictifs.

## Édition Exil & Armure

Les trois cartes personnelles utilisent un design Full Art : illustration sur toute la carte, textes et statistiques superposés. ZG, le Fondateur est Légendaire (2 400 / 1 600). ZG Exilé est Mythique, type Lumière (2 500 / 1 700), avec Serment de l’exil : +500 ATK et −500 DEF. Yanis vs ZG, le Spadassin héroïque est Héroïque, type Ombre (2 300 / 1 700), avec Armure maléfique : +400 DEF et −400 ATK. Chaque pouvoir consomme un tour et ne s’active qu’une fois par duel.

Héroïque utilise un budget de 4 000 et Mythique de 4 200. Les deux nouvelles cartes sont offertes une fois par sauvegarde ; la migration préserve les cartes personnalisées, les crédits et la progression. Elles peuvent aussi être obtenues dans les boosters, avec les probabilités affichées dans l’interface.

Vérifications : `node --check dist/app.js` et `node check.mjs`. Lancement sans npm : `node server.mjs`.

## Édition Mémoire & Temps

Yanis, le soldat aux mille traumas est Héroïque, type Sol (1 800 ATK / 2 200 DEF). Son Instinct de survie échange 400 ATK contre 400 DEF. Abdé et Yanis, les maîtres de la salle du temps et de l’esprit est Légendaire, type Temps (2 000 ATK / 2 000 DEF). Sanctuaire hors du temps restaure 400 PV. Ces deux cartes utilisent les photos fournies en Full Art et rejoignent une fois la collection, y compris les sauvegardes existantes.

Mystique est une rareté distincte de Mythique avec le même budget de 4 200 points. Dans les tirages, les anciennes probabilités Mythique sont partagées entre Mythique et Mystique ; la somme des probabilités de chaque booster reste égale à 100 %.

Cycle des types : Feu → Nature → Sol → Foudre → Eau → Ombre → Temps → Lumière → Feu. Chaque type bat le suivant (×1,25) et est faible contre le précédent (×0,80). La mise à jour des types Sol et Temps est appliquée une fois aux deux cartes déjà présentes dans les sauvegardes.

Le bouton « Roue des types », en haut à droite de la collection, ouvre une roue interactive avec huit couleurs et symboles distincts. Sélectionner un type montre son avantage, sa faiblesse et les multiplicateurs réellement utilisés dans les combats. Le bouton sous les relations filtre la collection par type ; le menu « Tous les types » permet de réinitialiser le filtre. Les affrontements entre types non adjacents et entre types identiques sont neutres (×1).

## Catalogue personnel et raretés

Le catalogue de départ contient seulement les neuf cartes demandées avec photos : ZG le Fondateur, ZG Exilé, Yanis vs ZG, Yanis le soldat aux mille traumas, Abdé et Yanis, Tom le samouraï rosé et Tom U6, La peptidance. Les onze exemples sont retirés des anciennes sauvegardes, des decks et des enchères. Les cartes créées personnellement dans l’atelier sont conservées. Les crédits réservés sur une annonce supprimée sont rendus une seule fois. Le deck est réparé lors de la migration, puis les choix suivants du joueur sont respectés. Les boosters ne tirent que les cartes du cercle et leurs probabilités et garanties sont affichées.

Les contours dépendent de la rareté : rang 1 Mythique / Mystique rouge, rang 2 Légendaire doré, rang 3 Héroïque violet. Les raretés inférieures restent disponibles pour la création de futures cartes : Épique indigo, Rare bleu et Commune gris. La couleur du type demeure sur son badge indépendant.

## Tom, le samouraï rosé

Tom rejoint le cercle en Légendaire Full Art dorée, type Nature, avec 2 300 ATK / 1 700 DEF. Pétales tranchants donne +400 ATK en échange de −400 DEF, une fois par duel. Yanis soldat est désormais uniquement Héroïque : la migration actualise le rang, les statistiques et le pouvoir tout en gardant ses exemplaires et le deck. La probabilité Mystique est désormais portée par Tom U6.

## Tom U6 — La peptidance

Tom U6 rejoint le cercle en Mystique Full Art rouge, type Eau, avec 2 000 ATK / 2 200 DEF. Réaction en chaîne restaure 500 PV une fois par duel et consomme le tour. La nouvelle image fournie illustre la carte. Un exemplaire rejoint chaque sauvegarde sans modifier les crédits, les doublons ni le deck. Les probabilités Mythique et Mystique sont à nouveau partagées entre ZG Exilé et Tom U6. Yanis soldat reste Héroïque.

## Le Maire

Carte Full Art spéciale argentée, nommée uniquement « Le Maire », avec une seule étoile. Type, rareté, attaque, défense et pouvoir sont affichés « Inconnu ». Les valeurs ATK et DEF sont réellement nulles : aucune statistique numérique cachée. Cette carte est offerte à la collection et reste hors des decks, des adversaires IA et des tirages ordinaires tant que ses caractéristiques ne sont pas définies. Le cycle des huit types reste inchangé.

## Emilien — Le Larp Tunisien

Emilien rejoint le cercle en Héroïque Full Art violet, avec la nouvelle photo fournie. Type Feu, 2 100 ATK / 1 900 DEF, pouvoir Entrée en scène : +400 ATK contre −400 DEF une fois par duel. La carte est disponible dans la collection et les tirages Héroïque des boosters. Les anciennes sauvegardes reçoivent un exemplaire sans modifier leur progression.

Les huit cartes jouables possèdent désormais un passif automatique lié à leur identité. Les définitions et déclencheurs sont dans `dist/passives.js`, indépendamment des pouvoirs actifs. Les détails de carte indiquent les règles complètes et l’arène affiche les bonus, charges et boucliers de chaque combattant. Les réserves sont propres au camp et au duel ; Le Maire reste entièrement inconnu. Les tests couvrent les plafonds, les consommations, les protections et les 64 combinaisons de combattants.
L’entrée en duel et les attaques sont animées par `dist/combat-animation.js`. Les impacts reprennent la couleur et le symbole du type attaquant. Les séquences joueur/IA sont jouées successivement, bloquent les doubles actions et s’annulent à la sortie de l’arène. Le mode de mouvements réduits reste pris en charge.

La refonte des duels utilise désormais `dist/duel.js` : exactement deux capacités par carte, dégâts directs et prévisualisation exacte contre la cible active, soins/boucliers avec recharges, une seule action par camp et par tour. Les anciennes postures génériques et le troisième pouvoir ont été retirés de l’interface et du moteur. Les passifs suivent les capacités propres à la carte. Les animations présentent les PV successivement, au moment de chaque effet. Les cartes affichent leur nom en haut, des pastilles agrandies et deux lignes de capacités dans une zone contrastée. Les contrôles couvrent les 64 affrontements, la prédiction, les recharges, les soins et les réserves.
Le bandeau final des cartes place le type à gauche, la rareté à droite et le nom centré en haut. Toutes les étoiles ont été supprimées, y compris sur Le Maire. Le dégradé de lisibilité ne couvre plus le haut de l’illustration.
