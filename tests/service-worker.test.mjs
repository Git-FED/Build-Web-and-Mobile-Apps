import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { runInNewContext } from 'node:vm';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const serviceWorkerSource = readFileSync(join(ROOT, 'www/sw.js'), 'utf8');

function createWorker({ cachedResponse = null, cacheNames = [] } = {}) {
  const listeners = new Map();
  const fetchCalls = [];
  const deletedCaches = [];
  const cacheWrites = [];
  const networkResponse = {
    clone() {
      return this;
    },
  };
  const caches = {
    open: async (name) => ({
      addAll: async () => {},
      put: async (request, response) => {
        cacheWrites.push({ name, request, response });
      },
    }),
    keys: async () => cacheNames,
    delete: async (name) => {
      deletedCaches.push(name);
      return true;
    },
    match: async () => cachedResponse,
  };
  const self = {
    location: new URL('https://example.test'),
    registration: { scope: 'https://example.test/app/' },
    clients: { claim: async () => {} },
    addEventListener: (type, listener) => listeners.set(type, listener),
    skipWaiting: async () => {},
  };

  runInNewContext(serviceWorkerSource, {
    self,
    caches,
    URL,
    Set,
    Promise,
    fetch: async (request) => {
      fetchCalls.push(request);
      return networkResponse;
    },
  });

  return { listeners, fetchCalls, deletedCaches, cacheWrites };
}

function createEvent(request = undefined) {
  const event = { request, response: null, pending: [] };
  event.waitUntil = (promise) => event.pending.push(Promise.resolve(promise));
  event.respondWith = (promise) => {
    event.response = Promise.resolve(promise);
  };
  return event;
}

test('shell asset URLs are matched as absolute paths and served cache-first', async () => {
  const cachedResponse = { source: 'cache' };
  const worker = createWorker({ cachedResponse });
  const event = createEvent({
    method: 'GET',
    mode: 'no-cors',
    url: 'https://example.test/app/styles.css',
  });

  worker.listeners.get('fetch')(event);

  assert.equal(await event.response, cachedResponse);
  assert.equal(worker.fetchCalls.length, 0);
});

test('activation only deletes stale caches owned by this application', async () => {
  const worker = createWorker({
    cacheNames: [
      'another-app-cache',
      'web2apk-shell-v1',
      'web2apk-runtime-v1',
      'web2apk-shell-v2.0.0',
      'web2apk-runtime-v2.0.0',
    ],
  });
  const event = createEvent();

  worker.listeners.get('activate')(event);
  await Promise.all(event.pending);

  assert.deepEqual(worker.deletedCaches.sort(), ['web2apk-runtime-v1', 'web2apk-shell-v1']);
});

test('stale-while-revalidate waits for runtime cache writes', async () => {
  const worker = createWorker();
  const request = {
    method: 'GET',
    mode: 'no-cors',
    url: 'https://example.test/app/data.json',
  };
  const event = createEvent(request);

  worker.listeners.get('fetch')(event);
  await event.response;
  await Promise.all(event.pending);

  assert.equal(worker.cacheWrites.length, 1);
  assert.equal(worker.cacheWrites[0].name, 'web2apk-runtime-v2.0.0');
  assert.equal(worker.cacheWrites[0].request, request);
});

test('network-first navigation waits for its runtime cache write', async () => {
  const worker = createWorker();
  const request = {
    method: 'GET',
    mode: 'navigate',
    url: 'https://example.test/app/page',
  };
  const event = createEvent(request);

  worker.listeners.get('fetch')(event);
  await event.response;
  await Promise.all(event.pending);

  assert.equal(worker.cacheWrites.length, 1);
  assert.equal(worker.cacheWrites[0].name, 'web2apk-runtime-v2.0.0');
  assert.equal(worker.cacheWrites[0].request, request);
});
