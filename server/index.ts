import cors from 'cors';
import express from 'express';
import { z, ZodError } from 'zod';
import { ApiError } from './errors.js';
import {
  createRecipe,
  createUser,
  findRecipeById,
  findUserById,
  listRecipes,
  listUsers,
  seedData,
  updateRecipeFavorite
} from './store.js';
import { Recipe, User } from './types.js';

const fallbackUser: User = {
  id: 'user-marie',
  email: 'marie@example.com',
  fullName: 'Marie Dupont',
  plan: 'premium',
  createdAt: '2024-01-15T10:00:00.000Z'
};

const fallbackRecipes: Recipe[] = [
  {
    id: 'lasagnes',
    ownerId: fallbackUser.id,
    title: 'Lasagnes maison',
    description:
      'Des lasagnes traditionnelles faites maison avec une sauce tomate mijotée et une béchamel onctueuse.',
    servings: 6,
    time: '1h30',
    tags: ['Plat principal', 'Italien'],
    difficulty: 'Difficulté moyenne',
    category: 'Plat principal',
    isFavorite: true,
    sharedCount: 2,
    ingredients: [
      { id: 'lasagnes-pasta', name: 'Pâtes à lasagnes', quantity: 250, unit: 'g' },
      { id: 'lasagnes-meat', name: 'Viande hachée', quantity: 400, unit: 'g' },
      { id: 'lasagnes-sauce', name: 'Sauce tomate', quantity: 500, unit: 'ml' },
      { id: 'lasagnes-bechamel', name: 'Béchamel', quantity: 400, unit: 'ml' },
      { id: 'lasagnes-cheese', name: 'Fromage râpé', quantity: 200, unit: 'g' },
      { id: 'lasagnes-onion', name: 'Oignon', quantity: 1, unit: 'unité' }
    ],
    steps: [
      'Préchauffer le four à 180°C. Faire cuire les pâtes à lasagnes selon les indications du paquet.',
      "Dans une poêle, faire revenir l'oignon haché puis ajouter la viande hachée. Cuire 10 minutes.",
      'Ajouter la sauce tomate à la viande et laisser mijoter 15 minutes.',
      'Dans un plat à gratin, alterner couches de pâtes, viande et béchamel. Terminer par le fromage.',
      'Enfourner 25-30 minutes jusqu’à ce que le dessus soit doré. Laisser reposer 5 minutes avant de servir.'
    ],
    createdAt: '2024-02-12T10:15:00.000Z',
    updatedAt: '2024-03-02T09:30:00.000Z'
  },
  {
    id: 'tarte-pommes',
    ownerId: fallbackUser.id,
    title: 'Tarte aux pommes',
    description: 'Une tarte aux pommes fondante parfumée à la cannelle, parfaite pour le goûter.',
    servings: 8,
    time: '45min',
    tags: ['Dessert', 'Facile'],
    difficulty: 'Facile',
    category: 'Dessert',
    isFavorite: false,
    sharedCount: 1,
    ingredients: [
      { id: 'tarte-pate', name: 'Pâte brisée', quantity: 1, unit: 'unité' },
      { id: 'tarte-pommes', name: 'Pommes', quantity: 5, unit: 'unité(s)' },
      { id: 'tarte-sucre', name: 'Sucre', quantity: 60, unit: 'g' },
      { id: 'tarte-beurre', name: 'Beurre', quantity: 30, unit: 'g' },
      { id: 'tarte-cannelle', name: 'Cannelle', quantity: 1, unit: 'c.à.c' }
    ],
    steps: [
      'Préchauffer le four à 180°C. Étaler la pâte dans un moule et la piquer avec une fourchette.',
      'Éplucher les pommes, les couper en lamelles et les disposer sur la pâte.',
      'Saupoudrer de sucre et de cannelle. Parsemer de petits morceaux de beurre.',
      'Cuire 35 minutes jusqu’à obtenir une belle coloration dorée.'
    ],
    createdAt: '2024-01-08T15:20:00.000Z',
    updatedAt: '2024-02-22T18:45:00.000Z'
  },
  {
    id: 'salade-cesar',
    ownerId: fallbackUser.id,
    title: 'Salade César',
    description: 'Une salade César rapide avec sa sauce maison et des croûtons croustillants.',
    servings: 4,
    time: '15min',
    tags: ['Entrée', 'Rapide'],
    difficulty: 'Facile',
    category: 'Entrée',
    isFavorite: false,
    sharedCount: 0,
    ingredients: [
      { id: 'cesar-laitue', name: 'Laitue romaine', quantity: 1, unit: 'unité' },
      { id: 'cesar-poulet', name: 'Blancs de poulet', quantity: 2, unit: 'unité(s)' },
      { id: 'cesar-parmesan', name: 'Parmesan', quantity: 60, unit: 'g' },
      { id: 'cesar-croutons', name: 'Croûtons', quantity: 80, unit: 'g' },
      { id: 'cesar-sauce', name: 'Sauce César', quantity: 120, unit: 'ml' }
    ],
    steps: [
      'Cuire les blancs de poulet dans une poêle puis les couper en lamelles.',
      'Préparer la sauce César en mélangeant mayonnaise, ail, parmesan et jus de citron.',
      'Mélanger la laitue, le poulet, les croûtons et napper de sauce.',
      'Servir avec des copeaux de parmesan.'
    ],
    createdAt: '2024-03-10T08:10:00.000Z',
    updatedAt: '2024-03-10T08:10:00.000Z'
  }
];

