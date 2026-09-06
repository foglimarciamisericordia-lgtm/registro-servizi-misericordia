// Cloudflare Pages Function: /api/kv
// Legge e scrive i dati condivisi (utenti, mezzi, servizi) nel
// database KV collegato al progetto, cosi' sono visibili a tutti
// gli utenti da qualunque dispositivo.
//
// IMPORTANTE: perche' funzioni, nel progetto Cloudflare Pages devi
// creare un namespace KV e collegarlo con il nome "REGISTRO_KV"
// (vedi ISTRUZIONI.md incluso in questo pacchetto).

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const key = url.searchParams.get('key');
  if (!key) {
    return new Response('Parametro "key" mancante', { status: 400 });
  }
  if (!env.REGISTRO_KV) {
    return new Response('Namespace KV "REGISTRO_KV" non collegato al progetto.', { status: 500 });
  }
  const value = await env.REGISTRO_KV.get(key);
  if (value === null) {
    return new Response(null, { status: 204 });
  }
  return new Response(value, {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const key = url.searchParams.get('key');
  if (!key) {
    return new Response('Parametro "key" mancante', { status: 400 });
  }
  if (!env.REGISTRO_KV) {
    return new Response('Namespace KV "REGISTRO_KV" non collegato al progetto.', { status: 500 });
  }
  const body = await request.text();
  await env.REGISTRO_KV.put(key, body);
  return new Response('OK', { status: 200 });
}
