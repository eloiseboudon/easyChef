import { randomUUID } from 'node:crypto';
import { ApiError } from './errors.js';
import {
  SupabaseConfigError,
  SupabaseError,
  ensureSupabaseConfigured,
  supabaseRequest
} from './supabaseClient.js';
import {
  CreateRecipeInput,
  CreateUserInput,
  Recipe,
  SubscriptionPlan,
  User
} from './types.js';

interface UserRow {
  id: string;
  email: string;
  full_name: string;
  plan: SubscriptionPlan;
  created_at: string;
}

interface IngredientRow {
  id: string;
  name: string;
  quantity: number;
  unit: string;
}

interface RecipeRow {
  id: string;
  owner_id: string;
  title: string;
  description: string | null;
  servings: number;
  time: string | null;
  difficulty: string | null;
  tags: string[] | null;
  category: string | null;
  is_favorite: boolean;
  shared_count: number;
  ingredients: IngredientRow[] | null;
  steps: string[] | null;
  created_at: string;
  updated_at: string;
}

const toUser = (row: UserRow): User => ({
  id: row.id,
  email: row.email,
  fullName: row.full_name,
  plan: row.plan,
  createdAt: row.created_at
});

const toRecipe = (row: RecipeRow): Recipe => ({
  id: row.id,
  ownerId: row.owner_id,
  title: row.title,
  description: row.description ?? undefined,
  servings: row.servings,
  time: row.time ?? undefined,
  difficulty: row.difficulty ?? undefined,
  tags: Array.isArray(row.tags) ? [...row.tags] : [],
  category: row.category ?? undefined,
  isFavorite: row.is_favorite,
  sharedCount: row.shared_count,
  ingredients: Array.isArray(row.ingredients)
    ? row.ingredients.map((ingredient) => ({ ...ingredient }))
    : [],
  steps: Array.isArray(row.steps) ? [...row.steps] : [],
  createdAt: row.created_at,
  updatedAt: row.updated_at
});

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const isUuid = (value: string) => uuidPattern.test(value);

const sanitizeOptionalString = (value: string | undefined) => {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : undefined;
};

const handleSupabaseFailure = (error: unknown, fallbackMessage: string, fallbackStatus = 500): never => {
  if (error instanceof ApiError) {
    throw error;
  }

  if (error instanceof SupabaseError) {
    if (error.status >= 400 && error.status < 500) {
      throw new ApiError(error.message, error.status);
    }

    console.error('Erreur Supabase inattendue:', {
      message: error.message,
      status: error.status,
      code: error.code,
      details: error.details,
      hint: error.hint
    });
    throw new ApiError(fallbackMessage, fallbackStatus);
  }

  if (error instanceof SupabaseConfigError) {
    console.error('Configuration Supabase manquante ou invalide:', error.message);
    throw new ApiError('La configuration Supabase est invalide.', 500);
  }

  throw new ApiError(fallbackMessage, fallbackStatus);
};

ensureSupabaseConfigured();

export const seedData = async (initialUsers: User[], initialRecipes: Recipe[]) => {
  if (initialUsers.length === 0 && initialRecipes.length === 0) {
    return;
  }

  try {
    const shouldSeedUsers = initialUsers.length > 0;
    const shouldSeedRecipes = initialRecipes.length > 0;

    const existingUsers = shouldSeedUsers
      ? await supabaseRequest<Pick<UserRow, 'id'>[]>({
          method: 'GET',
          path: 'users',
          query: {
            select: 'id',
            limit: '1'
          }
        })
      : [];

    const existingRecipes = shouldSeedRecipes
      ? await supabaseRequest<Pick<RecipeRow, 'id'>[]>({
          method: 'GET',
          path: 'recipes',
          query: {
            select: 'id',
            limit: '1'
          }
        })
      : [];

    if (existingUsers.length > 0 || existingRecipes.length > 0) {
      return;
    }

    let insertedUsers: UserRow[] = [];

    if (shouldSeedUsers) {
      insertedUsers = await supabaseRequest<UserRow[]>({
        method: 'POST',
        path: 'users',
        prefer: ['return=representation'],
        body: initialUsers.map((user) => {
          const payload: Partial<UserRow> = {
            email: user.email,
            full_name: user.fullName,
            plan: user.plan
          };

          if (isUuid(user.id)) {
            payload.id = user.id;
          }

          return payload;
        })
      });
    }

    if (shouldSeedRecipes && initialRecipes.length > 0) {
      const emailByInitialId = new Map(initialUsers.map((user) => [user.id, user.email.toLowerCase()]));
      const idByEmail = new Map(insertedUsers.map((user) => [user.email.toLowerCase(), user.id]));

      const recipesPayload = initialRecipes
        .map((recipe) => {
          const ownerEmail = emailByInitialId.get(recipe.ownerId);
          const ownerId = ownerEmail ? idByEmail.get(ownerEmail) : recipe.ownerId;

          if (!ownerId) {
            return undefined;
          }

          const payload: Partial<RecipeRow> & {
            owner_id: string;
            title: string;
            servings: number;
            is_favorite: boolean;
            shared_count: number;
            ingredients: IngredientRow[];
            steps: string[];
          } = {
            owner_id: ownerId,
            title: recipe.title,
            description: recipe.description ?? null,
            servings: recipe.servings,
            time: recipe.time ?? null,
            difficulty: recipe.difficulty ?? null,
            tags: recipe.tags.length > 0 ? [...recipe.tags] : null,
            category: recipe.category ?? recipe.tags[0] ?? null,
            is_favorite: recipe.isFavorite,
            shared_count: recipe.sharedCount,
            ingredients: recipe.ingredients.map((ingredient) => ({ ...ingredient })),
            steps: [...recipe.steps]
          };

          if (isUuid(recipe.id)) {
            payload.id = recipe.id;
          }

          return payload;
        })
        .filter((payload): payload is NonNullable<typeof payload> => Boolean(payload));

      if (recipesPayload.length > 0) {
        await supabaseRequest<RecipeRow[]>({
          method: 'POST',
          path: 'recipes',
          prefer: ['return=representation'],
          body: recipesPayload
        });
      }
    }
  } catch (error) {
    handleSupabaseFailure(error, 'Impossible de préparer les données initiales.');
  }
};

