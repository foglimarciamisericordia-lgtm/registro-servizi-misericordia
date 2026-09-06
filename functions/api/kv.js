// Cloudflare Pages Function: /api/kv
// Legge e scrive i dati condivisi (utenti, mezzi, servizi) nel
// database KV collegato al progetto. Da qui in poi OGNI richiesta
// deve presentare un token di sessione valido (ottenuto da /api/login):
// senza login riuscito, nessun dato e' leggibile ne' scrivibile.

async function sessioneValida(request, env) {
  const auth = request.headers.get('Authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  if (!token) return false;
  const sessione = await env.REGISTRO_KV.get('session:' + token);
  return !!sessione;
}

export async function onRequestGet(context) {
  const { request, env } = context;
  if (!env.REGISTRO_KV) {
    return new Response('Namespace KV "REGISTRO_KV" non collegato al progetto.', { status: 500 });
  }
  if (!(await sessioneValida(request, env))) {
    return new Response('Non autenticato o sessione scaduta.', { status: 401 });
  }
  const url = new URL(request.url);
  const key = url.searchParams.get('key');
  if (!key) {
    return new Response('Parametro "key" mancante', { status: 400 });
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
  if (!env.REGISTRO_KV) {
    return new Response('Namespace KV "REGISTRO_KV" non collegato al progetto.', { status: 500 });
  }
  if (!(await sessioneValida(request, env))) {
    return new Response('Non autenticato o sessione scaduta.', { status: 401 });
  }
  const url = new URL(request.url);
  const key = url.searchParams.get('key');
  if (!key) {
    return new Response('Parametro "key" mancante', { status: 400 });
  }
  if (key.startsWith('session:')) {
    return new Response('Chiave non consentita.', { status: 403 });
  }
  const body = await request.text();
  await env.REGISTRO_KV.put(key, body);
  return new Response('OK', { status: 200 });
}
