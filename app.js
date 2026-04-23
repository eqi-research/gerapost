/* =========================================================
   gerapost
   ========================================================= */

const STORAGE_KEY = 'tcg-profiles-v1';

// Ícones SVG inline (melhor compatibilidade com html2canvas do que fontes externas)
const ICON_VERIFIED = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path fill="currentColor" d="M22.25 12c0-1.43-.88-2.67-2.19-3.34.46-1.39.2-2.9-.81-3.91s-2.52-1.27-3.91-.81c-.66-1.31-1.91-2.19-3.34-2.19s-2.67.88-3.33 2.19c-1.4-.46-2.91-.2-3.92.81s-1.26 2.52-.8 3.91c-1.31.67-2.2 1.91-2.2 3.34s.89 2.67 2.2 3.34c-.46 1.39-.21 2.9.8 3.91s2.52 1.26 3.91.81c.67 1.31 1.91 2.19 3.34 2.19s2.68-.88 3.34-2.19c1.39.45 2.9.2 3.91-.81s1.27-2.52.81-3.91c1.31-.67 2.19-1.91 2.19-3.34zm-11.71 4.2L6.8 12.46l1.41-1.42 2.26 2.26 4.8-5.23 1.47 1.36-6.2 6.77z"/></svg>`;
const ICON_TWITTER = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M23.44 4.83c-.8.37-1.5.38-2.22.02.93-.56.98-.96 1.32-2.02-.88.52-1.86.9-2.9 1.1-.82-.88-2-1.43-3.3-1.43-2.5 0-4.55 2.04-4.55 4.54 0 .36.03.7.1 1.04-3.77-.2-7.12-2-9.36-4.75-.4.67-.6 1.45-.6 2.3 0 1.56.8 2.95 2 3.77-.74-.03-1.44-.23-2.05-.57v.06c0 2.2 1.56 4.03 3.64 4.44-.67.2-1.37.2-2.06.08.58 1.8 2.26 3.12 4.25 3.16C5.78 18.1 3.37 18.74 1 18.46c2 1.3 4.4 2.04 6.97 2.04 8.35 0 12.92-6.92 12.92-12.93 0-.2 0-.4-.02-.6.9-.63 1.96-1.22 2.56-2.14z"/></svg>`;
const ICON_X = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>`;

// ===== STATE =====
let profiles = loadProfiles();
let cells = [];
let cellIdCounter = 0;

const settings = {
  style: 'carrossel-ig',
  defaultProfileId: null,
  format: '1080x1350',
  width: 1080,
  height: 1350,
  ext: 'png',
  bgColor: '#ffffff',
  carrosselFontSize: 44
};

// ===== DOM refs =====
const $ = (id) => document.getElementById(id);
const profileForm = $('profile-form');
const profileList = $('profile-list');
const defaultProfileSel = $('default-profile');
const cellsContainer = $('cells-container');
const renderArea = $('render-area');
const status = $('status');
const previewModal = $('preview-modal');
const previewImg = $('preview-img');

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
  renderProfileList();
  refreshDefaultProfileOptions();
  for (let i = 0; i < 10; i++) addCell();
  attachGlobalListeners();
});

// ============================================================
// PERFIS
// ============================================================
function loadProfiles() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch { return []; }
}
function saveProfiles() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
}

profileForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = $('p-name').value.trim();
  const handle = $('p-handle').value.trim().replace(/^@/, '');
  const verified = $('p-verified').checked;
  const file = $('p-photo').files[0];
  const photo = file ? await fileToDataURL(file) : '';

  profiles.push({
    id: 'p_' + Date.now(),
    name, handle, verified, photo
  });
  saveProfiles();
  renderProfileList();
  refreshDefaultProfileOptions();
  refreshCellProfileSelectors();
  profileForm.reset();
});

function renderProfileList() {
  profileList.innerHTML = '';
  if (!profiles.length) {
    profileList.innerHTML = '<p style="color:var(--text-muted);font-size:13px;">Nenhum perfil salvo ainda.</p>';
    return;
  }
  for (const p of profiles) {
    const el = document.createElement('div');
    el.className = 'profile-card';
    el.innerHTML = `
      <img src="${p.photo || placeholderAvatar(p.name)}" alt="" />
      <div class="info">
        <div class="name">
          ${escapeHtml(p.name)}
          ${p.verified ? '<span class="verified-mini">✓</span>' : ''}
        </div>
        <div class="handle">@${escapeHtml(p.handle)}</div>
      </div>
      <button class="del" title="Excluir perfil" data-id="${p.id}">×</button>
    `;
    el.querySelector('.del').addEventListener('click', () => {
      if (!confirm(`Excluir o perfil "${p.name}"?`)) return;
      profiles = profiles.filter(x => x.id !== p.id);
      saveProfiles();
      renderProfileList();
      refreshDefaultProfileOptions();
      refreshCellProfileSelectors();
    });
    profileList.appendChild(el);
  }
}

function refreshDefaultProfileOptions() {
  defaultProfileSel.innerHTML = '';
  if (!profiles.length) {
    defaultProfileSel.innerHTML = '<option value="">— crie um perfil primeiro —</option>';
    settings.defaultProfileId = null;
    return;
  }
  for (const p of profiles) {
    const opt = document.createElement('option');
    opt.value = p.id;
    opt.textContent = `${p.name} (@${p.handle})`;
    defaultProfileSel.appendChild(opt);
  }
  if (!settings.defaultProfileId || !profiles.find(p => p.id === settings.defaultProfileId)) {
    settings.defaultProfileId = profiles[0].id;
  }
  defaultProfileSel.value = settings.defaultProfileId;
}

// ============================================================
// CÉLULAS
// ============================================================
function addCell() {
  const cell = {
    id: 'c_' + (++cellIdCounter),
    text: '',
    profileId: null, // null = usar padrão
    metaEnabled: false,
    meta: { date: '', likes: '', retweets: '', replies: '' },
    imageEnabled: false,
    imageDataURL: ''
  };
  cells.push(cell);
  renderCells();
}

function renderCells() {
  cellsContainer.innerHTML = '';
  cells.forEach((cell, idx) => {
    const el = document.createElement('div');
    el.className = 'cell';
    el.innerHTML = `
      <div class="cell-num">${idx + 1}</div>
      <div class="cell-main">
        <textarea placeholder="Texto do tweet..." maxlength="500">${escapeHtml(cell.text)}</textarea>
        <div class="cell-options">
          <label>
            Perfil:
            <select class="sel-profile">
              <option value="">(padrão)</option>
              ${profiles.map(p => `<option value="${p.id}" ${p.id === cell.profileId ? 'selected' : ''}>${escapeHtml(p.name)}</option>`).join('')}
            </select>
          </label>
          <label>
            <input type="checkbox" class="chk-meta" ${cell.metaEnabled ? 'checked' : ''} />
            Metadata
          </label>
          <label>
            <input type="checkbox" class="chk-image" ${cell.imageEnabled ? 'checked' : ''} />
            Imagem anexa
          </label>
        </div>
        <div class="meta-box" style="${cell.metaEnabled ? '' : 'display:none'}">
          <div class="cell-meta">
            <input class="m-date" placeholder="Data (ex: 14:32 · 22 abr 2026)" value="${escapeAttr(cell.meta.date)}" />
            <input class="m-replies" type="number" placeholder="Respostas" value="${escapeAttr(cell.meta.replies)}" />
            <input class="m-rts" type="number" placeholder="Retweets" value="${escapeAttr(cell.meta.retweets)}" />
            <input class="m-likes" type="number" placeholder="Curtidas" value="${escapeAttr(cell.meta.likes)}" />
            <button class="randomize" title="Aleatorizar">🎲</button>
          </div>
        </div>
        <div class="image-box" style="${cell.imageEnabled ? '' : 'display:none'}">
          <input type="file" class="f-image" accept="image/*" />
          ${cell.imageDataURL ? `<img src="${cell.imageDataURL}" class="cell-image-preview" />` : ''}
        </div>
      </div>
      <div class="cell-buttons">
        <button class="btn btn-sm btn-primary btn-preview">👁 Preview</button>
        <button class="btn btn-sm btn-danger btn-del">🗑 Apagar</button>
      </div>
    `;

    // text
    el.querySelector('textarea').addEventListener('input', (e) => { cell.text = e.target.value; });

    // profile
    el.querySelector('.sel-profile').addEventListener('change', (e) => {
      cell.profileId = e.target.value || null;
    });

    // meta toggle
    el.querySelector('.chk-meta').addEventListener('change', (e) => {
      cell.metaEnabled = e.target.checked;
      el.querySelector('.meta-box').style.display = cell.metaEnabled ? '' : 'none';
    });
    el.querySelector('.m-date').addEventListener('input',    (e) => cell.meta.date     = e.target.value);
    el.querySelector('.m-replies').addEventListener('input', (e) => cell.meta.replies  = e.target.value);
    el.querySelector('.m-rts').addEventListener('input',     (e) => cell.meta.retweets = e.target.value);
    el.querySelector('.m-likes').addEventListener('input',   (e) => cell.meta.likes    = e.target.value);
    el.querySelector('.randomize').addEventListener('click', (e) => {
      e.preventDefault();
      randomizeMeta(cell);
      renderCells();
    });

    // image
    el.querySelector('.chk-image').addEventListener('change', (e) => {
      cell.imageEnabled = e.target.checked;
      el.querySelector('.image-box').style.display = cell.imageEnabled ? '' : 'none';
    });
    el.querySelector('.f-image').addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      cell.imageDataURL = await fileToDataURL(file);
      renderCells();
    });

    // preview
    el.querySelector('.btn-preview').addEventListener('click', async () => {
      await previewCell(cell);
    });

    // delete
    el.querySelector('.btn-del').addEventListener('click', () => {
      cells = cells.filter(c => c.id !== cell.id);
      renderCells();
    });

    cellsContainer.appendChild(el);
  });
}

function refreshCellProfileSelectors() { renderCells(); }

function randomizeMeta(cell) {
  const now = new Date();
  const hh = String(Math.floor(Math.random() * 24)).padStart(2, '0');
  const mm = String(Math.floor(Math.random() * 60)).padStart(2, '0');
  const day = String(Math.floor(Math.random() * 28) + 1).padStart(2, '0');
  const monthsPt = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];
  const month = monthsPt[Math.floor(Math.random() * 12)];
  cell.meta.date = `${hh}:${mm} · ${day} ${month} ${now.getFullYear()}`;
  cell.meta.replies  = rand(5, 800);
  cell.meta.retweets = rand(10, 5000);
  cell.meta.likes    = rand(50, 30000);
}

function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

// ============================================================
// CONFIGURAÇÕES GLOBAIS
// ============================================================
function attachGlobalListeners() {
  const fontField = $('field-carrossel-font');
  const syncStyleUI = () => {
    fontField.style.display = settings.style === 'carrossel-ig' ? '' : 'none';
  };
  document.querySelectorAll('input[name="style"]').forEach(r =>
    r.addEventListener('change', e => {
      settings.style = e.target.value;
      if (e.target.value === 'carrossel-ig') {
        settings.format = '1080x1350';
        settings.width = 1080;
        settings.height = 1350;
        settings.bgColor = '#ffffff';
        $('format-preset').value = '1080x1350';
        $('custom-w').value = 1080;
        $('custom-h').value = 1350;
        $('bg-color').value = '#ffffff';
      }
      syncStyleUI();
    })
  );
  $('carrossel-font').addEventListener('input', e => {
    settings.carrosselFontSize = parseInt(e.target.value, 10) || 44;
  });
  syncStyleUI();
  document.querySelectorAll('input[name="ext"]').forEach(r =>
    r.addEventListener('change', e => settings.ext = e.target.value)
  );
  defaultProfileSel.addEventListener('change', e => settings.defaultProfileId = e.target.value || null);

  const fmt = $('format-preset');
  const cw = $('custom-w');
  const ch = $('custom-h');
  fmt.addEventListener('change', () => {
    settings.format = fmt.value;
    if (fmt.value !== 'custom' && fmt.value !== 'padrao') {
      const [w, h] = fmt.value.split('x').map(Number);
      cw.value = w; ch.value = h;
      settings.width = w; settings.height = h;
    }
  });
  cw.addEventListener('input', e => {
    settings.width  = parseInt(e.target.value, 10) || 1080;
    if (settings.format !== 'padrao') { fmt.value = 'custom'; settings.format = 'custom'; }
  });
  ch.addEventListener('input', e => {
    settings.height = parseInt(e.target.value, 10) || 1080;
    if (settings.format !== 'padrao') { fmt.value = 'custom'; settings.format = 'custom'; }
  });

  $('bg-color').addEventListener('input', e => settings.bgColor = e.target.value);

  $('add-cell').addEventListener('click', addCell);

  $('download-zip').addEventListener('click', downloadAllAsZip);

  $('close-preview').addEventListener('click', closePreview);
  previewModal.addEventListener('click', (e) => { if (e.target === previewModal) closePreview(); });
}

// ============================================================
// RENDERIZAÇÃO DO TWEET
// ============================================================
function buildTweetNode(cell) {
  const profile = profiles.find(p => p.id === (cell.profileId || settings.defaultProfileId));
  if (!profile) return null;

  const isPadrao = settings.format === 'padrao';

  const wrap = document.createElement('div');
  wrap.className = 'render-canvas' + (isPadrao ? ' padrao' : '');
  wrap.style.width = settings.width + 'px';
  wrap.style.height = settings.height + 'px';
  wrap.style.background = settings.bgColor;
  if (isPadrao) {
    const pad = Math.round(settings.height * 0.05);
    wrap.style.padding = pad + 'px';
  }

  const card = document.createElement('div');
  card.className = 'tweet-card ' + settings.style + (isPadrao ? ' padrao' : '');

  const isCarrosselIG = settings.style === 'carrossel-ig';
  const showLogo = !isPadrao && !isCarrosselIG;
  const logo = showLogo ? ICON_TWITTER : '';
  const textStyleAttr = isCarrosselIG ? ` style="font-size: ${settings.carrosselFontSize}px"` : '';
  const verifiedBadge = profile.verified ? `<span class="tw-verified">${ICON_VERIFIED}</span>` : '';
  const avatarSrc = profile.photo || placeholderAvatar(profile.name);

  let metaHTML = '';
  if (cell.metaEnabled) {
    const parts = [];
    if (cell.meta.date) parts.push(`<div class="tw-date">${escapeHtml(cell.meta.date)}</div>`);
    const stats = [];
    if (cell.meta.replies)  stats.push(`<span class="tw-stat"><b>${formatNum(cell.meta.replies)}</b>Respostas</span>`);
    if (cell.meta.retweets) stats.push(`<span class="tw-stat"><b>${formatNum(cell.meta.retweets)}</b>Retweets</span>`);
    if (cell.meta.likes)    stats.push(`<span class="tw-stat"><b>${formatNum(cell.meta.likes)}</b>Curtidas</span>`);
    if (stats.length) parts.push(`<div class="tw-meta">${stats.join('')}</div>`);
    metaHTML = parts.join('');
  }

  const imageHTML = (cell.imageEnabled && cell.imageDataURL)
    ? `<div class="tw-image-wrap"><img class="tw-image" src="${cell.imageDataURL}" /></div>`
    : '';

  const logoHTML = showLogo ? `<div class="tw-logo">${logo}</div>` : '';

  card.innerHTML = `
    <div class="tw-head">
      <img class="tw-avatar" src="${avatarSrc}" />
      <div class="tw-user">
        <div class="tw-name">${escapeHtml(profile.name)}${verifiedBadge}</div>
        <div class="tw-handle">@${escapeHtml(profile.handle)}</div>
      </div>
      ${logoHTML}
    </div>
    <div class="tw-text"${textStyleAttr}>${escapeHtml(cell.text || ' ')}</div>
    ${imageHTML}
    ${metaHTML}
  `;

  wrap.appendChild(card);
  return wrap;
}

async function renderCellToCanvas(cell) {
  const node = buildTweetNode(cell);
  if (!node) throw new Error('Perfil não encontrado. Crie um perfil primeiro.');

  renderArea.appendChild(node);

  // Espera as imagens embutidas carregarem (avatar + imagem anexa)
  await waitForImages(node);

  const canvas = await html2canvas(node, {
    width: settings.width,
    height: settings.height,
    backgroundColor: settings.bgColor,
    scale: 1,
    useCORS: true,
    logging: false
  });

  renderArea.removeChild(node);
  return canvas;
}

function waitForImages(root) {
  const imgs = Array.from(root.querySelectorAll('img'));
  return Promise.all(imgs.map(img => {
    if (img.complete && img.naturalWidth > 0) return Promise.resolve();
    return new Promise((resolve) => {
      img.addEventListener('load', () => resolve());
      img.addEventListener('error', () => resolve());
    });
  }));
}

// ============================================================
// PREVIEW & DOWNLOAD
// ============================================================
async function previewCell(cell) {
  try {
    setStatus('Gerando preview...');
    const canvas = await renderCellToCanvas(cell);
    const mime = settings.ext === 'jpg' ? 'image/jpeg' : 'image/png';
    const quality = settings.ext === 'jpg' ? 0.92 : undefined;
    previewImg.src = canvas.toDataURL(mime, quality);
    previewModal.classList.remove('hidden');

    $('preview-download').onclick = () => {
      canvas.toBlob(blob => {
        const idx = cells.indexOf(cell) + 1;
        saveAs(blob, `tweet-${String(idx).padStart(2,'0')}.${settings.ext}`);
      }, mime, quality);
    };
    setStatus('');
  } catch (err) {
    setStatus('Erro: ' + err.message);
    alert(err.message);
  }
}

function closePreview() {
  previewModal.classList.add('hidden');
  previewImg.src = '';
}

async function downloadAllAsZip() {
  const valid = cells.filter(c => c.text.trim());
  if (!valid.length) { alert('Nenhuma célula com texto preenchido.'); return; }
  if (!profiles.length) { alert('Crie ao menos um perfil antes de gerar as imagens.'); return; }

  const zip = new JSZip();
  const mime = settings.ext === 'jpg' ? 'image/jpeg' : 'image/png';
  const quality = settings.ext === 'jpg' ? 0.92 : undefined;

  setStatus(`Gerando 0 de ${valid.length}...`);
  try {
    for (let i = 0; i < valid.length; i++) {
      setStatus(`Gerando ${i + 1} de ${valid.length}...`);
      const canvas = await renderCellToCanvas(valid[i]);
      const blob = await new Promise(res => canvas.toBlob(res, mime, quality));
      const name = `tweet-${String(i + 1).padStart(2, '0')}.${settings.ext}`;
      zip.file(name, blob);
    }
    setStatus('Compactando ZIP...');
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    saveAs(zipBlob, `carrossel-tweets-${Date.now()}.zip`);
    setStatus(`Pronto — ${valid.length} imagens salvas.`);
  } catch (err) {
    setStatus('Erro: ' + err.message);
    alert('Falha ao gerar: ' + err.message);
  }
}

// ============================================================
// UTILS
// ============================================================
function setStatus(msg) { status.textContent = msg; }

function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}
function escapeAttr(s) { return escapeHtml(s); }

function fileToDataURL(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

function placeholderAvatar(name) {
  const initial = (name || '?').trim().charAt(0).toUpperCase();
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">
    <rect width="100" height="100" fill="#1d9bf0"/>
    <text x="50" y="62" font-size="48" text-anchor="middle" fill="#fff" font-family="Arial">${initial}</text>
  </svg>`;
  return 'data:image/svg+xml;base64,' + btoa(svg);
}

function formatNum(n) {
  const num = parseInt(n, 10);
  if (isNaN(num)) return n;
  if (num >= 1000000) return (num / 1000000).toFixed(1).replace('.0','') + ' mi';
  if (num >= 1000) return (num / 1000).toFixed(1).replace('.0','') + ' mil';
  return String(num);
}
