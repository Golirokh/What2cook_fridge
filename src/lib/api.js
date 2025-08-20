import { supabase } from './supabase'

const viteEnv = (typeof import.meta !== 'undefined' && import.meta.env) ? import.meta.env : undefined
export const N8N_WEBHOOK_URL = (viteEnv && viteEnv.VITE_N8N_WEBHOOK_URL) || process.env.REACT_APP_N8N_WEBHOOK_URL

if (!N8N_WEBHOOK_URL) {
  throw new Error('Missing N8N webhook URL environment variable. Please set REACT_APP_N8N_WEBHOOK_URL in your .env (or VITE_N8N_WEBHOOK_URL if using Vite), then restart the dev server.')
}

// Optional dedicated webhooks (fallback to the main webhook if not provided)
const INSTAGRAM_WEBHOOK_URL = (viteEnv && viteEnv.VITE_N8N_INSTAGRAM_WEBHOOK_URL) || process.env.REACT_APP_N8N_INSTAGRAM_WEBHOOK_URL || N8N_WEBHOOK_URL
const EMAIL_WEBHOOK_URL = (viteEnv && viteEnv.VITE_N8N_EMAIL_WEBHOOK_URL) || process.env.REACT_APP_N8N_EMAIL_WEBHOOK_URL || N8N_WEBHOOK_URL

export const startRecipeJob = async ({ jobId, cuisines, ingredients, title }) => {
  try {
    const response = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jobId,
        cuisines,
        ingredients,
        title: title || 'AI Recipe Request'
      })
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    // Webhook should respond quickly; ignore body if not needed
    let json = null
    try { json = await response.json() } catch (_) {}
    return json
  } catch (error) {
    console.error('Error starting recipe job:', error)
    throw error
  }
}

export const shareOnInstagram = async ({ recipeId }) => {
  try {
    const response = await fetch(INSTAGRAM_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'share_instagram', recipeId })
    })
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    return true
  } catch (error) {
    console.error('Error sharing to Instagram:', error)
    throw error
  }
}

export const sendRecipeEmail = async ({ recipeId }) => {
  try {
    const response = await fetch(EMAIL_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'send_email', recipeId })
    })
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    return true
  } catch (error) {
    console.error('Error sending recipe email:', error)
    throw error
  }
}

export const signIfNeeded = async ({ image_url, image_path, bucket = 'recipe-public', expiresIn = 600 }) => {
  try {
    // If we have a direct image_url, return it as-is
    if (image_url && !image_url.includes('supabase.co')) {
      return image_url
    }

    // If we have an image_path, try to get a signed URL
    if (image_path) {
      const { data, error } = await supabase.storage
        .from(bucket)
        .createSignedUrl(image_path, expiresIn)

      if (error) {
        console.warn('Failed to create signed URL:', error)
        // Fallback to public URL if signing fails
        const { data: publicData } = await supabase.storage
          .from(bucket)
          .getPublicUrl(image_path)
        return publicData.publicUrl
      }

      return data.signedUrl
    }

    // If we have a Supabase image_url, try to extract path and sign it
    if (image_url && image_url.includes('supabase.co')) {
      // Extract the file path from the URL (best-effort)
      const url = new URL(image_url)
      const parts = url.pathname.split('/')
      const maybePath = parts.slice(parts.indexOf('object') + 1).join('/') || parts.slice(-2).join('/')

      const { data, error } = await supabase.storage
        .from(bucket)
        .createSignedUrl(maybePath, expiresIn)

      if (error) {
        console.warn('Failed to create signed URL:', error)
        return image_url // Return original URL as fallback
      }

      return data.signedUrl
    }

    return image_url || null
  } catch (error) {
    console.error('Error signing image URL:', error)
    return image_url || null
  }
}
