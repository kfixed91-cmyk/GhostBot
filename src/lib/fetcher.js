// ╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮
// ┃                     GhostBot — HTTP FETCHER                           ┃
// ╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯

const axios = require("axios");
const fetch = require("node-fetch");
const chalk = require("chalk");

// Axios-based fetch (more reliable)
async function axiosFetch(url, options = {}) {
  try {
    const response = await axios({
      url,
      method: options.method || "GET",
      headers: options.headers || {},
      data: options.body || options.data || null,
      responseType: options.responseType || "json",
      timeout: options.timeout || 30000,
    });
    return { ok: true, data: response.data, status: response.status };
  } catch (e) {
    console.error(chalk.red(`[FETCH ERROR] ${url} — ${e.message}`));
    return { ok: false, error: e.message, status: e.response?.status || 0 };
  }
}

// node-fetch for buffer downloads
async function fetchBuffer(url, options = {}) {
  try {
    const res = await fetch(url, {
      headers: options.headers || { "User-Agent": "DEMON-BOT-V7/1.0" },
      ...options,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const buffer = await res.buffer();
    return { ok: true, buffer, contentType: res.headers.get("content-type") };
  } catch (e) {
    console.error(chalk.red(`[BUFFER ERROR] ${url} — ${e.message}`));
    return { ok: false, error: e.message };
  }
}

// Fetch JSON
async function fetchJson(url, options = {}) {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "DEMON-BOT-V7/1.0", ...options.headers },
      ...options,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    return { ok: true, data: json };
  } catch (e) {
    console.error(chalk.red(`[JSON ERROR] ${url} — ${e.message}`));
    return { ok: false, error: e.message };
  }
}

module.exports = {
  axiosFetch,
  fetchBuffer,
  fetchJson,
};
