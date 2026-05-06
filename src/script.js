//  DATA LAYER
const KEY = 'occurrenceos_v2';
let DB = { ocorrencias: [] };
let currentUser = null;
let editingId = null;

function loadDB() {
  try { DB = JSON.parse(localStorage.getItem(KEY)) || { ocorrencias: [] }; }
  catch { DB = { ocorrencias: [] }; }
}
function saveDB() { localStorage.setItem(KEY, JSON.stringify(DB)); }
function genId() { return Date.now().toString(36) + Math.random().toString(36).slice(2,6); }


//  AUTH
const USERS = {
  user:  { pass: '1234', profile: 'comum',      name: 'Usuário' },
  admin: { pass: '1234', profile: 'tratativas',  name: 'Admin Tratativas' }
};

let selectedProfile = 'comum';

function selectProfile(p) {
  selectedProfile = p;
  document.querySelectorAll('.profile-tab').forEach(t => t.classList.toggle('active', t.dataset.profile === p));
  const hint = document.getElementById('loginHint');
  hint.textContent = p === 'comum'
    ? 'perfil: usuário comum — insere ocorrências'
    : 'perfil: tratativas — visualiza, edita e resolve';
}

function doLogin() {
  const u = document.getElementById('loginUser').value.trim();
  const p = document.getElementById('loginPass').value;
  const err = document.getElementById('loginError');
  const found = USERS[u];
  if (!found || found.pass !== p || found.profile !== selectedProfile) {
    err.style.display = 'block';
    return;
  }
  err.style.display = 'none';
  currentUser = { username: u, ...found };
  initApp();
}

function doLogout() {
  currentUser = null;
  document.getElementById('loginPage').classList.add('active');
  document.getElementById('appPage').classList.remove('active');
  document.getElementById('loginPage').style.display = 'flex';
  document.getElementById('appPage').style.display = 'none';
  document.getElementById('loginUser').value = '';
  document.getElementById('loginPass').value = '';
}


//  APP INIT
function initApp() {
  document.getElementById('loginPage').classList.remove('active');
  document.getElementById('appPage').classList.add('active');
  document.getElementById('loginPage').style.display = 'none';
  document.getElementById('appPage').style.display = 'flex';

  document.getElementById('userName').textContent = currentUser.name;
  document.getElementById('userRole').textContent = currentUser.profile;
  document.getElementById('userAvatar').textContent = currentUser.name[0].toUpperCase();

  const isAdmin = currentUser.profile === 'tratativas';
  document.getElementById('navTratativas').classList.toggle('hidden', !isAdmin);

  loadDB();
  if (DB.ocorrencias.length === 0) seedData();

  showView('dashboard');
  document.getElementById('fData').value = today();
}

function today() { return new Date().toISOString().slice(0,10); }

function seedData() {
  DB.ocorrencias = [
    { id: genId(), titulo: 'Falha no servidor de produção', data: '2025-04-28', agente: 'Carlos Melo', descricao: 'Servidor web fora do ar por 2h, afetando clientes.', status: 'Aberta', tipo: 'Incidente', categoria: 'Infraestrutura', prioridade: 'Alta', local: 'TI', envolvidos: 'Equipe de infra', detalhamento: 'Queda de energia causou falha no no-break.', tratativas: 'Servidor reiniciado manualmente.', plano: 'Trocar no-break e revisar contingência.', prazo: '2025-05-10', responsavel: 'Ana Lima', resolvida: false, criadoEm: new Date().toISOString() },
    { id: genId(), titulo: 'Atraso na entrega de materiais', data: '2025-04-30', agente: 'João Souza', descricao: 'Materiais de escritório não entregues no prazo acordado.', status: 'Em tratamento', tipo: 'Não Conformidade', categoria: 'Processo', prioridade: 'Média', local: 'Almoxarifado', envolvidos: 'Fornecedor, Compras', detalhamento: '', tratativas: 'Contactado fornecedor. Nova data: 05/05.', plano: '', prazo: '', responsavel: 'Pedro Nunes', resolvida: false, criadoEm: new Date().toISOString() },
    { id: genId(), titulo: 'Acesso indevido ao sistema RH', data: '2025-05-01', agente: 'Lara Dias', descricao: 'Funcionário acessou dados de outros departamentos sem autorização.', status: 'Resolvida', tipo: 'Incidente', categoria: 'Segurança', prioridade: 'Alta', local: 'RH', envolvidos: 'TI, Jurídico', detalhamento: 'Falha na matriz de permissões.', tratativas: 'Acesso revogado imediatamente.', plano: 'Revisão completa de perfis no sistema.', prazo: '2025-05-15', responsavel: 'Ana Lima', resolvida: true, criadoEm: new Date().toISOString() }
  ];
  saveDB();
}


