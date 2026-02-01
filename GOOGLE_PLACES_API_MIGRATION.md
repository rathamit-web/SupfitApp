# Google Places API Migration Guide

## Problem
The app was using the **deprecated** `google.maps.places.AutocompleteService` which Google disabled for new customers on **March 1st, 2025**.

## Solution
Code has been migrated to use the **new Places API v1** (released in 2024).

## Setup Steps

### 1. Enable APIs in Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select your project
3. Enable the following APIs:
   - **Places API (v1)** - Search by
     - Autocomplete (required for address search)
     - Place details (required for address lookup)
   - **Maps JavaScript API** (optional, only if using maps widget)

### 2. Set API Restrictions

For security, restrict your API key to specific APIs:

1. Go to **Credentials** → **API keys**
2. Click on your API key
3. Under **API restrictions**, select:
   - `places.googleapis.com` (Places API v1)
   - Optionally: `maps.googleapis.com` (if using Maps)
4. Click **Save**

### 3. Set Application Restrictions (Optional but Recommended)

- **For web apps**: Add HTTP referrers (e.g., `https://yourdomain.com/*`)
- **For mobile apps**: Use `SHA-1` and package name restrictions

### 4. Environment Variable

Ensure your environment variables are set:

```bash
EXPO_PUBLIC_GOOGLE_PLACES_API_KEY=AIzaSy...
# or
GOOGLE_MAPS_API_KEY=AIzaSy...
```

### 5. Testing

1. Go to **Personal Details** modal
2. Click **Select from map**
3. Search for an address (e.g., "1600 Pennsylvania Ave")
4. Select a result → address fields auto-fill
5. Click **Save address**

## API Endpoints Used

### Autocomplete Search (Suggestions)
```
POST https://places.googleapis.com/v1/places:autocomplete
Headers:
  Content-Type: application/json
  X-Goog-Api-Key: YOUR_KEY
Body:
  {
    "input": "search query",
    "locationRestriction": { /* optional */ }
  }
```

### Place Details
```
GET https://places.googleapis.com/v1/places/{placeId}?fields=addressComponent,formattedAddress
Headers:
  X-Goog-Api-Key: YOUR_KEY
```

## Troubleshooting

### Error: "ApiNotActivatedMapError"
→ Enable **Places API** in Google Cloud Console

### Error: "API key not valid"
→ Check API restrictions and application restrictions in Cloud Console

### Error: "No results found"
→ Verify `input` parameter is not empty and API is enabled

### No address components returned
→ Ensure `addressComponent` field is included in the place details request

## Migration Benefits

✅ **Modern API** - Uses latest Google Places v1  
✅ **Better reliability** - Supported by Google for years to come  
✅ **No legacy code** - Removed deprecated SDK script loading  
✅ **Improved error messages** - Clear feedback when APIs missing  
✅ **Cross-platform** - Works on web, iOS, Android uniformly  

## References

- [Places API v1 Documentation](https://developers.google.com/maps/documentation/places/web-service/api-keys)
- [Autocomplete API](https://developers.google.com/maps/documentation/places/web-service/autocomplete)
- [Place Details API](https://developers.google.com/maps/documentation/places/web-service/details)
- [Migration Guide](https://developers.google.com/maps/documentation/javascript/places-migration-overview)
