# VWILE TCG

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

Le catalogue de départ contient seulement les six cartes demandées avec photos : ZG le Fondateur, ZG Exilé, Yanis vs ZG, Yanis le soldat aux mille traumas, Abdé et Yanis, et Tom le samouraï rosé. Les onze exemples sont retirés des anciennes sauvegardes, des decks et des enchères. Les cartes créées personnellement dans l’atelier sont conservées. Les crédits réservés sur une annonce supprimée sont rendus une seule fois. Le deck est réparé lors de la migration, puis les choix suivants du joueur sont respectés. Les boosters ne tirent que les cartes du cercle et leurs probabilités et garanties sont affichées.

Les contours dépendent de la rareté : rang 1 Mythique / Mystique rouge, rang 2 Légendaire doré, rang 3 Héroïque violet. Les raretés inférieures restent disponibles pour la création de futures cartes : Épique indigo, Rare bleu et Commune gris. La couleur du type demeure sur son badge indépendant.

## Tom, le samouraï rosé

Tom rejoint le cercle en Légendaire Full Art dorée, type Nature, avec 2 300 ATK / 1 700 DEF. Pétales tranchants donne +400 ATK en échange de −400 DEF, une fois par duel. Yanis soldat est désormais uniquement Héroïque : la migration actualise le rang, les statistiques et le pouvoir tout en gardant ses exemplaires et le deck. Les boosters ne réservent plus de probabilité à Mystique, puisqu’aucune carte actuelle n’a ce rang.