export const listUsers = async (): Promise<User[]> => {
  try {
    const rows = await supabaseRequest<UserRow[]>({
      method: 'GET',
      path: 'users',
      query: {
        select: '*',
        order: 'created_at.desc'
      }
    });

    return rows.map((row) => toUser(row));
  } catch (error) {
    handleSupabaseFailure(error, 'Impossible de récupérer les utilisateurs.');
  }
};

export const findUserById = async (id: string): Promise<User | undefined> => {
  try {
    const rows = await supabaseRequest<UserRow[]>({
      method: 'GET',
      path: 'users',
      query: {
        select: '*',
        id: `eq.${id}`,
        limit: '1'
      }
    });

    const row = rows[0];
    return row ? toUser(row) : undefined;
  } catch (error) {
    handleSupabaseFailure(error, 'Impossible de récupérer cet utilisateur.');
  }
};

export const createUser = async (input: CreateUserInput): Promise<User> => {
  const normalizedEmail = input.email.trim().toLowerCase();

  try {
    const existing = await supabaseRequest<Pick<UserRow, 'id'>[]>({
      method: 'GET',
      path: 'users',
      query: {
        select: 'id',
        email: `eq.${normalizedEmail}`,
        limit: '1'
      }
    });

    if (existing.length > 0) {
      throw new ApiError('Un utilisateur existe déjà avec cet e-mail.', 409);
    }

    const rows = await supabaseRequest<UserRow[]>({
      method: 'POST',
      path: 'users',
      prefer: ['return=representation'],
      body: [
        {
          email: normalizedEmail,
          full_name: input.fullName.trim(),
          plan: input.plan
        }
      ]
    });

    const row = rows[0];

    if (!row) {
      throw new ApiError("Impossible de créer l'utilisateur.", 500);
    }

    return toUser(row);
  } catch (error) {
    handleSupabaseFailure(error, "Impossible de créer l'utilisateur.");
  }
};

export const listRecipes = async (): Promise<Recipe[]> => {
  try {
    const rows = await supabaseRequest<RecipeRow[]>({
      method: 'GET',
      path: 'recipes',
      query: {
        select: '*',
        order: 'updated_at.desc'
      }
    });

    return rows.map((row) => toRecipe(row));
  } catch (error) {
    handleSupabaseFailure(error, 'Impossible de récupérer les recettes.');
  }
};

export const findRecipeById = async (id: string): Promise<Recipe | undefined> => {
  try {
    const rows = await supabaseRequest<RecipeRow[]>({
      method: 'GET',
      path: 'recipes',
      query: {
        select: '*',
        id: `eq.${id}`,
        limit: '1'
      }
    });

    const row = rows[0];
    return row ? toRecipe(row) : undefined;
  } catch (error) {
    handleSupabaseFailure(error, 'Impossible de récupérer cette recette.');
  }
};

export const createRecipe = async (input: CreateRecipeInput): Promise<Recipe> => {
  try {
    const owner = await supabaseRequest<Pick<UserRow, 'id'>[]>({
      method: 'GET',
      path: 'users',
      query: {
        select: 'id',
        id: `eq.${input.ownerId}`,
        limit: '1'
      }
    });

    if (owner.length === 0) {
      throw new ApiError("L'utilisateur spécifié est introuvable.", 404);
    }

    const tags = (input.tags ?? []).map((tag) => tag.trim()).filter((tag) => tag.length > 0);
    const ingredients = input.ingredients.map((ingredient) => ({
      id: randomUUID(),
      name: ingredient.name.trim(),
      quantity: ingredient.quantity,
      unit: ingredient.unit.trim()
    }));

    const steps = input.steps.map((step) => step.trim()).filter((step) => step.length > 0);

    const rows = await supabaseRequest<RecipeRow[]>({
      method: 'POST',
      path: 'recipes',
      prefer: ['return=representation'],
      body: [
        {
          owner_id: input.ownerId,
          title: input.title.trim(),
          description: sanitizeOptionalString(input.description) ?? null,
          servings: input.servings,
          time: sanitizeOptionalString(input.time) ?? null,
          difficulty: sanitizeOptionalString(input.difficulty) ?? null,
          tags: tags.length > 0 ? tags : null,
          category: tags[0] ?? null,
          is_favorite: false,
          shared_count: 0,
          ingredients,
          steps
        }
      ]
    });

    const row = rows[0];

    if (!row) {
      throw new ApiError('Impossible de créer la recette.', 500);
    }

    return toRecipe(row);
  } catch (error) {
    handleSupabaseFailure(error, 'Impossible de créer la recette.');
  }
};

export const updateRecipeFavorite = async (id: string, favorite: boolean): Promise<Recipe> => {
  try {
    const rows = await supabaseRequest<RecipeRow[]>({
      method: 'PATCH',
      path: 'recipes',
      query: {
        id: `eq.${id}`,
        select: '*'
      },
      prefer: ['return=representation'],
      body: {
        is_favorite: favorite,
        updated_at: new Date().toISOString()
      }
    });

    const row = rows[0];

    if (!row) {
      throw new ApiError('Recette introuvable.', 404);
    }

    return toRecipe(row);
  } catch (error) {
    handleSupabaseFailure(error, 'Impossible de mettre à jour la recette.');
  }
};
