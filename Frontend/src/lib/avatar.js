/**
 * Generate a dicebear avatar URL for an animal
 * @param {string} seed - The seed for avatar generation (usually animal name)
 * @param {string} style - The dicebear style to use (default: 'thumbs')
 * @param {object} options - Additional options for customization
 * @returns {string} The dicebear avatar URL
 */
export function getAnimalAvatar(seed, style = 'thumbs', options = {}) {
  const baseUrl = 'https://api.dicebear.com/7.x';
  const encodedSeed = encodeURIComponent(seed);

  // Build query parameters
  const params = new URLSearchParams();

  // Add custom options
  Object.entries(options).forEach(([key, value]) => {
    params.append(key, value);
  });

  const queryString = params.toString();
  const url = `${baseUrl}/${style}/svg?seed=${encodedSeed}${queryString ? '&' + queryString : ''}`;

  return url;
}

/**
 * Get animal avatar with fallback
 * @param {string} customImage - Custom image URL (optional)
 * @param {string} animalName - Animal name for fallback generation
 * @param {string} style - The dicebear style to use (default: 'thumbs')
 * @returns {string} Image URL (custom or generated)
 */
export function getAnimalAvatarWithFallback(customImage, animalName, style = 'thumbs') {
  return customImage || getAnimalAvatar(animalName, style);
}
