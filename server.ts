/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);
const isProd = process.env.NODE_ENV === 'production';

app.use(express.json({ limit: '5mb' }));

/**
 * Execute python cli_bridge with JSON stdin/stdout
 */
function callPythonBridge(action: string, payload: any): Promise<any> {
  return new Promise((resolve, reject) => {
    const pythonProc = spawn('python3', [path.join(process.cwd(), 'cli_bridge.py'), action], {
      env: { ...process.env, PYTHONPATH: process.cwd() },
    });

    let stdoutData = '';
    let stderrData = '';

    pythonProc.stdout.on('data', (data) => {
      stdoutData += data.toString();
    });

    pythonProc.stderr.on('data', (data) => {
      stderrData += data.toString();
    });

    pythonProc.on('close', (code) => {
      if (code !== 0 && !stdoutData.trim()) {
        return reject(new Error(`Python process exited with code ${code}: ${stderrData}`));
      }
      try {
        const parsed = JSON.parse(stdoutData.trim());
        resolve(parsed);
      } catch (err) {
        reject(new Error(`Failed to parse Python response: ${stdoutData || stderrData}`));
      }
    });

    pythonProc.stdin.write(JSON.stringify(payload));
    pythonProc.stdin.end();
  });
}

// ================= API ENDPOINTS =================

// Health check
app.get('/api/health', async (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    platform: 'CodePulse Full-Stack Analyzer',
    version: '1.0.0',
    python_engine: 'online',
    port: PORT,
  });
});

// Run Code Analysis
app.post('/api/analyze', async (req: Request, res: Response) => {
  try {
    const { code, filename, save_to_history } = req.body;
    if (typeof code !== 'string') {
      return res.status(400).json({ error: 'Code must be provided as a string.' });
    }
    const result = await callPythonBridge('analyze', {
      code,
      filename: filename || 'snippet.py',
      save_to_history: save_to_history !== false,
    });
    return res.json(result);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Analysis execution failed.' });
  }
});

// Apply Deterministic Autofix
app.post('/api/autofix', async (req: Request, res: Response) => {
  try {
    const { code, rule_id, line } = req.body;
    const result = await callPythonBridge('autofix', { code, rule_id, line });
    return res.json(result);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Auto-fix failed.' });
  }
});

// List History
app.get('/api/history', async (req: Request, res: Response) => {
  try {
    const search = (req.query.search as string) || '';
    const limit = parseInt((req.query.limit as string) || '50', 10);
    const result = await callPythonBridge('history_list', { search, limit });
    return res.json(result);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to list history.' });
  }
});

// Single Analysis by ID
app.get('/api/history/:id', async (req: Request, res: Response) => {
  try {
    const result = await callPythonBridge('history_get', { id: req.params.id });
    if (result.error) {
      return res.status(404).json(result);
    }
    return res.json(result);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to retrieve analysis.' });
  }
});

// Delete Single Analysis
app.delete('/api/history/:id', async (req: Request, res: Response) => {
  try {
    const result = await callPythonBridge('history_delete', { id: req.params.id });
    return res.json(result);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to delete analysis.' });
  }
});

// Clear All History
app.post('/api/history/clear', async (_req: Request, res: Response) => {
  try {
    const result = await callPythonBridge('history_clear', {});
    return res.json(result);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to clear history.' });
  }
});

// Dashboard Aggregated Stats
app.get('/api/dashboard/stats', async (_req: Request, res: Response) => {
  try {
    const result = await callPythonBridge('dashboard_stats', {});
    return res.json(result);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to calculate dashboard statistics.' });
  }
});

// Compare two analyses
app.post('/api/compare', async (req: Request, res: Response) => {
  try {
    const result = await callPythonBridge('compare', req.body);
    return res.json(result);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Comparison failed.' });
  }
});

// Retrieve Settings
app.get('/api/settings', async (_req: Request, res: Response) => {
  try {
    const result = await callPythonBridge('get_settings', {});
    return res.json(result);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to retrieve settings.' });
  }
});

// Update Settings
app.post('/api/settings', async (req: Request, res: Response) => {
  try {
    const result = await callPythonBridge('update_settings', { settings: req.body });
    return res.json(result);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to update settings.' });
  }
});

// Export Report (CSV / HTML / JSON)
app.get('/api/export/:id/:format', async (req: Request, res: Response) => {
  try {
    const { id, format } = req.params;
    if (format === 'json') {
      const record = await callPythonBridge('history_get', { id });
      return res.json(record);
    } else if (format === 'csv') {
      const result = await callPythonBridge('export_csv', { id });
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=codepulse_${id.slice(0, 8)}.csv`);
      return res.send(result.content);
    } else if (format === 'html') {
      const result = await callPythonBridge('export_html', { id });
      res.setHeader('Content-Type', 'text/html');
      return res.send(result.content);
    } else {
      return res.status(400).json({ error: `Unsupported format '${format}'.` });
    }
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Export generation failed.' });
  }
});

// Sample Code Loader
app.get('/api/samples/:name', (req: Request, res: Response) => {
  const sampleMap: Record<string, string> = {
    clean: path.join(process.cwd(), 'sample_code', 'clean_example.py'),
    issues: path.join(process.cwd(), 'sample_code', 'issues_example.py'),
    complex: path.join(process.cwd(), 'sample_code', 'complex_legacy.py'),
    security: path.join(process.cwd(), 'sample_code', 'security_risks.py'),
  };

  const filePath = sampleMap[req.params.name];
  if (!filePath || !fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Sample not found.' });
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  return res.json({ name: req.params.name, filename: path.basename(filePath), content });
});

// ================= VITE DEV / PROD MIDDLEWARE =================

async function startServer() {
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`CodePulse Full-Stack Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
