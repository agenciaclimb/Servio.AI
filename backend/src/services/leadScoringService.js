/**
 * Lead Scoring Service
 * Calcula scores de leads baseado em múltiplos fatores para priorização
 * 
 * Score (0-100) é calculado com base em:
 * - Match de categorias (25%)
 * - Similaridade de localização (20%)
 * - Histórico de engagement (25%)
 * - Recência do contato (20%)
 * - Dados demográficos (10%)
 */

/**
 * Calcula o score de um lead individual
 * @param {Object} lead - Documento do lead
 * @param {Object} prospectProfile - Perfil do prospector (preferências, histórico)
 * @returns {number} Score 0-100
 */
function calculateLeadScore(lead, prospectProfile) {
  if (!lead || !prospectProfile) {
    return 0;
  }

  let score = 0;

  // 25% - Match de categorias
  const categoryMatch = calculateCategoryMatch(lead.category, prospectProfile.preferredCategories);
  score += categoryMatch * 0.25;

  // 20% - Similaridade de localização
  const locationScore = calculateLocationScore(lead.location, prospectProfile.serviceArea);
  score += locationScore * 0.20;

  // 25% - Histórico de engagement
  const engagementScore = calculateEngagementScore(lead, prospectProfile.id);
  score += engagementScore * 0.25;

  // 20% - Recência do contato
  const recencyScore = calculateRecencyScore(lead.createdAt);
  score += recencyScore * 0.20;

  // 10% - Dados demográficos (budget range, company size, etc)
  const demographicScore = calculateDemographicScore(lead, prospectProfile);
  score += demographicScore * 0.10;

  // Retornar score entre 0-100
  return Math.min(100, Math.max(0, Math.round(score)));
}

/**
 * Calcula match de categorias
 * @param {string} leadCategory - Categoria do lead
 * @param {string[]} preferredCategories - Categorias preferidas do prospector
 * @returns {number} Score 0-100
 */
function calculateCategoryMatch(leadCategory, preferredCategories) {
  if (!leadCategory || !preferredCategories || preferredCategories.length === 0) {
    return 50; // Score neutro se sem dados
  }

  if (preferredCategories.includes(leadCategory)) {
    return 100; // Match perfeito
  }

  // Verificar match parcial (subcategorias)
  const leadCategoryBase = leadCategory.split('_')[0];
  if (preferredCategories.some(cat => cat.startsWith(leadCategoryBase))) {
    return 70; // Match parcial
  }

  return 20; // Sem match
}

/**
 * Calcula score de localização
 * @param {Object} leadLocation - Localização do lead {city, state}
 * @param {Object} serviceArea - Área de serviço do prospector {cities: [], maxDistance: number}
 * @returns {number} Score 0-100
 */
function calculateLocationScore(leadLocation, serviceArea) {
  if (!leadLocation || !serviceArea) {
    return 50;
  }

  const { city: leadCity, state: leadState } = leadLocation;

  // Verificar se cidade está na área de serviço
  if (serviceArea.cities && serviceArea.cities.includes(leadCity)) {
    return 100; // Está na área
  }

  // Verificar se estado é o mesmo
  if (leadState === serviceArea.state) {
    return 60; // Mesmo estado, mas fora da área preferida
  }

  return 20; // Fora da área
}

/**
 * Calcula score de engagement (interações históricas)
 * @param {Object} lead - Documento do lead
 * @param {string} prospectorId - ID do prospector
 * @returns {number} Score 0-100
 */
function calculateEngagementScore(lead, prospectorId) {
  if (!lead.activityHistory) {
    return 30; // Lead novo
  }

  // Contar interações com este prospector
  const interactions = lead.activityHistory.filter(
    activity => activity.prospectorId === prospectorId
  ).length;

  // Score cresce com interações: 0 = 30, 1 = 50, 2+ = 80
  if (interactions === 0) return 30;
  if (interactions === 1) return 50;
  if (interactions === 2) return 70;
  return 85; // 3+ interações
}

/**
 * Calcula score de recência
 * @param {Date|number} createdAt - Data de criação do lead
 * @returns {number} Score 0-100
 */
function calculateRecencyScore(createdAt) {
  if (!createdAt) {
    return 40;
  }

  const leadDate = new Date(createdAt).getTime();
  const now = Date.now();
  const ageInDays = (now - leadDate) / (1000 * 60 * 60 * 24);

  // Leads recentes são mais quentes
  if (ageInDays <= 1) return 100; // Menos de 1 dia
  if (ageInDays <= 3) return 85;
  if (ageInDays <= 7) return 70;
  if (ageInDays <= 14) return 55;
  if (ageInDays <= 30) return 40;
  return Math.max(10, 40 - Math.floor(ageInDays / 10)); // Diminui com idade
}

/**
 * Calcula score demográfico
 * @param {Object} lead - Documento do lead
 * @param {Object} prospectProfile - Perfil do prospector
 * @returns {number} Score 0-100
 */
