'use client'

import { createBrowserClient } from '@supabase/ssr'

// Define a singleton to hold the client.
let client: ReturnType<typeof createBrowserClient> | undefined

export function createClient() {
  if (client) {
    return client
  }

  // NOTE: The environment variables are not available on the client side by default.
  // They need to be prefixed with NEXT_PUBLIC_ to be exposed to the browser.
  // In this case, through next.config.ts, we are loading them from .env file.
  client = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  
  return client
}
