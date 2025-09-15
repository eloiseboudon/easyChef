import { FormEvent, KeyboardEvent, useEffect, useMemo, useState } from 'react';

type View = 'home' | 'add' | 'recipe';
type SubscriptionPlan = 'free' | 'premium';

interface Ingredient {
  id: string;
  name: string;
  quantity: number;
  unit: string;
}

interface Recipe {
  id: string;
  ownerId: string;
  title: string;
  description?: string;
  servings: number;
  time?: string;
  tags: string[];
  difficulty?: string;
  category?: string;
  isFavorite: boolean;
  sharedCount: number;
  ingredients: Ingredient[];
  steps: string[];
  createdAt: string;
  updatedAt: string;
}

interface RecipeFormData {
  title: string;
  description?: string;
  servings: number;
  tags: string[];
  ingredients: Ingredient[];
  steps: string[];
  time?: string;
  difficulty?: string;
}

interface User {
  id: string;
  email: string;
  fullName: string;
  plan: SubscriptionPlan;
  createdAt: string;
}

const fallbackUser: User = {
  id: 'user-marie',
  email: 'marie@example.com',
  fullName: 'Marie Dupont',
  plan: 'premium',
  createdAt: '2024-01-15T10:00:00.000Z'
};

const initialRecipes: Recipe[] = [
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

const units = ['g', 'ml', 'c.à.s', 'c.à.c', 'unité(s)'];

const formatQuantity = (quantity: number) => {
  if (Number.isInteger(quantity)) {
    return quantity.toString();
  }
  return quantity.toFixed(1).replace('.', ',');
};

const getInitials = (fullName: string) => {
  return fullName
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase())
    .join('')
    .slice(0, 2);
};

const getFirstName = (fullName: string) => fullName.split(' ')[0] ?? fullName;

const formatDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
};

interface HomeScreenProps {
  recipes: Recipe[];
  onRecipeSelect: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  loading: boolean;
  isOffline: boolean;
  userName: string;
}

