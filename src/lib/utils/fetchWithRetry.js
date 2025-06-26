/**
 * Fetch with retry logic for network resilience.
 * @param {Function} fetchFn - The fetch function to call (should return a Promise).
 * @param {number} retries - Number of retries (default: 3)
 * @param {number} delay - Delay between retries in ms (default: 500)
 * @returns {Promise<any>} - The result of the fetch function
 */
export async function fetchWithRetry(fetchFn, retries = 3, delay = 500) {
  let lastError;
  for (let i = 0; i < retries; i++) {
    try {
      return await fetchFn();
    } catch (err) {
      lastError = err;
      if (i < retries - 1) {
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }
  throw lastError;
}
