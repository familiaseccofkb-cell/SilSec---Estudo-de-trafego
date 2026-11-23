import test from 'node:test';
import assert from 'node:assert/strict';
import {firstPageIdentification,annexPages,companyBlock,frameReport,standaloneReport} from '../www/report.js';
import {reportReady,validateBrand} from '../www/records.js';
import {defaultStudy,defaultGroup,recalculatePopulationAndStudies,populationComponent} from '../www/engine.js';
import {normalizeStudy} from '../www/state.js';
import {appendFloorComposition} from '../www/floors.js';
test('relatório: fabricante pendente não apresenta soma parcial ou pré-abertura como zero',()=>{
 // 9.5.7 (D2 aprovada): o Anexo A tem só a coluna NBR de cada grupo; com o fabricante pendente, nenhum valor do fabricante aparece no anexo.
 const s=normalizeStudy(defaultStudy());s.groups[0].open=null;
 const c=recalculatePopulationAndStudies(s),html=annexPages(c.study,c.results);
 assert.equal(c.results.manufacturer.available,false);
 assert.doesNotMatch(html,/Fabricante/);
 assert.match(html,/<thead><tr><th>Parâmetro<\/th><th>Grupo 1<br>NBR<\/th><th>Grupo 2<br>NBR<\/th><\/tr><\/thead>/);
 // 9.5.7 (Fabio, 20/11/2026): pré-abertura e partida não existem na NBR 5665; ficam só na página do fabricante.
 assert.doesNotMatch(html,/Pré-abertura|Partida/);
 for(const prefix of ['Soma parcial']){
  const row=html.match(new RegExp('<tr><th>'+prefix+'[^<]*<\\/th>([\\s\\S]*?)<\\/tr>'))?.[1];
  assert.ok(row);
  const values=[...row.matchAll(/<td>(.*?)<\/td>/g)].map(m=>m[1]);
  assert.equal(values.length,c.study.groups.length,'uma coluna NBR por grupo');
  for(const v of values)assert.notEqual(v,'—');
 }
});
test('relatório: anexo A registra parâmetros 1 a 19 e resultados das duas bases com abertura em metros',()=>{const c=recalculatePopulationAndStudies(normalizeStudy(defaultStudy())),html=annexPages(c.study,c.results);for(let n=1;n<=19;n++)assert.ok(html.includes(n+' · '),n);assert.match(html,/0,8/);assert.match(html,/NBR<\/th>|NBR/);/* 9.5.7 (D2 aprovada + Fabio 20/11/2026): formulário NBR só com a coluna NBR e sem partida; comparativo do fabricante em página própria, com a partida na soma do tempo total */const [nbrPage,fabPage]=html.split('<section class="annex-page">').slice(1);assert.match(nbrPage,/NBR 5665 · Anexo A/);assert.doesNotMatch(nbrPage,/Fabricante|Partida|Pré-abertura/);assert.match(fabPage,/Pré-abertura informada pelo fabricante/);assert.match(fabPage,/Anexo A · Fabricante/);assert.match(fabPage,/<br>Fabricante<\/th>/);assert.match(fabPage,/Partida informada pelo fabricante/);assert.match(fabPage,/T1 \+ T2 \+ 1,1 × \(T3 \+ T4\) \+ partida/);assert.match(html,/Ct · Transporte do grupo/);assert.match(html,/Engenheiro responsável/);const entry=html.match(/<tr[^>]*><th[^>]*>11 · Entrada e saída<\/th>[\s\S]*?<\/tr>/)?.[0];assert.ok(entry);assert.doesNotMatch(entry,/s\/pessoa/);assert.match(entry,/2,4/);assert.equal((html.match(/class="annex-page"/g)||[]).length,2,'formulário NBR + comparativo do fabricante');/* 9.5.7 (D3 aprovada): no máximo 3 casas */assert.ok(html.includes(new Intl.NumberFormat('pt-BR',{maximumFractionDigits:3}).format(c.results.normative.capacity)));});
test('relatório: muitos grupos e estudos separados recebem formulários próprios, sem misturar demandas',()=>{const s=normalizeStudy(defaultStudy());s.groups=Array.from({length:5},(_,i)=>defaultGroup(i));s.populationCalc=appendFloorComposition(s.populationCalc,{...populationComponent(s.use,'auditorium'),amount:100,label:'Auditório externo'});const c=recalculatePopulationAndStudies(s),html=annexPages(c.study,c.results);/* 9.5.7: cada formulário NBR tem o comparativo do fabricante em página própria */assert.equal((html.match(/<h2>NBR 5665 · Anexo A/g)||[]).length,4);assert.equal((html.match(/<h2>Anexo A · Fabricante/g)||[]).length,4);assert.match(html,/grupos 5 a 5/);assert.match(html,/Auditório externo/);assert.match(html,/População total adotada:<\/strong> 100/);});
test('relatório: empresa assinante escolhe posição independente para dados e logomarca',()=>{const brand=validateBrand({companyName:'Empresa & Filhos',phone:'123',email:'empresa@example.test',address:'Rua A',contactPlacement:'footer',logoPlacement:'header',logoDataUri:'data:image/png;base64,iVBORw0KGgo='});const head=companyBlock(brand,'header'),foot=companyBlock(brand,'footer');assert.match(head,/report-logo/);assert.doesNotMatch(head,/Empresa &amp;/);assert.match(foot,/Empresa &amp; Filhos/);assert.match(foot,/123.*empresa@example.test.*Rua A/);assert.doesNotMatch(foot,/report-logo/);const html=frameReport('Conteúdo',brand);assert.ok(html.indexOf(head)<html.indexOf('Conteúdo'));assert.ok(html.indexOf(foot)>html.indexOf('Conteúdo'));});
test('relatório: contatos são escapados, HTML baixado é autônomo e prontidão exige cálculo concluído',()=>{const s=normalizeStudy(defaultStudy());s.customer.companyName='<script>Cliente</script>';s.projectDetails.contact='João';const identification=firstPageIdentification(s);assert.doesNotMatch(identification,/<script>/);assert.match(identification,/&lt;script&gt;/);const doc=standaloneReport(identification,'body{color:black}','Relatório');assert.match(doc,/<!doctype html>/);assert.match(doc,/body\{color:black\}/);assert.match(doc,/Salvar como PDF/);assert.equal(reportReady(true,{}),false);assert.equal(reportReady(false,null),false);assert.equal(reportReady(false,{}),true);});
