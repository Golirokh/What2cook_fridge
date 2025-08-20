import React, { useState } from 'react';
import HeaderHero from "./HeaderHero";
import VegIcon from "./Images/vegetables.png";
import MeatsIcon from "./Images/Meats.png";
import GrainsIcon from "./Images/grains.png"
import DairyIcon from "./Images/Dairy.png"
import HerbsIcon from "./Images/herbs.png"
import PantryIcon from "./Images/Pantry.png"
import { useRecipeJob } from './hooks/useRecipeJob';
import ResultCard from './components/ResultCard';


const What2Cook = () => {
  const [selectedCuisines, setSelectedCuisines] = useState(['International']);
  const [selectedIngredients, setSelectedIngredients] = useState([]);
  const [expandedCategories, setExpandedCategories] = useState({});
  const [message, setMessage] = useState({ text: '', type: '', show: false });
  const { isLoading, result, error, start } = useRecipeJob();

  // Show error messages from recipe generation
  React.useEffect(() => {
    if (error) {
      showMessage(error, 'error');
    }
  }, [error]);

  // Function to show messages
  const showMessage = (text, type = 'info') => {
    setMessage({ text, type, show: true });
    setTimeout(() => setMessage({ text: '', type: '', show: false }), 5000);
  };

  // Function to handle sharing actions from ResultCard
  const handleShareAction = (messageText) => {
    const type = messageText.includes('Failed') ? 'error' : 'success';
    showMessage(messageText, type);
  };

  const cuisines = [
    { id: 'international', name: 'International', icon: '🌍' },
    { id: 'italian', name: 'Italian', icon: '🇮🇹' },
    { id: 'indian', name: 'Indian', icon: '🇮🇳' },
    { id: 'chinese', name: 'Chinese', icon: '🇨🇳' },
    { id: 'japanese', name: 'Japanese', icon: '🇯🇵' },
    { id: 'mexican', name: 'Mexican', icon: '🇲🇽' },
    { id: 'arabic', name: 'Arabic', icon: '🇱🇧' },
    { id: 'mediterranean', name: 'Mediterranean', icon: '🇬🇷' },
    { id: 'french', name: 'French', icon: '🇫🇷' },
    { id: 'vegetarian', name: 'Vegetarian', icon: '🥬' }
  ];

  const ingredientCategories = {
    vegetables: {
      name: 'Vegetables',
      icon: '🥕',
      items: ['tomato', 'onion', 'garlic', 'carrot', 'bell pepper', 'spinach', 'broccoli', 'mushroom', 'potato', 'cucumber']
    },
    meats: {
      name: 'Meats',
      icon: '🍗',
      items: ['chicken breast', 'ground beef', 'lamb', 'shrimp', 'tuna', 'eggs', 'tofu', 'chickpeas', 'lentils', 'sausage']
    },
    grains: {
      name: 'Grains/Carbs',
      icon: '🍚',
      items: ['rice', 'pasta', 'noodles', 'quinoa', 'couscous', 'bulgur', 'tortilla', 'bread', 'oats', 'barley']
    },
    dairy: {
      name: 'Dairy',
      icon: '🥛',
      items: ['milk', 'yogurt', 'mozzarella', 'cheddar', 'feta', 'butter', 'cream', 'parmesan', 'paneer', 'labneh']
    },
    herbs: {
      name: 'Herbs & Spices',
      icon: '🌿',
      items: ['salt', 'black pepper', 'cumin', 'turmeric', 'paprika', 'oregano', 'basil', 'parsley', 'cinnamon', 'chili flakes']
    },
    pantry: {
      name: 'Pantry & Sauces',
      icon: '🫙',
      items: ['olive oil', 'tomato paste', 'soy sauce', 'vinegar', 'lemon', 'tahini', 'ketchup', 'mustard', 'mayonnaise', 'honey']
    }
  };

  const categoryImages = {
    meats: MeatsIcon,
    vegetables: VegIcon,
    grains: GrainsIcon,
    dairy: DairyIcon,
    herbs: HerbsIcon,
    pantry: PantryIcon,
  };

  const toggleCuisine = (cuisineId) => {
    const cuisine = cuisines.find(c => c.id === cuisineId);

    if (selectedCuisines.includes(cuisine.name)) {
      const newSelection = selectedCuisines.filter(c => c !== cuisine.name);
      if (newSelection.length === 0) {
        setSelectedCuisines(['International']);
      } else {
        setSelectedCuisines(newSelection);
      }
    } else {
      if (selectedCuisines.length >= 3) {
        showMessage('You can only select up to 3 cuisines', 'error');
        return;
      }
      setSelectedCuisines([...selectedCuisines, cuisine.name]);
    }
  };

  const toggleIngredient = (ingredient) => {
    if (selectedIngredients.includes(ingredient)) {
      setSelectedIngredients(selectedIngredients.filter(i => i !== ingredient));
    } else {
      if (selectedIngredients.length >= 10) {
        showMessage('You can only select up to 10 ingredients', 'error');
        return;
      }
      setSelectedIngredients([...selectedIngredients, ingredient]);
    }
  };

  const removeIngredient = (ingredient) => {
    setSelectedIngredients(selectedIngredients.filter(i => i !== ingredient));
  };

  const handleCategoryMouseEnter = (categoryId) => {
    setExpandedCategories({ [categoryId]: true });
  };

  const handleCategoryMouseLeave = () => {
    setExpandedCategories({});
  };

  const handleSubmit = async () => {
    if (!selectedCuisines.length || !selectedIngredients.length) return;
    await start({ cuisines: selectedCuisines, ingredients: selectedIngredients });
  };

  const isFormValid = selectedCuisines.length > 0 && selectedIngredients.length > 0;

  return (
    <div className="min-h-screen bg-[#FEFBF7]">

      {/* Unified Message System - Top Right */}
      {message.show && (
        <div className="fixed top-4 right-4 z-50 max-w-sm">
          <div className={`rounded-lg border px-4 py-3 shadow-lg ${
            message.type === 'success' 
              ? 'border-green-200 bg-green-50 text-green-800' 
              : message.type === 'error' 
              ? 'border-red-200 bg-red-50 text-red-800'
              : 'border-blue-200 bg-blue-50 text-blue-800'
          }`}>
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                {message.type === 'success' && (
                  <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                )}
                {message.type === 'error' && (
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                )}
                {message.type === 'info' && (
                  <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{message.text}</p>
              </div>
              <button
                onClick={() => setMessage({ text: '', type: '', show: false })}
                className="flex-shrink-0 text-gray-400 hover:text-gray-600"
              >
                <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto px-4 py-8">
        <HeaderHero />

        <div className="px-4 pb-8">
          <div className="mx-auto max-w-5xl rounded-3xl bg-sky-50 p-8 shadow-sm ring-1 ring-slate-200 md:p-12">

            <div id="picker" className="mb-8 text-sm">
              <h2 className="text-[20px] text-gray-700 mb-6 text-start font-cursive">
                What is today’s flavor vibe <span className="text-[15px] text-gray-700 mb-6 text-start font-cursive">(Select up to 3)</span>
              </h2>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {cuisines.map((cuisine) => (
                  <button
                    key={cuisine.id}
                    onClick={() => toggleCuisine(cuisine.id)}
                    className={`
                relative px-2 py-1 rounded-full border transition-all duration-300
                ${selectedCuisines.includes(cuisine.name)
                        ? 'bg-yellow-200 border-blue-500 text-gray-900 ring-2 ring-blue-200'
                        : 'bg-white border-gray-300 text-gray-900 hover:border-blue-300 hover:bg-blue-50'}
                hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-300
              `}
                    aria-pressed={selectedCuisines.includes(cuisine.name)}
                    aria-label={`Cuisine ${cuisine.name}`}
                  >

                    <div className="text-[15px]  leading-none">{cuisine.name}</div>
                  </button>
                ))}
              </div>


            </div>


            <div className="mb-12">
              <h2 className="text-[20px] text-gray-700 mb-6 text-start font-cursive">What do you have? <span className="text-[15px] text-gray-700 mb-6 text-start font-cursive">
                (Select up to 5)
              </span></h2>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-start">
                {Object.entries(ingredientCategories).map(([categoryId, category]) => (
                  <div
                    key={categoryId}
                    className="ingredient-category bg-white rounded-lg shadow-md relative overflow-visible"
                    onMouseEnter={() => handleCategoryMouseEnter(categoryId)}
                    onMouseLeave={handleCategoryMouseLeave}
                  >
                    <div className="relative">
                      <div className="relative w-full p-4 text-left bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-between rounded-lg overflow-visible">
                        {categoryImages[categoryId] ? (
                          <img
                            src={categoryImages[categoryId]}
                            alt={`${category.name} icon`}
                            className="absolute left-4 top-1/2 -translate-y-1/2 h-12 w-12 md:h-14 md:w-14 object-contain pointer-events-none select-none"
                          />
                        ) : (
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl md:text-3xl pointer-events-none select-none">{category.icon}</span>
                        )}
                        <div className="flex items-center gap-2 pl-16 md:pl-20">
                          <span className="font-semibold text-gray-800">{category.name}</span>
                        </div>
                        <span className="text-gray-400">▼</span>
                      </div>

                      {expandedCategories[categoryId] && (
                        <div
                          id={`panel-${categoryId}`}
                          className="ingredient-dropdown absolute left-0 right-0 top-full bg-white p-4 max-h-60 overflow-y-auto z-50 shadow-lg border-t rounded-b-lg"
                          onClick={(e) => e.stopPropagation()}
                          style={{ minWidth: '100%' }}
                        >
                          <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                            {category.items.map((item) => (
                              <label key={item} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                                <input
                                  type="checkbox"
                                  checked={selectedIngredients.includes(item)}
                                  onChange={() => toggleIngredient(item)}
                                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                  onClick={(e) => e.stopPropagation()}
                                />
                                <span className=" text-[13px] text-gray-700 capitalize">{item}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>


            {/* Your picks section - always rendered to prevent layout shift */}
            <div className="mb-8 min-h-[60px]">
              {selectedIngredients.length > 0 ? (
                <>
                  <h3 className="text-[20px] text-gray-700 mb-4 text-start font-cursive">Your picks:</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedIngredients.map((ingredient) => (
                      <div key={ingredient} className="px-3 pb-1 flex items-center gap-2 text-gray-900 border-b-2 border-gray-300">
                        <span className="capitalize">{ingredient}</span>
                        <button onClick={() => removeIngredient(ingredient)} className="text-gray-900 hover:text-blue-800 font-bold" aria-label={`Remove ${ingredient}`}>
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="h-[60px] flex items-center">
                  <p className="text-gray-400 text-sm italic">Select ingredients above to see your picks here</p>
                </div>
              )}
            </div>


            <div className="text-center">
              <AIButton
                isLoading={isLoading}
                disabled={!isFormValid || isLoading}
                onClick={handleSubmit}
              />
            </div>
          </div>
        </div>


        {/* Recipe Result */}
        <ResultCard loading={isLoading} error={error} data={result} onShareAction={handleShareAction} />
      </div>
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-shake { animation: shake 0.5s ease-in-out; }
        .animate-fadeIn { animation: fadeIn 0.3s ease-out; }

        @keyframes glow { 
          0%,100% { box-shadow: 0 10px 24px rgba(14,165,233,.18); }
          50%     { box-shadow: 0 12px 30px rgba(234,179,8,.25); }
        }
        @keyframes sheen {
          0%   { transform: translateX(-20%); opacity: 0; }
          40%  { opacity: .7; }
          100% { transform: translateX(220%); opacity: 0; }
        }
        .animate-glow { animation: glow 2.2s ease-in-out infinite; }
        .group:hover .group-hover\:animate-sheen { animation: sheen .9s ease-in-out 1; }

                 /* Fix dropdown positioning issues */
         .ingredient-category {
           position: relative;
           overflow: visible;
         }
         
         .ingredient-dropdown {
           position: absolute;
           z-index: 9999;
           min-width: 100%;
           left: 0;
           right: 0;
           pointer-events: auto;
         }
         
         /* Ensure dropdowns don't affect layout */
         .ingredient-dropdown * {
           pointer-events: auto;
         }
      `}



      </style>
    </div>
  );
};


function SparkleIcon({ className = "h-5 w-5" }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <path d="M12 3l1.6 3.8L17 8.4l-3.8 1.6L12 14l-1.2-4.1L7 8.4l3.8-1.6L12 3z" fill="currentColor" opacity=".9" />
      <path d="M5 15l.9 2.1L8 18l-2.1.9L5 21l-.9-2.1L2 18l2.1-.9L5 15z" fill="currentColor" opacity=".75" />
      <path d="M19 13l.7 1.6 1.6.7-1.6.7L19 18l-.7-1.6-1.6-.7 1.6-.7.7-1.6z" fill="currentColor" opacity=".75" />
    </svg>
  );
}

function AIButton({ isLoading, disabled, onClick }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-busy={isLoading ? "true" : "false"}
      className={[
        "group relative inline-flex items-center gap-2 rounded-full px-6 py-3",
        "text-white font-semibold transition-all duration-300",
        "focus:outline-none focus-visible:ring-4 focus-visible:ring-teal-300/50",
        disabled
          ? "opacity-60 cursor-not-allowed bg-slate-400"
          : "shadow-lg hover:shadow-xl active:scale-95",
        // warm AI gradient
        disabled
          ? ""
          : "bg-gradient-to-r from-orange-400 via-amber-300 to-teal-500",
        // soft glow pulse
        !disabled && !isLoading ? "animate-glow" : ""
      ].join(" ")}
    >
      {/* subtle glossy sheen */}
      {!disabled && (
        <span className="pointer-events-none absolute inset-0 overflow-hidden rounded-full">
          <span className="absolute -inset-y-1 -left-1/2 w-1/2 translate-x-0 rotate-12 bg-white/30 blur-xl opacity-0 group-hover:animate-sheen" />
        </span>
      )}

      <span className="grid h-6 w-6 place-items-center rounded-full bg-white/20 ring-1 ring-white/30">
        {isLoading ? (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
        ) : (
          <SparkleIcon className="h-4 w-4" />
        )}
      </span>

      <span className="whitespace-nowrap">
        {isLoading ? "Generating with AI…" : "What to cook AI?"}
      </span>
    </button>
  );
}





export default What2Cook;