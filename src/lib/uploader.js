// ╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮
// ┃                   GhostBot — MEDIA UPLOADER                           ┃
// ╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯

const FormData = require("form-data");
const fetch = require("node-fetch");
const { fetchBuffer } = require("./fetcher");
const fs = require("fs-extra");
const path = require("path");
const os = require("os");

/**
 * Upload media to various free hosting services
 */

// Upload to tmpfiles.org (free, no API key needed)
async function uploadToTmpFiles(buffer, filename = "file") {
  try {
    const form = new FormData();
    form.append("file", buffer, { filename });

    const res = await fetch("https://tmpfiles.org/api/v1/upload", {
      method: "POST",
      body: form,
    });

    const data = await res.json();
    if (data?.data?.url) {
      // tmpfiles returns URL like: https://tmpfiles.org/12345/file.png
      // Direct download: https://tmpfiles.org/dl/12345/file.png
      return { ok: true, url: data.data.url.replace("/tmpfiles.org/", "/tmpfiles.org/dl/") };
    }
    return { ok: false, error: "Upload failed" };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

// Upload to file.io (free, no API key needed)
async function uploadToFileIO(buffer, filename = "file") {
  try {
    const form = new FormData();
    form.append("file", buffer, { filename });

    const res = await fetch("https://file.io", {
      method: "POST",
      body: form,
    });

    const data = await res.json();
    if (data?.link) {
      return { ok: true, url: data.link };
    }
    return { ok: false, error: "Upload failed" };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

// Upload to catbox.moe (free, no API key)
async function uploadToCatbox(buffer, filename = "file.png") {
  try {
    const form = new FormData();
    form.append("reqtype", "fileupload");
    form.append("fileToUpload", buffer, { filename });

    const res = await fetch("https://catbox.moe/user/api.php", {
      method: "POST",
      body: form,
    });

    const text = await res.text();
    if (text.startsWith("http")) {
      return { ok: true, url: text.trim() };
    }
    return { ok: false, error: text };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

// Upload to telegraph (for images)
async function uploadToTelegraph(buffer) {
  try {
    const form = new FormData();
    form.append("file", buffer, { filename: "image.png", contentType: "image/png" });

    const res = await fetch("https://telegra.ph/upload", {
      method: "POST",
      body: form,
    });

    const data = await res.json();
    if (data?.[0]?.src) {
      return { ok: true, url: `https://telegra.ph${data[0].src}` };
    }
    return { ok: false, error: "Upload failed" };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

// Main upload function (try multiple services)
async function uploadMedia(buffer, options = {}) {
  const filename = options.filename || `demon_${Date.now()}.${options.ext || "png"}`;

  // Try catbox first (most reliable for WhatsApp)
  const catbox = await uploadToCatbox(buffer, filename);
  if (catbox.ok) return catbox;

  // Try tmpfiles
  const tmpfiles = await uploadToTmpFiles(buffer, filename);
  if (tmpfiles.ok) return tmpfiles;

  // Try file.io
  const fileio = await uploadToFileIO(buffer, filename);
  if (fileio.ok) return fileio;

  return { ok: false, error: "All upload services failed" };
}

// Upload image specifically
async function uploadImage(buffer) {
  const result = await uploadToTelegraph(buffer);
  if (result.ok) return result;
  return uploadMedia(buffer, { ext: "png" });
}

module.exports = {
  uploadMedia,
  uploadImage,
  uploadToTmpFiles,
  uploadToFileIO,
  uploadToCatbox,
  uploadToTelegraph,
};
