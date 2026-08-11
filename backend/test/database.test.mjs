import test from 'node:test';
import assert from 'node:assert/strict';
import { createDatabase, toRequest, transitions } from '../src/database.mjs';
import { summarizeTos } from '../src/tos.mjs';

test('database creates and seeds examination requests', () => {
  const db = createDatabase(':memory:');
  const rows = db.prepare('SELECT * FROM requests').all();
  assert.equal(rows.length, 4);
  assert.equal(toRequest(rows[0]).reference, 'TQ-2026-0001');
  db.close();
});

test('workflow permits only controlled status transitions', () => {
  assert.deepEqual(transitions.Submitted, ['Area Coordinator Review', 'Returned']);
  assert.deepEqual(transitions['Area Coordinator Review'], ['Dean Review', 'Returned']);
  assert.deepEqual(transitions['Dean Review'], ['Approved', 'Returned']);
  assert.deepEqual(transitions.Ready, ['Released']);
  assert.deepEqual(transitions.Released, []);
});

test('database includes TOS and two-stage approval fields', () => {
  const db = createDatabase(':memory:');
  const request = toRequest(db.prepare('SELECT * FROM requests WHERE id=1').get());
  assert.equal(request.tos.totalItems, 50);
  assert.equal(request.tos.remembering + request.tos.understanding + request.tos.applying + request.tos.analyzing + request.tos.evaluating + request.tos.creating, 100);
  assert.equal(request.approvals.coordinator.name, '');
  assert.equal(request.approvals.dean.name, '');
  assert.equal(request.academicArea, 'Biology and Chemistry');
  assert.equal(request.approvals.coordinator.signature, '');
  db.close();
});

test('database constraints reject invalid print quantities', () => {
  const db = createDatabase(':memory:');
  assert.throws(() => db.prepare("UPDATE requests SET copies=0 WHERE id=1").run());
  db.close();
});

test('TOS template calculations derive row and Bloom percentages', () => {
  const summary = summarizeTos([
    { topicObjectives:'Cell structure',hours:4,testType:'Multiple Choice',remembering:5,understanding:3,applying:2,analyzing:0,evaluating:0,creating:0,points:10 },
    { topicObjectives:'Microbial growth',hours:6,testType:'Mixed Format',remembering:1,understanding:3,applying:3,analyzing:2,evaluating:1,creating:0,points:20 },
  ]);
  assert.equal(summary.totalItems, 20);
  assert.equal(summary.normalizedRows[0].hoursPercentage, 40);
  assert.equal(summary.normalizedRows[1].pointsPercentage, 66.67);
  assert.equal(summary.percentages.remembering, 30);
  assert.equal(Object.values(summary.percentages).reduce((sum,value) => sum + value, 0), 100);
});
