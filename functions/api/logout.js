// Cloudflare Pages Function: /api/logout
// Invalida il token di sessione lato server.

export async function onRequestPost(context) {
  const { request, env } = context;
  if (!env.REGISTRO_KV) {
    return new Response(JSON.stringify({ errore: 'Namespace KV non collegato al progetto.' }), { status: 500 });
  }
  const auth = request.headers.get('Authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  if (token) {
    await env.REGISTRO_KV.delete('session:' + token);
  }
  return new Response(JSON.stringify({ ok: true }), { status: 200 });
}
