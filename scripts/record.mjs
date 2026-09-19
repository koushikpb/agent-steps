// Records a live run into fixtures/<name>.json through the dev server.
// Usage: in one terminal `ALLOW_LIVE=1 npm run dev` (port 3117); in another `npm run record -- demo`.
const name = process.argv[2] ?? 'demo';
const prompt =
  process.argv[3] ??
  'Load sales.csv, compute total revenue per month, fix the bug in summarize.py so revenue uses quantity times unit_price, run it to confirm, then chart monthly revenue as a bar chart.';

const res = await fetch('http://localhost:3117/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ prompt, mode: 'live', parser: 'streaming', record: name }),
});
if (!res.ok) {
  console.error(`request failed: ${res.status} ${await res.text()} (403 = live mode disabled: start the server with ALLOW_LIVE=1)`);
  process.exit(1);
}
let text;
try {
  text = await res.text();
} catch (err) {
  console.error(`stream failed before it ended: ${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
}
const types = [...text.matchAll(/"type":"(\w+)"/g)].map((m) => m[1]);
const count = (t) => types.filter((x) => x === t).length;
console.log(`events=${types.length} steps=${count('step_done')} charts=${count('chart')} errors=${count('error')} -> fixtures/${name}.json`);
process.exit(count('error') > 0 ? 2 : 0);
