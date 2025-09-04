import React, { useState, useEffect } from 'react';
import HeaderHero from './HeaderHero';
import VegIcon from './Images/vegetables.png';
import MeatsIcon from './Images/Meats.png';
import GrainsIcon from './Images/grains.png';
import FishIcon from './Images/Fish.png';
import PlantProteinIcon from './Images/PlantProtein.png';
import PantryIcon from './Images/Pantry.png';
import { useRecipeJob } from './hooks/useRecipeJob';
import ResultCard from './components/ResultCard';
import { supabase } from './lib/supabase';

const What2Cook = () => {
  const [selectedCuisines, setSelectedCuisines] = useState(['International']);
  const [selectedIngredients, setSelectedIngredients] = useState([]);
  const [expandedCategories, setExpandedCategories] = useState({});
  const [message, setMessage] = useState({ text: '', type: '', show: false });

  // Tabs
  const [activeTab, setActiveTab] = useState('manually-pick'); // 'manually-pick' | 'fridge'

  // Upload state
  const [imageFile, setImageFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedImageUrl, setUploadedImageUrl] = useState('');
  const [lastWebhookIngredients, setLastWebhookIngredients] = useState(null);
  const [pendingImageID, setPendingImageID] = useState('');
  const [isPolling, setIsPolling] = useState(false);

  const { isLoading, result, error, start } = useRecipeJob();

  useEffect(() => {
    if (error) showMessage(error, 'error');
  }, [error]);

  const showMessage = (text, type = 'info') => {
    setMessage({ text, type, show: true });
    window.clearTimeout(showMessage._t);
    showMessage._t = window.setTimeout(() => setMessage({ text: '', type: '', show: false }), 5000);
  };

  const handleShareAction = (msg) => {
    const type = /fail|error/i.test(msg) ? 'error' : 'success';
    showMessage(msg, type);
  };

  const cuisines = [
    { id: 'international', name: 'International' },
    { id: 'italian', name: 'Italian' },
    { id: 'indian', name: 'Indian' },
    { id: 'chinese', name: 'Chinese' },
    { id: 'japanese', name: 'Japanese' },
    { id: 'mexican', name: 'Mexican' },
    { id: 'arabic', name: 'Arabic' },
    { id: 'mediterranean', name: 'Mediterranean' },
    { id: 'french', name: 'French' },
    { id: 'vegetarian', name: 'Vegetarian' }
  ];

  const ingredientCategories = {
    vegetables: {
      name: 'Vegetables',
      items: ['tomato', 'potato', 'carrot', 'bell pepper', 'broccoli', 'spinach', 'mushroom', 'cabbage', 'zucchini', 'eggplant']
    },
    meats: {
      name: 'Meats',
      items: ['chicken', 'beef', 'lamb', 'pork', 'sausage', 'turkey', 'veal']
    },
    grains: {
      name: 'Grains/Carbs',
      items: ['rice', 'pasta', 'noodles', 'quinoa', 'couscous', 'bulgur', 'tortilla', 'bread', 'oats', 'barley']
    },
    fish: {
      name: 'Fish/Seafood',
      items: ['salmon', 'tuna', 'cod', 'sea bass', 'shrimp', 'crab', 'lobster', 'clams', 'squid']
    },
    plant_proteins: {
      name: 'Plant-based Proteins',
      items: ['lentils', 'chickpeas', 'kidney beans', 'black beans', 'pinto beans', 'soybeans', 'tofu']
    },
    pantry: {
      name: 'Pantry & Sauces',
      items: ['olive oil', 'tomato paste', 'soy sauce', 'vinegar', 'flour', 'tahini', 'ketchup', 'mustard', 'mayonnaise', 'honey']
    }
  };

  const categoryImages = {
    meats: MeatsIcon,
    vegetables: VegIcon,
    grains: GrainsIcon,
    fish: FishIcon,
    plant_proteins: PlantProteinIcon,
    pantry: PantryIcon
  };

  const toggleCuisine = (cuisineId) => {
    const cuisine = cuisines.find((c) => c.id === cuisineId);
    if (!cuisine) return;
    if (selectedCuisines.includes(cuisine.name)) {
      const next = selectedCuisines.filter((c) => c !== cuisine.name);
      setSelectedCuisines(next.length === 0 ? ['International'] : next);
    } else {
      if (selectedCuisines.length >= 3) return showMessage('You can only select up to 3 cuisines', 'error');
      setSelectedCuisines([...selectedCuisines, cuisine.name]);
    }
  };

  const toggleIngredient = (ingredient) => {
    if (selectedIngredients.includes(ingredient)) {
      setSelectedIngredients(selectedIngredients.filter((i) => i !== ingredient));
    } else {
      if (selectedIngredients.length >= 10) return showMessage('You can only select up to 10 ingredients', 'error');
      setSelectedIngredients([...selectedIngredients, ingredient]);
    }
  };

  const removeIngredient = (ingredient) => setSelectedIngredients(selectedIngredients.filter((i) => i !== ingredient));
  const handleCategoryMouseEnter = (categoryId) => setExpandedCategories({ [categoryId]: true });
  const handleCategoryMouseLeave = () => setExpandedCategories({});

  const handleSubmit = async () => {
    if (!selectedCuisines.length || !selectedIngredients.length) return;
    await start({ cuisines: selectedCuisines, ingredients: selectedIngredients });
  };

  // Upload helpers
  const handleFileSelect = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) return showMessage('File size must be less than 8MB', 'error');
    if (!file.type.startsWith('image/')) return showMessage('Please select an image file', 'error');
    setImageFile(file);
    setUploadedImageUrl('');
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files && e.dataTransfer.files[0];
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) return showMessage('File size must be less than 8MB', 'error');
    if (!file.type.startsWith('image/')) return showMessage('Please select an image file', 'error');
    setImageFile(file);
    setUploadedImageUrl('');
  };

  const handleDragOver = (e) => e.preventDefault();

  // Apply ingredients returned from webhook and navigate to Manually Pick
  const applyWebhookIngredients = (rawList) => {
    if (!rawList) {
      console.warn('[Webhook] No payload to apply');
      return;
    }
    let list = [];
    if (Array.isArray(rawList)) {
      if (rawList.every((x) => typeof x === 'string')) {
        list = rawList;
      } else if (rawList.every((x) => x && typeof x === 'object' && Array.isArray(x.ingredients))) {
        list = rawList.flatMap((x) => x.ingredients);
      }
    } else if (rawList && typeof rawList === 'object' && Array.isArray(rawList.ingredients)) {
      list = rawList.ingredients;
    }
    console.debug('[Webhook] Raw payload:', rawList);
    console.debug('[Webhook] Flattened list:', list);
    const normalized = list
      .filter(Boolean)
      .map((x) => String(x).toLowerCase().trim())
      .filter((x) => x.length > 0);
    console.debug('[Webhook] Normalized list:', normalized);
    const unique = Array.from(new Set(normalized)).slice(0, 10);
    if (unique.length === 0) {
      console.warn('[Webhook] No valid ingredients after normalization');
      return;
    }
    setLastWebhookIngredients(unique);
    setSelectedIngredients(unique);
    setActiveTab('manually-pick');
    showMessage('Ingredients detected and added to Your picks', 'success');
    // Optional: scroll to the picks section
    try { document.getElementById('manually-pick-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); } catch (_) {}
  };

  // Try to extract ingredients array from an HTTP response (JSON or text)
  const extractIngredientsFromResponse = async (res) => {
    try {
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const data = await res.json();
        console.debug('[Webhook] JSON response:', data);
        if (Array.isArray(data)) {
          const fromStrings = data.filter((x) => typeof x === 'string');
          const fromObjects = data
            .filter((x) => x && typeof x === 'object' && Array.isArray(x.ingredients))
            .flatMap((x) => x.ingredients);
          const combined = [...fromStrings, ...fromObjects];
          return combined.length ? combined : null;
        }
        return Array.isArray(data.ingredients) ? data.ingredients : null;
      }
      const text = await res.text();
      if (!text) return null;
      try {
        const parsed = JSON.parse(text);
        console.debug('[Webhook] Text->JSON parsed response:', parsed);
        if (Array.isArray(parsed)) {
          const fromStrings = parsed.filter((x) => typeof x === 'string');
          const fromObjects = parsed
            .filter((x) => x && typeof x === 'object' && Array.isArray(x.ingredients))
            .flatMap((x) => x.ingredients);
          const combined = [...fromStrings, ...fromObjects];
          return combined.length ? combined : null;
        }
        return Array.isArray(parsed.ingredients) ? parsed.ingredients : null;
      } catch (_) {
        // Fallback: split by commas/newlines
        const rough = text.split(/[\,\n]/).map((s) => s.trim()).filter(Boolean);
        console.debug('[Webhook] Plain text fallback parsed list:', rough);
        return rough.length ? rough : null;
      }
    } catch (_) {
      return null;
    }
  };

  // Polling for async results from n8n (if the webhook only starts the workflow)
  const pollForIngredients = async (imageID) => {
    const resultUrl = process.env.REACT_APP_N8N_FRIDGE_RESULT_URL;
    if (!resultUrl) {
      console.warn('[Poll] REACT_APP_N8N_FRIDGE_RESULT_URL not set; cannot poll for results');
      return;
    }
    if (!imageID) return;
    setIsPolling(true);
    let attempts = 0;
    const maxAttempts = 20; // ~60s if 3s interval
    const intervalMs = 3000;

    const tryOnce = async () => {
      attempts += 1;
      try {
        const url = `${resultUrl}?imageID=${encodeURIComponent(imageID)}`;
        const res = await fetch(url, { method: 'GET' });
        if (res.ok) {
          const extracted = await extractIngredientsFromResponse(res.clone());
          if (extracted && extracted.length) {
            console.debug('[Poll] Ingredients found on attempt', attempts, extracted);
            applyWebhookIngredients(extracted);
            setPendingImageID('');
            setIsPolling(false);
            return true;
          }
        } else {
          console.warn('[Poll] Non-200 result', res.status);
        }
      } catch (err) {
        console.warn('[Poll] Error fetching results', err);
      }
      return false;
    };

    // Initial immediate attempt
    const immediate = await tryOnce();
    if (immediate) return;

    // Interval attempts
    const timer = setInterval(async () => {
      const done = await tryOnce();
      if (done || attempts >= maxAttempts) {
        clearInterval(timer);
        setIsPolling(false);
        if (!done) {
          console.warn('[Poll] Max attempts reached without ingredients');
        }
      }
    }, intervalMs);
  };

  const uploadImage = async () => {
    if (!imageFile) return;
    setIsUploading(true);
    setUploadProgress(10);
    try {
      const originalExt = imageFile.name.includes('.') ? `.${imageFile.name.split('.').pop().toLowerCase()}` : '';
      const imageIDInitial = crypto.randomUUID();

      const attemptUpload = async (idCandidate) => {
        const path = `fridge/${idCandidate}${originalExt}`;
        const { error: uploadError } = await supabase.storage.from('fridge_public').upload(path, imageFile, { cacheControl: '3600', upsert: false });
        if (uploadError) throw new Error(uploadError.message);
        const { data: urlData } = supabase.storage.from('fridge_public').getPublicUrl(path);
        const publicUrl = urlData.publicUrl;
        const { error: dbError } = await supabase.from('tb_fridge_photos').insert({ id: idCandidate, img_url: publicUrl });
        if (dbError) return { publicUrl, duplicate: dbError.code === '23505' };
        return { publicUrl, duplicate: false };
      };

      let imageID = imageIDInitial;
      let attempt = await attemptUpload(imageID);
      if (attempt.duplicate) {
        imageID = crypto.randomUUID();
        attempt = await attemptUpload(imageID);
        if (attempt.duplicate) throw new Error('Duplicate ID on retry');
      }

      setUploadProgress(70);

      const publicUrl = attempt.publicUrl;
      const webhookUrl = process.env.REACT_APP_N8N_FRIDGE_WEBHOOK_URL;
      if (webhookUrl) {
        const res = await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageID:imageID, img_url: publicUrl })
        });
        if (!res.ok) throw new Error(`Webhook failed: ${res.status}`);
        const extracted = await extractIngredientsFromResponse(res.clone());
        if (extracted && extracted.length) {
          applyWebhookIngredients(extracted);
        } else {
          const rawText = await res.text().catch(() => '');
          console.warn('[Webhook] No ingredients extracted from response', {
            status: res.status,
            headers: Object.fromEntries(res.headers.entries()),
            rawBody: rawText
          });
          // Start polling for async results
          setPendingImageID(imageID);
          pollForIngredients(imageID);
        }
      }

      setUploadProgress(100);
      setUploadedImageUrl(publicUrl);
      setImageFile(null);
      showMessage('Image uploaded successfully!', 'success');
    } catch (err) {
      showMessage(`Upload failed: ${err.message}`, 'error');
    } finally {
      setTimeout(() => setIsUploading(false), 400);
      setTimeout(() => setUploadProgress(0), 600);
    }
  };

  const retryWebhook = async () => {
    if (!uploadedImageUrl) return;
    try {
      const webhookUrl = process.env.REACT_APP_N8N_FRIDGE_WEBHOOK_URL;
      if (!webhookUrl) return showMessage('Webhook URL not configured', 'error');
      const idGuess = uploadedImageUrl.split('/').pop().split('.')[0];
      const res = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageID: idGuess, img_url: uploadedImageUrl })
      });
      if (!res.ok) throw new Error(`Webhook failed: ${res.status}`);
      const extracted = await extractIngredientsFromResponse(res.clone());
      if (extracted && extracted.length) {
        applyWebhookIngredients(extracted);
      } else {
        const rawText = await res.text().catch(() => '');
        console.warn('[Webhook][Retry] No ingredients extracted from response', {
          status: res.status,
          headers: Object.fromEntries(res.headers.entries()),
          rawBody: rawText
        });
        setPendingImageID(idGuess);
        pollForIngredients(idGuess);
      }
      showMessage('Webhook triggered successfully!', 'success');
    } catch (err) {
      showMessage(`Webhook retry failed: ${err.message}`, 'error');
    }
  };

  const isFormValid = selectedCuisines.length > 0 && selectedIngredients.length > 0;

  return (
    <div className="min-h-screen bg-[#FEFBF7]">
      {message.show && (
        <div className="fixed top-4 right-4 z-50 max-w-sm">
          <div className={`rounded-lg border px-4 py-3 shadow-lg ${message.type === 'success' ? 'border-green-200 bg-green-50 text-green-800' : message.type === 'error' ? 'border-red-200 bg-red-50 text-red-800' : 'border-blue-200 bg-blue-50 text-blue-800'}`}>
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0" aria-hidden="true">
                {message.type === 'success' && (
                  <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                )}
                {message.type === 'error' && (
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
                )}
                {message.type === 'info' && (
                  <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
                )}
              </div>
              <div className="flex-1"><p className="text-sm font-medium">{message.text}</p></div>
              <button onClick={() => setMessage({ text: '', type: '', show: false })} className="flex-shrink-0 text-gray-400 hover:text-gray-600" aria-label="Dismiss message">
                <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto px-4 py-8">
        <HeaderHero />

        {/* Tabs Panel */}
        <div className="px-4 pb-8">
          <div className="mx-auto max-w-5xl rounded-3xl bg-sky-50 p-8 shadow-sm ring-1 ring-slate-200 md:p-12">
            {/* Tabs Navigation */}
            <div className="mb-8">
              <div className="flex space-x-1 bg-white p-1 rounded-lg shadow-sm" role="tablist">
                <button
                  role="tab"
                  aria-selected={activeTab === 'manually-pick'}
                  aria-controls="manually-pick-panel"
                  id="manually-pick-tab"
                  onClick={() => setActiveTab('manually-pick')}
                  onKeyDown={(e) => { if (e.key === 'ArrowRight') { e.preventDefault(); document.getElementById('fridge-tab').focus(); } }}
                  className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${activeTab === 'manually-pick' ? 'bg-blue-500 text-white shadow-sm' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`}
                >
                  Manually Pick
                </button>
                <button
                  role="tab"
                  aria-selected={activeTab === 'fridge'}
                  aria-controls="fridge-panel"
                  id="fridge-tab"
                  onClick={() => setActiveTab('fridge')}
                  onKeyDown={(e) => { if (e.key === 'ArrowLeft') { e.preventDefault(); document.getElementById('manually-pick-tab').focus(); } }}
                  className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${activeTab === 'fridge' ? 'bg-blue-500 text-white shadow-sm' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`}
                >
                  What is in the fridge
                </button>
              </div>
            </div>

            {/* Panels */}
            <div className="min-h-[400px]">
              {/* Manually Pick */}
              <div role="tabpanel" id="manually-pick-panel" aria-labelledby="manually-pick-tab" className={activeTab === 'manually-pick' ? 'block' : 'hidden'}>
                <div id="picker" className="mb-8 text-sm">
                  <h2 className="text-[20px] text-gray-700 mb-6 text-start font-cursive">What is today's flavor vibe <span className="text-[15px] text-gray-700 mb-6 text-start font-cursive">(Select up to 3)</span></h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {cuisines.map((c) => (
                      <button key={c.id} onClick={() => toggleCuisine(c.id)} className={`relative px-2 py-1 rounded-full border transition-all duration-300 ${selectedCuisines.includes(c.name) ? 'bg-yellow-200 border-blue-500 text-gray-900 ring-2 ring-blue-200' : 'bg-white border-gray-300 text-gray-900 hover:border-blue-300 hover:bg-blue-50'} hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-300`} aria-pressed={selectedCuisines.includes(c.name)} aria-label={`Cuisine ${c.name}`}>
                        <div className="text-[15px] leading-none">{c.name}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mb-12">
                  <h2 className="text-[20px] text-gray-700 mb-6 text-start font-cursive">What do you have? <span className="text-[15px]">(Select up to 10)</span></h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-start">
                    {Object.entries(ingredientCategories).map(([categoryId, category]) => (
                      <div key={categoryId} className="ingredient-category bg-white rounded-lg shadow-md relative overflow-visible" onMouseEnter={() => handleCategoryMouseEnter(categoryId)} onMouseLeave={handleCategoryMouseLeave}>
                        <div className="relative">
                          <div className="relative w-full p-4 text-left bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-between rounded-lg overflow-visible">
                            {categoryImages[categoryId] ? (
                              <img src={categoryImages[categoryId]} alt={`${category.name} icon`} className="absolute left-4 top-1/2 -translate-y-1/2 h-12 w-12 md:h-14 md:w-14 object-contain pointer-events-none select-none" />
                            ) : (
                              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl md:text-3xl pointer-events-none select-none">•</span>
                            )}
                            <div className="flex items-center gap-2 pl-16 md:pl-20">
                              <span className="font-semibold text-gray-800">{category.name}</span>
                            </div>
                            <span className="text-gray-400">▼</span>
                          </div>
                          {expandedCategories[categoryId] && (
                            <div id={`panel-${categoryId}`} className="ingredient-dropdown absolute left-0 right-0 top-full bg-white p-4 max-h-60 overflow-y-auto z-50 shadow-lg border-t rounded-b-lg" onClick={(e) => e.stopPropagation()} style={{ minWidth: '100%' }}>
                              <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                                {category.items.map((item) => (
                                  <label key={item} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                                    <input type="checkbox" checked={selectedIngredients.includes(item)} onChange={() => toggleIngredient(item)} className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500" onClick={(e) => e.stopPropagation()} />
                                    <span className="text-[13px] text-gray-700 capitalize">{item}</span>
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

                <div className="mb-8 min-h-[60px]">
                  {selectedIngredients.length > 0 ? (
                    <>
                      <h3 className="text-[20px] text-gray-700 mb-4 text-start font-cursive">Your picks:</h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedIngredients.map((ingredient) => (
                          <div key={ingredient} className="px-3 pb-1 flex items-center gap-2 text-gray-900 border-b-2 border-gray-300">
                            <span className="capitalize">{ingredient}</span>
                            <button onClick={() => removeIngredient(ingredient)} className="text-gray-900 hover:text-blue-800 font-bold" aria-label={`Remove ${ingredient}`}>×</button>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="h-[60px] flex items-center"><p className="text-gray-400 text-sm italic">Select ingredients above to see your picks here</p></div>
                  )}
                </div>
              </div>

              {/* Fridge */}
              <div role="tabpanel" id="fridge-panel" aria-labelledby="fridge-tab" className={activeTab === 'fridge' ? 'block' : 'hidden'}>
                <div className="text-center">
                  <h2 className="text-[20px] text-gray-700 mb-6 text-start font-cursive">Upload a photo of your fridge contents</h2>
                  <p className="text-gray-600 mb-6 text-sm">Drop an image here or click to browse. PNG/JPG/WEBP up to 8MB.</p>

                  <div className="mb-6">
                    {!uploadedImageUrl ? (
                      <div className={`border-2 border-dashed rounded-lg p-8 transition-all duration-200 cursor-pointer ${imageFile ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'}`} onDrop={handleDrop} onDragOver={handleDragOver} onClick={() => document.getElementById('image-input').click()}>
                        <input id="image-input" type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
                        {imageFile ? (
                          <div className="text-center">
                            <div className="mx-auto w-24 h-24 mb-4 relative">
                              <img src={URL.createObjectURL(imageFile)} alt="Preview" className="w-full h-full object-cover rounded-lg" />
                            </div>
                            <p className="text-sm text-gray-600 mb-2">{imageFile.name} ({(imageFile.size / 1024 / 1024).toFixed(2)} MB)</p>
                            <button onClick={(e) => { e.stopPropagation(); setImageFile(null); }} className="text-red-600 hover:text-red-800 text-sm font-medium">Remove</button>
                          </div>
                        ) : (
                          <div className="text-center">
                            <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" stroke="currentColor" fill="none" viewBox="0 0 48 48"><path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" /></svg>
                            <p className="text-gray-600 mb-2"><span className="font-medium text-blue-600">Click to upload</span> or drag and drop</p>
                            <p className="text-xs text-gray-500">PNG, JPG, WEBP up to 8MB</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center">
                        <div className="mx-auto w-32 h-32 mb-4 relative"><img src={uploadedImageUrl} alt="Uploaded" className="w-full h-full object-cover rounded-lg" /></div>
                        <p className="text-sm text-gray-600 mb-4">Image uploaded successfully!</p>
                        <div className="flex justify-center space-x-2">
                          <button onClick={() => setUploadedImageUrl('')} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500">Upload Another</button>
                          <button onClick={retryWebhook} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500">Retry Webhook</button>
                          {pendingImageID && (
                            <button onClick={() => pollForIngredients(pendingImageID)} disabled={isPolling} className={`px-4 py-2 text-sm font-medium text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${isPolling ? 'bg-gray-400 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700'}`}>
                              {isPolling ? 'Fetching…' : 'Fetch Ingredients'}
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    {imageFile && !uploadedImageUrl && (
                      <div className="mt-4">
                        <button onClick={uploadImage} disabled={isUploading} className={`px-6 py-3 text-sm font-medium text-white rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${isUploading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 active:scale-95'}`}>
                          {isUploading ? (
                            <span className="inline-flex items-center gap-2"><span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> Uploading...</span>
                          ) : 'Upload & Analyze'}
                        </button>
                        {isUploading && (
                          <div className="mt-3 w-full bg-gray-200 rounded-full h-2"><div className="bg-blue-600 h-2 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} /></div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {activeTab === 'manually-pick' && (
              <div className="text-center">
                <AIButton isLoading={isLoading} disabled={!isFormValid || isLoading} onClick={handleSubmit} />
              </div>
            )}
          </div>
        </div>

        {/* Recipe Result */}
        <ResultCard loading={isLoading} error={error} data={result} onShareAction={handleShareAction} />
      </div>

      <style>{`
        @keyframes glow { 0%,100% { box-shadow: 0 10px 24px rgba(14,165,233,.18); } 50% { box-shadow: 0 12px 30px rgba(234,179,8,.25); } }
        @keyframes sheen { 0% { transform: translateX(-20%); opacity: 0; } 40% { opacity: .7; } 100% { transform: translateX(220%); opacity: 0; } }
        .animate-glow { animation: glow 2.2s ease-in-out infinite; }
        .group:hover .group-hover\\:animate-sheen { animation: sheen .9s ease-in-out 1; }
        .ingredient-category { position: relative; overflow: visible; }
        .ingredient-dropdown { position: absolute; z-index: 9999; min-width: 100%; left: 0; right: 0; pointer-events: auto; }
        .ingredient-dropdown * { pointer-events: auto; }
      `}</style>
    </div>
  );
};

function SparkleIcon({ className = 'h-5 w-5' }) {
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
      aria-busy={isLoading ? 'true' : 'false'}
      className={[
        'group relative inline-flex items-center gap-2 rounded-full px-6 py-3',
        'text-white font-semibold transition-all duration-300',
        'focus:outline-none focus-visible:ring-4 focus-visible:ring-teal-300/50',
        disabled ? 'opacity-60 cursor-not-allowed bg-slate-400' : 'shadow-lg hover:shadow-xl active:scale-95',
        disabled ? '' : 'bg-gradient-to-r from-orange-400 via-amber-300 to-teal-500',
        !disabled && !isLoading ? 'animate-glow' : ''
      ].join(' ')}
    >
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
      <span className="whitespace-nowrap">{isLoading ? 'Generating with AI…' : 'What to cook AI?'}</span>
    </button>
  );
}

export default What2Cook;

 