// 3D GridWorld — Vite WebSocket Plugin
// Relays Python RL training requests to the browser page via WebSocket.

import type { Plugin } from 'vite';
import { WebSocketServer, WebSocket } from 'ws';

export function gridworldWS(): Plugin {
  let wss: WebSocketServer | null = null;
  let pageSockets: Set<WebSocket> = new Set();

  return {
    name: 'gridworld-ws',

    configureServer() {
      const WS_PORT = 5174;

      wss = new WebSocketServer({ port: WS_PORT });
      console.log(`[GridWorld WS] Listening on ws://0.0.0.0:${WS_PORT}`);

      wss.on('connection', (ws: WebSocket) => {
        ws.on('message', (data: Buffer) => {
          try {
            const msg = JSON.parse(data.toString());

            // Page registration
            if (msg.type === 'register_page') {
              pageSockets.add(ws);
              console.log('[GridWorld WS] Page registered');
              return;
            }

            // Response from page bridge: forward to pending Python ws
            if (msg.type === 'response' && msg.id) {
              const pending = (ws as any)._pending || {};
              const cb = pending[msg.id];
              if (cb) {
                cb(msg.result, msg.error);
                delete pending[msg.id];
              }
              return;
            }

            // Request from Python: forward to first registered page
            if (msg.type === 'request' && msg.method) {
              const target = pageSockets.values().next().value;
              if (!target) {
                ws.send(JSON.stringify({
                  type: 'response', id: msg.id, error: 'no_page_connected',
                }));
                return;
              }

              const reqId = msg.id || Math.random().toString(36).slice(2);

              // Forward to page
              target.send(JSON.stringify({
                type: 'execute', id: reqId,
                method: msg.method, params: msg.params || [],
              }));

              // Wait for page to respond (page will send back on this same ws)
              // Actually page sends back via the bridge ws, which is 'target'
              // But the response goes to target (bridge), not to the Python ws.
              // So we need to intercept: bridge responds on its own ws,
              // we capture it and forward to the Python ws.

              // Instead: store pending callbacks on the target ws
              const timeout = setTimeout(() => {
                ws.send(JSON.stringify({ type: 'response', id: reqId, error: 'timeout' }));
              }, 30000);

              (target as any)._pending = (target as any)._pending || {};
              (target as any)._pending[reqId] = (result: any, error?: string) => {
                clearTimeout(timeout);
                if (error) {
                  ws.send(JSON.stringify({ type: 'response', id: reqId, error }));
                } else {
                  ws.send(JSON.stringify({ type: 'response', id: reqId, result }));
                }
              };
            }
          } catch (e) {
            console.error('[GridWorld WS] Error:', e);
          }
        });

        ws.on('close', () => {
          pageSockets.delete(ws);
        });
      });
    },

    transformIndexHtml() {
      // Only inject bridge script in dev mode (not in production build)
      if (process.env['NODE_ENV'] !== 'production' && process.env['NODE_ENV'] !== 'test') {
        return [
          {
          tag: 'script',
          attrs: { type: 'module' },
          children: `
(function() {
  var ws = null;
  var reconnectTimer = null;

  function connectBridge() {
    if (ws && ws.readyState === WebSocket.OPEN) return;
    try { ws = new WebSocket('ws://' + location.hostname + ':5174'); }
    catch(e) { return; }

    ws.onopen = function() {
      console.log('[GridWorld Bridge] Connected');
      ws.send(JSON.stringify({ type: 'register_page' }));
      if (reconnectTimer) { clearInterval(reconnectTimer); reconnectTimer = null; }
    };

    ws.onmessage = function(event) {
      try {
        var msg = JSON.parse(event.data);
        if (msg.type === 'execute' && msg.method && window.__gridworld) {
          var api = window.__gridworld;
          var parts = msg.method.split('.');
          var fn = api;
          for (var i = 0; i < parts.length; i++) { fn = fn[parts[i]]; }
          if (typeof fn === 'function') {
            try {
              var result = fn.apply(api, msg.params || []);
              ws.send(JSON.stringify({
                type: 'response',
                id: msg.id,
                result: result !== undefined ? JSON.parse(JSON.stringify(result)) : null,
              }));
            } catch(e) {
              ws.send(JSON.stringify({ type: 'response', id: msg.id, error: e.message }));
            }
          } else {
            ws.send(JSON.stringify({ type: 'response', id: msg.id, error: 'method_not_found: ' + msg.method }));
          }
        }
      } catch(e) {
        console.error('[GridWorld Bridge] Error:', e);
      }
    };

    ws.onclose = function() {
      console.log('[GridWorld Bridge] Disconnected');
      ws = null;
      if (!reconnectTimer) { reconnectTimer = setInterval(connectBridge, 3000); }
    };
  }

  var check = setInterval(function() {
    if (window.__gridworld) {
      clearInterval(check);
      connectBridge();
    }
  }, 200);
})();
`,
        },
      ];
      }
      return [];
    },
  };
}
