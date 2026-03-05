/**
 * Swagger UI route — serves interactive API documentation at /api/docs
 * Uses Swagger UI from CDN (zero backend dependencies)
 */
import { Router, Request, Response } from 'express';
import { readFileSync } from 'fs';
import { join } from 'path';

const router = Router();

// Serve the raw OpenAPI spec as JSON (converted from YAML at startup)
let specJson: object | null = null;

function loadSpec(): object {
  if (specJson) return specJson;
  try {
    // Simple YAML-to-JSON for the subset we use (no js-yaml dependency needed)
    const yamlPath = join(__dirname, '../../../docs/openapi.yaml');
    const yamlText = readFileSync(yamlPath, 'utf8');
    // For the Swagger UI, we serve YAML directly — it handles both formats
    // Store raw text and serve as YAML
    specJson = { _raw: yamlText };
    return specJson;
  } catch {
    return { error: 'OpenAPI spec not found' };
  }
}

// Serve the YAML spec directly
router.get('/docs/openapi.yaml', (_req: Request, res: Response) => {
  try {
    const yamlPath = join(__dirname, '../../../docs/openapi.yaml');
    const yamlText = readFileSync(yamlPath, 'utf8');
    res.setHeader('Content-Type', 'text/yaml');
    res.send(yamlText);
  } catch {
    res.status(404).json({ error: 'OpenAPI spec not found' });
  }
});

// Serve Swagger UI (self-contained HTML using CDN)
router.get('/docs', (_req: Request, res: Response) => {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SONATE Platform — API Documentation</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui.css">
  <style>
    html { box-sizing: border-box; overflow-y: scroll; }
    *, *:before, *:after { box-sizing: inherit; }
    body { margin: 0; background: #fafafa; }
    .swagger-ui .topbar { display: none; }
    .swagger-ui .info .title { font-size: 2rem; }
    .custom-header {
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%);
      color: white;
      padding: 16px 24px;
      display: flex;
      align-items: center;
      gap: 12px;
      font-family: system-ui, -apple-system, sans-serif;
    }
    .custom-header h1 { margin: 0; font-size: 1.25rem; font-weight: 600; }
    .custom-header .badge {
      background: #7c3aed;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 0.75rem;
      font-weight: 500;
    }
    .custom-header a {
      color: #93c5fd;
      text-decoration: none;
      margin-left: auto;
      font-size: 0.875rem;
    }
    .custom-header a:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <div class="custom-header">
    <h1>🔐 SONATE Platform API</h1>
    <span class="badge">v2.0.0</span>
    <a href="https://yseeku.com" target="_blank">yseeku.com ↗</a>
  </div>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui-bundle.js"></script>
  <script>
    SwaggerUIBundle({
      url: '/api/docs/openapi.yaml',
      dom_id: '#swagger-ui',
      deepLinking: true,
      presets: [
        SwaggerUIBundle.presets.apis,
        SwaggerUIBundle.SwaggerUIStandalonePreset
      ],
      layout: 'BaseLayout',
      defaultModelsExpandDepth: 1,
      docExpansion: 'list',
      filter: true,
      tryItOutEnabled: true,
    });
  </script>
</body>
</html>`;
  res.setHeader('Content-Type', 'text/html');
  res.send(html);
});

export default router;
