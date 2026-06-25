const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const catalogPath = path.join(root, 'packages/studio/src/providers/modelCatalog.kie.js');
const clientPath = path.join(root, 'packages/studio/src/providers/kieClient.js');

test('Kie catalog ids are unique and provider tagged', () => {
    const source = fs.readFileSync(catalogPath, 'utf8');
    const ids = [...source.matchAll(/\b(?:t2i|i2i|t2v|i2v|v2v|lipsync|audio)\('([^']+)'/g)].map(match => match[1]);
    assert.ok(ids.length > 50, 'expected a broad Kie model catalog');
    assert.equal(new Set(ids).size, ids.length, 'Kie model ids must be unique');
    assert.match(source, /provider:\s*'kie'/);
});

test('Kie client uses documented auth and polling endpoints', () => {
    const source = fs.readFileSync(clientPath, 'utf8');
    assert.match(source, /Authorization:\s*`Bearer \$\{apiKey\}`/);
    assert.match(source, /\/api\/v1\/jobs\/createTask/);
    assert.match(source, /\/api\/v1\/jobs\/recordInfo\?taskId=/);
    assert.match(source, /\/api\/v1\/runway\/generate/);
    assert.match(source, /\/api\/v1\/runway\/record-detail\?taskId=/);
    assert.match(source, /\/api\/v1\/veo\/generate/);
    assert.match(source, /\/api\/v1\/veo\/record-info\?taskId=/);
    assert.match(source, /\/api\/file-stream-upload/);
    assert.match(source, /\/api\/v1\/chat\/credit/);
});