function calculateDemographicScore(lead, prospectProfile) {
  let score = 50; // Default

  // Se há range de budget preferido e lead tem budget
  if (prospectProfile.budgetRange && lead.budget) {
    const { min, max } = prospectProfile.budgetRange;
    if (lead.budget >= min && lead.budget <= max) {
      score = 85;
    } else if (lead.budget > max) {
      score = 70; // Um pouco alto
    } else {
      score = 40; // Muito baixo
    }
  }

  // Bonus por tamanho de empresa se disponível
  if (lead.companySize && prospectProfile.preferredCompanySize) {
    if (lead.companySize === prospectProfile.preferredCompanySize) {
      score = Math.min(100, score + 15);
    }
  }

  return score;
}

/**
 * Calcula scores para múltiplos leads em batch
 * @param {string} prospectorId - ID do prospector
 * @param {Object[]} leads - Array de leads
 * @param {Object} prospectProfile - Perfil do prospector
 * @returns {Array} Array de {leadId, score}
 */
function scoreLeadsBatch(prospectorId, leads, prospectProfile) {
  if (!Array.isArray(leads) || leads.length === 0) {
    return [];
  }

  return leads.map(lead => ({
    leadId: lead.id,
    prospectorId,
    score: calculateLeadScore(lead, prospectProfile),
    scoredAt: new Date().toISOString(),
  }));
}

/**
 * Ordena leads por score (maior primeiro)
 * @param {Object[]} leads - Array de leads com scores
 * @returns {Object[]} Leads ordenados
 */
function rankLeads(leads) {
  if (!Array.isArray(leads)) {
    return [];
  }

  return [...leads].sort((a, b) => {
    const scoreA = a.score || 0;
    const scoreB = b.score || 0;
    return scoreB - scoreA;
  });
}

/**
 * Detecta leads "quentes" (high-intent)
 * @param {string} prospectorId - ID do prospector
 * @param {Object[]} leads - Array de leads
 * @param {number} threshold - Score mínimo (default 80)
 * @returns {Object[]} Leads acima do threshold
 */
function detectHotLeads(prospectorId, leads, threshold = 80) {
  if (!Array.isArray(leads) || leads.length === 0) {
    return [];
  }

  return leads
    .filter(lead => (lead.score || 0) >= threshold)
    .map(lead => ({
      ...lead,
      prospectorId,
      temperature: calculateTemperature(lead.score),
    }));
}

/**
 * Classifica temperatura do lead baseado no score
 * @param {number} score - Score 0-100
 * @returns {string} 'hot' | 'warm' | 'cold'
 */
function calculateTemperature(score) {
  if (score >= 80) return 'hot';
  if (score >= 50) return 'warm';
  return 'cold';
}

/**
 * Calcula análise de score (breakdown dos componentes)
 * @param {Object} lead - Documento do lead
 * @param {Object} prospectProfile - Perfil do prospector
 * @returns {Object} Análise detalhada
 */
function analyzeLeadScore(lead, prospectProfile) {
  const categoryMatch = calculateCategoryMatch(lead.category, prospectProfile.preferredCategories);
  const locationScore = calculateLocationScore(lead.location, prospectProfile.serviceArea);
  const engagementScore = calculateEngagementScore(lead, prospectProfile.id);
  const recencyScore = calculateRecencyScore(lead.createdAt);
  const demographicScore = calculateDemographicScore(lead, prospectProfile);

  const totalScore = calculateLeadScore(lead, prospectProfile);

  return {
    totalScore,
    components: {
      categoryMatch: { value: categoryMatch, weight: 0.25 },
      locationScore: { value: locationScore, weight: 0.20 },
      engagementScore: { value: engagementScore, weight: 0.25 },
      recencyScore: { value: recencyScore, weight: 0.20 },
      demographicScore: { value: demographicScore, weight: 0.10 },
    },
    temperature: calculateTemperature(totalScore),
    recommendation: generateRecommendation(totalScore),
  };
}

/**
 * Gera recomendação de ação baseada no score
 * @param {number} score - Score do lead
 * @returns {string} Recomendação
 */
function generateRecommendation(score) {
  if (score >= 85) {
    return 'Contatar imediatamente - lead muito quente';
  }
  if (score >= 70) {
    return 'Contatar esta semana - lead promissor';
  }
  if (score >= 50) {
    return 'Acompanhar - lead em potencial';
  }
  return 'Baixa prioridade - considerar contatar mais tarde';
}

module.exports = {
  calculateLeadScore,
  scoreLeadsBatch,
  rankLeads,
  detectHotLeads,
  analyzeLeadScore,
  calculateTemperature,
  calculateCategoryMatch,
  calculateLocationScore,
  calculateEngagementScore,
  calculateRecencyScore,
  calculateDemographicScore,
  generateRecommendation,
};
