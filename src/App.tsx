import { FormEvent, KeyboardEvent, useEffect, useMemo, useState } from 'react';

type Screen = 'home' | 'add' | 'recipe';

interface Ingredient {
  id: string;
  name: string;
  quantity: number;
  unit: string;
}

interface Recipe {
  id: string;
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

const initialRecipes: Recipe[] = [
  {
    id: 'lasagnes',
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
    ]
  },
  {
    id: 'tarte-pommes',
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
    ]
  },
  {
    id: 'salade-cesar',
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
      { id: 'cesar-croûtons', name: 'Croûtons', quantity: 80, unit: 'g' },
      { id: 'cesar-sauce', name: 'Sauce César', quantity: 120, unit: 'ml' }
    ],
    steps: [
      'Cuire les blancs de poulet dans une poêle puis les couper en lamelles.',
      'Préparer la sauce César en mélangeant mayonnaise, ail, parmesan et jus de citron.',
      'Mélanger la laitue, le poulet, les croûtons et napper de sauce.',
      'Servir avec des copeaux de parmesan.'
    ]
  }
];

interface HomeScreenProps {
  recipes: Recipe[];
  onRecipeSelect: (id: string) => void;
  onToggleFavorite: (id: string) => void;
}

const HomeScreen = ({ recipes, onRecipeSelect, onToggleFavorite }: HomeScreenProps) => {
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

  return (
    <div className="content-body">
      <div className="home-header">
        <div className="greeting">Bonjour Marie ! 👋</div>
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

      <div className="section-header">
        <div className="section-title">Mes recettes récentes</div>
        <button
          type="button"
          className="see-all"
          onClick={() => setSearchTerm('')}
        >
          Voir tout
        </button>
      </div>

      <div className="recipe-list">
        {filteredRecipes.map((recipe) => (
          <div
            className="recipe-card"
            key={recipe.id}
            onClick={() => onRecipeSelect(recipe.id)}
            role="button"
            tabIndex={0}
            onKeyDown={(event: KeyboardEvent<HTMLDivElement>) => {
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
          </div>
        ))}

        {filteredRecipes.length === 0 && (
          <div className="empty-state">
            Aucune recette ne correspond à votre recherche.
          </div>
        )}
      </div>
    </div>
  );
};

interface AddRecipeScreenProps {
  onSave: (recipe: RecipeFormData) => void;
  onCancel: () => void;
}

interface IngredientDraft {
  id: string;
  quantity: string;
  unit: string;
  name: string;
}

const units = ['g', 'ml', 'c.à.s', 'c.à.c', 'unité(s)'];

const AddRecipeScreen = ({ onSave, onCancel }: AddRecipeScreenProps) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [servings, setServings] = useState(6);
  const [tagsInput, setTagsInput] = useState('');
  const [time, setTime] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [stepsText, setStepsText] = useState('');
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

  const handleIngredientChange = (id: string, field: keyof Omit<IngredientDraft, 'id'>, value: string) => {
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

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
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
      window.alert('Merci de renseigner au minimum un titre, le nombre de parts, des ingrédients et des étapes.');
      return;
    }

    const parsedTags = tagsInput
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean);

    onSave({
      title: trimmedTitle,
      description: description.trim() || undefined,
      servings: parsedServings,
      tags: parsedTags,
      ingredients: parsedIngredients,
      steps: parsedSteps,
      time: time.trim() || undefined,
      difficulty: difficulty.trim() || undefined
    });
  };

  return (
    <form className="form-content" onSubmit={handleSubmit}>
      <div className="form-header">
        <button type="button" className="cancel-btn" onClick={onCancel}>
          Annuler
        </button>
        <div className="form-title">Nouvelle recette</div>
        <button type="submit" className="save-btn">
          Sauvegarder
        </button>
      </div>

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
            <div key={ingredient.id} className="ingredient-item">
              <input
                type="number"
                min="0"
                className="form-input ingredient-qty"
                placeholder="100"
                value={ingredient.quantity}
                onChange={(event) =>
                  handleIngredientChange(ingredient.id, 'quantity', event.target.value)
                }
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
                onClick={() => handleRemoveIngredient(ingredient.id)}
                aria-label="Supprimer l'ingrédient"
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
}

const formatQuantity = (quantity: number) => {
  if (Number.isInteger(quantity)) {
    return quantity.toString();
  }
  return quantity.toFixed(1).replace('.', ',');
};

const RecipeScreen = ({
  recipe,
  servings,
  onDecreaseServings,
  onIncreaseServings,
  onToggleFavorite
}: RecipeScreenProps) => {
  const ratio = servings / (recipe.servings || 1);

  const adjustedIngredients = recipe.ingredients.map((ingredient) => ({
    ...ingredient,
    quantity: Math.max(Math.round(ingredient.quantity * ratio * 10) / 10, 0)
  }));

  return (
    <div className="content-body">
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
        </div>
      </div>

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
  );
};

