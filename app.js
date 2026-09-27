import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
const CONFIG={url:'https://pjptkmfwzulbrskqrhll.supabase.co',key:'sb_publishable_VhPKD5GdaYIe7vQUd3VViw_2p8GvBqt'};
const supabase=createClient(CONFIG.url,CONFIG.key,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
let albums=[],currentAlbum=null,currentMedia=[],visibleMedia=[],lightIndex=0,isAdmin=false,user=null,profile=null;
let previewUserMode=false;
const $=id=>document.getElementById(id), esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c])), safe=s=>s.normalize('NFKD').replace(/[^a-zA-Z0-9._-]+/g,'-');
const msg=t=>{$('authMsg').textContent=t||''};
async function signIn(){const email=$('email').value.trim(),password=$('password').value;if(!email||!password)return msg('Preenche o email e a palavra-passe.');$('signInBtn').disabled=true;msg('A entrar...');try{const{data,error}=await supabase.auth.signInWithPassword({email,password});if(error)return msg('Erro: '+error.message);await showApp(data.user)}catch(e){msg('Erro: '+e.message)}finally{$('signInBtn').disabled=false}}
async function signUp(){const email=$('email').value.trim(),password=$('password').value;if(!email||!password)return msg('Preenche o email e a palavra-passe.');msg('A criar conta...');const{data,error}=await supabase.auth.signUp({email,password});if(error)return msg('Erro: '+error.message);if(data.session)await showApp(data.user);else msg('Conta criada. Confirma o email se a confirmação estiver ativa.')}
function showAuth(){$('authView').hidden=false;$('appView').hidden=true;$('password').value=''}
async function showApp(u){user=u;$('authView').hidden=true;$('appView').hidden=false;$('userEmail').textContent=u.email||'';await loadProfile();await loadRole();await loadAlbums();await loadFeed();await loadCars();await loadEvents();await loadStore();}
async function loadRole(){const{data,error}=await supabase.from('profiles').select('role').eq('id',user.id).maybeSingle();if(error)console.warn(error);isAdmin=data?.role==='admin';$('roleBadge').textContent=(isAdmin&&!previewUserMode)?'ADMIN':'MEMBRO';$('previewUserBtn').textContent=previewUserMode?'🔐 Voltar ao Admin':'👤 Ver como utilizador';$('uploadBtn').style.display=(isAdmin&&!previewUserMode)?'':'none';$('newAlbumBtn').style.display=(isAdmin&&!previewUserMode)?'':'none';$('deleteAlbumBtn').style.display=(isAdmin&&!previewUserMode)?'':'none';$('newCarBtn').style.display='';$('newEventBtn').style.display=(isAdmin&&!previewUserMode)?'':'none';$('newProductBtn').style.display=(isAdmin&&!previewUserMode)?'':'none';$('newPostBtn').style.display='';$('adminPanel').hidden=!isAdmin||previewUserMode;if(isAdmin)loadMembers()}
async function loadProfile(){const{data}=await supabase.from('profiles').select('*').eq('id',user.id).maybeSingle();profile=data||{id:user.id,role:'member'};$('profileName').value=profile.display_name||'';$('profileBio').value=profile.bio||'';$('profileAvatar').textContent=(profile.display_name||user.email||'RP').slice(0,2).toUpperCase()}
async function saveProfile(){const{error}=await supabase.from('profiles').update({display_name:$('profileName').value.trim(),bio:$('profileBio').value.trim()}).eq('id',user.id);$('profileMsg').textContent=error?'Erro: '+error.message:'Perfil guardado.';await loadProfile()}
async function loadAlbums(){const{data,error}=await supabase.from('albums').select('*').order('album_number',{ascending:true});if(error)throw error;albums=data||[];$('albumSelect').innerHTML=albums.map(a=>`<option value="${a.id}">#${a.album_number} · ${esc(a.name)}</option>`).join('');if(!albums.length){currentAlbum=null;$('gallery').innerHTML='';$('empty').textContent=isAdmin?'Cria o primeiro álbum para começar.':'Ainda não existem álbuns.';$('empty').style.display='block';return}currentAlbum=albums.some(a=>a.id===currentAlbum)?currentAlbum:albums[0].id;$('albumSelect').value=currentAlbum;await loadMedia()}
async function createAlbum(){if(!isAdmin)return;const name=prompt('Nome do álbum:');if(!name?.trim())return;const{error}=await supabase.from('albums').insert({name:name.trim(),created_by:user.id});if(error)return alert('Erro: '+error.message);await loadAlbums()}
async function deleteAlbum(){if(!isAdmin||!currentAlbum)return;const a=albums.find(x=>x.id===currentAlbum);if(!a||!confirm(`Apagar o álbum #${a.album_number} “${a.name}” e os ficheiros?`))return;const{data:ms}=await supabase.from('media').select('original_path,preview_path').eq('album_id',currentAlbum);const paths=(ms||[]).flatMap(m=>[m.original_path,m.preview_path]).filter(Boolean);for(let i=0;i<paths.length;i+=100)await supabase.storage.from('media').remove(paths.slice(i,i+100));const{error}=await supabase.from('albums').delete().eq('id',currentAlbum);if(error)alert(error.message);currentAlbum=null;await loadAlbums()}
async function loadMedia(){if(!currentAlbum)return;let q=supabase.from('media').select('*').eq('album_id',currentAlbum).order('media_number',{ascending:true});const{data,error}=await q;if(error)return alert(error.message);currentMedia=data||[];renderGallery()}
function renderGallery(){const filter=$('mediaFilter').value,search=$('mediaSearch').value.toLowerCase().trim(),sort=$('mediaSort').value;let photos=0,videos=0;currentMedia.forEach(m=>m.mime_type.startsWith('image/')?photos++:videos++);$('photoCount').textContent=photos;$('videoCount').textContent=videos;$('storageCount').textContent=currentMedia.length;const album=albums.find(a=>a.id===currentAlbum);$('albumInfo').textContent=album?`Álbum #${album.album_number} · ${album.name} · ${currentMedia.length} ficheiro(s)`:'';$('gallery').innerHTML='';visibleMedia=currentMedia.filter(m=>(filter==='all'||(filter==='image'?m.mime_type.startsWith('image/'):m.mime_type.startsWith('video/')))&&(!search||(`${m.media_number} ${m.file_name}`).toLowerCase().includes(search)));visibleMedia.sort((a,b)=>{if(sort==='number_desc')return (b.media_number||0)-(a.media_number||0);if(sort==='name_asc')return String(a.file_name||'').localeCompare(String(b.file_name||''),'pt-PT');if(sort==='name_desc')return String(b.file_name||'').localeCompare(String(a.file_name||''),'pt-PT');if(sort==='date_desc')return new Date(b.created_at)-new Date(a.created_at);if(sort==='date_asc')return new Date(a.created_at)-new Date(b.created_at);return (a.media_number||0)-(b.media_number||0)});visibleMedia.forEach(m=>addMediaCard(m));$('empty').style.display=visibleMedia.length?'none':'block'}
async function getViewUrl(m,original=false){
  const path=original&&m.original_path
    ?m.original_path
    :m.preview_path;

  if(!path)return null;

  const{data,error}=await supabase
    .storage
    .from('media')
    .createSignedUrl(path,3600);

  if(error){
    console.error('Erro ao criar Signed URL:',error);
    console.error('Caminho:',path);
    return null;
  }

  return data?.signedUrl||null;
}
async function processPhoto(mediaId, silent=false){
  if(!isAdmin)return false;

  try{
    const { data: media, error } = await supabase
      .from('media')
      .select('*')
      .eq('id', mediaId)
      .single();

    if(error || !media){
      throw new Error('Ficheiro não encontrado.');
    }

    if(!media.mime_type?.startsWith('image/')){
      throw new Error('Este ficheiro não é uma fotografia.');
    }

    if(!media.original_path){
      throw new Error('A fotografia não tem original_path.');
    }

    const { data: file, error: downloadError } =
      await supabase.storage
        .from('media')
        .download(media.original_path);

    if(downloadError || !file){
      throw new Error('Não foi possível descarregar a fotografia original.');
    }

    const arrayBuffer = await file.arrayBuffer();

    let binary = '';
    const bytes = new Uint8Array(arrayBuffer);

    const chunkSize = 8192;

    for(let i = 0; i < bytes.length; i += chunkSize){
      binary += String.fromCharCode(
        ...bytes.subarray(i, i + chunkSize)
      );
    }

    const imageBase64 = btoa(binary);

    const response = await fetch(
      'http://127.0.0.1:8765/process',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          filename: media.file_name || 'image.jpg',
          image: imageBase64
        })
      }
    );

    const result = await response.json();

    if(!response.ok || !result?.ok){
      throw new Error(
        result?.error || `Worker respondeu ${response.status}.`
      );
    }

    if(!result.storage?.path){
      throw new Error(
        'O Worker não devolveu o caminho da imagem protegida.'
      );
    }

    const previewPath = result.storage.path;

    const { error: updateError } =
      await supabase
        .from('media')
        .update({
          preview_path: previewPath,
          privacy_status: 'ready',
          processed_at: new Date().toISOString(),
          processing_error: null,
          blur_provider: 'local-worker'
        })
        .eq('id', mediaId);

    if(updateError){
      throw new Error(
        'A imagem foi processada, mas não foi possível atualizar o registo: ' +
        updateError.message
      );
    }

    return true;

  }catch(e){

    const message =
      e instanceof Error ? e.message : String(e);

    await supabase
      .from('media')
      .update({
        privacy_status: 'failed',
        processing_error: message,
        blur_provider: 'local-worker'
      })
      .eq('id', mediaId);

    if(!silent){
      alert('Erro ao processar a fotografia: ' + message);
    }

    return false;
  }
}
async function addMediaCard(m){
  const card=document.createElement('article');
  card.className='card';

  const media=document.createElement(
    m.mime_type.startsWith('image/')?'img':'video'
  );

  media.className='media';

  if(media.tagName==='VIDEO'){
    media.controls=true;
  }

const url=await getViewUrl(m,isAdmin&&!previewUserMode);

console.log('RPMEDIA PREVIEW:', {
  previewUserMode,
  isAdmin,
  original_path: m.original_path,
  preview_path: m.preview_path,
  url
});
  if(url){
    media.src=url;
  }else{
    media.alt='Pré-visualização protegida ainda não disponível';
    media.style.opacity='.3';
  }

  media.addEventListener('click',()=>openLightbox(m));

  const meta=document.createElement('div');
  meta.className='meta';

  const statusLabel=
    m.privacy_status==='ready'
      ?'Protegido ✓'
      :m.privacy_status==='processing'
        ?'A processar…'
        :m.privacy_status==='failed'
          ?'Erro no processamento'
          :m.mime_type.startsWith('video/')
            ?'Proteção de vídeo: V6.3'
            :'A aguardar IA';

  meta.innerHTML=`
    <div class="number">#${m.media_number}</div>
    <div class="name" title="${esc(m.file_name)}">
      ${esc(m.file_name)}
    </div>
    <div class="privacy-status ${
      m.privacy_status==='ready'
        ?'ok'
        :m.privacy_status==='failed'
          ?'bad'
          :''
    }">
      ${statusLabel}
    </div>
  `;

  const actions=document.createElement('div');
  actions.className='media-actions';

  if(isAdmin&&m.original_path){
    const dl=document.createElement('a');
    dl.className='download';
    dl.href=url||'#';
    dl.download=m.file_name;
    dl.textContent='↓ Original';
    actions.appendChild(dl);
  }

  if(
    isAdmin &&
    m.mime_type.startsWith('image/') &&
    m.privacy_status!=='ready'
  ){
    const ai=document.createElement('button');

    ai.className='ghost';

    ai.textContent=
      m.privacy_status==='failed'
        ?'↻ Reprocessar'
        :'🤖 Processar IA';

    ai.onclick=async()=>{
      ai.disabled=true;
      ai.textContent='A processar…';

      await processPhoto(m.id);

      await loadMedia();
    };

    actions.appendChild(ai);
  }

  if(isAdmin){

    const move=document.createElement('select');

    move.className='move-select';

    move.innerHTML=
      '<option value="">Mover para…</option>'+
      albums
        .filter(a=>a.id!==m.album_id)
        .map(a=>
          `<option value="${a.id}">
            #${a.album_number} · ${esc(a.name)}
          </option>`
        )
        .join('');

    move.onchange=()=>moveMedia(m.id,move.value);

    actions.appendChild(move);

    const del=document.createElement('button');

    del.className='danger';
    del.textContent='🗑 Apagar';

    del.onclick=()=>deleteMedia(m);

    actions.appendChild(del);

  }else if(!m.preview_path){

    const s=document.createElement('span');

    s.className='muted';

    s.textContent=
      m.mime_type.startsWith('video/')
        ?'Vídeo protegido — processamento na V6.3'
        :'A aguardar pré-visualização protegida';

    actions.appendChild(s);
  }

  meta.appendChild(actions);

  card.append(media,meta);

  $('gallery').appendChild(card);
}
async function moveMedia(id,albumId){if(!isAdmin||!albumId)return;const{error}=await supabase.from('media').update({album_id:albumId}).eq('id',id);if(error)alert(error.message);await loadMedia()}
async function deleteMedia(m){if(!isAdmin||!confirm(`Apagar “${m.file_name}”?`))return;const paths=[m.original_path,m.preview_path].filter(Boolean);await supabase.storage.from('media').remove(paths);const{error}=await supabase.from('media').delete().eq('id',m.id);if(error)alert(error.message);await loadMedia()}
async function uploadFiles(e){
  if(!isAdmin||!currentAlbum)return;const files=[...e.target.files];$('progress').hidden=false;
  for(let i=0;i<files.length;i++){
    const f=files[i],path=`originals/${currentAlbum}/${crypto.randomUUID()}-${safe(f.name)}`;
    $('progress').style.width=`${Math.round((i/files.length)*100)}%`;
    const{error}=await supabase.storage.from('media').upload(path,f,{contentType:f.type,upsert:false});
    if(error){alert(`Erro ${f.name}: ${error.message}`);continue}
    const{data:ins,error:db}=await supabase.from('media').insert({album_id:currentAlbum,file_name:f.name,storage_path:path,mime_type:f.type,size_bytes:f.size,original_path:path,privacy_status:'pending',uploaded_by:user.id}).select().single();
    if(db){await supabase.storage.from('media').remove([path]);alert(`Erro ${f.name}: ${db.message}`);continue}
    if(f.type.startsWith('image/')){
      await processPhoto(ins.id,true);
    }
  }
  $('progress').style.width='100%';setTimeout(()=>{$('progress').hidden=true},500);e.target.value='';await loadMedia()
}

