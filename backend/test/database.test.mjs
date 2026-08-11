import test from 'node:test';
import assert from 'node:assert/strict';
import { createDatabase, toRequest, transitions } from '../src/database.mjs';

test('database creates and seeds examination requests', () => {
  const db = createDatabase(':memory:');
  const rows = db.prepare('SELECT * FROM requests').all();
  assert.equal(rows.length, 4);
  assert.equal(toRequest(rows[0]).reference, 'TQ-2026-0001');
  db.close();
});

test('workflow permits only controlled status transitions', () => {
  assert.deepEqual(transitions.Submitted, ['Under Review', 'Returned']);
  assert.deepEqual(transitions.Ready, ['Released']);
  assert.deepEqual(transitions.Released, []);
});

test('database constraints reject invalid print quantities', () => {
  const db = createDatabase(':memory:');
  assert.throws(() => db.prepare("UPDATE requests SET copies=0 WHERE id=1").run());
  db.close();
});