const HomeScreen = ({
  recipes,
  onRecipeSelect,
  onToggleFavorite,
  loading,
  isOffline,
  userName
}: HomeScreenProps) => {
  const [searchTerm, setSearchTerm] = useState('');

  const stats = useMemo(() => {
    const totalFavorites = recipes.filter((recipe) => recipe.isFavorite).length;
    const totalShared = recipes.reduce((acc, recipe) => acc + recipe.sharedCount, 0);
    return {
      totalRecipes: recipes.length,
      totalFavorites,
      totalShared
    };
  }, [recipes]);

  const filteredRecipes = useMemo(() => {
    const normalizedTerm = searchTerm.trim().toLowerCase();

    if (!normalizedTerm) {
      return recipes;
    }

    return recipes.filter((recipe) => {
      const matchesTitle = recipe.title.toLowerCase().includes(normalizedTerm);
      const matchesTag = recipe.tags.some((tag) => tag.toLowerCase().includes(normalizedTerm));
      const matchesIngredient = recipe.ingredients.some((ingredient) =>
        ingredient.name.toLowerCase().includes(normalizedTerm)
      );
      return matchesTitle || matchesTag || matchesIngredient;
    });
  }, [recipes, searchTerm]);

  const hasNoResults = !loading && filteredRecipes.length === 0;

  return (
    <div className="view">
      <div className="home-header">
        <div className="greeting">Bonjour {userName} ! 👋</div>
        <div className="subtitle">Que cuisinez-vous aujourd'hui ?</div>
      </div>

      <div className="search-bar">
        <input
          type="text"
          className="search-input"
          placeholder="Rechercher une recette..."
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
        />
        <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <circle cx="11" cy="11" r="8"></circle>
          <path d="m21 21-4.35-4.35"></path>
        </svg>
      </div>

      <div className="quick-stats">
        <div className="stat-card">
          <div className="stat-number">{stats.totalRecipes}</div>
          <div className="stat-label">Recettes</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{stats.totalFavorites}</div>
          <div className="stat-label">Favoris</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{stats.totalShared}</div>
          <div className="stat-label">Partagées</div>
        </div>
      </div>

      {isOffline && (
        <div className="inline-alert">
          Mode hors ligne : les nouvelles recettes seront enregistrées localement.
        </div>
      )}

      <div className="section-header">
        <div className="section-title">Mes recettes récentes</div>
        <button type="button" className="see-all" onClick={() => setSearchTerm('')}>
          Voir tout
        </button>
      </div>

      {loading ? (
        <div className="loading-state">
          <div className="loading-card" />
          <div className="loading-card" />
          <div className="loading-card" />
        </div>
      ) : hasNoResults ? (
        <div className="empty-state">Aucune recette ne correspond à votre recherche.</div>
      ) : (
        <div className="recipe-grid">
          {filteredRecipes.map((recipe) => (
            <article
              className="recipe-card"
              key={recipe.id}
              onClick={() => onRecipeSelect(recipe.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(event: KeyboardEvent<HTMLElement>) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  onRecipeSelect(recipe.id);
                }
              }}
            >
              <button
                className="favorite-btn"
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onToggleFavorite(recipe.id);
                }}
              >
                {recipe.isFavorite ? '❤️' : '🤍'}
              </button>
              <div className="recipe-title">{recipe.title}</div>
              <div className="recipe-meta">
                <div className="meta-item">
                  <svg className="meta-icon" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                  <span>
                    {recipe.servings} {recipe.servings > 1 ? 'personnes' : 'personne'}
                  </span>
                </div>
                <div className="meta-item">
                  <svg className="meta-icon" viewBox="0 0 24 24" fill="currentColor">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12,6 12,12 16,14" />
                  </svg>
                  <span>{recipe.time ?? '--'}</span>
                </div>
              </div>
              <div className="recipe-tags">
                {recipe.tags.map((tag) => (
                  <span key={`${recipe.id}-${tag}`} className="tag">
                    {tag}
                  </span>
                ))}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};

interface AddRecipeScreenProps {
  onSave: (recipe: RecipeFormData) => Promise<void> | void;
  onCancel: () => void;
  isOffline: boolean;
}

interface IngredientDraft {
  id: string;
  quantity: string;
  unit: string;
  name: string;
}

const AddRecipeScreen = ({ onSave, onCancel, isOffline }: AddRecipeScreenProps) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [servings, setServings] = useState(6);
  const [tagsInput, setTagsInput] = useState('');
  const [time, setTime] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [stepsText, setStepsText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ingredients, setIngredients] = useState<IngredientDraft[]>([
    { id: 'ingredient-0', quantity: '250', unit: 'g', name: 'Farine' },
    { id: 'ingredient-1', quantity: '3', unit: 'unité(s)', name: 'Œufs' }
  ]);

  const handleAddIngredient = () => {
    setIngredients((previous) => [
      ...previous,
      {
        id: `ingredient-${previous.length + 1}`,
        quantity: '',
        unit: 'g',
        name: ''
      }
    ]);
  };

  const handleIngredientChange = (
    id: string,
    field: keyof Omit<IngredientDraft, 'id'>,
    value: string
  ) => {
    setIngredients((previous) =>
      previous.map((ingredient) =>
        ingredient.id === id
          ? {
              ...ingredient,
              [field]: value
            }
          : ingredient
      )
    );
  };

  const handleRemoveIngredient = (id: string) => {
    setIngredients((previous) => previous.filter((ingredient) => ingredient.id !== id));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedTitle = title.trim();
    const parsedServings = Number(servings);

    const parsedIngredients = ingredients
      .filter((ingredient) => ingredient.name.trim())
      .map((ingredient, index) => ({
        id: `${ingredient.id}-${index}`,
        name: ingredient.name.trim(),
        unit: ingredient.unit,
        quantity: Number(ingredient.quantity) || 0
      }));

    const parsedSteps = stepsText
      .split(/\n+/)
      .map((step) => step.trim())
      .filter(Boolean);

    if (!trimmedTitle || !parsedServings || parsedIngredients.length === 0 || parsedSteps.length === 0) {
      window.alert(
        'Merci de renseigner au minimum un titre, le nombre de parts, des ingrédients et des étapes.'
      );
      return;
    }

    const parsedTags = tagsInput
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean);

    setIsSubmitting(true);
    try {
      await Promise.resolve(
        onSave({
          title: trimmedTitle,
          description: description.trim() || undefined,
          servings: parsedServings,
          tags: parsedTags,
          ingredients: parsedIngredients,
          steps: parsedSteps,
          time: time.trim() || undefined,
          difficulty: difficulty.trim() || undefined
        })
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="view form-content" onSubmit={handleSubmit}>
      <div className="form-header">
        <button type="button" className="cancel-btn" onClick={onCancel}>
          Annuler
        </button>
        <div className="form-title">Nouvelle recette</div>
        <button type="submit" className="save-btn" disabled={isSubmitting}>
          {isSubmitting ? 'Sauvegarde...' : 'Sauvegarder'}
        </button>
      </div>

      {isOffline && (
        <div className="inline-alert info">
          Vous êtes hors ligne : la recette sera enregistrée sur cet appareil.
        </div>
      )}

      <div className="form-section">
        <div className="form-group">
          <label className="form-label" htmlFor="recipe-title">
            Nom de la recette *
          </label>
          <input
            id="recipe-title"
            type="text"
            className="form-input"
            placeholder="Ex: Tarte aux fraises"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="recipe-description">
            Description (optionnel)
          </label>
          <textarea
            id="recipe-description"
            className="form-input form-textarea"
            placeholder="Une délicieuse tarte parfaite pour l'été..."
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          ></textarea>
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="recipe-servings">
            Nombre de parts *
          </label>
          <input
            id="recipe-servings"
            type="number"
            min={1}
            className="form-input"
            placeholder="6"
            value={servings}
            onChange={(event) => setServings(Number(event.target.value))}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="recipe-time">
            Temps de préparation (optionnel)
          </label>
          <input
            id="recipe-time"
            type="text"
            className="form-input"
            placeholder="45min"
            value={time}
            onChange={(event) => setTime(event.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="recipe-difficulty">
            Difficulté (optionnel)
          </label>
          <input
            id="recipe-difficulty"
            type="text"
            className="form-input"
            placeholder="Facile, Moyen, Avancé..."
            value={difficulty}
            onChange={(event) => setDifficulty(event.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="recipe-tags">
            Tags
          </label>
          <input
            id="recipe-tags"
            type="text"
            className="form-input"
            placeholder="dessert, facile, été (séparés par des virgules)"
            value={tagsInput}
            onChange={(event) => setTagsInput(event.target.value)}
          />
        </div>

        <div className="ingredients-section">
          <div className="form-label">Ingrédients *</div>
          {ingredients.map((ingredient) => (
            <div className="ingredient-item" key={ingredient.id}>
              <input
                type="number"
                className="form-input ingredient-qty"
                placeholder="250"
                value={ingredient.quantity}
                onChange={(event) => handleIngredientChange(ingredient.id, 'quantity', event.target.value)}
                min={0}
              />
              <select
                className="form-input ingredient-unit"
                value={ingredient.unit}
                onChange={(event) => handleIngredientChange(ingredient.id, 'unit', event.target.value)}
              >
                {units.map((unit) => (
                  <option key={`${ingredient.id}-${unit}`} value={unit}>
                    {unit}
                  </option>
                ))}
              </select>
              <input
                type="text"
                className="form-input ingredient-name"
                placeholder="Nom de l'ingrédient"
                value={ingredient.name}
                onChange={(event) => handleIngredientChange(ingredient.id, 'name', event.target.value)}
              />
              <button
                type="button"
                className="remove-ingredient"
                aria-label="Supprimer l'ingrédient"
                onClick={() => handleRemoveIngredient(ingredient.id)}
              >
                ✕
              </button>
            </div>
          ))}
          <button type="button" className="add-btn" onClick={handleAddIngredient}>
            <span>➕</span>
            <span>Ajouter un ingrédient</span>
          </button>
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="recipe-steps">
            Étapes de préparation *
          </label>
          <textarea
            id="recipe-steps"
            className="form-input form-textarea"
            placeholder={'1. Préchauffer le four à 180°C\n2. Mélanger la farine et les œufs\n3. ...'}
            value={stepsText}
            onChange={(event) => setStepsText(event.target.value)}
            style={{ height: 150 }}
            required
          ></textarea>
        </div>
      </div>
    </form>
  );
};

interface RecipeScreenProps {
  recipe: Recipe;
  servings: number;
  onDecreaseServings: () => void;
  onIncreaseServings: () => void;
  onToggleFavorite: (id: string) => void;
  author?: User;
  isOffline: boolean;
}

const RecipeScreen = ({
  recipe,
  servings,
  onDecreaseServings,
  onIncreaseServings,
  onToggleFavorite,
  author,
  isOffline
}: RecipeScreenProps) => {
  const ratio = servings / (recipe.servings || 1);

  const adjustedIngredients = recipe.ingredients.map((ingredient) => ({
    ...ingredient,
    quantity: Math.max(Math.round(ingredient.quantity * ratio * 10) / 10, 0)
  }));

  const lastUpdatedLabel = formatDate(recipe.updatedAt);

  return (
    <div className="view recipe-view">
      <div className="recipe-header">
        <div className="recipe-actions">
          <button
            className="action-btn"
            type="button"
            onClick={() => onToggleFavorite(recipe.id)}
            aria-label="Ajouter aux favoris"
          >
            {recipe.isFavorite ? '❤️' : '🤍'}
          </button>
          <button className="action-btn" type="button" aria-label="Partager la recette">
            📤
          </button>
          <button className="action-btn" type="button" aria-label="Plus d'options">
            ⋯
          </button>
        </div>
        <div className="recipe-title-view">{recipe.title}</div>
        <div className="recipe-info">
          {recipe.time && (
            <div className="info-item">
              <svg className="info-icon" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12,6 12,12 16,14" />
              </svg>
              <span>{recipe.time}</span>
            </div>
          )}
          {recipe.difficulty && (
            <div className="info-item">
              <svg className="info-icon" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
              <span>{recipe.difficulty}</span>
            </div>
          )}
          <div className="info-item">
            <svg className="info-icon" viewBox="0 0 24 24" fill="currentColor">
              <path d="M7 2h10a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zm0 4h10" />
              <path d="M9 10h6M9 14h4" />
            </svg>
            <span>Mis à jour le {lastUpdatedLabel}</span>
          </div>
          {author && (
            <div className="info-item author">
              <div className="author-avatar">{getInitials(author.fullName)}</div>
              <div>
                <div className="info-label">Proposée par</div>
                <div className="info-value">{author.fullName}</div>
              </div>
            </div>
          )}
        </div>
        {recipe.tags.length > 0 && (
          <div className="recipe-tags recipe-tags-inline">
            {recipe.tags.map((tag) => (
              <span key={`${recipe.id}-view-${tag}`} className="tag">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {isOffline && (
        <div className="inline-alert info recipe-inline-alert">
          Mode hors ligne : les favoris sont synchronisés localement.
        </div>
      )}

      <div className="serving-adjuster">
        <div className="adjuster-title">Ajuster les portions</div>
        <div className="adjuster-controls">
          <button className="adjuster-btn" type="button" onClick={onDecreaseServings}>
            −
          </button>
          <div className="serving-count">
            {servings} {servings > 1 ? 'personnes' : 'personne'}
          </div>
          <button className="adjuster-btn" type="button" onClick={onIncreaseServings}>
            +
          </button>
        </div>
      </div>

      <div className="recipe-sections">
        <div className="ingredients-list">
          <div className="list-title">Ingrédients</div>
          {adjustedIngredients.map((ingredient) => (
            <div key={ingredient.id} className="ingredient-line">
              <span>{ingredient.name}</span>
              <strong>
                {formatQuantity(ingredient.quantity)} {ingredient.unit}
              </strong>
            </div>
          ))}
        </div>

        <div className="steps-list">
          <div className="list-title">Préparation</div>
          {recipe.steps.map((step, index) => (
            <div key={`${recipe.id}-step-${index}`} className="step-item">
              <div className="step-number">{index + 1}</div>
              <div className="step-text">{step}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const App = () => {
  const [view, setView] = useState<View>('home');
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [activeUserId, setActiveUserId] = useState<string>(fallbackUser.id);
  const [selectedRecipeId, setSelectedRecipeId] = useState<string>('');
  const [servings, setServings] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isBackendAvailable, setIsBackendAvailable] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [addFormKey, setAddFormKey] = useState<number>(0);

  const applyFallbackData = () => {
    setUsers([fallbackUser]);
    setActiveUserId(fallbackUser.id);
    setRecipes(initialRecipes);
    const fallbackRecipe = initialRecipes[0];
    setSelectedRecipeId(fallbackRecipe?.id ?? '');
    setServings(fallbackRecipe?.servings ?? 1);
  };

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        const [usersResponse, recipesResponse] = await Promise.all([
          fetch('/api/users'),
          fetch('/api/recipes')
        ]);

        if (!usersResponse.ok || !recipesResponse.ok) {
          throw new Error('Réponse inattendue du serveur.');
        }

        const usersPayload = await usersResponse.json();
        const recipesPayload = await recipesResponse.json();

        if (!isMounted) {
          return;
        }

        const fetchedUsers: User[] = Array.isArray(usersPayload.users) ? usersPayload.users : [];
        const fetchedRecipes: Recipe[] = Array.isArray(recipesPayload.recipes)
          ? recipesPayload.recipes
          : [];

        setUsers(fetchedUsers.length > 0 ? fetchedUsers : [fallbackUser]);
        setActiveUserId(fetchedUsers[0]?.id ?? fallbackUser.id);
        setRecipes(fetchedRecipes);
        setSelectedRecipeId(fetchedRecipes[0]?.id ?? '');
        setServings(fetchedRecipes[0]?.servings ?? 1);
        setIsBackendAvailable(true);
        setStatusMessage(null);
      } catch (error) {
        console.error('Impossible de charger les données depuis le serveur', error);
        setIsBackendAvailable(false);
        setStatusMessage("Mode hors ligne : les données sont chargées depuis un jeu d'essai local.");
        applyFallbackData();
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  const selectedRecipe = useMemo(
    () => recipes.find((recipe) => recipe.id === selectedRecipeId) ?? recipes[0],
    [recipes, selectedRecipeId]
  );

  useEffect(() => {
    if (selectedRecipe) {
      setServings(selectedRecipe.servings);
    }
  }, [selectedRecipe?.id, selectedRecipe?.servings]);

  const activeUser = useMemo(
    () => users.find((user) => user.id === activeUserId) ?? users[0] ?? fallbackUser,
    [users, activeUserId]
  );

  const recipeAuthor = useMemo(
    () => (selectedRecipe ? users.find((user) => user.id === selectedRecipe.ownerId) : undefined),
    [selectedRecipe, users]
  );

  const userFirstName = getFirstName(activeUser.fullName);

  const handleSelectRecipe = (id: string) => {
    setSelectedRecipeId(id);
    setView('recipe');
  };

  const handleToggleFavorite = async (id: string) => {
    const existingRecipe = recipes.find((recipe) => recipe.id === id);

    if (!existingRecipe) {
      return;
    }

    setRecipes((previous) =>
      previous.map((recipe) =>
        recipe.id === id
          ? {
              ...recipe,
              isFavorite: !recipe.isFavorite
            }
          : recipe
      )
    );

    if (!isBackendAvailable) {
      return;
    }

    try {
      const response = await fetch(`/api/recipes/${id}/favorite`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ favorite: !existingRecipe.isFavorite })
      });

      if (!response.ok) {
        throw new Error(`Erreur API ${response.status}`);
      }
    } catch (error) {
      console.error('Impossible de mettre à jour le statut favori sur le serveur', error);
      setRecipes((previous) =>
        previous.map((recipe) =>
          recipe.id === id
            ? {
                ...recipe,
                isFavorite: existingRecipe.isFavorite
              }
            : recipe
        )
      );
      setStatusMessage('La connexion au serveur a été perdue : les favoris sont enregistrés localement.');
      setIsBackendAvailable(false);
    }
  };

  const handleCreateRecipe = async (data: RecipeFormData) => {
    const ownerId = activeUser?.id ?? fallbackUser.id;

    if (isBackendAvailable) {
      try {
        const response = await fetch('/api/recipes', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            ownerId,
            title: data.title,
            description: data.description,
            servings: data.servings,
            time: data.time,
            difficulty: data.difficulty,
            tags: data.tags,
            steps: data.steps,
            ingredients: data.ingredients.map((ingredient) => ({
              name: ingredient.name,
              quantity: ingredient.quantity,
              unit: ingredient.unit
            }))
          })
        });

        if (!response.ok) {
          throw new Error(`Erreur API ${response.status}`);
        }

        const createdRecipe: Recipe = await response.json();

        setRecipes((previous) => [createdRecipe, ...previous]);
        setSelectedRecipeId(createdRecipe.id);
        setView('recipe');
        setAddFormKey((value) => value + 1);
        setServings(createdRecipe.servings);
        setStatusMessage(null);
        return;
      } catch (error) {
        console.error('Impossible de sauvegarder la recette côté serveur', error);
        setStatusMessage("Impossible de contacter le serveur : la recette est enregistrée localement.");
        setIsBackendAvailable(false);
      }
    }

    const now = new Date().toISOString();
    const newRecipe: Recipe = {
      id: `local-${Date.now()}`,
      ownerId,
      title: data.title,
      description: data.description,
      servings: data.servings,
      time: data.time,
      difficulty: data.difficulty,
      tags: data.tags,
      category: data.tags[0],
      isFavorite: false,
      sharedCount: 0,
      ingredients: data.ingredients,
      steps: data.steps,
      createdAt: now,
      updatedAt: now
    };

    setRecipes((previous) => [newRecipe, ...previous]);
    if (!users.some((user) => user.id === ownerId)) {
      setUsers((previous) => [{ ...fallbackUser, id: ownerId }, ...previous]);
    }
    setSelectedRecipeId(newRecipe.id);
    setView('recipe');
    setAddFormKey((value) => value + 1);
    setServings(newRecipe.servings);
  };

  const handleCancelForm = () => {
    setView('home');
    setAddFormKey((value) => value + 1);
  };

  const decreaseServings = () => {
    setServings((current) => (current > 1 ? current - 1 : current));
  };

  const increaseServings = () => {
    setServings((current) => (current < 20 ? current + 1 : current));
  };

  const headerTitle =
    view === 'home'
      ? 'Tableau de bord recettes'
      : view === 'add'
        ? 'Nouvelle recette'
        : selectedRecipe
          ? selectedRecipe.title
          : 'Recette';

  const headerSubtitle =
    view === 'home'
      ? 'Retrouvez vos dernières créations et vos favoris.'
      : view === 'add'
        ? 'Ajoutez vos ingrédients, étapes et tags en un clin d’œil.'
        : 'Ajustez les portions et partagez la recette avec vos proches.';

  const isOffline = !isBackendAvailable;

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">🍳 EasyChef</div>
        <nav className="nav-list">
          <button
            type="button"
            className={`nav-link ${view === 'home' ? 'active' : ''}`}
            onClick={() => setView('home')}
          >
            <svg className="nav-icon" viewBox="0 0 24 24" fill="currentColor">
              <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9,22 9,12 15,12 15,22" />
            </svg>
            <span>Accueil</span>
          </button>
          <button
            type="button"
            className={`nav-link ${view === 'add' ? 'active' : ''}`}
            onClick={() => {
              setAddFormKey((value) => value + 1);
              setView('add');
            }}
          >
            <svg className="nav-icon" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="16" />
              <line x1="8" y1="12" x2="16" y2="12" />
            </svg>
            <span>Ajouter</span>
          </button>
          <button
            type="button"
            className={`nav-link ${view === 'recipe' ? 'active' : ''}`}
            onClick={() => selectedRecipe && setView('recipe')}
            disabled={!selectedRecipe}
          >
            <svg className="nav-icon" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.51 4.04 3 5.5l7 7z" />
            </svg>
            <span>Favoris</span>
          </button>
        </nav>
        <div className="profile-card">
          <div className="profile-avatar">{getInitials(activeUser.fullName)}</div>
          <div>
            <div className="profile-name">{activeUser.fullName}</div>
            <div className="profile-email">{activeUser.email}</div>
            <div className="badge">{activeUser.plan === 'premium' ? 'Premium' : 'Gratuit'}</div>
          </div>
        </div>
      </aside>
      <div className="main-panel">
        <header className="main-header">
          <div>
            <h1 className="main-title">{headerTitle}</h1>
            <p className="main-subtitle">{headerSubtitle}</p>
          </div>
          <div className="header-actions">
            {view !== 'add' && (
              <button
                type="button"
                className="primary-button"
                onClick={() => {
                  setAddFormKey((value) => value + 1);
                  setView('add');
                }}
              >
                + Nouvelle recette
              </button>
            )}
          </div>
        </header>
        {statusMessage && (
          <div className="alert-banner">
            <span>ℹ️</span>
            <span>{statusMessage}</span>
          </div>
        )}
        <main className="view-container">
          {view === 'home' && (
            <HomeScreen
              recipes={recipes}
              onRecipeSelect={handleSelectRecipe}
              onToggleFavorite={handleToggleFavorite}
              loading={isLoading}
              isOffline={isOffline}
              userName={userFirstName}
            />
          )}
          {view === 'add' && (
            <AddRecipeScreen
              key={addFormKey}
              onSave={handleCreateRecipe}
              onCancel={handleCancelForm}
              isOffline={isOffline}
            />
          )}
          {view === 'recipe' && selectedRecipe ? (
            <RecipeScreen
              recipe={selectedRecipe}
              servings={servings}
              onDecreaseServings={decreaseServings}
              onIncreaseServings={increaseServings}
              onToggleFavorite={handleToggleFavorite}
              author={recipeAuthor}
              isOffline={isOffline}
            />
          ) : view === 'recipe' && !isLoading ? (
            <div className="view">
              <div className="empty-state">Sélectionnez une recette pour afficher ses détails.</div>
            </div>
          ) : null}
        </main>
      </div>
    </div>
  );
};

export default App;
