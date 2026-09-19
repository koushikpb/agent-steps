const SIMPLE_ESCAPES: Record<string, string> = {
  '"': '"', '\\': '\\', '/': '/', b: '\b', f: '\f', n: '\n', r: '\r', t: '\t',
};

/**
 * Returns the decoded value of the top-level string property `key` from JSON object text
 * that may be cut off anywhere. Tracks string/escape/nesting state so a key inside another
 * value or a nested object is ignored. An incomplete escape at the cut is dropped, so the
 * result is always a prefix of the final value.
 */
export function extractStringField(partial: string, key: string): string {
  let depth = 0;
  let inString = false;
  let isKey = false; // the current string is a property name at depth 1
  let expectKey = false; // at depth 1, the next string is a property name
  let lastKey = '';
  let current = '';
  let escape: string | null = null; // text after a backslash, e.g. 'u00e'

  for (let i = 0; i < partial.length; i++) {
    const ch = partial[i];
    if (inString) {
      if (escape !== null) {
        escape += ch;
        if (escape[0] === 'u') {
          if (escape.length === 5) {
            current += String.fromCharCode(parseInt(escape.slice(1), 16));
            escape = null;
          }
        } else {
          current += SIMPLE_ESCAPES[escape] ?? escape;
          escape = null;
        }
        continue;
      }
      if (ch === '\\') { escape = ''; continue; }
      if (ch === '"') {
        inString = false;
        if (depth === 1 && isKey) lastKey = current;
        else if (depth === 1 && lastKey === key) return current;
        continue;
      }
      current += ch;
      continue;
    }
    switch (ch) {
      case '"': inString = true; current = ''; isKey = depth === 1 && expectKey; break;
      case '{': depth += 1; if (depth === 1) expectKey = true; break;
      case '[': depth += 1; break;
      case '}': case ']': depth -= 1; break;
      case ':': if (depth === 1) expectKey = false; break;
      case ',': if (depth === 1) { expectKey = true; lastKey = ''; } break;
      default: break;
    }
  }
  if (inString && depth === 1 && !isKey && lastKey === key) return current;
  return '';
}
