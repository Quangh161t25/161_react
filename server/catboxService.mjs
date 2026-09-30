/**
 * Catbox.moe API Integration Service
 * API Documentation: https://catbox.moe/tools.php
 */

export const CATBOX_USERHASH = '457cab18a14302fef9eba0e24';

/**
 * Uploads a base64 encoded file to Catbox.moe
 * @param {Object} options
 * @param {string} options.base64 - Data URL or plain base64 string
 * @param {string} [options.filename] - Name of the file, e.g. "avatar.png"
 * @param {string} [options.mimeType] - MIME type, e.g. "image/png"
 * @returns {Promise<string>} Direct URL to the uploaded file on Catbox
 */
export async function uploadToCatbox({ base64, filename = 'upload.png', mimeType = 'image/png' }) {
  if (!base64 || typeof base64 !== 'string') {
    throw new Error('Invalid base64 data for Catbox upload');
  }

  // Strip data URL prefix if present (e.g. data:image/png;base64,...)
  let cleanBase64 = base64;
  if (base64.includes(';base64,')) {
    const parts = base64.split(';base64,');
    cleanBase64 = parts[1];
    const mimeMatch = parts[0].match(/data:(.*?)$/);
    if (mimeMatch && mimeMatch[1]) {
      mimeType = mimeMatch[1];
    }
  }

  const buffer = Buffer.from(cleanBase64, 'base64');
  const blob = new Blob([buffer], { type: mimeType });

  const form = new FormData();
  form.append('reqtype', 'fileupload');
  form.append('userhash', CATBOX_USERHASH);
  form.append('fileToUpload', blob, filename);

  const res = await fetch('https://catbox.moe/user/api.php', {
    method: 'POST',
    body: form,
  });

  const responseText = await res.text();
  if (!res.ok || !responseText.startsWith('http')) {
    throw new Error(`Catbox upload failed: ${responseText}`);
  }

  return responseText.trim();
}
