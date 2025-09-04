// src/components/ResultCard.jsx
import React, { useState } from 'react';
import { shareOnInstagram, sendRecipeEmail } from '../lib/api';
import IgLogo from "../Images/Instagram.png";
import Emlogo from "../Images/Email.png";

export default function ResultCard({ loading, error, data, onShareAction }) {

  // Shared container (matches HeaderHero / section cards)
  const Shell = ({ children, className = "" }) => (
    <div className="px-4 pt-2 pb-4">

      <div className={`mx-auto max-w-5xl rounded-2xl bg-orange-50 p-5 md:p-6 shadow-sm ring-1 ring-slate-200 ${className}`}>
        {children}
      </div>
    </div>
  );

  const [igBusy, setIgBusy] = useState(false);
  const [busy, setBusy] = useState(false);

  if (loading) {
    return (
      <Shell>


        <div className="grid items-start gap-6 md:grid-cols-2">
          {/* Image skeleton */}
          <div className="aspect-[4/3] w-full overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200">
            <div className="h-full w-full animate-pulse bg-slate-200" />
          </div>

          {/* Text skeleton */}
          <div>
            <div className="h-8 w-3/4 animate-pulse rounded bg-slate-200 mb-4" />
            <div className="h-5 w-32 animate-pulse rounded bg-slate-200 mb-2" />
            <div className="space-y-2 mb-6">
              <div className="h-4 w-11/12 animate-pulse rounded bg-slate-200" />
              <div className="h-4 w-10/12 animate-pulse rounded bg-slate-200" />
              <div className="h-4 w-9/12 animate-pulse rounded bg-slate-200" />
            </div>
            <div className="h-5 w-28 animate-pulse rounded bg-slate-200 mb-2" />
            <div className="space-y-3">
              <div className="h-4 w-full animate-pulse rounded bg-slate-200" />
              <div className="h-4 w-10/12 animate-pulse rounded bg-slate-200" />
              <div className="h-4 w-9/12 animate-pulse rounded bg-slate-200" />
            </div>
          </div>
        </div>
      </Shell>
    );
  }

  if (error) {
    return (
      <Shell>
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-800">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 h-5 w-5 flex-none text-red-500">
              <svg viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
            </div>
            <div>
              <h3 className="font-semibold">Recipe generation failed</h3>
              <p className="mt-1 text-sm">{error}</p>
            </div>
          </div>
        </div>
      </Shell>
    );
  }

  if (!data) return null;

  // ---------- Normalize data from your n8n row ----------
  const title =
    data.title ||
    data.recipe_json?.title ||
    'Your AI Recipe';

  const imageUrl =
    data.display_image_url ||
    data.imageUrl ||            // camelCase from your n8n
    data.image_url || null;     // snake_case fallback

  const recipeId = data.request_id || data.id || null;

  // ingredients: string "a, b, c" OR array
  let ingredients = [];
  if (Array.isArray(data.ingredients)) {
    ingredients = data.ingredients;
  } else if (typeof data.ingredients === 'string') {
    ingredients = data.ingredients.split(',').map(s => s.trim()).filter(Boolean);
  } else if (Array.isArray(data.recipe_json?.ingredients)) {
    ingredients = data.recipe_json.ingredients;
  }

  // steps: string with \n OR array
  let steps = [];
  if (Array.isArray(data.recipe)) {
    steps = data.recipe;
  } else if (typeof data.recipe === 'string') {
    steps = data.recipe.split('\n').map(s => s.trim()).filter(Boolean);
  } else if (Array.isArray(data.recipe_json?.steps)) {
    steps = data.recipe_json.steps;
  }





  // ------------------------------------------------------

  const handleShareInstagram = async () => {
    if (!recipeId) return;
    try {
      setIgBusy(true);
      await shareOnInstagram({ recipeId });
      onShareAction('recipe is shared in the Instagram, check it!');
    } catch (e) {
      onShareAction('Failed to share on Instagram.');
    } finally {
      setIgBusy(false);
    }
  };

  const handleSendEmail = async () => {
    if (!recipeId) return;
    try {
      setBusy(true);
      await sendRecipeEmail({ recipeId });
      onShareAction('recipe is emailed to you!');
    } catch (e) {
      onShareAction('Failed to send email.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Shell>
      <div className="grid items-start gap-6 md:grid-cols-2">
        {/* Left: Image */}
        <div className="order-1 md:order-none">
          <div className="w-[400px] h-[600px] overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={title}
                className="w-[400px] h-[600px] object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            ) : (
              <div className="w-[400px] h-[600px] bg-slate-100" />
            )}
          </div>
          <button
            onClick={handleShareInstagram}
            disabled={igBusy}
            aria-busy={igBusy}
            title="Share to Instagram"
            aria-label="Share to Instagram"
            className={`inline-grid h-10 w-10 place-items-center rounded-full focus:outline-none focus-visible:ring-4 ${igBusy ? 'cursor-not-allowed opacity-60' : 'hover:opacity-95'}`}
          >
            {igBusy ? (
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : (
              <img src={IgLogo} alt="" className="h-6 w-6" aria-hidden="true" />
            )}
          </button>
          <button
            onClick={handleSendEmail}
            disabled={busy}
            aria-busy={busy}
            title="Send recipe by email"
            aria-label="Send recipe by email"
            className={`inline-grid h-10 w-10 place-items-center rounded-full focus:outline-none focus-visible:ring-4 ${busy ? 'cursor-not-allowed opacity-60' : 'hover:opacity-95'}`}
          >
            {busy ? (
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : (
              <img src={Emlogo} alt="" className="h-6 w-6" aria-hidden="true" />
            )}
          </button>
        </div>









        {/* Right: Title + Ingredients */}
        <div>
          <h2 className="font-display text-slate-900 text-2xl md:text-3xl leading-tight text-start">
            {title}
          </h2>

          {ingredients.length > 0 && (
            <div className="mt-5">
              <h3 className="text-[20px] text-gray-700 mb-2 text-start font-cursive">
                Ingredients
              </h3>
              <ul className="grid grid-cols-2 gap-x-6 gap-y-1">
                {ingredients.map((ingredient, i) => (
                  <li
                    key={`${ingredient}-${i}`}
                    className="flex items-start"
                  >
                    <span className="mr-2 text-emerald-600">•</span>
                    <span className="text-gray-700 capitalize">{ingredient}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}



          {/* NEW: Steps under the image (full width) */}
          {steps.length > 0 && (
            <div className="md:col-span-2 mt-10">
              <h3 className="text-[20px] text-gray-700 mb-2 text-start font-cursive">
                Instructions
              </h3>
              <ol className="space-y-3">
                {steps.map((step, i) => (
                  <li key={`step-${i}`} className="flex gap-3">
                    <span className="flex-none w-8 h-8 rounded-full bg-blue-100 text-blue-700 grid place-items-center text-sm font-semibold">
                      {i + 1}
                    </span>
                    <span className="text-gray-700 leading-relaxed">{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>



        {/* (optional) Cuisines chips can stay here or below steps */}
        {Array.isArray(data.cuisines) && data.cuisines.length > 0 && (
          <div className="md:col-span-2 mt-6 pt-6 border-t border-slate-200">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-gray-500">Cuisines:</span>
              {data.cuisines.map((c, i) => (
                <span key={`${c}-${i}`} className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                  {c}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>


    </Shell>
  );

}


