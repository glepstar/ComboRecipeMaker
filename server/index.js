import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
const port = process.env.PORT || 3001;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.resolve(__dirname, '../dist');

app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, app: 'Combo Recipe Maker', mode: 'local' });
});

app.use(express.static(distPath));

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) {
    return next();
  }

  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(port, () => {
  console.log(`Combo Recipe Maker server running on http://localhost:${port}`);
});
