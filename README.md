# VWILE TCG

Application de démonstration en français, sans dépendance : `npm run dev`, puis http://127.0.0.1:4173.

ZG est la première légendaire. L’atelier permet de personnaliser les cartes et d’ajouter ses amis avec des illustrations vectorielles originales. Collection, boosters à probabilités affichées, doublons, enchères locales avec crédits réservés, deck de trois cartes et duel contre une IA sont jouables. La progression est enregistrée en localStorage dans le navigateur.

Cette version est un prototype local : pas de comptes partagés, de serveur multijoueur ni d’argent réel. Le marché utilise des vendeurs fictifs. Les ventes personnelles peuvent être retirées et n’ont pas d’acheteur automatique. Pour jouer ensemble, il faudra ajouter une authentification, une base de données partagée, la validation des tirages et enchères côté serveur ainsi qu’un moteur de duel synchronisé.

Les règles détaillées sont accessibles dans l’application. Six types forment un cycle d’avantages (×1,25) et de faiblesses (×0,80). Les budgets ATK + DEF vont de 3 200 à 4 000 suivant la rareté. Une victoire rapporte 100 crédits fictifs.
