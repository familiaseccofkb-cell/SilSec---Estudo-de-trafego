import test from 'node:test';
import assert from 'node:assert/strict';
import {firstPageIdentification,annexPages,companyBlock,frameReport,standaloneReport} from '../public/report.js';
import {reportReady,validateBrand} from '../public/records.js';
import {defaultStudy,defaultGroup,recalculatePopulationAndStudies,populationComponent} from '../public/engine.js';
import {normalizeStudy} from '../public/state.js';
import {appendFloorComposition} from '../public/floors.js';
test('relatório: fabricante pendente não apresenta soma parcial ou pré-abertura como zero',()=>{
 const s=normalizeStudy(defaultStudy());s.groups[0].open=null;
 const c=recalculatePopulationAndStudies(s),html=annexPages(c.study,c.results);
 assert.equal(c.results.manufacturer.available,false);
 for(const prefix of ['Soma parcial','Pré-abertura']){
  const row=html.match(new RegExp('<tr><th>'+prefix+'[^<]*<\\/th>([\\s\\S]*?)<\\/tr>'))?.[1];
  assert.ok(row);
  const values=[...row.matchAll(/<td>(.*?)<\/td>/g)].map(m=>m[1]);
  for(let i=1;i<values.length;i+=2)assert.equal(values[i],'—');
  assert.notEqual(values[0],'—');
 }
});
test('relatório: anexo A registra parâmetros 1 a 19 e resultados das duas bases com abertura em metros',()=>{const c=recalculatePopulationAndStudies(normalizeStudy(defaultStudy())),html=annexPages(c.study,c.results);for(let n=1;n<=19;n++)assert.ok(html.includes(n+' · '),n);assert.match(html,/0,800/);assert.match(html,/NBR<\/th>|NBR/);assert.match(html,/Fabricante/);assert.match(html,/Ct · Transporte do grupo/);assert.match(html,/Engenheiro responsável/);const entry=html.match(/<tr[^>]*><th[^>]*>11 · Entrada e saída<\/th>[\s\S]*?<\/tr>/)?.[0];assert.ok(entry);assert.doesNotMatch(entry,/s\/pessoa/);assert.match(entry,/2,4000/);assert.equal((html.match(/class="annex-page"/g)||[]).length,1);assert.ok(html.includes(new Intl.NumberFormat('pt-BR',{minimumFractionDigits:4,maximumFractionDigits:4}).format(c.results.normative.capacity)));});
test('relatório: muitos grupos e estudos separados recebem formulários próprios, sem misturar demandas',()=>{const s=normalizeStudy(defaultStudy());s.groups=Array.from({length:5},(_,i)=>defaultGroup(i));s.populationCalc=appendFloorComposition(s.populationCalc,{...populationComponent(s.use,'auditorium'),amount:100,label:'Auditório externo'});const c=recalculatePopulationAndStudies(s),html=annexPages(c.study,c.results);assert.equal((html.match(/class="annex-page"/g)||[]).length,4);assert.match(html,/grupos 5 a 5/);assert.match(html,/Auditório externo/);assert.match(html,/População total adotada:<\/strong> 100/);});
test('relatório: empresa assinante escolhe posição independente para dados e logomarca',()=>{const brand=validateBrand({companyName:'Empresa & Filhos',phone:'123',email:'empresa@example.test',address:'Rua A',contactPlacement:'footer',logoPlacement:'header',logoDataUri:'data:image/png;base64,iVBORw0KGgo='});const head=companyBlock(brand,'header'),foot=companyBlock(brand,'footer');assert.match(head,/report-logo/);assert.doesNotMatch(head,/Empresa &amp;/);assert.match(foot,/Empresa &amp; Filhos/);assert.match(foot,/123.*empresa@example.test.*Rua A/);assert.doesNotMatch(foot,/report-logo/);const html=frameReport('Conteúdo',brand);assert.ok(html.indexOf(head)<html.indexOf('Conteúdo'));assert.ok(html.indexOf(foot)>html.indexOf('Conteúdo'));});
test('relatório: contatos são escapados, HTML baixado é autônomo e prontidão exige cálculo concluído',()=>{const s=normalizeStudy(defaultStudy());s.customer.companyName='<script>Cliente</script>';s.projectDetails.contact='João';const identification=firstPageIdentification(s);assert.doesNotMatch(identification,/<script>/);assert.match(identification,/&lt;script&gt;/);const doc=standaloneReport(identification,'body{color:black}','Relatório');assert.match(doc,/<!doctype html>/);assert.match(doc,/body\{color:black\}/);assert.match(doc,/Salvar como PDF/);assert.equal(reportReady(true,{}),false);assert.equal(reportReady(false,null),false);assert.equal(reportReady(false,{}),true);});
