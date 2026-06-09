const assert = require('node:assert/strict');
const { layout } = require('../layout.js');
const nodes = [
  { id: 'root', group: 'database' }, { id: 'crm', group: 'database' }, { id: 'rag', group: 'database' }, { id: 'logs', group: 'database' },
  { id: 'lead1', group: 'database' }, { id: 'lead2', group: 'database' }, { id: 'rag1', group: 'database' }, { id: 'rag2', group: 'database' },
  { id: 'A', group: 'pipeline' }, { id: 'B', group: 'pipeline' }, { id: 'C', group: 'pipeline' }, { id: 'D', group: 'pipeline' }, { id: 'E', group: 'pipeline' }, { id: 'F', group: 'pipeline' }
];
const edges = [
  { from: 'root', to: 'crm' }, { from: 'root', to: 'rag' }, { from: 'root', to: 'logs' }, { from: 'crm', to: 'lead1' }, { from: 'crm', to: 'lead2' }, { from: 'rag', to: 'rag1' }, { from: 'rag', to: 'rag2' },
  { from: 'A', to: 'B' }, { from: 'B', to: 'C' }, { from: 'C', to: 'D' }, { from: 'D', to: 'E' }, { from: 'E', to: 'F' }, { from: 'F', to: 'A' }
];
const groups = [{ id: 'database' }, { id: 'pipeline' }];
const result = layout(nodes, edges, groups);
const database = groups.find(group => group.id === 'database').bounds;
const pipeline = groups.find(group => group.id === 'pipeline').bounds;
assert.ok(pipeline.aspect > database.aspect, 'pipeline should be wider than the database tree');
assert.ok(pipeline.x < database.x, 'wide pipeline should be packed before the tall data tree');
assert.ok(database.h > pipeline.h, 'database tree should use vertical space');
assert.ok(result.width > database.x + database.w);
assert.ok(nodes.every(node => Number.isFinite(node.x) && Number.isFinite(node.y)));
console.log('Group-aware layout packs a wide pipeline beside a tall database tree.');
