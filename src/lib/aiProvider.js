// ╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮
// ┃                   GhostBot — AI PROVIDER                              ┃
// ╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯

const { fetchJson, axiosFetch } = require("./fetcher");
const config = require("../../config");

/**
 * AI Provider abstraction layer
 * Supports: Gemini (default), OpenAI, and custom providers
 */

// ── GEMINI ──────────────────────────────────────────────────────
async function geminiChat(prompt) {
  if (!config.GEMINI_API_KEY) {
    return { ok: false, error: "Gemini API key not configured. Add GEMINI_API_KEY in config.js" };
  }
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${config.GEMINI_API_KEY}`;
    const body = {
      contents: [{ parts: [{ text: prompt }] }],
      safetySettings: [
        { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
      ],
    };
    const result = await axiosFetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      data: body,
    });
    if (!result.ok) return { ok: false, error: result.error };
    const text = result.data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return { ok: false, error: "No response from Gemini" };
    return { ok: true, result: text };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

// ── OPENAI ──────────────────────────────────────────────────────
async function openaiChat(prompt) {
  if (!config.OPENAI_API_KEY) {
    return { ok: false, error: "OpenAI API key not configured. Add OPENAI_API_KEY in config.js" };
  }
  try {
    const result = await axiosFetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.OPENAI_API_KEY}`,
      },
      data: {
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 1000,
        temperature: 0.7,
      },
    });
    if (!result.ok) return { ok: false, error: result.error };
    const text = result.data?.choices?.[0]?.message?.content;
    if (!text) return { ok: false, error: "No response from OpenAI" };
    return { ok: true, result: text };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

// ── MAIN AI FUNCTION ─────────────────────────────────────────────
async function ai(prompt, provider) {
  const useProvider = provider || config.AI_PROVIDER || "gemini";
  switch (useProvider.toLowerCase()) {
    case "openai":
    case "gpt":
      return openaiChat(prompt);
    case "gemini":
    default:
      return geminiChat(prompt);
  }
}

/**
 * Specialized AI functions
 */

// Code assistant
async function codeAI(question) {
  const prompt = `You are an expert programmer. Answer this coding question concisely and helpfully:\n\n${question}`;
  return ai(prompt);
}

// Translate with AI
async function translateAI(text, targetLang) {
  const prompt = `Translate the following text to ${targetLang}. Only respond with the translation, nothing else:\n\n${text}`;
  return ai(prompt);
}

// Explain a topic
async function explainAI(topic) {
  const prompt = `Explain the following topic in a clear, detailed but concise way. Use simple language:\n\n${topic}`;
  return ai(prompt);
}

// Summarize text
async function summarizeAI(text) {
  const prompt = `Summarize the following text in a concise way, capturing the main points:\n\n${text}`;
  return ai(prompt);
}

// Image generation via Gemini (text description of image generation capability)
async function imageAI(prompt) {
  // Note: This uses Gemini's vision-capable model to provide an image-like description
  // For actual image generation, integrate DALL-E or Stable Diffusion API
  if (!config.GEMINI_API_KEY && !config.OPENAI_API_KEY) {
    return {
      ok: true,
      result: `🎨 *Image Prompt Generated*\n\n"${prompt}"\n\nTo generate actual images, add an OPENAI_API_KEY (for DALL-E) or use a dedicated image generation API.`,
    };
  }
  // If OpenAI key available, try DALL-E
  if (config.OPENAI_API_KEY) {
    try {
      const result = await axiosFetch("https://api.openai.com/v1/images/generations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${config.OPENAI_API_KEY}`,
        },
        data: { model: "dall-e-3", prompt, n: 1, size: "1024x1024" },
      });
      if (result.ok && result.data?.data?.[0]?.url) {
        return {
          ok: true,
          result: `🎨 Here's your generated image for: "${prompt}"`,
          imageUrl: result.data.data[0].url,
        };
      }
    } catch (e) {
      // Fall through
    }
  }
  return {
    ok: true,
    result: `🎨 *AI Image Prompt*\n\n"${prompt}"\n\nAdd OPENAI_API_KEY in config.js for DALL-E image generation.`,
  };
}

module.exports = {
  ai,
  codeAI,
  translateAI,
  explainAI,
  summarizeAI,
  imageAI,
  geminiChat,
  openaiChat,
};
