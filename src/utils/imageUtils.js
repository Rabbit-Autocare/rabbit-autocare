/**
 * Utility function to get the correct Supabase image URL
 * @param {string} imagePath - The image path or URL
 * @returns {string|null} - The complete image URL or null if no image
 */
export function getSupabaseImageUrl(imagePath) {
  if (!imagePath) return null;
  
  // If it's already a full URL, return as is
  if (imagePath.startsWith('http')) {
    return imagePath;
  }
  
  // If it's a relative path, construct the full Supabase URL
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/product-images/${imagePath}`;
}