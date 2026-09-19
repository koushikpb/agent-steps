import { splitDiff, type DiffLineKind } from '../lib/diff-lines';

const CLASS: Record<DiffLineKind, string> = {
  header: 'text-zinc-500',
  hunk: 'bg-sky-50 text-sky-700',
  add: 'bg-emerald-50 text-emerald-800',
  del: 'bg-rose-50 text-rose-800',
  context: 'text-zinc-800',
};

export function DiffView({ diff }: { diff: string }) {
  return (
    <pre data-testid="step-diff" className="overflow-x-auto rounded border border-zinc-200 bg-white text-xs leading-5">
      {splitDiff(diff).map((line, i) => (
        <div key={i} className={`px-2 ${CLASS[line.kind]}`}>{line.text || ' '}</div>
      ))}
    </pre>
  );
}
