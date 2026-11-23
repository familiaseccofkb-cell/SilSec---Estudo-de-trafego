import test from 'node:test';
import assert from 'node:assert/strict';
import {homePage} from '../server/site/pages.mjs';
import {BRAND} from '../www/brand.js';

// 9.5.7 · 19l (Fabio, 20/11/2026): "Veja em vídeo" mostra o vídeo y_fxuLWYFJk do canal SilSec Engenharia,
// pelo youtube-nocookie.com, responsivo e sem autoplay; o vídeo antigo e o mp4 próprio saem do site.
test('página inicial: "Veja em vídeo" com o vídeo novo do YouTube, sem cookies e sem autoplay', () => {
  const html = homePage({plans: [{id: 'basic', summary: 'Básico'}, {id: 'advanced', summary: 'Completo'}], session: null, message: null});
  assert.match(html, /<h2>Veja em vídeo<\/h2><p class="lead">Por que o estudo de tráfego importa/);
  const iframe = html.match(/<div class="video-main"><iframe [^>]*><\/iframe><\/div>/)?.[0];
  assert.ok(iframe, 'iframe do vídeo principal');
  assert.match(iframe, /src="https:\/\/www\.youtube-nocookie\.com\/embed\/y_fxuLWYFJk\?rel=0"/);
  for (const attr of [/ title="[^"]+"/, / loading="lazy"/, / allowfullscreen/, / referrerpolicy="strict-origin-when-cross-origin"/]) assert.match(iframe, attr);
  assert.doesNotMatch(iframe, /autoplay/);
  assert.doesNotMatch(html, /2NFZdsuN4_4|invideo|\.mp4|<video/i);
  assert.ok(BRAND.videos.every(v => !('file' in v)), 'sem vídeo próprio servido pelo site');
});

// 9.5.7 · 19m (Fabio, 21/11/2026): segundo vídeo (2ndckRtA65k) logo abaixo do primeiro, também no player do site.
// 19q (Fabio, 22/11/2026): a SilSec não vende mais o sistema; o vídeo de apresentação do sistema (2ndckRtA65k) saiu.
test('página inicial: só o vídeo do estudo de tráfego, sem o de apresentação do sistema', () => {
  const html = homePage({plans: [{id: 'basic', summary: 'Básico'}, {id: 'advanced', summary: 'Completo'}], session: null, message: null});
  const ids = [...html.matchAll(/<div class="video-main"><iframe src="https:\/\/www\.youtube-nocookie\.com\/embed\/([A-Za-z0-9_-]{11})\?rel=0"[^>]*><\/iframe><\/div>/g)].map(m => m[1]);
  assert.deepEqual(ids, ['y_fxuLWYFJk']);
  assert.doesNotMatch(html, /2ndckRtA65k|como a plataforma ajuda/);
  assert.doesNotMatch(html, /video-list|i\.ytimg\.com|autoplay/);
});
