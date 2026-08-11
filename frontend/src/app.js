const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
let requests = [];

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
  const transitions = { Submitted: ['Area Coordinator Review', 'Returned'], 'Area Coordinator Review': ['Dean Review', 'Returned'], 'Dean Review': ['Approved', 'Returned'], Approved: ['Printing'], Printing: ['Ready'], Ready: ['Released'], Returned: ['Submitted'] };
  const tos = r.tos || {};
  const matrix = [['Remembering',tos.remembering],['Understanding',tos.understanding],['Applying',tos.applying],['Analyzing',tos.analyzing],['Evaluating',tos.evaluating],['Creating',tos.creating]];
  const approvals = r.approvals || { coordinator:{}, dean:{} };
  $('#modal-content').innerHTML = `<p class="eyebrow">${r.reference}</p><h2>${r.courseCode} · ${r.courseTitle}</h2>${badge(r.status)}<div class="detail-grid"><div><small>Examination</small><strong>${r.examType}</strong></div><div><small>Department</small><strong>${r.department}</strong></div><div><small>Print quantity</small><strong>${r.copies} copies · ${r.pages} pages each</strong></div><div><small>TOS items</small><strong>${tos.totalItems || 50} test items</strong></div><div><small>Exam schedule</small><strong>${formatDate(r.examDate)}</strong></div><div><small>Needed by</small><strong>${formatDate(r.neededBy)}</strong></div><div><small>Learning outcomes</small><strong>${tos.outcomes || 'Legacy request — add during revision'}</strong></div><div><small>Content coverage</small><strong>${tos.coverage || 'Legacy request — add during revision'}</strong></div></div><p class="eyebrow">COGNITIVE-LEVEL DISTRIBUTION</p><div class="tos-matrix">${matrix.map(([label,value]) => `<div><strong>${value ?? 0}%</strong><small>${label}</small></div>`).join('')}</div><div class="approval-records"><div class="approval-record ${approvals.coordinator.approvedAt ? 'approved' : ''}"><small>Area Coordinator</small><strong>${approvals.coordinator.name || 'Awaiting approval'}</strong>${approvals.coordinator.notes ? `<small>${approvals.coordinator.notes}</small>` : ''}</div><div class="approval-record ${approvals.dean.approvedAt ? 'approved' : ''}"><small>Dean</small><strong>${approvals.dean.name || 'Awaiting approval'}</strong>${approvals.dean.notes ? `<small>${approvals.dean.notes}</small>` : ''}</div></div><div class="workflow-actions">${(transitions[r.status] || []).map((next) => `<button class="${next === 'Returned' ? 'secondary' : 'primary'}" data-transition="${next}" data-id="${r.id}">${next === 'Dean Review' ? 'Approve as Area Coordinator' : next === 'Approved' ? 'Approve as Dean' : next === 'Returned' ? 'Return for revision' : `Mark ${next}`}</button>`).join('') || '<span class="muted">Workflow complete</span>'}</div>`;
  $('#modal').hidden = false;
}

async function load() {
  requests = await api('/requests');
  renderDashboard();
  renderTable();
}

$$('[data-view]').forEach((button) => button.addEventListener('click', () => showView(button.dataset.view)));
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
    const approvalRequired = ['Dean Review', 'Approved'].includes(button.dataset.transition);
    const role = button.dataset.transition === 'Dean Review' ? 'Area Coordinator' : 'Dean';
    const approverName = approvalRequired ? window.prompt(`${role} full name:`) : '';
    if (approvalRequired && !approverName) return;
    const notes = approvalRequired ? (window.prompt(`${role} approval notes (optional):`) || '') : '';
    await api(`/requests/${button.dataset.id}/status`, { method: 'PATCH', body: JSON.stringify({ status: button.dataset.transition, approverName, notes }) });
    $('#modal').hidden = true;
    await load();
    toast(`Request moved to ${button.dataset.transition}`);
  } catch (error) { toast(error.message); }
});
$('#request-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const values = Object.fromEntries(new FormData(event.target));
  values.copies = Number(values.copies); values.pages = Number(values.pages);
  ['tosTotalItems','tosRemembering','tosUnderstanding','tosApplying','tosAnalyzing','tosEvaluating','tosCreating'].forEach((key) => { values[key] = Number(values[key]); });
  try {
    const created = await api('/requests', { method: 'POST', body: JSON.stringify(values) });
    event.target.reset();
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

function updateTosTotal() {
  const total = $$('.tos-percent').reduce((sum, input) => sum + Number(input.value || 0), 0);
  $('#tos-total').innerHTML = `Cognitive-level distribution: <strong>${total}%</strong>${total === 100 ? '' : ' — must total 100%'}`;
  $('#tos-total').classList.toggle('invalid', total !== 100);
}
$$('.tos-percent').forEach((input) => input.addEventListener('input', updateTosTotal));

load().catch((error) => toast(error.message));
