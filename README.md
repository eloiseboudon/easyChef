# EasyChef

EasyChef est une application web de gestion de recettes pensée pour un public francophone. Elle propose une interface réactive propulsée par React/Vite et une API Node.js connectée à Supabase pour persister les utilisateurs et les recettes.

## Aperçu fonctionnel

- Tableau de bord listant les recettes disponibles et leurs principales métadonnées (durée, difficulté, favoris, partages).
- Consultation détaillée d'une recette avec ingrédients, étapes et informations de partage.
- Ajout de nouvelles recettes avec gestion des ingrédients et des étapes.
- Marquage d'une recette comme favorite.
- Synchronisation des données via Supabase (insertion des données de démonstration au premier démarrage si les tables sont vides).

## Pile technologique

| Couche | Technologies |
| --- | --- |
| Frontend | [React 18](https://react.dev/), [TypeScript](https://www.typescriptlang.org/), [Vite 7](https://vitejs.dev/), [vite-plugin-pwa](https://vite-pwa-org.netlify.app/) |
| Backend | [Node.js 18+](https://nodejs.org/), [Express 4](https://expressjs.com/), [Supabase REST](https://supabase.com/), [Zod](https://zod.dev/) |
| Tooling | [tsx](https://tsx.is/), npm, ESLint/TypeScript compiler |

## Ports exposés

| Service | Port | Description |
| --- | --- | --- |
| API Node.js | `4000` (configurable via `PORT`) | Fournit les routes REST sous `/api/*`. |
| Vite (développement) | `5173` | Sert l'application React et proxifie `/api` vers `http://localhost:4000`. |
| Supabase REST | `443` (hébergé par Supabase) | Consommé par l'API via `SUPABASE_URL`. |

## Prérequis

- Node.js **18** ou version supérieure (l'API utilise `fetch` natif introduit dans Node 18).
- npm 9+.
- Un projet [Supabase](https://supabase.com/) opérationnel avec une base PostgreSQL.

## Installation

```bash
npm install
```

> ℹ️ Si votre registre npm bloque certains paquets (ex. packages `@types/*`), ajoutez les autorisations nécessaires avant d'exécuter l'installation.

## Configuration de l'environnement

Créez un fichier `.env` à la racine avec les variables suivantes :

```env
# Adresse du projet Supabase (ex. https://xyzcompany.supabase.co)
SUPABASE_URL=
easychef123pass
# Utilisez de préférence la clé de rôle de service pour permettre l'écriture et la lecture.
SUPABASE_SERVICE_ROLE_KEY=
# Facultatif : clé anonyme si vous n'avez pas accès à la clé de service.
# SUPABASE_ANON_KEY=

# Schéma Supabase ciblé (optionnel, "public" par défaut)
# SUPABASE_SCHEMA=public

# Port local de l'API Node (optionnel, 4000 par défaut)
# PORT=4000
```

### Schéma des tables Supabase

Exécutez le SQL ci-dessous dans le projet Supabase cible pour créer les tables attendues par l'API :

```sql
create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  full_name text not null,
  plan text not null check (plan in ('free', 'premium')),
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.recipes (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.users(id) on delete cascade,
  title text not null,
  description text,
  servings int not null check (servings > 0),
  time text,
  difficulty text,
  tags text[],
  category text,
  is_favorite boolean not null default false,
  shared_count int not null default 0,
  ingredients jsonb not null default '[]'::jsonb,
  steps text[] not null default '{}',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists recipes_owner_idx on public.recipes(owner_id);
```

> L'application insère automatiquement un utilisateur et trois recettes de démonstration au premier démarrage si les tables sont vides.

### Politique de sécurité

Ouvrez les accès REST à l'API Supabase correspondante (politiques RLS) pour permettre à la clé fournie d'effectuer les opérations suivantes :

- `users`: `SELECT`, `INSERT`.
- `recipes`: `SELECT`, `INSERT`, `UPDATE` (uniquement la colonne `is_favorite` et l'horodatage `updated_at`).

Pour un développement rapide, vous pouvez autoriser toutes les opérations au rôle utilisé par votre clé, puis restreindre progressivement.

## Démarrer l'application en développement

```bash
npm run dev
```

Le script lance simultanément :

1. **API EasyChef** sur `http://localhost:4000` (ou le port défini par `PORT`).
2. **Vite** sur `http://localhost:5173` avec proxy automatique vers l'API pour toute requête `/api/*`.

Arrêtez les services avec `Ctrl+C` (le script gère la fermeture proprement).

### Lancer uniquement un des services

- API seule : `npm run server` (mode watch) ou `npm run server:start` (exécution unique).
- Client Vite seul : `npm run client`.

## Construction et prévisualisation

```bash
npm run build   # compile le client et l'API
npm run preview # prévisualise le build Vite sur http://localhost:4173
```

> Remarque : la compilation nécessite que les dépendances TypeScript (`@types/*`, `vite-plugin-pwa`, etc.) soient installées. Si vous utilisez un registre privé, vérifiez que ces paquets sont autorisés.

## API REST

Toutes les routes sont préfixées par `/api`.

| Méthode | Route | Description |
| --- | --- | --- |
| `GET` | `/api/health` | Vérification basique de l'état de l'API. |
| `GET` | `/api/users` | Liste les utilisateurs (ordre anti-chronologique). |
| `GET` | `/api/users/:id` | Récupère un utilisateur par identifiant. |
| `POST` | `/api/users` | Crée un utilisateur (`email`, `fullName`, `plan`). |
| `GET` | `/api/recipes` | Liste les recettes (ordre de mise à jour décroissant). |
| `GET` | `/api/recipes/:id` | Récupère une recette par identifiant. |
| `POST` | `/api/recipes` | Crée une recette (ingrédients et étapes inclus). |
| `PATCH` | `/api/recipes/:id/favorite` | Active/désactive le statut favori d'une recette. |

Toutes les réponses d'erreur suivent le format `{ "message": string }`. Les erreurs de validation retournent un HTTP 400 avec le détail Zod dans `details`.

## Déploiement

- **API** : déployez `server/index.ts` (compilé) sur une plateforme Node.js, configurez les variables d'environnement Supabase, exposez le port 4000 (ou celui que vous avez défini) et publiez les routes `/api/*` derrière votre reverse proxy.
- **Client** : servez les fichiers statiques générés par `npm run build`. Configurez votre reverse proxy pour rediriger `/api` vers l'API Node.js.
- **Supabase** : assurez-vous que les politiques RLS correspondent aux besoins de lecture/écriture de l'API et que les tables ci-dessus existent.

## Résolution des problèmes courants

- **Erreur TS2688 (types introuvables)** : installez les dépendances `@types/node` et `vite-plugin-pwa` depuis le registre npm ou autorisez-les dans votre politique réseau.
- **Code de sortie 127 lors de `npm run dev`** : `tsx` n'est pas disponible. Exécutez `npm install` pour récupérer les dépendances de développement.
- **Erreur `SUPABASE_URL n'est pas défini`** : vérifiez votre fichier `.env` et relancez le serveur.

## Licence

Ce projet est fourni à des fins pédagogiques. Ajoutez la licence de votre choix si vous le diffusez publiquement.
