import test from 'node:test';
import assert from 'node:assert/strict';
import {siglasFooter,siglasUsed} from '../public/siglas.js';
import {annexPages,frameReport} from '../public/report.js';
import {defaultStudy,recalculatePopulationAndStudies} from '../public/engine.js';
import {normalizeStudy} from '../public/state.js';

// 9.5.7 (Fabio, 20/11/2026): toda sigla exibida tem o descritivo no rodapé, no formato "* TIV – Tempo de Ida e Volta".
test('rodapé de siglas: lista só as siglas presentes, no formato * SIGLA – descritivo',()=>{
 const html=siglasFooter('<p>Intervalo pelo TIV e PPH do fabricante.</p>');
 assert.match(html,/\* TIV – Tempo de Ida e Volta/);
 assert.match(html,/\* PPH – Partidas por hora, por elevador/);
 assert.doesNotMatch(html,/ADS/);
 assert.equal(siglasFooter('<p>Sem siglas aqui.</p>'),'');
});

test('rodapé de siglas: ignora atributos, palavras maiores e o próprio rodapé',()=>{
 assert.deepEqual(siglasUsed('<div class="NBR" data-x="TIV">NBRX TIVO</div>'),[]);
 assert.deepEqual(siglasUsed('<p>Ct · transporte</p>').map(x=>x[0]),['Ct']);
 const twice=siglasFooter('<p>NBR</p>'+siglasFooter('<p>NBR</p>'));
 assert.equal((twice.match(/\* NBR/g)||[]).length,1);
 assert.doesNotMatch(twice,/\* ABNT/,'o descritivo "(ABNT)" do rodapé não vira nova sigla');
});

test('relatório e cada página do Anexo A têm rodapé de siglas',()=>{
 const c=recalculatePopulationAndStudies(normalizeStudy(defaultStudy())),html=annexPages(c.study,c.results);
 const pages=html.split('<section class="annex-page').slice(1);
 assert.ok(pages.length>=2);
 for(const p of pages)assert.match(p,/<footer class="siglas-rodape"[\s\S]*\* NBR – Norma Brasileira \(ABNT\)/);
 assert.match(pages.find(p=>p.includes('Anexo A · Fabricante')),/\* FAB – Cálculo com os dados do fabricante|\* Ct – Capacidade de transporte do grupo/);
 assert.match(frameReport('<p>Intervalo pelo TIV.</p>',{}),/\* TIV – Tempo de Ida e Volta/);
});

test('apresentação termina com a página "Siglas utilizadas", só com as siglas dos slides',async()=>{
 const {default:PptxGenJS}=await import('pptxgenjs');const {buildPresentation}=await import('../public/presentation.js');const {emptyBrand}=await import('../public/records.js');
 const c=recalculatePopulationAndStudies(normalizeStudy(defaultStudy())),deck=buildPresentation(c.study,c.results,emptyBrand(),PptxGenJS);
 assert.equal(deck.slides.at(-1).title,'Siglas utilizadas');
 assert.equal(deck.slides.filter(s=>/^Siglas utilizadas/.test(s.title)).length,1);
});
