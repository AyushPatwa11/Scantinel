/**
 * Validates incoming scan request body.
 * Ensures URL is present, is a string, and resembles a valid hostname or URL.
 */
function validateScanRequest(req, res, next) {
  const { url } = req.body || {};

  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'URL is required and must be a string.' });
  }

  const trimmed = url.trim();

  if (trimmed.length < 3 || trimmed.length > 2000) {
    return res.status(400).json({ error: 'URL must be between 3 and 2000 characters.' });
  }

  // Block localhost / private IP scanning
  const blocked = [
    /^localhost/i,
    /^127\.\d+\.\d+\.\d+/,
    /^10\.\d+\.\d+\.\d+/,
    /^172\.(1[6-9]|2\d|3[01])\.\d+\.\d+/,
    /^192\.168\.\d+\.\d+/,
    /^0\.0\.0\.0/,
    /^::1$/,
    /^fd[0-9a-f]{2}:/i
  ];

  for (const pattern of blocked) {
    if (pattern.test(trimmed)) {
      return res.status(400).json({ error: 'Scanning private/internal IP addresses is not permitted.' });
    }
  }

  // Ensure it looks like a URL or domain
  const looksLikeUrl = /^(https?:\/\/)?([a-z0-9]([a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}(\/.*)?$/i.test(trimmed);
  if (!looksLikeUrl) {
    return res.status(400).json({ error: 'Please enter a valid domain name or URL (e.g. example.com or https://example.com).' });
  }

  req.body.url = trimmed;
  next();
}

module.exports = { validateScanRequest };
