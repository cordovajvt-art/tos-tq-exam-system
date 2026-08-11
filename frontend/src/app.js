const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
let requests = [];
let currentRole = 'faculty';

const api = async (path, options = {}) => {
  const response = await fetch(`/api${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || 'Request failed');
  return body;
};

const badge = (status) => `<span class="badge ${status.toLowerCase().replaceAll(' ', '-')}">${status}</span>`;
const formatDate = (value) => new Intl.DateTimeFormat('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(`${value}T00:00:00`));

function showView(name) {
  $$('.view').forEach((view) => view.classList.toggle('active', view.id === name));
  $$('.nav-item').forEach((item) => item.classList.toggle('active', item.dataset.view === name));
  $('#page-title').textContent = { dashboard: 'Printing overview', requests: 'Request register', new: 'Create request' }[name];
  $('.sidebar').classList.remove('open');
  if (name === 'requests') renderTable();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

const roleConfig = {
  biology: { title: 'Biology & Chemistry Area Coordinator', area: 'Biology and Chemistry', status: 'Area Coordinator Review' },
  mathematics: { title: 'Mathematics & Physics Area Coordinator', area: 'Mathematics and Physics', status: 'Area Coordinator Review' },
  dean: { title: 'Dean Dashboard', area: null, status: 'Dean Review' },
};

function openRoleDashboard(role) {
  currentRole = role;
  const config = roleConfig[role];
  showView('review');
  $$('.nav-item').forEach((item) => item.classList.toggle('active', item.dataset.role === role));
  $('#page-title').textContent = config.title;
  $('#review-title').textContent = config.title;
  $('#review-description').textContent = role === 'dean' ? 'Give final academic approval to coordinator-endorsed TOS and TQ submissions.' : `Review faculty TOS and TQ submissions assigned to the ${config.area} area.`;
  $('#review-role-badge').textContent = role === 'dean' ? 'Dean' : 'Area Coordinator';
  renderReviewDashboard();
}

function renderReviewDashboard() {
  const config = roleConfig[currentRole];
  if (!config) return;
  const assigned = requests.filter((r) => !config.area || r.academicArea === config.area);
  const pending = assigned.filter((r) => r.status === config.status);
  const endorsed = currentRole === 'dean' ? assigned.filter((r) => r.approvals?.dean?.approvedAt).length : assigned.filter((r) => r.approvals?.coordinator?.approvedAt).length;
  $('#review-pending').textContent = pending.length;
  $('#review-stats').innerHTML = `<article class="stat"><span>Assigned submissions</span><strong>${assigned.length}</strong></article><article class="stat"><span>Awaiting my review</span><strong>${pending.length}</strong></article><article class="stat"><span>Approved by me</span><strong>${endorsed}</strong></article><article class="stat"><span>Returned</span><strong>${assigned.filter((r) => r.status === 'Returned').length}</strong></article>`;
  $('#review-queue').innerHTML = pending.map((r) => `<article class="review-card"><div><h3>${r.courseCode} · ${r.courseTitle}</h3><p>${r.reference} · ${r.examType}</p><div class="review-meta"><span>${r.academicArea}</span><span>${r.tos.totalItems} TQ items</span><span>Needed ${formatDate(r.neededBy)}</span></div></div><button class="primary" data-id="${r.id}">Review TOS & TQ</button></article>`).join('') || '<p class="empty">No submissions are waiting for your approval.</p>';
}

function renderDashboard() {
  const groups = {
    Total: requests.length,
    'In review': requests.filter((r) => ['Submitted', 'Area Coordinator Review', 'Dean Review'].includes(r.status)).length,
    'In production': requests.filter((r) => ['Approved', 'Printing'].includes(r.status)).length,
    'Ready to claim': requests.filter((r) => r.status === 'Ready').length,
  };
  $('#stats').innerHTML = Object.entries(groups).map(([label, value]) => `<article class="stat"><span>${label}</span><strong>${value}</strong></article>`).join('');
  $('#recent').innerHTML = requests.slice(0, 5).map((r) => `<article class="request-row" data-id="${r.id}"><div><h3>${r.courseCode} · ${r.courseTitle}</h3><p>${r.reference} · ${r.examType} · ${r.copies} copies</p></div>${badge(r.status)}</article>`).join('') || '<p class="empty">No requests yet.</p>';
}

function renderTable() {
  const query = $('#search').value.toLowerCase();
  const status = $('#status-filter').value;
  const visible = requests.filter((r) => (!query || `${r.reference} ${r.courseCode} ${r.courseTitle}`.toLowerCase().includes(query)) && (!status || r.status === status));
  $('#request-table').innerHTML = visible.map((r) => `<tr><td><strong>${r.reference}</strong><small>${formatDate(r.createdAt.slice(0, 10))}</small></td><td><strong>${r.courseCode} · ${r.courseTitle}</strong><small>${r.examType}</small></td><td>${r.copies} × ${r.pages} pages</td><td><strong>${formatDate(r.examDate)}</strong><small>Needed ${formatDate(r.neededBy)}</small></td><td>${badge(r.status)}</td><td><button class="row-action" data-id="${r.id}">Open</button></td></tr>`).join('') || '<tr><td colspan="6" class="empty">No matching requests.</td></tr>';
}

function toast(message) {
  $('#toast').textContent = message;
  $('#toast').classList.add('show');
  setTimeout(() => $('#toast').classList.remove('show'), 2600);
}

function openRequest(id) {
  const r = requests.find((item) => item.id === Number(id));
  if (!r) return;
  const tos = r.tos || {};
  const matrix = [['Remembering',tos.remembering],['Understanding',tos.understanding],['Applying',tos.applying],['Analyzing',tos.analyzing],['Evaluating',tos.evaluating],['Creating',tos.creating]];
  const rowTable = tos.rows?.length ? `<p class="eyebrow">TABLE OF SPECIFICATIONS</p><div class="tos-sheet-wrap"><table class="tos-sheet detail-tos"><thead><tr><th>Topic / Objectives</th><th>Hrs.</th><th>Hrs. %</th><th>Type</th><th>R</th><th>U</th><th>Ap</th><th>An</th><th>E</th><th>C</th><th>Items</th><th>Points</th><th>Points %</th></tr></thead><tbody>${tos.rows.map((row) => `<tr><td>${row.topicObjectives}</td><td>${row.hours}</td><td>${row.hoursPercentage}%</td><td>${row.testType}</td>${bloomLevels.map((level) => `<td>${row[level]}</td>`).join('')}<td>${row.items}</td><td>${row.points}</td><td>${row.pointsPercentage}%</td></tr>`).join('')}</tbody></table></div>` : '';
  const approvals = r.approvals || { coordinator:{}, dean:{} };
  const coordinator = approvals.coordinator; const dean = approvals.dean;
  const permitted = currentRole === 'dean' && r.status === 'Dean Review' ? ['Approved','Returned'] : ['biology','mathematics'].includes(currentRole) && r.status === 'Area Coordinator Review' && r.academicArea === roleConfig[currentRole].area ? ['Dean Review','Returned'] : currentRole === 'faculty' && ['Submitted','Returned'].includes(r.status) ? [r.status === 'Submitted' ? 'Area Coordinator Review' : 'Submitted'] : [];
  const approvalNext = permitted.find((next) => ['Dean Review','Approved'].includes(next));
  const actions = approvalNext ? `<form id="approval-form" class="review-form" data-id="${r.id}" data-next="${approvalNext}"><label>Approver full name<input name="approverName" required placeholder="Enter your official name"/></label><label>Comments on the TOS<textarea name="tosComment" rows="2" required placeholder="Comment on outcomes, coverage, and cognitive distribution"></textarea></label><label>Comments on the TQ<textarea name="tqComment" rows="2" required placeholder="Comment on test questions, quality, and alignment"></textarea></label><label>Attach signature image<input name="signature" type="file" accept="image/png,image/jpeg,image/webp" required/></label><div class="form-actions">${permitted.includes('Returned') ? `<button type="button" class="secondary" data-transition="Returned" data-id="${r.id}">Return for revision</button>` : ''}<button class="primary" type="submit">${currentRole === 'dean' ? 'Sign and approve' : 'Sign and endorse to Dean'}</button></div></form>` : `<div class="workflow-actions">${permitted.map((next) => `<button class="primary" data-transition="${next}" data-id="${r.id}">Send to ${next}</button>`).join('') || '<span class="muted">Open the assigned reviewer dashboard to take action.</span>'}</div>`;
  $('#modal-content').innerHTML = `<p class="eyebrow">${r.reference} · ${r.academicArea || 'Biology and Chemistry'}</p><h2>${r.courseCode} · ${r.courseTitle}</h2>${badge(r.status)}<div class="detail-grid"><div><small>Examination</small><strong>${r.examType}</strong></div><div><small>Department</small><strong>${r.department}</strong></div><div><small>Print quantity</small><strong>${r.copies} copies · ${r.pages} pages each</strong></div><div><small>TQ items</small><strong>${tos.totalItems || 50} test questions</strong></div><div><small>Exam schedule</small><strong>${formatDate(r.examDate)}</strong></div><div><small>Needed by</small><strong>${formatDate(r.neededBy)}</strong></div><div><small>Learning outcomes</small><strong>${tos.outcomes || 'Legacy request — add during revision'}</strong></div><div><small>Content coverage</small><strong>${tos.coverage || 'Legacy request — add during revision'}</strong></div></div><p class="eyebrow">TOS COGNITIVE-LEVEL DISTRIBUTION</p><div class="tos-matrix">${matrix.map(([label,value]) => `<div><strong>${value ?? 0}%</strong><small>${label}</small></div>`).join('')}</div><div class="approval-records"><div class="approval-record ${coordinator.approvedAt ? 'approved' : ''}"><small>Area Coordinator</small><strong>${coordinator.name || 'Awaiting approval'}</strong>${coordinator.tosComment ? `<small>TOS: ${coordinator.tosComment}</small>` : ''}${coordinator.tqComment ? `<small>TQ: ${coordinator.tqComment}</small>` : ''}${coordinator.signature ? `<img class="signature-preview" src="${coordinator.signature}" alt="Area Coordinator signature"/>` : ''}</div><div class="approval-record ${dean.approvedAt ? 'approved' : ''}"><small>Dean</small><strong>${dean.name || 'Awaiting approval'}</strong>${dean.tosComment ? `<small>TOS: ${dean.tosComment}</small>` : ''}${dean.tqComment ? `<small>TQ: ${dean.tqComment}</small>` : ''}${dean.signature ? `<img class="signature-preview" src="${dean.signature}" alt="Dean signature"/>` : ''}</div></div>${actions}`;
  if (rowTable) $('#modal-content').innerHTML = $('#modal-content').innerHTML.replace('<p class="eyebrow">TOS COGNITIVE-LEVEL DISTRIBUTION</p>', `${rowTable}<p class="eyebrow">TOS COGNITIVE-LEVEL DISTRIBUTION</p>`);
  $('#modal').hidden = false;
}

async function load() {
  requests = await api('/requests');
  renderDashboard();
  renderTable();
}

$$('[data-view]').forEach((button) => button.addEventListener('click', () => { currentRole = 'faculty'; showView(button.dataset.view); }));
$$('.role-nav').forEach((button) => button.addEventListener('click', () => openRoleDashboard(button.dataset.role)));
document.addEventListener('click', (event) => {
  const go = event.target.closest('[data-go]');
  const opener = event.target.closest('[data-id]');
  if (go) showView(go.dataset.go);
  if (opener && !event.target.closest('[data-transition]')) openRequest(opener.dataset.id);
});
$('#new-top').addEventListener('click', () => showView('new'));
$('#menu').addEventListener('click', () => $('.sidebar').classList.toggle('open'));
$('#search').addEventListener('input', renderTable);
$('#status-filter').addEventListener('change', renderTable);
$('#modal-close').addEventListener('click', () => { $('#modal').hidden = true; });
$('#modal').addEventListener('click', (event) => { if (event.target === $('#modal')) $('#modal').hidden = true; });
$('#modal-content').addEventListener('click', async (event) => {
  const button = event.target.closest('[data-transition]');
  if (!button) return;
  try {
    await api(`/requests/${button.dataset.id}/status`, { method: 'PATCH', body: JSON.stringify({ status: button.dataset.transition }) });
    $('#modal').hidden = true;
    await load();
    if (currentRole !== 'faculty') renderReviewDashboard();
    toast(`Request moved to ${button.dataset.transition}`);
  } catch (error) { toast(error.message); }
});
$('#modal-content').addEventListener('submit', async (event) => {
  if (event.target.id !== 'approval-form') return;
  event.preventDefault();
  const form = event.target; const file = form.signature.files[0];
  if (!file || file.size > 1_000_000) return toast('Attach a signature image smaller than 1 MB');
  const signatureData = await new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = reject; reader.readAsDataURL(file); });
  const values = Object.fromEntries(new FormData(form));
  try {
    await api(`/requests/${form.dataset.id}/status`, { method: 'PATCH', body: JSON.stringify({ status: form.dataset.next, approverName: values.approverName, tosComment: values.tosComment, tqComment: values.tqComment, signatureData }) });
    $('#modal').hidden = true; await load(); renderReviewDashboard(); toast('Signed approval recorded successfully');
  } catch (error) { toast(error.message); }
});

const bloomLevels = ['remembering','understanding','applying','analyzing','evaluating','creating'];
const bloomLabels = ['Remembering','Understanding','Applying','Analyzing','Evaluating','Creating'];

function addTosRow(values = {}) {
  const row = document.createElement('tr');
  row.className = 'tos-entry';
  row.innerHTML = `<td><textarea data-key="topicObjectives" rows="2" placeholder="Topic and measurable objectives">${values.topicObjectives || ''}</textarea></td><td><input data-key="hours" type="number" min="0.5" max="1000" step="0.5" value="${values.hours || ''}"/></td><td class="computed" data-computed="hoursPercentage">0%</td><td><select data-key="testType"><option value="">Select</option>${['Multiple Choice','True or False','Matching Type','Identification','Problem Solving','Essay','Mixed Format'].map((type) => `<option ${values.testType === type ? 'selected' : ''}>${type}</option>`).join('')}</select></td>${bloomLevels.map((level) => `<td><input data-key="${level}" type="number" min="0" max="200" step="1" value="${values[level] ?? 0}"/></td>`).join('')}<td class="computed" data-computed="items">0</td><td><input data-key="points" type="number" min="0" max="10000" step="0.5" value="${values.points || ''}"/></td><td class="computed" data-computed="pointsPercentage">0%</td><td><button class="remove-tos-row" type="button" title="Remove row">×</button></td>`;
  $('#tos-rows').append(row);
  calculateTos();
}

function collectTosRows() {
  return $$('.tos-entry').map((row) => {
    const value = (key) => row.querySelector(`[data-key="${key}"]`).value;
    return { topicObjectives: value('topicObjectives').trim(), hours: Number(value('hours')), testType: value('testType'), points: Number(value('points')), ...Object.fromEntries(bloomLevels.map((level) => [level, Number(value(level))])) };
  }).filter((row) => row.topicObjectives || row.hours || row.testType || row.points || bloomLevels.some((level) => row[level]));
}

function calculateTos() {
  const rows = collectTosRows();
  const elements = $$('.tos-entry');
  const totalHours = rows.reduce((sum,row) => sum + row.hours, 0);
  const totalPoints = rows.reduce((sum,row) => sum + row.points, 0);
  const totals = Object.fromEntries(bloomLevels.map((level) => [level, rows.reduce((sum,row) => sum + row[level], 0)]));
  const totalItems = Object.values(totals).reduce((sum,value) => sum + value, 0);
  elements.forEach((element) => {
    const hours = Number(element.querySelector('[data-key="hours"]').value || 0);
    const points = Number(element.querySelector('[data-key="points"]').value || 0);
    const items = bloomLevels.reduce((sum,level) => sum + Number(element.querySelector(`[data-key="${level}"]`).value || 0), 0);
    element.querySelector('[data-computed="hoursPercentage"]').textContent = `${totalHours ? (hours / totalHours * 100).toFixed(1) : '0.0'}%`;
    element.querySelector('[data-computed="items"]').textContent = items;
    element.querySelector('[data-computed="pointsPercentage"]').textContent = `${totalPoints ? (points / totalPoints * 100).toFixed(1) : '0.0'}%`;
  });
  $('#tos-totals').innerHTML = `<tr><td>TOTAL</td><td>${totalHours}</td><td>${totalHours ? '100%' : '0%'}</td><td></td>${bloomLevels.map((level) => `<td>${totals[level]}</td>`).join('')}<td>${totalItems}</td><td>${totalPoints}</td><td>${totalPoints ? '100%' : '0%'}</td><td></td></tr>`;
  $('#bloom-summary').innerHTML = bloomLevels.map((level,index) => `<article><strong>${totalItems ? (totals[level] / totalItems * 100).toFixed(1) : '0.0'}%</strong><small>${bloomLabels[index]} · ${totals[level]} items</small></article>`).join('');
}

$('#add-tos-row').addEventListener('click', () => addTosRow());
$('#tos-rows').addEventListener('input', calculateTos);
$('#tos-rows').addEventListener('change', calculateTos);
$('#tos-rows').addEventListener('click', (event) => { const remove = event.target.closest('.remove-tos-row'); if (!remove) return; remove.closest('tr').remove(); if (!$$('.tos-entry').length) addTosRow(); calculateTos(); });
$('#request-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const values = Object.fromEntries(new FormData(event.target));
  values.copies = Number(values.copies); values.pages = Number(values.pages);
  values.tosRows = collectTosRows();
  try {
    const created = await api('/requests', { method: 'POST', body: JSON.stringify(values) });
    event.target.reset();
    $('#tos-rows').innerHTML = ''; for (let index = 0; index < 5; index += 1) addTosRow();
    await load();
    showView('requests');
    toast(`${created.reference} submitted successfully`);
  } catch (error) { toast(error.message); }
});

const today = new Date();
const iso = (date) => date.toISOString().slice(0, 10);
$('[name="examDate"]').min = iso(today);
$('[name="examDate"]').value = iso(new Date(today.getTime() + 14 * 86400000));
$('[name="neededBy"]').min = iso(today);
$('[name="neededBy"]').value = iso(new Date(today.getTime() + 10 * 86400000));

for (let index = 0; index < 5; index += 1) addTosRow();

load().catch((error) => toast(error.message));
