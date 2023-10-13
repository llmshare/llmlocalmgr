/**
 * Fetches a page and extracts URLs from the JSON response.
 * @returns {Promise<Array<string>>} A promise that resolves to an array of URLs.
 */
export async function fetchPageAndExtractURLs() {
  try {
    const response = await fetch(
      "https://huggingface.co/api/models?author=mlc-ai"
    );

    // Check if the request was successful
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const parsedResponse = await response.json();

    // Use destructuring to extract modelId from each item
    const huggingFaceURLs = parsedResponse.map(
      ({ modelId }) => `https://huggingface.co/${modelId}`
    );

    return huggingFaceURLs;
  } catch (error) {
    console.error(`Failed to fetch page and extract URLs: ${error}`);
    return [];
  }
}
