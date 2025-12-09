const express = require("express");
const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

const router = express.Router();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
  console.error("GEMINI_API_KEY is not defined.");
  // In a real app, you'd want better error handling here.
  // process.exit(1); // This would stop the server. Let's handle it in the request.
}

let genAI;
if (GEMINI_API_KEY) {
  genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
}

router.post("/gemini", async (req, res) => {
  if (!genAI) {
    return res
      .status(500)
      .json({ error: "GEMINI_API_KEY is not configured on the server." });
  }

  try {
    const { model: modelName, prompt } = req.body;

    if (!modelName || !prompt) {
      return res.status(400).json({ error: "Missing model or prompt" });
    }

    const model = genAI.getGenerativeModel({ model: modelName });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    res.json({ text });
  } catch (error) {
    console.error("Error in Gemini proxy:", error);
    res.status(500).json({ error: "Failed to generate content" });
  }
});

module.exports = router;
