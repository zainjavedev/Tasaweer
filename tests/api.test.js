import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { startServer, stopServer } from './helpers/server.js';

let srv;

before(async () => {
  srv = await startServer({
    port: 4010,
    env: {
      GEMINI_FAKE: '1',
      // Leave AUTH unset to allow anonymous in tests
      AUTH_USERNAME: '',
      AUTH_PASSWORD: '',
      NODE_ENV: 'production',
    },
  });
});

after(async () => {
  await stopServer(srv?.child);
});

test('auth status: not required when no creds configured', async () => {
  const res = await fetch(`${srv.baseUrl}/api/auth/status`);
  assert.equal(res.ok, true);
  const data = await res.json();
  assert.equal(data.authRequired, false);
});

test('generate image returns data URL (fake)', async () => {
  const res = await fetch(`${srv.baseUrl}/api/gemini/generate`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ prompt: 'a sunny room with a couch' }),
  });
  assert.equal(res.ok, true);
  const data = await res.json();
  assert.match(data.imageUrl, /^data:image\//);
});

test('edit image returns data URL (fake)', async () => {
  // 1x1 white PNG base64 payload without data URL prefix
  const tinyBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGMAAQAABQABDQottAAAAABJRU5ErkJggg==';
  const res = await fetch(`${srv.baseUrl}/api/gemini/edit`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ base64ImageData: tinyBase64, mimeType: 'image/png', prompt: 'enhance' }),
  });
  assert.equal(res.ok, true);
  const data = await res.json();
  assert.match(data.imageUrl, /^data:image\//);
});

