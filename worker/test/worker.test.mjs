import test from 'node:test';
import assert from 'node:assert/strict';
import {sanitizeCandidate,sanitizePreferences,extractJson,validateResult,corsHeaders} from '../src/index.js';

test('candidate sanitation rejects unknown types',()=>{
  assert.equal(sanitizeCandidate({id:'x',title:'X',type:'unknown'}),null);
  assert.equal(sanitizeCandidate({id:'x',title:'X',type:'event'}).id,'x');
});

test('preferences are restricted to supported values',()=>{
  const prefs=sanitizePreferences({company:'invalid',time:'day',interest:'event',weather:'indoor',limited:'yes',area:'all'});
  assert.equal(prefs.time,'day');
  assert.notEqual(prefs.company,'invalid');
});

test('JSON extraction accepts fenced output',()=>{
  assert.deepEqual(extractJson('```json\n{"summary":"ok","recommendations":[]}\n```'),{summary:'ok',recommendations:[]});
});

test('result validation blocks invented and duplicate IDs',()=>{
  const allowed=new Set(['a','b']);
  assert.equal(validateResult({summary:'ok',recommendations:[{id:'a',reason:'条件に合う'}]},allowed),true);
  assert.equal(validateResult({summary:'ok',recommendations:[{id:'z',reason:'架空'}]},allowed),false);
  assert.equal(validateResult({summary:'ok',recommendations:[{id:'a',reason:'一つ'},{id:'a',reason:'重複'}]},allowed),false);
});

test('CORS stays pinned to configured origin',()=>{
  const headers=corsHeaders('https://evil.example','https://soutarounaka1016-max.github.io');
  assert.equal(headers['access-control-allow-origin'],'https://soutarounaka1016-max.github.io');
});
