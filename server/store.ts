import { randomUUID } from 'node:crypto';
import { ApiError } from './errors.js';
import {
  CreateRecipeInput,
  CreateUserInput,
  Recipe,
  User
} from './types.js';

const users: User[] = [];
const recipes: Recipe[] = [];

const cloneUser = (user: User): User => ({ ...user });

const cloneRecipe = (recipe: Recipe): Recipe => ({
  ...recipe,
  tags: [...recipe.tags],
  ingredients: recipe.ingredients.map((ingredient) => ({ ...ingredient })),
  steps: [...recipe.steps]
});

const getUserRecord = (id: string) => users.find((user) => user.id === id);

export const seedData = (initialUsers: User[], initialRecipes: Recipe[]) => {
  users.length = 0;
  users.push(...initialUsers.map((user) => cloneUser(user)));

  recipes.length = 0;
  recipes.push(...initialRecipes.map((recipe) => cloneRecipe(recipe)));
};

export const listUsers = (): User[] => users.map((user) => cloneUser(user));

export const findUserById = (id: string): User | undefined => {
  const user = getUserRecord(id);
  return user ? cloneUser(user) : undefined;
};

export const createUser = (input: CreateUserInput): User => {
  const normalizedEmail = input.email.trim().toLowerCase();

  if (users.some((user) => user.email.toLowerCase() === normalizedEmail)) {
    throw new ApiError('Un utilisateur existe déjà avec cet e-mail.', 409);
  }

  const user: User = {
    id: randomUUID(),
    email: normalizedEmail,
    fullName: input.fullName.trim(),
    plan: input.plan,
    createdAt: new Date().toISOString()
  };

  users.push(user);
  return cloneUser(user);
};

export const listRecipes = (): Recipe[] =>
  recipes
    .slice()
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .map((recipe) => cloneRecipe(recipe));

const getRecipeRecord = (id: string) => recipes.find((recipe) => recipe.id === id);

export const findRecipeById = (id: string): Recipe | undefined => {
  const recipe = getRecipeRecord(id);
  return recipe ? cloneRecipe(recipe) : undefined;
};

export const createRecipe = (input: CreateRecipeInput): Recipe => {
  const ownerExists = Boolean(getUserRecord(input.ownerId));

  if (!ownerExists) {
    throw new ApiError("L'utilisateur spécifié est introuvable.", 404);
  }

  const now = new Date().toISOString();

  const recipe: Recipe = {
    id: randomUUID(),
    ownerId: input.ownerId,
    title: input.title.trim(),
    description: input.description?.trim() || undefined,
    servings: input.servings,
    time: input.time?.trim() || undefined,
    difficulty: input.difficulty?.trim() || undefined,
    tags: (input.tags ?? []).map((tag) => tag.trim()).filter(Boolean),
    category: input.tags && input.tags.length > 0 ? input.tags[0] : undefined,
    isFavorite: false,
    sharedCount: 0,
    ingredients: input.ingredients.map((ingredient) => ({
      id: randomUUID(),
      name: ingredient.name.trim(),
      quantity: ingredient.quantity,
      unit: ingredient.unit.trim()
    })),
    steps: input.steps.map((step) => step.trim()).filter(Boolean),
    createdAt: now,
    updatedAt: now
  };

  recipes.unshift(recipe);
  return cloneRecipe(recipe);
};

export const updateRecipeFavorite = (id: string, favorite: boolean): Recipe => {
  const recipe = getRecipeRecord(id);

  if (!recipe) {
    throw new ApiError('Recette introuvable.', 404);
  }

  recipe.isFavorite = favorite;
  recipe.updatedAt = new Date().toISOString();

  return cloneRecipe(recipe);
};
