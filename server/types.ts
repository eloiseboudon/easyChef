export type SubscriptionPlan = 'free' | 'premium';

export interface User {
  id: string;
  email: string;
  fullName: string;
  plan: SubscriptionPlan;
  createdAt: string;
}

export interface Ingredient {
  id: string;
  name: string;
  quantity: number;
  unit: string;
}

export interface Recipe {
  id: string;
  ownerId: string;
  title: string;
  description?: string;
  servings: number;
  time?: string;
  difficulty?: string;
  tags: string[];
  category?: string;
  isFavorite: boolean;
  sharedCount: number;
  ingredients: Ingredient[];
  steps: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserInput {
  email: string;
  fullName: string;
  plan: SubscriptionPlan;
}

export interface CreateRecipeIngredient {
  name: string;
  quantity: number;
  unit: string;
}

export interface CreateRecipeInput {
  ownerId: string;
  title: string;
  description?: string;
  servings: number;
  time?: string;
  difficulty?: string;
  tags?: string[];
  steps: string[];
  ingredients: CreateRecipeIngredient[];
}

export interface ToggleFavoriteInput {
  favorite: boolean;
}
