/**
 * Google Places API Service
 * Busca automática de profissionais para prospecção
 */

const axios = require('axios');

const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY;
const PLACES_API_BASE = 'https://places.googleapis.com/v1';

/**
 * Busca profissionais por categoria e localização usando New Places API (2024)
 * @param {string} category - Categoria do profissional (ex: 'Eletricista', 'Encanador')
 * @param {string} location - Localização (ex: 'São Paulo, SP')
 * @param {number} maxResults - Máximo de resultados (default: 20)
 * @returns {Promise<Array>} Lista de profissionais encontrados
 */
async function searchProfessionals(category, location, maxResults = 20) {
  try {
    if (!GOOGLE_PLACES_API_KEY) {
      throw new Error('GOOGLE_PLACES_API_KEY não configurada');
    }

    // Text Search (New API) - mais preciso que a antiga versão
    const response = await axios.post(
      `${PLACES_API_BASE}/places:searchText`,
      {
        textQuery: `${category} em ${location}`,
        languageCode: 'pt-BR',
        maxResultCount: Math.min(maxResults, 20), // Limite da API
        locationBias: {
          circle: {
            center: await geocodeLocation(location),
            radius: 50000.0, // 50km de raio
          },
        },
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': GOOGLE_PLACES_API_KEY,
          'X-Goog-FieldMask':
            'places.id,places.displayName,places.formattedAddress,places.nationalPhoneNumber,places.internationalPhoneNumber,places.websiteUri,places.rating,places.userRatingCount,places.googleMapsUri,places.businessStatus',
        },
      }
    );

    const places = response.data.places || [];

    return places.map(place => ({
      placeId: place.id,
      name: place.displayName?.text || 'Nome não disponível',
      address: place.formattedAddress || '',
      phone: place.nationalPhoneNumber || place.internationalPhoneNumber || '',
      website: place.websiteUri || '',
      rating: place.rating || 0,
      reviewCount: place.userRatingCount || 0,
      googleMapsUrl: place.googleMapsUri || '',
      businessStatus: place.businessStatus || 'OPERATIONAL',
      category,
      location,
      source: 'google_places_api',
      fetchedAt: new Date().toISOString(),
    }));
  } catch (error) {
    console.error(
      'Erro ao buscar profissionais no Google Places:',
      error.response?.data || error.message
    );

    // Retorna array vazio em caso de erro para não quebrar o fluxo
    return [];
  }
}

/**
 * Geocodifica um endereço para obter lat/lng
 * @param {string} location - Localização em texto (ex: 'São Paulo, SP')
 * @returns {Promise<Object>} { latitude, longitude }
 */
async function geocodeLocation(location) {
  try {
    // Usa Geocoding API do Google
    const response = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
      params: {
        address: location,
        key: GOOGLE_PLACES_API_KEY,
      },
    });

    if (response.data.results && response.data.results.length > 0) {
      const { lat, lng } = response.data.results[0].geometry.location;
      return { latitude: lat, longitude: lng };
    }

    // Fallback: coordenadas de São Paulo
    return { latitude: -23.5505, longitude: -46.6333 };
  } catch (error) {
    console.error('Erro ao geocodificar localização:', error.message);
    // Fallback: coordenadas de São Paulo
    return { latitude: -23.5505, longitude: -46.6333 };
  }
}

/**
 * Busca detalhes completos de um local (Place Details API)
 * @param {string} placeId - ID do local do Google Places
 * @returns {Promise<Object>} Detalhes completos do local
 */
async function getPlaceDetails(placeId) {
  try {
    if (!GOOGLE_PLACES_API_KEY) {
      throw new Error('GOOGLE_PLACES_API_KEY não configurada');
    }

    const response = await axios.get(`${PLACES_API_BASE}/places/${placeId}`, {
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': GOOGLE_PLACES_API_KEY,
        'X-Goog-FieldMask':
          'id,displayName,formattedAddress,nationalPhoneNumber,internationalPhoneNumber,websiteUri,rating,userRatingCount,googleMapsUri,regularOpeningHours,photos,reviews,businessStatus',
      },
    });

    const place = response.data;

    return {
      placeId: place.id,
      name: place.displayName?.text || '',
      address: place.formattedAddress || '',
      phone: place.nationalPhoneNumber || place.internationalPhoneNumber || '',
      website: place.websiteUri || '',
      rating: place.rating || 0,
      reviewCount: place.userRatingCount || 0,
      googleMapsUrl: place.googleMapsUri || '',
      businessStatus: place.businessStatus || 'OPERATIONAL',
      openingHours: place.regularOpeningHours?.weekdayDescriptions || [],
      photos: (place.photos || []).map(photo => ({
        name: photo.name,
        widthPx: photo.widthPx,
        heightPx: photo.heightPx,
      })),
      reviews: (place.reviews || []).slice(0, 5).map(review => ({
        author: review.authorAttribution?.displayName || 'Anônimo',
        rating: review.rating || 0,
        text: review.text?.text || '',
        publishTime: review.publishTime || '',
      })),
      fetchedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Erro ao buscar detalhes do local:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Valida se um telefone é válido (básico)
 * @param {string} phone - Número de telefone
 * @returns {boolean}
 */
function isValidPhone(phone) {
  if (!phone) return false;

  // Remove caracteres não numéricos
  const cleaned = phone.replace(/\D/g, '');

  // Valida: mínimo 10 dígitos (DDD + número)
  return cleaned.length >= 10 && cleaned.length <= 15;
}

/**
 * Filtra profissionais por qualidade mínima
 * @param {Array} professionals - Lista de profissionais
 * @param {Object} filters - Filtros { minRating, minReviews, requirePhone, requireWebsite }
 * @returns {Array} Profissionais filtrados
 */
function filterByQuality(professionals, filters = {}) {
  const { minRating = 3.5, minReviews = 1, requirePhone = true, requireWebsite = false } = filters;

  return professionals.filter(pro => {
    // Rating mínimo
    if (pro.rating < minRating) return false;

    // Número mínimo de reviews
    if (pro.reviewCount < minReviews) return false;

    // Requer telefone válido
    if (requirePhone && !isValidPhone(pro.phone)) return false;

    // Requer website
    if (requireWebsite && !pro.website) return false;

    // Apenas negócios operacionais
    if (pro.businessStatus !== 'OPERATIONAL') return false;

    return true;
  });
}

/**
 * Busca profissionais com filtros de qualidade já aplicados
 * @param {string} category - Categoria do profissional
 * @param {string} location - Localização
 * @param {Object} options - Opções { maxResults, minRating, minReviews }
 * @returns {Promise<Array>} Profissionais de alta qualidade
 */
async function searchQualityProfessionals(category, location, options = {}) {
  const { maxResults = 20, minRating = 4.0, minReviews = 3, requirePhone = true } = options;

  // Busca mais resultados para compensar a filtragem
  const rawResults = await searchProfessionals(category, location, maxResults * 2);

  // Filtra por qualidade
  const filtered = filterByQuality(rawResults, {
    minRating,
    minReviews,
    requirePhone,
    requireWebsite: false,
  });

  // Ordena por rating (maior primeiro)
  filtered.sort((a, b) => {
    const scoreA = a.rating * Math.log10(a.reviewCount + 1);
    const scoreB = b.rating * Math.log10(b.reviewCount + 1);
    return scoreB - scoreA;
  });

  // Retorna até maxResults
  return filtered.slice(0, maxResults);
}

module.exports = {
  searchProfessionals,
  getPlaceDetails,
  searchQualityProfessionals,
  filterByQuality,
  isValidPhone,
};
