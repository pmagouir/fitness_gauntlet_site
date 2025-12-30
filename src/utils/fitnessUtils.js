import { cn } from './cn';

/**
 * Get age range from age
 */
export function getAgeRange(age) {
  if (age >= 21 && age <= 34) return '21-34';
  if (age >= 35 && age <= 39) return '35-39';
  if (age >= 40 && age <= 44) return '40-44';
  if (age >= 45 && age <= 49) return '45-49';
  return '50+';
}

/**
 * Calculate performance level for a test result
 */
export function calculateLevel(testData, gender, ageRange, result) {
  const standards = testData[gender]?.[ageRange];
  if (!standards) return null;

  const { basic, athletic, elite } = standards;
  const isHighBetter = testData.type === 'high';

  if (isHighBetter) {
    if (result >= elite) return 'elite';
    if (result >= athletic) return 'athletic';
    if (result >= basic) return 'basic';
    return 'below';
  } else {
    if (result <= elite) return 'elite';
    if (result <= athletic) return 'athletic';
    if (result <= basic) return 'basic';
    return 'below';
  }
}

/**
 * Calculate score (0-100) for a test result
 */
export function calculateScore(testData, gender, ageRange, result) {
  const standards = testData[gender]?.[ageRange];
  if (!standards) return 0;

  const { basic, athletic, elite } = standards;
  const isHighBetter = testData.type === 'high';

  if (isHighBetter) {
    if (result < basic) {
      // Below basic: 0-33
      return Math.max(0, Math.min(33, (result / basic) * 33));
    } else if (result < athletic) {
      // Basic to athletic: 33-66
      const progress = (result - basic) / (athletic - basic);
      return 33 + progress * 33;
    } else if (result < elite) {
      // Athletic to elite: 66-90
      const progress = (result - athletic) / (elite - athletic);
      return 66 + progress * 24;
    } else {
      // Elite and above: 90-100
      const excess = result - elite;
      const maxExcess = elite * 0.2; // 20% above elite = 100
      return 90 + Math.min(10, (excess / maxExcess) * 10);
    }
  } else {
    if (result > basic) {
      // Below basic: 0-33
      return Math.max(0, Math.min(33, (basic / result) * 33));
    } else if (result > athletic) {
      // Basic to athletic: 33-66
      const progress = (basic - result) / (basic - athletic);
      return 33 + progress * 33;
    } else if (result > elite) {
      // Athletic to elite: 66-90
      const progress = (athletic - result) / (athletic - elite);
      return 66 + progress * 24;
    } else {
      // Elite and above: 90-100
      const excess = elite - result;
      const maxExcess = elite * 0.2; // 20% below elite = 100
      return 90 + Math.min(10, (excess / maxExcess) * 10);
    }
  }
}

/**
 * Get level color class
 */
export function getLevelColor(level) {
  switch (level) {
    case 'elite':
      return 'text-purple-600 bg-purple-100';
    case 'athletic':
      return 'text-blue-600 bg-blue-100';
    case 'basic':
      return 'text-green-600 bg-green-100';
    case 'below':
      return 'text-gray-600 bg-gray-100';
    default:
      return 'text-gray-600 bg-gray-100';
  }
}

/**
 * Format result with unit
 */
export function formatResult(result, unit) {
  if (result === null || result === undefined) return '—';
  
  if (unit === 'xBW') {
    return `${result.toFixed(2)}x`;
  } else if (unit === 'sec') {
    const minutes = Math.floor(result / 60);
    const seconds = Math.floor(result % 60);
    return minutes > 0 ? `${minutes}:${seconds.toString().padStart(2, '0')}` : `${seconds}s`;
  } else if (unit === 'ft') {
    return `${result.toFixed(1)}ft`;
  } else if (unit === 'meters') {
    return `${result}m`;
  } else {
    return result.toString();
  }
}

