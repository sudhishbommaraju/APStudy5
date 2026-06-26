// Vercel serverless entry. Hands every /api/* request to the Express app.
// (Local dev runs server/index.js directly with app.listen.)
import app from '../server/index.js';

export default function handler(req, res) {
  // Safety net in case the platform strips the /api prefix.
  if (!req.url.startsWith('/api')) req.url = '/api' + req.url;
  return app(req, res);
}
