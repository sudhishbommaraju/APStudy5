// Vercel serverless entry. All /api/* requests are routed here (see vercel.json)
// and handled by the Express app. Local dev runs server/index.js with app.listen.
import app from '../server/index.js';

export default function handler(req, res) {
  // The Express routes are defined under /api/*; make sure the app sees that
  // prefix regardless of how the platform passes the path.
  if (!req.url || !req.url.startsWith('/api')) {
    req.url = '/api' + (req.url && req.url !== '/' ? req.url : '');
  }
  return app(req, res);
}
