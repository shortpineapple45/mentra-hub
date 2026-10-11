import test from 'node:test';import assert from 'node:assert/strict';import {insight,normalize,prompt} from '../src/insight/core.ts';
test('sentinel and empty output never become popups',()=>{for(const text of ['NO_INSIGHT',' no_insight. ','"NO_INSIGHT"',''])assert.equal(insight(text,20),'');});
test('word target never cuts off the answer',()=>assert.equal(insight('one two three four.',3),'one two three four.'));
test('user settings bounded to bound frequency and popup size',()=>{const s=normalize({words:999,frequency:99,duration:100});assert.equal(s.words,40);assert.equal(s.frequency,5);assert.equal(s.duration,30);});

test('default frequency explains notable names without requiring a question',()=>{assert.match(prompt(20,4),/Marcus Aurelius/);assert.match(prompt(20,4),/even without a question/);assert.match(prompt(20,1),/Ignore names mentioned in passing/);});
test('older settings migrate to helpful frequency and drop interval',()=>{const s=normalize({words:25,duration:12});assert.equal(s.frequency,4);assert.equal('interval' in s,false);});
