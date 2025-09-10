// Shared CORS headers for all Edge Functions
// For production, restrict origins to your actual domains
const allowedOrigins = [
  'https://tailtracker.app',
  'https://www.tailtracker.app',
  'http://localhost:3000',
  'http://localhost:8081', // Expo dev server
  'http://localhost:19006' // Expo web
];

export const corsHeaders = {
  'Access-Control-Allow-Origin': process.env.NODE_ENV === 'development' ? '*' : 'https://tailtracker.app',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, PUT, DELETE, OPTIONS',
}

// Function to get appropriate CORS headers based on origin
export function getCorsHeaders(origin?: string) {
  if (process.env.NODE_ENV === 'development') {
    return corsHeaders;
  }
  
  const allowedOrigin = allowedOrigins.includes(origin || '') ? origin : 'https://tailtracker.app';
  
  return {
    ...corsHeaders,
    'Access-Control-Allow-Origin': allowedOrigin || 'https://tailtracker.app'
  };
}