const app = express();
const PORT = Number(process.env.PORT ?? 4000);

app.use(cors());
app.use(express.json());

const planSchema = z.enum(['free', 'premium']);

const createUserSchema = z.object({
  email: z.string().email('Adresse e-mail invalide.'),
  fullName: z.string().min(2, 'Le nom complet doit contenir au moins 2 caractères.'),
  plan: planSchema.default('free')
});

const ingredientSchema = z.object({
  name: z.string().min(1, "Le nom de l'ingrédient est requis."),
  quantity: z.number().min(0, 'La quantité doit être positive.'),
  unit: z.string().min(1, "L'unité est requise.")
});

const createRecipeSchema = z.object({
  ownerId: z.string().min(1, "L'identifiant utilisateur est requis."),
  title: z.string().min(2, 'Le titre doit contenir au moins 2 caractères.'),
  description: z.string().optional(),
  servings: z.number().min(1, 'Le nombre de parts doit être supérieur à zéro.'),
  time: z.string().optional(),
  difficulty: z.string().optional(),
  tags: z.array(z.string()).optional(),
  steps: z.array(z.string().min(1, 'Chaque étape doit contenir du texte.')).min(1, 'Au moins une étape est requise.'),
  ingredients: z.array(ingredientSchema).min(1, 'Au moins un ingrédient est requis.')
});

const toggleFavoriteSchema = z.object({
  favorite: z.boolean()
});

type AsyncRouteHandler = (
  request: express.Request,
  response: express.Response,
  next: express.NextFunction
) => Promise<void>;

const asyncHandler = (handler: AsyncRouteHandler) =>
  (request: express.Request, response: express.Response, next: express.NextFunction) => {
    handler(request, response, next).catch(next);
  };

app.get('/api/health', (_request, response) => {
  response.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get(
  '/api/users',
  asyncHandler(async (_request, response) => {
    const users = await listUsers();
    response.json({ users });
  })
);

app.get(
  '/api/users/:id',
  asyncHandler(async (request, response) => {
    const user = await findUserById(request.params.id);

    if (!user) {
      response.status(404).json({ message: 'Utilisateur introuvable.' });
      return;
    }

    response.json(user);
  })
);

app.post(
  '/api/users',
  asyncHandler(async (request, response) => {
    const payload = createUserSchema.parse(request.body);
    const user = await createUser(payload);
    response.status(201).json(user);
  })
);

app.get(
  '/api/recipes',
  asyncHandler(async (_request, response) => {
    const recipes = await listRecipes();
    response.json({ recipes });
  })
);

app.get(
  '/api/recipes/:id',
  asyncHandler(async (request, response) => {
    const recipe = await findRecipeById(request.params.id);

    if (!recipe) {
      response.status(404).json({ message: 'Recette introuvable.' });
      return;
    }

    response.json(recipe);
  })
);

app.post(
  '/api/recipes',
  asyncHandler(async (request, response) => {
    const payload = createRecipeSchema.parse(request.body);
    const recipe = await createRecipe(payload);
    response.status(201).json(recipe);
  })
);

app.patch(
  '/api/recipes/:id/favorite',
  asyncHandler(async (request, response) => {
    const payload = toggleFavoriteSchema.parse(request.body);
    const recipe = await updateRecipeFavorite(request.params.id, payload.favorite);
    response.json(recipe);
  })
);

app.use((error: unknown, _request: express.Request, response: express.Response, _next: express.NextFunction) => {
  if (error instanceof ApiError) {
    response.status(error.status).json({ message: error.message });
    return;
  }

  if (error instanceof ZodError) {
    response.status(400).json({ message: 'Données invalides.', details: error.flatten() });
    return;
  }

  console.error('Erreur serveur inattendue :', error);
  response.status(500).json({ message: 'Erreur interne du serveur.' });
});

const startServer = async () => {
  await seedData([fallbackUser], fallbackRecipes);

  app.listen(PORT, () => {
    console.log(`EasyChef API disponible sur http://localhost:${PORT}`);
  });
};

startServer().catch((error) => {
  console.error("Impossible de démarrer le serveur EasyChef :", error);
  process.exit(1);
});
