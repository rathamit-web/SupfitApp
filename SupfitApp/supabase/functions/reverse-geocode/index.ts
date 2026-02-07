/**
 * Supabase Edge Function: reverse-geocode
 * 
 * Purpose: Reverse geocode lat/lng to city name for fallback location matching
 * Standard: Google Maps Reverse Geocoding API
 * 
 * Input: { latitude: number, longitude: number }
 * Output: { city_name: string, state: string, country: string, accuracy: string }
 * 
 * Called by: locationService.reverseGeocodeToCity()
 * Used for: Finding city centroid fallback when GPS/address is unavailable
 */

import { serve } from 'https://deno.land/std@0.131.0/http/server.ts';

const GOOGLE_MAPS_API_KEY = Deno.env.get('GOOGLE_MAPS_API_KEY');

serve(async (req: Request) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  try {
    // Parse request body
    const { latitude, longitude } = await req.json();

    // Validate inputs
    if (!latitude || !longitude || typeof latitude !== 'number' || typeof longitude !== 'number') {
      return new Response(
        JSON.stringify({
          error: 'Invalid coordinates. Expected { latitude: number, longitude: number }',
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    if (!GOOGLE_MAPS_API_KEY) {
      return new Response(
        JSON.stringify({
          error: 'Google Maps API key not configured',
        }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    // Call Google Reverse Geocoding API
    const url = 'https://maps.googleapis.com/maps/api/geocode/json';
    const params = new URLSearchParams({
      latlng: `${latitude},${longitude}`,
      key: GOOGLE_MAPS_API_KEY,
      language: 'en',
      result_type: 'administrative_area_level_2', // Prefer city-level results
    });

    const response = await fetch(`${url}?${params.toString()}`);
    const data = await response.json();

    if (data.status !== 'OK' || !data.results || data.results.length === 0) {
      return new Response(
        JSON.stringify({
          error: `Reverse geocoding failed: ${data.status}`,
          city_name: null,
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    // Extract city, state, country from first result
    const result = data.results[0];
    const addressComponents = result.address_components || [];

    let city = null;
    let state = null;
    let country = null;
    let accuracy = 'unknown';

    addressComponents.forEach((component: any) => {
      const types = component.types || [];

      if (types.includes('locality')) {
        city = component.long_name;
        accuracy = 'fine'; // City-level accuracy
      }
      if (types.includes('administrative_area_level_1')) {
        state = component.long_name;
      }
      if (types.includes('country')) {
        country = component.long_name;
      }
    });

    // Fallback to administrative_area_level_2 if no city found
    if (!city) {
      addressComponents.forEach((component: any) => {
        const types = component.types || [];
        if (types.includes('administrative_area_level_2') && !city) {
          city = component.long_name;
          accuracy = 'coarse'; // District/region level
        }
      });
    }

    return new Response(
      JSON.stringify({
        city_name: city || 'Unknown',
        state: state || 'Unknown',
        country: country || 'Unknown',
        accuracy,
        formatted_address: result.formatted_address || null,
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Internal server error',
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
});
