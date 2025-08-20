# What2Cook Setup Guide

## Environment Variables

Create a `.env` file in your project root with the following variables:

```bash
VITE_SUPABASE_URL=https://zhxyxtagwdvqocljizhl.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpoeHl4dGFnd2R2cW9jbGppemhsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM2OTAyMTgsImV4cCI6MjA2OTI2NjIxOH0.ImE-rBvenOIUEpnktr73I2NyA6cMwhDJLVqyBmbjXW0
VITE_N8N_WEBHOOK_URL=https://primevesta.app.n8n.cloud/webhook/Goli/GenRecSupa
```

## Supabase Setup

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Enable Realtime on the `tb_recipes` table
3. Create the `tb_recipes` table with the following structure:

```sql
CREATE TABLE public.tb_recipes (
  request_id uuid PRIMARY KEY,
  status text NOT NULL,
  recipe_json jsonb,
  image_path text,
  image_url text,
  display_image_url text,
  error_message text,
  cuisines text[],
  ingredients text[],
  created_at timestamptz DEFAULT now(),
  finished_at timestamptz
);

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE tb_recipes;
```

4. Create a storage bucket called `recipe-public` (public or private)
5. Set up Row Level Security (RLS) policies as needed

## n8n Setup

1. Create a webhook node in n8n
2. Configure the webhook endpoint to receive POST requests
3. The webhook should expect the following payload:
   ```json
   {
     "jobId": "uuid",
     "cuisines": ["Italian", "Mediterranean"],
     "ingredients": ["tomato", "pasta", "olive oil"],
     "title": "AI Recipe Request"
   }
   ```
4. Configure n8n to:
   - Insert/upsert a row in `tb_recipes` with `status: 'processing'`
   - Generate the recipe using AI
   - Upload the generated image to Supabase Storage
   - Update the row with `status: 'ready'`, recipe data, and image path
   - Handle errors by setting `status: 'error'` and `error_message`

## Running the Application

1. Install dependencies: `npm install`
2. Configure your `.env` file
3. Start the development server: `npm start`

## Features

- **Real-time Updates**: Uses Supabase Realtime to automatically update the UI when recipes are ready
- **Image Handling**: Supports both public and private storage buckets with automatic URL signing
- **Timeout & Fallback**: 3.5-minute timeout with single poll fallback for reliability
- **Error Handling**: Comprehensive error states and user feedback
- **Responsive Design**: Beautiful UI with loading skeletons and result cards
