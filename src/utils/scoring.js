/**
 * Parse MM:SS time string into total seconds
 * @param {string} timeStr - Time in format "MM:SS" or "M:SS"
 * @returns {number} Total seconds, or null if invalid
 */
export function parseTimeToSeconds(timeStr) {
  if (!timeStr || typeof timeStr !== 'string') return null;
  
  const parts = timeStr.trim().split(':');
  if (parts.length !== 2) return null;
  
  const minutes = parseInt(parts[0], 10);
  const seconds = parseInt(parts[1], 10);
  
  if (isNaN(minutes) || isNaN(seconds) || minutes < 0 || seconds < 0 || seconds >= 60) {
    return null;
  }
  
  return minutes * 60 + seconds;
}

/**
 * Format seconds into MM:SS string
 * @param {number} totalSeconds - Total seconds
 * @returns {string} Formatted time string "MM:SS"
 */
export function formatSecondsToTime(totalSeconds) {
  if (totalSeconds === null || totalSeconds === undefined || isNaN(totalSeconds)) {
    return '0:00';
  }
  
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Calculate multiplier for weight events (UserLift / UserBodyweight)
 * @param {number} userLift - Weight lifted in lbs
 * @param {number} userBodyweight - User's bodyweight in lbs
 * @returns {number} Multiplier (xBW), or null if invalid
 */
export function calculateMultiplier(userLift, userBodyweight) {
  if (!userLift || !userBodyweight || userBodyweight <= 0) {
    return null;
  }
  return userLift / userBodyweight;
}

/**
 * Calculate score with interpolation between thresholds
 * @param {number} userValue - The calculated value (multiplier or absolute)
 * @param {object} thresholds - Object with basic, athletic, elite values
 * @param {string} logic - 'higher' or 'lower'
 * @returns {number} Score from 0-100
 */
export function calculateScore(userValue, thresholds, logic) {
  if (userValue === null || userValue === undefined || isNaN(userValue)) {
    return 0;
  }
  
  const { basic, athletic, elite } = thresholds;
  const isHigherBetter = logic === 'higher';
  
  if (isHigherBetter) {
    // Higher is better
    if (userValue < basic) {
      // Below basic: 0-33 points (linear interpolation from 0 to basic)
      return Math.max(0, Math.min(33, (userValue / basic) * 33));
    } else if (userValue < athletic) {
      // Between basic and athletic: 33-66 points
      const progress = (userValue - basic) / (athletic - basic);
      return 33 + (progress * 33);
    } else if (userValue < elite) {
      // Between athletic and elite: 66-100 points
      const progress = (userValue - athletic) / (elite - athletic);
      return 66 + (progress * 34);
    } else {
      // At or above elite: 100 points (can extend beyond for exceptional performance)
      const excess = userValue - elite;
      const maxExcess = elite * 0.2; // 20% above elite = bonus
      return Math.min(100, 100 + (excess / maxExcess) * 10);
    }
  } else {
    // Lower is better
    if (userValue > basic) {
      // Below basic: 0-33 points
      return Math.max(0, Math.min(33, (basic / userValue) * 33));
    } else if (userValue > athletic) {
      // Between basic and athletic: 33-66 points
      const progress = (basic - userValue) / (basic - athletic);
      return 33 + (progress * 33);
    } else if (userValue > elite) {
      // Between athletic and elite: 66-100 points
      const progress = (athletic - userValue) / (athletic - elite);
      return 66 + (progress * 34);
    } else {
      // At or below elite: 100 points (can extend beyond for exceptional performance)
      const excess = elite - userValue;
      const maxExcess = elite * 0.2; // 20% below elite = bonus
      return Math.min(100, 100 + (excess / maxExcess) * 10);
    }
  }
}

/**
 * Get the standard thresholds for a test
 * @param {object} testData - Test data from standards
 * @param {string} gender - 'male' or 'female'
 * @param {string} ageRange - Age range like '35-39'
 * @returns {object|null} Object with basic, athletic, elite values
 */
export function getThresholds(testData, gender, ageRange) {
  if (!testData || !testData[gender] || !testData[gender][ageRange]) {
    return null;
  }
  return testData[gender][ageRange];
}

/**
 * Calculate the actual value for comparison (handles multiplier vs absolute)
 * @param {object} testData - Test data from standards
 * @param {number|string} userInput - Raw user input (lbs, time string, etc.)
 * @param {number} userBodyweight - User's bodyweight in lbs (for multiplier calculations)
 * @returns {number|null} Calculated value for comparison
 */
export function calculateComparisonValue(testData, userInput, userBodyweight) {
  if (userInput === null || userInput === undefined || userInput === '') {
    return null;
  }
  
  if (testData.calc === 'multiplier') {
    // For weight events, calculate multiplier
    const liftWeight = typeof userInput === 'string' ? parseFloat(userInput) : userInput;
    return calculateMultiplier(liftWeight, userBodyweight);
  } else {
    // For absolute values
    if (testData.unit === 'time') {
      // Parse time string
      if (typeof userInput === 'string') {
        return parseTimeToSeconds(userInput);
      }
      // If already a number, assume it's seconds
      return typeof userInput === 'number' ? userInput : null;
    } else {
      // Other absolute values (reps, ft, meters)
      return typeof userInput === 'string' ? parseFloat(userInput) : userInput;
    }
  }
}

