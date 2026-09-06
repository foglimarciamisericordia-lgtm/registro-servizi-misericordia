// Cloudflare Pages Function: /api/login
// Verifica utente e password SUL SERVER (non nel browser) e rilascia
// un token di sessione. Nessun dato dell'app e' leggibile senza aver
// prima superato questo controllo.

async function sha256Hex(text) {
  const data = new TextEncoder().encode(text);
  const buf = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

const DURATA_SESSIONE_SECONDI = 12 * 60 * 60; // 12 ore

export async function onRequestPost(context) {
  const { request, env } = context;
  if (!env.REGISTRO_KV) {
    return new Response(JSON.stringify({ errore: 'Namespace KV non collegato al progetto.' }), { status: 500 });
  }

  let body;
  try {
    body = await request.json();
  } catch (e) {
    return new Response(JSON.stringify({ errore: 'Richiesta non valida.' }), { status: 400 });
  }

  const username = (body.username || '').trim();
  const password = body.password || '';
  if (!username || !password) {
    return new Response(JSON.stringify({ errore: 'Nome utente e password richiesti.' }), { status: 400 });
  }

  let utenti = [];
  try {
    const raw = await env.REGISTRO_KV.get('utenti');
    utenti = raw ? JSON.parse(raw) : [];
  } catch (e) {
    utenti = [];
  }

  // Primo avvio: se non esiste ancora nessun utente, crea l'amministratore predefinito.
  if (utenti.length === 0) {
    const hash = await sha256Hex('admin123');
    utenti = [{
      id: 'admin-1', username: 'admin', passwordHash: hash,
      nome: 'Amministratore', cognome: 'Sistema', ruolo: 'amministratore',
      mustChangePassword: true
    }];
    await env.REGISTRO_KV.put('utenti', JSON.stringify(utenti));
  }

  const idx = utenti.findIndex(u => (u.username || '').toLowerCase() === username.toLowerCase());
  if (idx === -1) {
    return new Response(JSON.stringify({ errore: 'Nome utente o password non corretti.' }), { status: 401 });
  }

  const utente = utenti[idx];
  const hashInserito = await sha256Hex(password);
  let valido = false;

  if (utente.passwordHash) {
    valido = utente.passwordHash === hashInserito;
  } else if (utente.password) {
    // Account non ancora migrato al nuovo formato: confronta il valore
    // storico e, se corretto, lo converte subito in hash sicuro.
    valido = utente.password === password;
    if (valido) {
      delete utenti[idx].password;
      utenti[idx].passwordHash = hashInserito;
      await env.REGISTRO_KV.put('utenti', JSON.stringify(utenti));
    }
  }

  if (!valido) {
    return new Response(JSON.stringify({ errore: 'Nome utente o password non corretti.' }), { status: 401 });
  }

  const token = crypto.randomUUID();
  const sessione = { userId: utente.id, creatoIl: Date.now() };
  await env.REGISTRO_KV.put('session:' + token, JSON.stringify(sessione), { expirationTtl: DURATA_SESSIONE_SECONDI });

  const utenteSicuro = {
    id: utente.id, username: utente.username, nome: utente.nome,
    cognome: utente.cognome, ruolo: utente.ruolo,
    mustChangePassword: !!utente.mustChangePassword
  };

  return new Response(JSON.stringify({ token, utente: utenteSicuro }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}