//  NAVEGACAO

function showView(v) {
  document.querySelectorAll('.view').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(el => el.classList.remove('active'));

  const map = { dashboard: 'viewDashboard', nova: 'viewNova', tratativas: 'viewTratativas' };
  document.getElementById(map[v])?.classList.add('active');
  document.querySelectorAll('.nav-btn').forEach(btn => {
    if (btn.textContent.toLowerCase().includes(v.toLowerCase()) ||
       (v === 'dashboard' && btn.textContent.includes('Dashboard'))) {
      btn.classList.add('active');
    }
  });

  if (v === 'dashboard') renderDashboard();
  if (v === 'tratativas') renderTratativas();
}


//  DASH
function renderDashboard() {
  const all = DB.ocorrencias;
  const abertas   = all.filter(o => !o.resolvida && !o.tratativas).length;
  const tratando  = all.filter(o => !o.resolvida && o.tratativas).length;
  const resolvidas = all.filter(o => o.resolvida).length;
  const altas     = all.filter(o => o.prioridade === 'Alta' && !o.resolvida).length;

  document.getElementById('dashboardSub').textContent =
    `// total: ${all.length} ocorrência${all.length !== 1 ? 's' : ''} registrada${all.length !== 1 ? 's' : ''}`;

  document.getElementById('statsGrid').innerHTML = `
    <div class="stat-card"><div class="stat-label">TOTAL</div><div class="stat-value blue">${all.length}</div></div>
    <div class="stat-card"><div class="stat-label">ABERTAS</div><div class="stat-value amber">${abertas}</div></div>
    <div class="stat-card"><div class="stat-label">EM TRATAMENTO</div><div class="stat-value blue">${tratando}</div></div>
    <div class="stat-card"><div class="stat-label">RESOLVIDAS</div><div class="stat-value green">${resolvidas}</div></div>
    <div class="stat-card"><div class="stat-label">PRIORIDADE ALTA</div><div class="stat-value red">${altas}</div></div>
  `;

  const recent = [...all].sort((a,b) => new Date(b.criadoEm) - new Date(a.criadoEm)).slice(0, 5);
  const container = document.getElementById('dashboardList');
  if (!recent.length) { container.innerHTML = '<div class="empty-state"><div class="empty-icon">📋</div>Nenhuma ocorrência registrada ainda.</div>'; return; }
  container.innerHTML = '';
  recent.forEach(o => container.appendChild(buildCard(o, false)));
}


//  add a oc

function addOcorrencia() {
  const titulo   = document.getElementById('fTitulo').value.trim();
  const data     = document.getElementById('fData').value;
  const agente   = document.getElementById('fAgente').value.trim();
  const descricao = document.getElementById('fDescricao').value.trim();

  if (!titulo || !agente || !descricao) { toast('Preencha todos os campos obrigatórios (*)', 'error'); return; }

  const nova = {
    id: genId(), titulo, data: data || today(), agente, descricao,
    status: 'Aberta', tipo: '', categoria: '', prioridade: '',
    local: '', envolvidos: '', detalhamento: '', tratativas: '', plano: '',
    prazo: '', responsavel: '', resolvida: false, criadoEm: new Date().toISOString()
  };
  DB.ocorrencias.unshift(nova);
  saveDB();
  clearForm();
  toast('Ocorrência registrada com sucesso!', 'success');
  showView('dashboard');
}

