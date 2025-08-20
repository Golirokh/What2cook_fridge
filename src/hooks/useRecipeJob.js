import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { startRecipeJob, signIfNeeded } from '../lib/api'

export const useRecipeJob = () => {
  const [jobId, setJobId] = useState(null)
  const [result, setResult] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  
  const timeoutRef = useRef(null)
  const channelRef = useRef(null)
  const pollTimeoutRef = useRef(null)

  const cleanup = useCallback(() => {
    // Clear timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }

    // Clear poll timeout
    if (pollTimeoutRef.current) {
      clearTimeout(pollTimeoutRef.current)
      pollTimeoutRef.current = null
    }

    // Remove Supabase channel
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current)
      channelRef.current = null
    }
  }, [])

  const pollOnce = useCallback(async (id) => {
    try {
      const { data, error: pollError } = await supabase
        .from('tb_recipes')
        .select('*')
        .eq('request_id', id)
        .single()

      if (pollError) {
        console.warn('Poll failed:', pollError)
        return
      }

      if (data && data.status === 'ready') {
        // Sign the image URL if needed
        const signedImageUrl = await signIfNeeded({
          image_url: data.display_image_url || data.image_url,
          image_path: data.image_path
        })

        setResult({
          ...data,
          display_image_url: signedImageUrl
        })
        setIsLoading(false)
        setError(null)
        cleanup()
      } else if (data && data.status === 'error') {
        setError(data.error_message || 'Recipe generation failed')
        setIsLoading(false)
        cleanup()
      }
    } catch (pollErr) {
      console.warn('Poll error:', pollErr)
    }
  }, [cleanup])

  const start = useCallback(async ({ cuisines, ingredients }) => {
    // Reset state
    setResult(null)
    setError(null)
    setIsLoading(true)

    // Generate new job ID
    const newJobId = crypto.randomUUID()
    setJobId(newJobId)

    console.log('Starting recipe job with ID:', newJobId)

    try {
      // Subscribe to Supabase Realtime for this job
      const channel = supabase
        .channel(`recipes-${newJobId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'tb_recipes',
            filter: `request_id=eq.${newJobId}`
          },
          async (payload) => {
            console.log('Realtime update received:', payload)
            
            if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
              const data = payload.new
              console.log('Processing data:', data)
              
              if (data.status === 'ready') {
                console.log('Recipe ready, processing result...')
                // Sign the image URL if needed
                const signedImageUrl = await signIfNeeded({
                  image_url: data.display_image_url || data.image_url,
                  image_path: data.image_path
                })

                setResult({
                  ...data,
                  display_image_url: signedImageUrl
                })
                setIsLoading(false)
                setError(null)
                cleanup()
              } else if (data.status === 'error') {
                console.log('Recipe error:', data.error_message)
                setError(data.error_message || 'Recipe generation failed')
                setIsLoading(false)
                cleanup()
              } else {
                console.log('Status update:', data.status)
              }
            }
          }
        )
        .subscribe((status) => {
          console.log('Realtime subscription status:', status)
          if (status === 'SUBSCRIBED') {
            console.log('Successfully subscribed to Realtime channel')
          } else if (status === 'CHANNEL_ERROR') {
            console.error('Realtime channel error')
          }
        })

      channelRef.current = channel

      // Start the recipe job
      console.log('Calling n8n webhook...')
      await startRecipeJob({
        jobId: newJobId,
        cuisines,
        ingredients,
        title: 'AI Recipe Request'
      })
      console.log('Webhook called successfully')

      // Check if the row was created (debug Realtime issues)
      setTimeout(async () => {
        try {
          const { data: checkData, error: checkError } = await supabase
            .from('tb_recipes')
            .select('*')
            .eq('request_id', newJobId)
            .single()
          
          if (checkError) {
            console.log('Row check error:', checkError)
          } else {
            console.log('Row found in DB:', checkData)
            console.log('Current status:', checkData.status)
            
            // If the row is already ready/error, process it immediately
            if (checkData.status === 'ready') {
              console.log('Row already ready, processing immediately...')
              const signedImageUrl = await signIfNeeded({
                image_url: checkData.display_image_url || checkData.image_url,
                image_path: checkData.image_path
              })

              setResult({
                ...checkData,
                display_image_url: signedImageUrl
              })
              setIsLoading(false)
              setError(null)
              cleanup()
            } else if (checkData.status === 'error') {
              console.log('Row already has error, showing error...')
              setError(checkData.error_message || 'Recipe generation failed')
              setIsLoading(false)
              cleanup()
            }
          }
        } catch (err) {
          console.log('Row check failed:', err)
        }
      }, 2000) // Check after 2 seconds

      // Set timeout for 3.5 minutes
      timeoutRef.current = setTimeout(async () => {
        console.log('Timeout reached, polling once...')
        await pollOnce(newJobId)
        
        // If still loading after poll, show timeout message
        if (isLoading) {
          setError('Recipe is still being generated. This can take a few minutes. You can try again or wait a bit longer.')
          setIsLoading(false)
          cleanup()
        }
      }, 3.5 * 60 * 1000) // 3.5 minutes

    } catch (err) {
      console.error('Error starting recipe job:', err)
      setError('Failed to start recipe generation. Please try again.')
      setIsLoading(false)
      cleanup()
    }
  }, [isLoading, pollOnce, cleanup])

  // Cleanup on unmount
  useEffect(() => {
    return cleanup
  }, [cleanup])

  return {
    jobId,
    result,
    isLoading,
    error,
    start
  }
}
