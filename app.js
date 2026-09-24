import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const CONFIG = {
  url: 'https://pjptkmfwzulbrskqrhll.supabase.co',
  key: 'sb_publishable_VhPKD5GdaYIe7vQUd3VViw_2p8GvBqt'
};

const supabase = createClient(CONFIG.url, CONFIG.key, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

let albums = [];
let currentAlbum = null;

const $ = id => document.getElementById(id);
const msg = text => { $('authMsg').textContent = text || ''; };

async function signIn() {
  const email = $('email').value.trim();
  const password = $('password').value;

  if (!email || !password) {
    msg('Preenche o email e a palavra-passe.');
    return;
  }

  msg('A entrar...');
  $('signInBtn').disabled = true;

  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      msg('Erro de login: ' + error.message);
      return;
    }

    if (!data.session) {
      msg('Login sem sessão. Verifica a configuração da conta no Supabase.');
      return;
    }

    msg('Login efetuado. A carregar...');
    await showApp(data.user);
  } catch (err) {
    msg('Erro de ligação: ' + (err?.message || String(err)));
  } finally {
    $('signInBtn').disabled = false;
  }
}

async function signUp() {
  const email = $('email').value.trim();
  const password = $('password').value;

  if (!email || !password) {
    msg('Preenche o email e a palavra-passe.');
    return;
  }

  msg('A criar conta...');
  try {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) {
      msg('Erro: ' + error.message);
    } else if (data.session) {
      msg('Conta criada. A entrar...');
      await showApp(data.user);
    } else {
      msg('Conta criada. Confirma o email se o Supabase pedir confirmação.');
    }
  } catch (err) {
    msg('Erro de ligação: ' + (err?.message || String(err)));
  }
}

async function signOut() {
  await supabase.auth.signOut();
  showAuth();
}

function showAuth() {
  $('authView').hidden = false;
  $('appView').hidden = true;
  $('password').value = '';
  $('signInBtn').disabled = false;
}

async function showApp(user) {
  $('authView').hidden = true;
  $('appView').hidden = false;
  $('userEmail').textContent = user?.email || '';

  try {
    await loadAlbums();
  } catch (err) {
    console.error(err);
    $('empty').textContent = 'Sessão iniciada, mas não foi possível carregar os álbuns. Verifica a ligação ao Supabase.';
    $('empty').style.display = 'block';
  }
}

async function loadAlbums() {
  const { data, error } = await supabase
    .from('albums')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Erro a carregar álbuns:', error);
    throw error;
  }

  albums = data || [];
  $('albumSelect').innerHTML = albums
    .map(a => `<option value="${a.id}">${escapeHtml(a.name)}</option>`)
    .join('');

  if (!albums.length) {
    currentAlbum = null;
    $('gallery').innerHTML = '';
    $('empty').textContent = 'Cria o primeiro álbum para começar.';
    $('empty').style.display = 'block';
    await updateAdminButton();
    return;
  }

  currentAlbum = albums[0].id;
  $('albumSelect').value = currentAlbum;
  await updateAdminButton();
  await loadMedia();
}

async function createAlbum() {
  const name = prompt('Nome do álbum:');
  if (!name?.trim()) return;

  const { error } = await supabase.from('albums').insert({ name: name.trim() });
  if (error) {
    alert('Erro ao criar álbum: ' + error.message);
    return;
  }
  await loadAlbums();
}

async function loadMedia() {
  if (!currentAlbum) return;

  const { data, error } = await supabase
    .from('media')
    .select('*')
    .eq('album_id', currentAlbum)
    .order('created_at', { ascending: false });

  if (error) {
    alert('Erro a carregar ficheiros: ' + error.message);
    return;
  }

  let photos = 0, videos = 0;
  $('gallery').innerHTML = '';

  for (const m of (data || [])) {
    if (m.mime_type?.startsWith('image/')) photos++;
    else videos++;

    const { data: signed, error: signedError } =
      await supabase.storage.from('media').createSignedUrl(m.storage_path, 3600);

    if (signedError) continue;

    const card = document.createElement('article');
    card.className = 'card';

    const el = document.createElement(m.mime_type?.startsWith('image/') ? 'img' : 'video');
    el.className = 'media';
    el.src = signed.signedUrl;
    if (el.tagName === 'VIDEO') el.controls = true;

    const meta = document.createElement('div');
    meta.className = 'meta';
    meta.innerHTML = `<div class="name">${escapeHtml(m.file_name)}</div>
      <a class="download" href="${signed.signedUrl}" download>↓ Download</a>`;

    card.append(el, meta);
    $('gallery').appendChild(card);
  }

  $('photoCount').textContent = photos;
  $('videoCount').textContent = videos;
  $('storageCount').textContent = (data || []).length;
  $('empty').style.display = (data || []).length ? 'none' : 'block';
}

async function updateAdminButton() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  if (error) console.warn('Perfil não carregado:', error.message);
  $('newAlbumBtn').style.display = profile?.role === 'admin' ? '' : 'none';
}

async function uploadFiles(event) {
  const files = [...event.target.files];
  if (!files.length || !currentAlbum) return;

  $('progress').hidden = false;

  for (let i = 0; i < files.length; i++) {
    const f = files[i];
    const path = `${crypto.randomUUID()}-${safeName(f.name)}`;

    const { error: uploadError } = await supabase.storage
      .from('media')
      .upload(path, f, { contentType: f.type, upsert: false });

    if (uploadError) {
      alert(`Erro em ${f.name}: ${uploadError.message}`);
      continue;
    }

    const { error: dbError } = await supabase.from('media').insert({
      album_id: currentAlbum,
      file_name: f.name,
      storage_path: path,
      mime_type: f.type,
      size_bytes: f.size
    });

    if (dbError) {
      await supabase.storage.from('media').remove([path]);
      alert(`Erro a guardar ${f.name}: ${dbError.message}`);
    }

    $('progress').style.width = `${Math.round((i + 1) / files.length * 100)}%`;
  }

  $('progress').hidden = true;
  event.target.value = '';
  await loadMedia();
}

function safeName(s) {
  return s.normalize('NFKD').replace(/[^a-zA-Z0-9._-]+/g, '-');
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
  }[c]));
}

// Restore an existing session when the page is reopened.
(async function bootstrap() {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) await showApp(session.user);
  } catch (err) {
    console.error('Erro ao restaurar sessão:', err);
  }
})();

$('signInBtn').addEventListener('click', signIn);
$('signUpBtn').addEventListener('click', signUp);
$('signOutBtn').addEventListener('click', signOut);
$('uploadBtn').addEventListener('click', () => $('fileInput').click());
$('fileInput').addEventListener('change', uploadFiles);
$('newAlbumBtn').addEventListener('click', createAlbum);
$('albumSelect').addEventListener('change', async () => {
  currentAlbum = $('albumSelect').value;
  await loadMedia();
});
$('password').addEventListener('keydown', e => {
  if (e.key === 'Enter') signIn();
});

supabase.auth.onAuthStateChange(async (_event, session) => {
  if (session?.user) {
    await showApp(session.user);
  } else {
    showAuth();
  }
});

(async () => {
  msg('A verificar sessão...');
  const { data, error } = await supabase.auth.getSession();

  if (error) {
    msg('Erro ao iniciar: ' + error.message);
    return;
  }

  if (data.session?.user) {
    await showApp(data.session.user);
  } else {
    showAuth();
    msg('');
  }
})();