function clearForm() {
  ['fTitulo','fAgente','fDescricao'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('fData').value = today();
}

//  TRATATIVA
function renderTratativas() {
  const txt  = (document.getElementById('filtroTxt')?.value || '').toLowerCase();
  const st   = document.getElementById('filtroSt')?.value || '';
  const pr   = document.getElementById('filtroPr')?.value || '';
  const cat  = document.getElementById('filtroCat')?.value || '';

  let lista = DB.ocorrencias.filter(o => {
    const s = computeStatus(o);
    const matchTxt = txt ? (`${o.titulo} ${o.agente} ${o.descricao}`).toLowerCase().includes(txt) : true;
    const matchSt  = st  ? s === st : true;
    const matchPr  = pr  ? o.prioridade === pr : true;
    const matchCat = cat ? o.categoria === cat : true;
    return matchTxt && matchSt && matchPr && matchCat;
  });

  const container = document.getElementById('trataList');
  if (!lista.length) { container.innerHTML = '<div class="empty-state"><div class="empty-icon">🔍</div>Nenhuma ocorrência encontrada.</div>'; return; }
  container.innerHTML = '';
  lista.forEach(o => container.appendChild(buildCard(o, true)));
}

function clearFilters() {
  document.getElementById('filtroTxt').value = '';
  document.getElementById('filtroSt').value = '';
  document.getElementById('filtroPr').value = '';
  document.getElementById('filtroCat').value = '';
  renderTratativas();
}

function computeStatus(o) {
  if (o.resolvida) return 'Resolvida';
  if (o.tratativas?.trim()) return 'Em tratamento';
  return 'Aberta';
}


//  BUILD CARD

function buildCard(o, showActions) {
  const li = document.createElement('div');
  li.className = 'occ-card' + (o.resolvida ? ' resolved' : '');
  const status = computeStatus(o);
  const stClass = status === 'Resolvida' ? 'resolvida' : status === 'Em tratamento' ? 'tratamento' : 'aberta';
  const prClass = (o.prioridade || '').toLowerCase().replace('é','e');

  li.innerHTML = `
    <div class="occ-top">
      <div>
        <div class="occ-title">${esc(o.titulo)}</div>
        <div class="occ-meta">${o.data}  ·  agente: ${esc(o.agente)}</div>
      </div>
      <div class="occ-badges">
        <span class="badge-pill ${stClass}">${status}</span>
        ${o.prioridade    ? `<span class="badge-pill ${prClass}">${esc(o.prioridade)}</span>` : ''}
        ${o.classificacao ? `<span class="badge-pill cat">${esc(o.classificacao)}</span>` : ''}
        ${o.tipificacao   ? `<span class="badge-pill cat">${esc(o.tipificacao)}</span>` : ''}
        ${o.numOc         ? `<span class="badge-pill cat">#${esc(o.numOc)}</span>` : ''}
        ${o.empresa       ? `<span class="badge-pill cat">${esc(o.empresa)}</span>` : ''}
        ${o.local         ? `<span class="badge-pill cat">📍 ${esc(o.local)}</span>` : ''}
      </div>
    </div>
    <div class="occ-desc">${esc(o.descricao)}</div>
    ${o.tratativas ? `<div class="occ-tratativa"><strong>// TRATATIVA</strong>${esc(o.tratativas)}</div>` : ''}
    ${o.plano && o.plano.length ? `<div class="occ-tratativa" style="border-left-color:var(--green)"><strong>// PLANO DE AÇÃO</strong>${o.plano.length} ação(ões) registrada(s)</div>` : ''}
    ${showActions ? `
    <div class="occ-actions">
      <button class="occ-action-btn" onclick="openModal('${o.id}')">✏️ Tratar</button>
      <button class="occ-action-btn resolve" onclick="toggleResolve('${o.id}')">${o.resolvida ? '↩ Reabrir' : '✓ Resolver'}</button>
      <button class="occ-action-btn del" onclick="deleteOcc('${o.id}')">🗑 Excluir</button>
    </div>` : ''}
  `;
  return li;
}


//  MODA TRATATIVA

function openModal(id) {
  const o = DB.ocorrencias.find(x => x.id === id);
  if (!o) return;
  editingId = id;

  document.getElementById('modalTitle').textContent = `Tratar: ${o.titulo}`;
  document.getElementById('mTitulo').value = o.titulo;
  document.getElementById('mData').value = o.data;
  document.getElementById('mAgente').value = o.agente;
  document.getElementById('mStatus').value = computeStatus(o);
  document.getElementById('mDesc').value = o.descricao;

  document.getElementById('mStatusEdit').value   = o.statusEdit   || '';
  document.getElementById('mNumOc').value         = o.numOc        || '';
  document.getElementById('mOrigem').value        = o.origem       || '';
  document.getElementById('mDataReceb').value     = o.dataReceb    || '';
  document.getElementById('mDataHoraEvento').value= o.dataHoraEvento || '';
  document.getElementById('mPrioridade').value    = o.prioridade   || '';
  document.getElementById('mBiblioteca').value    = o.biblioteca   || '';
  document.getElementById('mClassificacao').value = o.classificacao|| '';
  document.getElementById('mTipificacao').value   = o.tipificacao  || '';
  document.getElementById('mTipo').value          = o.tipo         || '';
  document.getElementById('mRisco').value         = o.risco        || '';
  document.getElementById('mLocal').value         = o.local        || '';
  document.getElementById('mEmpresa').value       = o.empresa      || '';
  document.getElementById('mEnvolvidos').value    = o.envolvidos   || '';
  document.getElementById('mDetalhamento').value  = o.detalhamento || '';
  document.getElementById('mTratativas').value    = o.tratativas   || '';
  planoRows = Array.isArray(o.plano) ? JSON.parse(JSON.stringify(o.plano)) : [];
  renderPlanoTable();
  document.getElementById('mPrazo').value         = o.prazo        || '';
  document.getElementById('mResponsavel').value   = o.responsavel  || '';

  document.getElementById('modalOverlay').classList.add('open');
}

function closeModal() {
  document.getElementById('modalOverlay').classList.remove('open');
  editingId = null;
}

function salvarTratativa() {
  const o = DB.ocorrencias.find(x => x.id === editingId);
  if (!o) return;
  o.statusEdit     = document.getElementById('mStatusEdit').value;
  o.numOc          = document.getElementById('mNumOc').value;
  o.origem         = document.getElementById('mOrigem').value;
  o.dataReceb      = document.getElementById('mDataReceb').value;
  o.dataHoraEvento = document.getElementById('mDataHoraEvento').value;
  o.prioridade     = document.getElementById('mPrioridade').value;
  o.biblioteca     = document.getElementById('mBiblioteca').value;
  o.classificacao  = document.getElementById('mClassificacao').value;
  o.tipificacao    = document.getElementById('mTipificacao').value;
  o.tipo           = document.getElementById('mTipo').value;
  o.risco          = document.getElementById('mRisco').value;
  o.local          = document.getElementById('mLocal').value;
  o.empresa        = document.getElementById('mEmpresa').value;
  o.envolvidos     = document.getElementById('mEnvolvidos').value;
  o.detalhamento   = document.getElementById('mDetalhamento').value;
  o.tratativas     = document.getElementById('mTratativas').value;
  o.plano          = JSON.parse(JSON.stringify(planoRows));
  o.prazo          = document.getElementById('mPrazo').value;
  o.responsavel    = document.getElementById('mResponsavel').value;
  if (o.statusEdit === 'Resolvida') o.resolvida = true;
  else if (o.statusEdit === 'Aberta') o.resolvida = false;
  saveDB();
  closeModal();
  renderTratativas();
  toast('Tratativa salva com sucesso!', 'success');
}

function resolverModal() {
  const o = DB.ocorrencias.find(x => x.id === editingId);
  if (!o) return;
  salvarTratativa();
  o.resolvida = true;
  saveDB();
  renderTratativas();
  toast('Ocorrência marcada como resolvida!', 'success');
}

function toggleResolve(id) {
  const o = DB.ocorrencias.find(x => x.id === id);
  if (!o) return;
  o.resolvida = !o.resolvida;
  saveDB();
  renderTratativas();
  toast(o.resolvida ? 'Marcada como resolvida.' : 'Ocorrência reaberta.', 'success');
}

function deleteOcc(id) {
  if (!confirm('Excluir esta ocorrência permanentemente?')) return;
  DB.ocorrencias = DB.ocorrencias.filter(o => o.id !== id);
  saveDB();
  renderTratativas();
  toast('Ocorrência excluída.', 'success');
}


//  UTILS
function esc(s) {
  if (!s) return '';
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function toast(msg, type = 'success') {
  const wrap = document.getElementById('toastWrap');
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.textContent = (type === 'success' ? '✓ ' : '⚠ ') + msg;
  wrap.appendChild(t);
  setTimeout(() => t.remove(), 3500);
}



//  TABELA DE PA

let planoRows = [];

function addPlanoRow() {
  planoRows.push({ oq:'', porq:'', como:'', quem:'', onde:'', quando:'', status:'Pendente' });
  renderPlanoTable();
}

function deletePlanoRow(idx) {
  planoRows.splice(idx, 1);
  renderPlanoTable();
}

function updatePlanoField(idx, field, val) {
  planoRows[idx][field] = val;
  // cor por status
  if (field === 'status') {
    const sel = document.querySelector(`.plano-status-sel[data-idx="${idx}"]`);
    if (sel) applyStatusClass(sel, val);
  }
}

function applyStatusClass(sel, val) {
  sel.className = 'plano-status-sel';
  const map = { 'Pendente':'s-pendente','Em andamento':'s-andamento','Concluído':'s-concluido','Cancelado':'s-cancelado' };
  if (map[val]) sel.classList.add(map[val]);
}

function renderPlanoTable() {
  const wrap = document.getElementById('planoTable');
  if (!wrap) return;
  if (planoRows.length === 0) {
    wrap.innerHTML = '<div style="color:var(--muted);font-family:var(--mono);font-size:.72rem;padding:10px 0;">Nenhuma ação adicionada. Clique em "+ Adicionar linha" para começar.</div>';
    return;
  }
  let html = `
    <div class="plano-table-wrap">
      <table class="plano-table">
        <thead>
          <tr>
            <th>#</th>
            <th>O QUÊ?</th>
            <th>POR QUÊ?</th>
            <th>COMO?</th>
            <th>QUEM?</th>
            <th>ONDE?</th>
            <th>QUANDO?</th>
            <th>STATUS</th>
            <th></th>
          </tr>
        </thead>
        <tbody>`;
  planoRows.forEach((r, i) => {
    const stMap = { 'Pendente':'s-pendente','Em andamento':'s-andamento','Concluído':'s-concluido','Cancelado':'s-cancelado' };
    const stClass = stMap[r.status] || 's-pendente';
    html += `
          <tr>
            <td style="color:var(--muted);font-family:var(--mono);text-align:center;width:28px;">${i+1}</td>
            <td><textarea class="plano-td-input" rows="2" onchange="updatePlanoField(${i},'oq',this.value)" oninput="updatePlanoField(${i},'oq',this.value)">${escHtml(r.oq)}</textarea></td>
            <td><textarea class="plano-td-input" rows="2" onchange="updatePlanoField(${i},'porq',this.value)" oninput="updatePlanoField(${i},'porq',this.value)">${escHtml(r.porq)}</textarea></td>
            <td><textarea class="plano-td-input" rows="2" onchange="updatePlanoField(${i},'como',this.value)" oninput="updatePlanoField(${i},'como',this.value)">${escHtml(r.como)}</textarea></td>
            <td><textarea class="plano-td-input" rows="2" onchange="updatePlanoField(${i},'quem',this.value)" oninput="updatePlanoField(${i},'quem',this.value)">${escHtml(r.quem)}</textarea></td>
            <td><textarea class="plano-td-input" rows="2" onchange="updatePlanoField(${i},'onde',this.value)" oninput="updatePlanoField(${i},'onde',this.value)">${escHtml(r.onde)}</textarea></td>
            <td><input type="date" class="plano-td-input" style="min-height:unset;" value="${escHtml(r.quando)}" onchange="updatePlanoField(${i},'quando',this.value)"/></td>
            <td style="min-width:120px;">
              <select class="plano-status-sel ${stClass}" data-idx="${i}" onchange="updatePlanoField(${i},'status',this.value)">
                <option ${r.status==='Pendente'?'selected':''}>Pendente</option>
                <option ${r.status==='Em andamento'?'selected':''}>Em andamento</option>
                <option ${r.status==='Concluído'?'selected':''}>Concluído</option>
                <option ${r.status==='Cancelado'?'selected':''}>Cancelado</option>
              </select>
            </td>
            <td><button class="btn-del-row" onclick="deletePlanoRow(${i})" title="Remover">✕</button></td>
          </tr>`;
  });
  html += `</tbody></table></div>`;
  wrap.innerHTML = html;
}

function escHtml(s) {
  if (!s) return '';
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// fechar modal se clicar fora
document.getElementById('modalOverlay').addEventListener('click', function(e) {
  if (e.target === this) closeModal();
});

// página de loading
loadDB();
document.getElementById('loginPage').style.display = 'flex';
document.getElementById('appPage').style.display = 'none';