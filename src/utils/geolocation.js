/**
 * IP geolocation utilities for logging user location data
 */

/**
 * Get user's approximate location via IP geolocation
 * @returns {Promise<Object>} Location data including country, region, city
 */
export async function getUserLocation() {
  try {
    // Try multiple free geolocation services for reliability
    const services = [
    const ipinfoApiKey = process.env.IPINFO_API_KEY;
    const services = [
      'https://ipapi.co/json/',
      ipinfoApiKey ? `https://ipinfo.io/json?token=${ipinfoApiKey}` : null,
      'https://api.ipify.org?format=json' // fallback to just IP
    ].filter(Boolean);

    for (const service of services) {
      try {
        const response = await fetch(service);
        if (response.ok) {
          const data = await response.json();
          
          // Normalize response format
          return {
            ip: data.ip || data.query || null,
            country: data.country_name || data.country || null,
            region: data.region || data.regionName || null,
            city: data.city || null,
            timezone: data.timezone || null,
            isp: data.org || data.isp || null,
            source: service
          };
        }
      } catch (err) {
        console.warn(`Geolocation service ${service} failed:`, err);
        continue;
      }
    }
    
    // If all services fail, return null
    return null;
  } catch (error) {
    console.warn('Error getting user location:', error);
    return null;
  }
}

/**
 * Get user location and store it for analytics
 * This is called once per session and cached
 */
let cachedLocation = null;
export async function getCachedUserLocation() {
  if (cachedLocation === null) {
    cachedLocation = await getUserLocation();
  }
  return cachedLocation;
}