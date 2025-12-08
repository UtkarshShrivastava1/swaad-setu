import { GoogleGenerativeAI } from "@google/generative-ai";

// s,? Frontend-only public key (exposed in browser)
const GEMINI_API_KEY = import.meta.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.warn(
    "GEMINI_API_KEY is not defined. Auto-description will not work."
  );
}

const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;

// o. USE A STABLE MODEL THAT ACTUALLY WORKS IN ALL REGIONS
const GEMINI_MODEL_NAME = "gemini-2.5-flash";

export const generateDailyBriefing = async (
  todayRevenue: number,
  todayOrders: number,
  monthlyRevenue: number,
  tablesOccupied: number,
  totalTables: number,
  topItems: { name: string; count: number }[],
  peakHours: { hour: string; orders: number }[]
): Promise<string> => {
  if (!genAI) {
    return "Insights unavailable. API key not configured.";
  }

  const model = genAI.getGenerativeModel({
    model: GEMINI_MODEL_NAME,
  });

  const topItemsString =
    topItems.map((item) => `${item.name} (${item.count} sold)`).join(", ") ||
    "N/A";

  const peakHoursString =
    peakHours
      .filter((h) => h.orders > 0)
      .map((h) => `${h.hour}:00 (${h.orders} orders)`)
      .join(", ") || "N/A";

  const prompt = `
You are an expert restaurant operations analyst AI. Your goal is to provide a single, practical, management-focused insight for the restaurant manager based on today's live data.

Analyze the following data:
- Today's Revenue: ₹${todayRevenue.toLocaleString("en-IN")}
- This Month's Revenue: ₹${monthlyRevenue.toLocaleString("en-IN")}
- Today's Orders: ${todayOrders}
- Table Occupancy: ${tablesOccupied}/${totalTables}
- Busiest Hours Today (orders per hour): ${peakHoursString}
- Top 5 Selling Items Today: ${topItemsString}

Based on this data, generate a single, concise, and practical insight related to **operations, staffing, or inventory management**.
- The insight should be an observation that helps the manager make decisions.
- **Do not provide marketing or promotional suggestions.**
- Keep it under 150 characters.

Good Examples (Management-focused):
- "The evening rush is starting, centered around 8 PM. It might be a good time to check on kitchen stock for your top seller, 'Paneer Butter Masala'."
- "Table occupancy is high, but order volume is average. This could indicate slower service or that guests are staying longer."
- "Today's revenue is strong compared to the monthly trend, primarily driven by a high number of orders during the lunch peak."

Bad Examples (Marketing-focused):
- "Promote 'Paneer Butter Masala' with a discount!"
- "Create a new combo offer to boost sales."

Generate one practical, management-focused insight now.
`;

  try {
    const result = await model.generateContent(prompt);
    const response = result.response;
    let text = response.text() || "";

    // Hard client-side safety
    text = text
      .replace(/[\n"'`]/g, "")
      .replace(/\s+/g, " ")
      .trim();

    if (!text) {
      return "Unable to generate daily briefing.";
    }

    return text;
  } catch (error) {
    console.error("Error generating daily briefing:", error);
    return "Failed to generate daily briefing.";
  }
};

export const generateBillBriefing = async (
  activeBills: number,
  paidToday: number,
  revenueToday: number,
  avgBillValue: number
): Promise<string> => {
  if (!genAI) {
    return "Insights unavailable. API key not configured.";
  }

  const model = genAI.getGenerativeModel({
    model: GEMINI_MODEL_NAME,
  });

  const prompt = `
You are a restaurant bill insights generator.
Summarize today's bill performance in a concise, engaging sentence (100-150 characters), highlighting key metrics.
Include active bills, paid today, total revenue, and average bill value.
Example: "Bill performance is strong! 3 active bills, 12 paid today, generating ,128,540 in revenue with an average bill of ,1359."

Active Bills: ${activeBills}
Paid Today: ${paidToday}
Revenue Today: ,1${revenueToday}
Average Bill Value: ,1${avgBillValue}
`;

  try {
    const result = await model.generateContent(prompt);
    const response = result.response;
    let text = response.text() || "";

    // Hard client-side safety
    text = text
      .replace(/[\n"'`]/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 150); // Limit to 150 characters for a concise summary

    if (!text) {
      return "Unable to generate bill briefing.";
    }

    return text;
  } catch (error) {
    console.error("Error generating bill briefing:", error);
    return "Failed to generate bill briefing.";
  }
};

export const generateMenuItemDescription = async (
  itemName: string
): Promise<string> => {
  if (!genAI || !itemName?.trim()) {
    return `Classic ${itemName?.slice(0, 16) || "Dish"}`;
  }

  const model = genAI.getGenerativeModel({
    model: GEMINI_MODEL_NAME,
  });

  // o. CHARACTER-BASED PROMPT (NOT WORD-BASED)
  const prompt = `
You are a menu description generator for a restaurant SaaS app.

Generate a natural menu description in 50 to 70 characters only.
Rules:
- Do not exceed 70 characters
- Do not repeat the full food name
- No emojis
- No quotes
- No special characters
- Simple Indian food friendly tone
Return only the description text

Food Item: ${itemName}
`;

  try {
    const result = await model.generateContent(prompt);
    const response = result.response;
    let text = response.text() || "";

    // o. HARD CLIENT-SIDE SAFETY
    text = text
      .replace(/[\n"'`]/g, "")
      .replace(/[^\w\s]/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 70);

    if (!text) {
      return `Classic ${itemName.slice(0, 16)}`;
    }

    return text;
  } catch (error) {
    console.error("Error generating menu item description:", error);
    return `Classic ${itemName.slice(0, 16)}`;
  }
};
