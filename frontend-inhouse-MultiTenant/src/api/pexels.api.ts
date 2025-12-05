
// import { createClient } from "pexels"; // Removed pexels library import

// Ensure you have your Pexels API key in your .env file
// Example: VITE_PEXELS_API_KEY=YOUR_PEXELS_API_KEY
const PEXELS_API_KEY = import.meta.env.VITE_PEXELS_API_KEY;

if (!PEXELS_API_KEY) {
  console.warn(
    "PEXELS_API_KEY is not defined in environment variables. Image search will not work."
  );
}

// const client = PEXELS_API_KEY ? createClient(PEXELS_API_KEY) : null; // Removed pexels client creation

export const searchPexelsImages = async (query: string, perPage: number = 6) => {
  if (!PEXELS_API_KEY) { // Check for API key directly
    return { photos: [], total_results: 0 };
  }

  try {
    const response = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=${perPage}`,
      {
        headers: {
          Authorization: PEXELS_API_KEY,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Pexels API error: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error searching Pexels images:", error);
    return { photos: [], total_results: 0 };
  }
};

