import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createDatabase, toRequest, transitions } from './database.mjs';

const root = resolve(fileURLToPath(new URL('../..', import.meta.url)));
const frontend = join(root, 'frontend/dist');
const db = createDatabase(process.env.DATABASE_PATH || join(root, 'data/exam-system.db'));
const port = Number(process.env.PORT || 4173);
const host = process.env.HOST || '127.0.0.1';
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml' };

function json(response, status, body) {
  response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
  response.end(JSON.stringify(body));
}

async function body(request) {
  let text = '';
  for await (const chunk of request) { text += chunk; if (text.length > 1_000_000) throw new Error('Payload too large'); }
  return text ? JSON.parse(text) : {};
}

function validate(input) {
  const required = ['courseCode','courseTitle','examType','department','academicArea','examDate','neededBy','tosOutcomes','tosCoverage'];
  for (const key of required) if (!String(input[key] || '').trim()) return `${key} is required`;
  if (!Number.isInteger(input.copies) || input.copies < 1 || input.copies > 1000) return 'Copies must be between 1 and 1000';
  if (!Number.isInteger(input.pages) || input.pages < 1 || input.pages > 100) return 'Pages must be between 1 and 100';
  if (input.neededBy > input.examDate) return 'Needed-by date must not be after the exam date';
  if (!Number.isInteger(input.tosTotalItems) || input.tosTotalItems < 10 || input.tosTotalItems > 200) return 'TOS total items must be between 10 and 200';
  const levels = ['tosRemembering','tosUnderstanding','tosApplying','tosAnalyzing','tosEvaluating','tosCreating'];
  if (levels.some((key) => !Number.isInteger(input[key]) || input[key] < 0 || input[key] > 100)) return 'Each cognitive level must be between 0 and 100 percent';
  if (levels.reduce((sum, key) => sum + input[key], 0) !== 100) return 'TOS cognitive-level percentages must total 100%';
  if (!['Biology and Chemistry', 'Mathematics and Physics'].includes(input.academicArea)) return 'Select a valid academic area';
}

async function api(request, response, url) {
  if (url.pathname === '/api/health' && request.method === 'GET') return json(response, 200, { status: 'ok', service: 'tos-tq-exam-system' });
  if (url.pathname === '/api/requests' && request.method === 'GET') {
    return json(response, 200, db.prepare('SELECT * FROM requests ORDER BY created_at DESC, id DESC').all().map(toRequest));
  }
  if (url.pathname === '/api/requests' && request.method === 'POST') {
    const input = await body(request); const error = validate(input); if (error) return json(response, 400, { error });
    const year = new Date().getFullYear();
    const sequence = Number(db.prepare('SELECT COALESCE(MAX(id),0)+1 next FROM requests').get().next);
    const reference = `TQ-${year}-${String(sequence).padStart(4, '0')}`;
    const result = db.prepare('INSERT INTO requests (reference,course_code,course_title,exam_type,department,academic_area,copies,pages,exam_date,needed_by,notes,tos_outcomes,tos_coverage,tos_total_items,tos_remembering,tos_understanding,tos_applying,tos_analyzing,tos_evaluating,tos_creating) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)').run(reference,input.courseCode.trim(),input.courseTitle.trim(),input.examType.trim(),input.department.trim(),input.academicArea,input.copies,input.pages,input.examDate,input.neededBy,String(input.notes || '').trim(),input.tosOutcomes.trim(),input.tosCoverage.trim(),input.tosTotalItems,input.tosRemembering,input.tosUnderstanding,input.tosApplying,input.tosAnalyzing,input.tosEvaluating,input.tosCreating);
    db.prepare('INSERT INTO status_history (request_id,from_status,to_status) VALUES (?,NULL,?)').run(result.lastInsertRowid,'Submitted');
    return json(response, 201, toRequest(db.prepare('SELECT * FROM requests WHERE id=?').get(result.lastInsertRowid)));
  }
  const match = url.pathname.match(/^\/api\/requests\/(\d+)\/status$/);
  if (match && request.method === 'PATCH') {
    const id = Number(match[1]); const input = await body(request); const current = db.prepare('SELECT * FROM requests WHERE id=?').get(id);
    if (!current) return json(response, 404, { error: 'Request not found' });
    if (!(transitions[current.status] || []).includes(input.status)) return json(response, 409, { error: `Cannot move from ${current.status} to ${input.status}` });
    if (input.status === 'Dean Review' && !String(input.approverName || '').trim()) return json(response, 400, { error: 'Area coordinator name is required' });
    if (input.status === 'Approved' && !String(input.approverName || '').trim()) return json(response, 400, { error: 'Dean name is required' });
    if (['Dean Review', 'Approved'].includes(input.status) && !/^data:image\/(png|jpeg|webp);base64,/.test(String(input.signatureData || ''))) return json(response, 400, { error: 'A PNG, JPEG, or WebP signature image is required for approval' });
    if (String(input.signatureData || '').length > 1_400_000) return json(response, 413, { error: 'Signature image must be smaller than 1 MB' });
    db.exec('BEGIN');
    try {
      if (input.status === 'Dean Review') db.prepare('UPDATE requests SET status=?,coordinator_name=?,coordinator_tos_comment=?,coordinator_tq_comment=?,coordinator_signature=?,coordinator_approved_at=CURRENT_TIMESTAMP,updated_at=CURRENT_TIMESTAMP WHERE id=?').run(input.status,input.approverName.trim(),String(input.tosComment || '').trim(),String(input.tqComment || '').trim(),input.signatureData,id);
      else if (input.status === 'Approved') db.prepare('UPDATE requests SET status=?,dean_name=?,dean_tos_comment=?,dean_tq_comment=?,dean_signature=?,dean_approved_at=CURRENT_TIMESTAMP,updated_at=CURRENT_TIMESTAMP WHERE id=?').run(input.status,input.approverName.trim(),String(input.tosComment || '').trim(),String(input.tqComment || '').trim(),input.signatureData,id);
      else db.prepare('UPDATE requests SET status=?,updated_at=CURRENT_TIMESTAMP WHERE id=?').run(input.status,id);
      db.prepare('INSERT INTO status_history (request_id,from_status,to_status) VALUES (?,?,?)').run(id,current.status,input.status); db.exec('COMMIT');
    } catch (error) { db.exec('ROLLBACK'); throw error; }
    return json(response, 200, toRequest(db.prepare('SELECT * FROM requests WHERE id=?').get(id)));
  }
  return json(response, 404, { error: 'Not found' });
}

async function staticFile(request, response, url) {
  let path = url.pathname === '/' ? '/index.html' : url.pathname;
  path = resolve(frontend, `.${path}`);
  if (!path.startsWith(frontend)) return json(response, 403, { error: 'Forbidden' });
  try { if (!(await stat(path)).isFile()) throw new Error(); const content = await readFile(path); response.writeHead(200, { 'Content-Type': types[extname(path)] || 'application/octet-stream', 'X-Content-Type-Options': 'nosniff' }); response.end(content); }
  catch { const content = await readFile(join(frontend, 'index.html')); response.writeHead(200, { 'Content-Type': types['.html'] }); response.end(content); }
}

const server = createServer(async (request, response) => {
  try { const url = new URL(request.url, `http://${request.headers.host || 'localhost'}`); if (url.pathname.startsWith('/api/')) await api(request,response,url); else await staticFile(request,response,url); }
  catch (error) { console.error(error); json(response, 500, { error: 'Internal server error' }); }
});

server.listen(port, host, () => console.log(`TOS–TQ system running at http://${host}:${port}`));