function openLightbox(m){const i=visibleMedia.findIndex(x=>x.id===m.id);lightIndex=Math.max(0,i);renderLightbox()}
async function renderLightbox(){const m=currentMedia[lightIndex];if(!m)return;$('lightbox').hidden=false;$('lbMedia').innerHTML='';const url=await getViewUrl(m,isAdmin&&!previewUserMode);if(!url){$('lbMedia').innerHTML='<div class="empty">Esta pré-visualização protegida ainda não foi processada.</div>'}else{const el=document.createElement(m.mime_type.startsWith('image/')?'img':'video');el.src=url;if(el.tagName==='VIDEO'){el.controls=true;el.autoplay=true} $('lbMedia').appendChild(el)}const album=albums.find(a=>a.id===currentAlbum);$('lbCaption').textContent=`ÁLBUM #${album?.album_number||''} · ${m.mime_type.startsWith('image/')?'FOTO':'VÍDEO'} #${m.media_number} · ${m.file_name}`}
function closeLightbox(){$('lightbox').hidden=true;$('lbMedia').innerHTML=''}function prev(){if(!visibleMedia.length)return;lightIndex=(lightIndex-1+visibleMedia.length)%visibleMedia.length;renderLightbox()}function next(){if(!visibleMedia.length)return;lightIndex=(lightIndex+1)%visibleMedia.length;renderLightbox()}
async function loadFeed(){
  const{data,error}=await supabase
    .from('posts')
    .select('*')
    .order('created_at',{ascending:false})
    .limit(50);

  if(error)return console.warn(error);

  $('feedList').innerHTML=(data||[])
    .map(p=>`
      <article class="post">
        <div class="post-head">
          <b>Membro RPM</b>
          <span>${new Date(p.created_at).toLocaleString('pt-PT')}</span>
        </div>
        <h3>${esc(p.title||'Publicação RPM')}</h3>
        <p>${esc(p.body||'')}</p>
        <div class="post-actions">
          <button data-like="${p.id}">♡ Gosto</button>
          ${isAdmin?`<button data-delpost="${p.id}">🗑</button>`:''}
        </div>
      </article>
    `)
    .join('')
    ||'<div class="empty">Ainda não existem publicações.</div>';

  document.querySelectorAll('[data-like]')
    .forEach(b=>b.onclick=()=>likePost(b.dataset.like));

  document.querySelectorAll('[data-delpost]')
    .forEach(b=>b.onclick=()=>deletePost(b.dataset.delpost));
}
async function createPost(){openForm('Nova publicação','<label>Título</label><input id="fTitle"><label>Texto</label><textarea id="fBody"></textarea><button class="primary" id="fSave">Publicar</button>');$('fSave').onclick=async()=>{const{error}=await supabase.from('posts').insert({title:$('fTitle').value.trim(),body:$('fBody').value.trim(),user_id:user.id});if(error)return alert(error.message);closeModal();loadFeed()}}
async function likePost(id){const{error}=await supabase.from('post_likes').upsert({post_id:id,user_id:user.id},{onConflict:'post_id,user_id'});if(error)alert(error.message)}async function deletePost(id){if(!isAdmin||!confirm('Apagar publicação?'))return;await supabase.from('posts').delete().eq('id',id);loadFeed()}
async function loadCars(){const{data,error}=await supabase.from('cars').select('*,profiles(display_name)').order('created_at',{ascending:false});if(error)return console.warn(error);$('carsGrid').innerHTML=(data||[]).map(c=>`<article class="feature-card"><h3>${esc(c.make)} ${esc(c.model)}</h3><p>${esc(c.year||'')} · ${esc(c.engine||'')}</p><p>${esc(c.description||'')}</p><small class="muted">${esc(c.profiles?.display_name||'Membro')}</small></article>`).join('')||'<div class="empty">Ainda não existem carros.</div>'}
async function createCar(){openForm('Novo carro','<label>Marca</label><input id="fMake"><label>Modelo</label><input id="fModel"><label>Ano</label><input id="fYear" type="number"><label>Motor</label><input id="fEngine"><label>Descrição</label><textarea id="fDesc"></textarea><button class="primary" id="fSave">Guardar</button>');$('fSave').onclick=async()=>{const{error}=await supabase.from('cars').insert({user_id:user.id,make:$('fMake').value.trim(),model:$('fModel').value.trim(),year:Number($('fYear').value)||null,engine:$('fEngine').value.trim(),description:$('fDesc').value.trim()});if(error)return alert(error.message);closeModal();loadCars()}}
async function loadEvents(){const{data,error}=await supabase.from('events').select('*').order('event_date',{ascending:false});if(error)return console.warn(error);$('eventsGrid').innerHTML=(data||[]).map(e=>`<article class="feature-card"><h3>${esc(e.name)}</h3><p>${new Date(e.event_date).toLocaleString('pt-PT')} · ${esc(e.location||'')}</p><p>${esc(e.description||'')}</p></article>`).join('')||'<div class="empty">Ainda não existem eventos.</div>'}
async function createEvent(){if(!isAdmin)return;openForm('Novo evento','<label>Nome</label><input id="fName"><label>Data</label><input id="fDate" type="datetime-local"><label>Local</label><input id="fLoc"><label>Descrição</label><textarea id="fDesc"></textarea><button class="primary" id="fSave">Criar</button>');$('fSave').onclick=async()=>{const{error}=await supabase.from('events').insert({name:$('fName').value.trim(),event_date:$('fDate').value,location:$('fLoc').value.trim(),description:$('fDesc').value.trim(),created_by:user.id});if(error)return alert(error.message);closeModal();loadEvents()}}
async function loadStore(){const{data,error}=await supabase.from('products').select('*').eq('active',true).order('created_at',{ascending:false});if(error)return console.warn(error);$('storeGrid').innerHTML=(data||[]).map(p=>`<article class="feature-card"><h3>${esc(p.name)}</h3><p>${esc(p.description||'')}</p><p><b>${Number(p.price).toFixed(2)} €</b></p><button class="primary" data-order="${p.id}">Encomendar</button></article>`).join('')||'<div class="empty">A loja ainda não tem produtos.</div>';document.querySelectorAll('[data-order]').forEach(b=>b.onclick=()=>orderProduct(b.dataset.order))}
async function createProduct(){if(!isAdmin)return;openForm('Novo produto','<label>Nome</label><input id="fName"><label>Preço (€)</label><input id="fPrice" type="number" step="0.01"><label>Descrição</label><textarea id="fDesc"></textarea><button class="primary" id="fSave">Criar</button>');$('fSave').onclick=async()=>{const{error}=await supabase.from('products').insert({name:$('fName').value.trim(),price:Number($('fPrice').value)||0,description:$('fDesc').value.trim(),created_by:user.id});if(error)return alert(error.message);closeModal();loadStore()}}
async function orderProduct(id){const qty=Number(prompt('Quantidade:',1));if(!qty||qty<1)return;const{error}=await supabase.from('orders').insert({user_id:user.id,status:'pending',notes:`Produto ${id} · quantidade ${qty}`});if(error)alert(error.message);else alert('Encomenda registada. Um administrador irá contactar-te.')}
async function loadMembers(){if(!isAdmin)return;const{data}=await supabase.from('profiles').select('id,display_name,role,created_at').order('created_at');$('membersList').innerHTML=(data||[]).map(m=>`<div class="member-row"><div><b>${esc(m.display_name||'Sem nome')}</b><small> · ${esc(m.role)}</small></div><button class="ghost" data-promote="${m.id}" data-role="${m.role}">${m.role==='admin'?'Tornar membro':'Tornar admin'}</button></div>`).join('');document.querySelectorAll('[data-promote]').forEach(b=>b.onclick=()=>changeRole(b.dataset.promote,b.dataset.role))}
async function changeRole(id,role){if(!isAdmin)return;const next=role==='admin'?'member':'admin';if(id===user.id)return alert('Não podes retirar o teu próprio acesso de admin nesta interface.');const{error}=await supabase.from('profiles').update({role:next}).eq('id',id);if(error)alert(error.message);else loadMembers()}
function openForm(title,body){$('modalBody').innerHTML=`<h3>${title}</h3>${body}`;$('modal').hidden=false}function closeModal(){$('modal').hidden=true;$('modalBody').innerHTML=''}
function switchTab(tab){document.querySelectorAll('.tab').forEach(x=>x.classList.remove('active'));$('tab-'+tab).classList.add('active');document.querySelectorAll('.nav-btn').forEach(x=>x.classList.toggle('active',x.dataset.tab===tab))}
$('signInBtn').onclick=signIn;$('signUpBtn').onclick=signUp;$('signOutBtn').onclick=async()=>{await supabase.auth.signOut();showAuth()};$('password').onkeydown=e=>{if(e.key==='Enter')signIn()};$('uploadBtn').onclick=()=>$('fileInput').click();$('fileInput').onchange=uploadFiles;$('newAlbumBtn').onclick=createAlbum;$('deleteAlbumBtn').onclick=deleteAlbum;$('albumSelect').onchange=async()=>{currentAlbum=$('albumSelect').value;await loadMedia()};$('mediaFilter').onchange=renderGallery;$('mediaSearch').oninput=renderGallery;$('mediaSort').onchange=renderGallery;$('lbClose').onclick=closeLightbox;$('lbPrev').onclick=prev;$('lbNext').onclick=next;$('modalClose').onclick=closeModal;$('newPostBtn').onclick=createPost;$('newCarBtn').onclick=createCar;$('newEventBtn').onclick=createEvent;$('newProductBtn').onclick=createProduct;$('saveProfileBtn').onclick=saveProfile;$('previewUserBtn').onclick=()=>{previewUserMode=!previewUserMode;loadRole();renderGallery()};document.querySelectorAll('.nav-btn').forEach(b=>b.onclick=()=>switchTab(b.dataset.tab));document.addEventListener('keydown',e=>{if(!$('lightbox').hidden){if(e.key==='Escape')closeLightbox();if(e.key==='ArrowLeft')prev();if(e.key==='ArrowRight')next()}});$('lightbox').onclick=e=>{if(e.target===$('lightbox'))closeLightbox()};
supabase.auth.onAuthStateChange(async(_event,session)=>{if(session?.user)await showApp(session.user);else showAuth()});
(async()=>{const{data,error}=await supabase.auth.getSession();if(error)msg(error.message);else if(data.session)await showApp(data.session.user)})();
