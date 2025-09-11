import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';
import { join } from 'node:path';

const NEXT_BIN = 'node_modules/next/dist/bin/next';

async function run(cmd, args = [], opts = {}) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, { stdio: 'inherit', ...opts });
    p.on('exit', (code) => (code === 0 ? resolve(undefined) : reject(new Error(`${cmd} ${args.join(' ')} exited ${code}`))));
    p.on('error', reject);
  });
}

export async function ensureBuilt(cwd = process.cwd()) {
  // Always perform a fresh build so route changes are picked up
  await run('node', [NEXT_BIN, 'build'], { cwd });
}

export async function startServer({ port = 4010, env = {}, cwd = process.cwd() } = {}) {
  await ensureBuilt(cwd);
  const child = spawn('node', [NEXT_BIN, 'start', '-p', String(port)], {
    cwd,
    env: { ...process.env, PORT: String(port), ...env },
    stdio: 'pipe',
  });

  let started = false;
  const logs = [];
  child.stdout.on('data', (d) => logs.push(d.toString()));
  child.stderr.on('data', (d) => logs.push(d.toString()));

  // Poll readiness endpoint
  const baseUrl = `http://localhost:${port}`;
  const deadline = Date.now() + 60_000;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`${baseUrl}/api/auth/status`);
      if (res.ok) { started = true; break; }
    } catch {}
    await delay(500);
  }
  if (!started) {
    try { child.kill('SIGTERM'); } catch {}
    throw new Error(`Next server did not start. Logs:\n${logs.join('')}`);
  }
  return { child, baseUrl };
}

export async function stopServer(child) {
  if (!child) return;
  await new Promise((r) => {
    child.once('exit', () => r(undefined));
    try { child.kill('SIGTERM'); } catch { r(undefined); }
    setTimeout(() => r(undefined), 2000);
  });
}
