import test from 'node:test';
import assert from 'node:assert/strict';
import {STUDY_STEPS} from '../public/workflow.js';

test('ordem das etapas: gráficos depois do cálculo de tráfego, relatório por último',()=>{
  assert.deepEqual(STUDY_STEPS.map(s=>s.view),['study','parameters','population','traffic','performance','report']);
  assert.equal(STUDY_STEPS.at(-1).title,'Relatório');
});