const App = () => {
  const [recipes, setRecipes] = useState<Recipe[]>(initialRecipes);
  const [activeScreen, setActiveScreen] = useState<Screen>('home');
  const [selectedRecipeId, setSelectedRecipeId] = useState<string>(initialRecipes[0]?.id ?? '');
  const [servings, setServings] = useState(initialRecipes[0]?.servings ?? 1);
  const [addFormKey, setAddFormKey] = useState(0);

  const selectedRecipe = useMemo(
    () => recipes.find((recipe) => recipe.id === selectedRecipeId) ?? recipes[0],
    [recipes, selectedRecipeId]
  );

  useEffect(() => {
    if (selectedRecipe) {
      setServings(selectedRecipe.servings);
    }
  }, [selectedRecipe?.id, selectedRecipe?.servings]);

  const handleSelectRecipe = (id: string) => {
    setSelectedRecipeId(id);
    setActiveScreen('recipe');
  };

  const handleToggleFavorite = (id: string) => {
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
  };

  const handleCreateRecipe = (data: RecipeFormData) => {
    const newRecipe: Recipe = {
      id: `recipe-${Date.now()}`,
      title: data.title,
      description: data.description,
      servings: data.servings,
      time: data.time,
      difficulty: data.difficulty,
      tags: data.tags,
      category: data.tags[0],
      isFavorite: false,
      sharedCount: 0,
      ingredients: data.ingredients.map((ingredient, index) => ({
        ...ingredient,
        id: `${ingredient.id}-${index}`
      })),
      steps: data.steps
    };

    setRecipes((previous) => [newRecipe, ...previous]);
    setSelectedRecipeId(newRecipe.id);
    setActiveScreen('recipe');
    setAddFormKey((value) => value + 1);
  };

  const handleCancelForm = () => {
    setActiveScreen('home');
    setAddFormKey((value) => value + 1);
  };

  const decreaseServings = () => {
    setServings((current) => (current > 1 ? current - 1 : current));
  };

  const increaseServings = () => {
    setServings((current) => (current < 20 ? current + 1 : current));
  };

  const navigate = (screen: Screen) => {
    setActiveScreen(screen);
    if (screen === 'home' && selectedRecipe) {
      setServings(selectedRecipe.servings);
    }
  };

  return (
    <div className="app-container">
      <div className="device">
        <div className="screen">
          <div className="notch"></div>

          <div className="status-bar">
            <span>9:41</span>
            <span>📶 📶 📶 100% 🔋</span>
          </div>

          <div className={`content ${activeScreen === 'home' ? 'active' : ''}`} id="home">
            {activeScreen === 'home' && (
              <HomeScreen
                recipes={recipes}
                onRecipeSelect={handleSelectRecipe}
                onToggleFavorite={handleToggleFavorite}
              />
            )}
          </div>

          <div className={`content ${activeScreen === 'add' ? 'active' : ''}`} id="add">
            {activeScreen === 'add' && (
              <AddRecipeScreen key={addFormKey} onSave={handleCreateRecipe} onCancel={handleCancelForm} />
            )}
          </div>

          <div className={`content ${activeScreen === 'recipe' ? 'active' : ''}`} id="recipe">
            {activeScreen === 'recipe' && selectedRecipe && (
              <RecipeScreen
                recipe={selectedRecipe}
                servings={servings}
                onDecreaseServings={decreaseServings}
                onIncreaseServings={increaseServings}
                onToggleFavorite={handleToggleFavorite}
              />
            )}
          </div>

          <div className="bottom-nav">
            <button
              type="button"
              className={`nav-item ${activeScreen === 'home' ? 'active' : ''}`}
              onClick={() => navigate('home')}
            >
              <svg className="nav-icon" viewBox="0 0 24 24" fill="currentColor">
                <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9,22 9,12 15,12 15,22" />
              </svg>
              <span className="nav-text">Accueil</span>
            </button>
            <button
              type="button"
              className={`nav-item ${activeScreen === 'add' ? 'active' : ''}`}
              onClick={() => navigate('add')}
            >
              <svg className="nav-icon" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="16" />
                <line x1="8" y1="12" x2="16" y2="12" />
              </svg>
              <span className="nav-text">Ajouter</span>
            </button>
            <button type="button" className="nav-item" disabled>
              <svg className="nav-icon" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.51 4.04 3 5.5l7 7z" />
              </svg>
              <span className="nav-text">Favoris</span>
            </button>
            <button type="button" className="nav-item" disabled>
              <svg className="nav-icon" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              <span className="nav-text">Profil</span>
            </button>
          </div>
        </div>

        <div className="screen-controls">
          <button
            type="button"
            className={`control-btn ${activeScreen === 'home' ? 'active' : ''}`}
            onClick={() => navigate('home')}
          >
            Accueil
          </button>
          <button
            type="button"
            className={`control-btn ${activeScreen === 'add' ? 'active' : ''}`}
            onClick={() => navigate('add')}
          >
            Ajouter
          </button>
          <button
            type="button"
            className={`control-btn ${activeScreen === 'recipe' ? 'active' : ''}`}
            onClick={() => navigate('recipe')}
          >
            Recette
          </button>
        </div>
      </div>
    </div>
  );
};

export default App;
