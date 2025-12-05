
import { createClient } from "pexels";

// Ensure you have your Pexels API key in your .env file
// Example: VITE_PEXELS_API_KEY=YOUR_PEXELS_API_KEY
const PEXELS_API_KEY = import.meta.env.VITE_PEXELS_API_KEY;

if (!PEXELS_API_KEY) {
  console.warn(
    "PEXELS_API_KEY is not defined in environment variables. Image search will not work."
  );
}

const client = PEXELS_API_KEY ? createClient(PEXELS_API_KEY) : null;

export const searchPexelsImages = async (query: string, perPage: number = 6) => {
  if (!client) {
    return { photos: [], total_results: 0 };
  }

  try {
    const response = await client.photos.search({ query, per_page: perPage });
    return response;
  } catch (error) {
    console.error("Error searching Pexels images:", error);
    return { photos: [], total_results: 0 };
  }
};
