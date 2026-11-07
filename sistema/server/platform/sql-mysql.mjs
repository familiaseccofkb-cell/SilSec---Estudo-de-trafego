// Tradução das poucas construções específicas do SQLite usadas pela API para MySQL/MariaDB.
// O restante do SQL da aplicação é SQL padrão e passa sem alteração.

function matchParen(sql, open) {
  let depth = 0, quote = null;
  for (let i = open; i < sql.length; i++) {
    const c = sql[i];
    if (quote) { if (c === quote && sql[i - 1] !== '\\') quote = null; continue; }
    if (c === "'" || c === '"' || c === '`') { quote = c; continue; }
    if (c === '(') depth++;
    else if (c === ')' && --depth === 0) return i;
  }
  throw new Error('Parênteses desbalanceados no SQL: ' + sql);
}

// Substitui cada chamada name(...) por wrap(argumentos), respeitando parênteses aninhados.
function rewriteCalls(sql, name, wrap) {
  const re = new RegExp('\\b' + name + '\\s*\\(', 'gi');
  let out = '', last = 0, m;
  while ((m = re.exec(sql))) {
    const open = m.index + m[0].length - 1, close = matchParen(sql, open);
    out += sql.slice(last, m.index) + wrap(rewriteCalls(sql.slice(open + 1, close), name, wrap));
    last = close + 1; re.lastIndex = close + 1;
  }
  return out + sql.slice(last);
}

const cache = new Map();
export function toMysql(sql) {
  if (cache.has(sql)) return cache.get(sql);
  let s = sql;
  // INSERT OR IGNORE / ON CONFLICT DO NOTHING -> INSERT IGNORE
  s = s.replace(/\bINSERT\s+OR\s+IGNORE\s+INTO\b/gi, 'INSERT IGNORE INTO');
  if (/\bON\s+CONFLICT\s*\([^)]*\)\s*DO\s+NOTHING\b/i.test(s)) {
    s = s.replace(/\s*\bON\s+CONFLICT\s*\([^)]*\)\s*DO\s+NOTHING\b/i, '').replace(/\bINSERT\s+INTO\b/i, 'INSERT IGNORE INTO');
  }
  // ON CONFLICT(...) DO UPDATE SET x = excluded.x -> ON DUPLICATE KEY UPDATE x = VALUES(x)
  s = s.replace(/\bON\s+CONFLICT\s*\([^)]*\)\s*DO\s+UPDATE\s+SET\b/gi, 'ON DUPLICATE KEY UPDATE');
  s = s.replace(/\bexcluded\.([A-Za-z_][A-Za-z0-9_]*)/g, 'VALUES($1)');
  // CAST(x AS REAL) -> (x)+0  (conversão numérica compatível com MySQL e MariaDB)
  s = rewriteCalls(s, 'CAST', inner => {
    const m = inner.match(/^([\s\S]*)\s+AS\s+REAL\s*$/i);
    return m ? '((' + m[1] + ')+0)' : 'CAST(' + inner + ')';
  });
  // json_extract devolve texto sem aspas, como no SQLite
  s = rewriteCalls(s, 'json_extract', inner => 'JSON_UNQUOTE(JSON_EXTRACT(' + inner + '))');
  // LIKE no SQLite ignora maiúsculas/minúsculas; as colunas aqui usam colação binária
  s = s.replace(/\bLIKE\s+\?/gi, 'LIKE ? COLLATE utf8mb4_general_ci');
  cache.set(sql, s);
  return s;
}
