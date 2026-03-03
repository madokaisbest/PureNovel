/**
 * parallelDiff.js — Orchestrates single-worker or multi-worker diff.
 *
 * For texts with < PARALLEL_THRESHOLD lines → single diff.worker (accurate, fast)
 * For large texts → anchor-based split + worker pool (N parallel cores)
 *
 * The split is "correct" because anchor lines are guaranteed identical,
 * so merging adjacent chunk results produces a valid global diff.
 */
import { normalizeForComparison, stripPunctuation } from './normalize.js';
import { findAnchors, splitAtAnchors } from './anchors.js';
import DiffWorker from '../workers/diff.worker.js?worker';
import ChunkWorker from '../workers/chunk.worker.js?worker';

const PARALLEL_THRESHOLD = 5_000;   // Lines; below → single worker path

// ── Similarity from merged entries (Sørensen–Dice, non-blank lines) ──────────
function similarityFromEntries(entries, nb1, nb2) {
    let matched = 0;
    for (const e of entries)
        if (e.tag === 'equal') matched += e.aLines.filter(l => l.trim()).length;
    return nb1 + nb2 > 0 ? Math.round((2 * matched / (nb1 + nb2)) * 10000) / 100 : 100;
}

/**
 * Run comparison and deliver results via callbacks.
 * @returns {() => void}  cleanup / terminate function
 */
export function runComparison(rawText1, rawText2, options, callbacks) {
    const { doNormalize, ignorePunctuation } = options;
    const { onProgress, onResult, onError } = callbacks;

    // ── Prepare (normalize / strip punct) ────────────────────────────────────
    let t1 = doNormalize ? normalizeForComparison(rawText1) : rawText1;
    let t2 = doNormalize ? normalizeForComparison(rawText2) : rawText2;
    if (ignorePunctuation) { t1 = stripPunctuation(t1); t2 = stripPunctuation(t2); }

    const nb1 = t1.split('\n').filter(l => l.trim()).length;
    const nb2 = t2.split('\n').filter(l => l.trim()).length;

    const lines1 = t1.split('\n');
    const lines2 = t2.split('\n');

    let terminated = false;
    const workers = [];
    const cleanup = () => { terminated = true; workers.forEach(w => w.terminate()); };

    // ── Single-worker path ────────────────────────────────────────────────────
    if (Math.max(lines1.length, lines2.length) <= PARALLEL_THRESHOLD) {
        const w = new DiffWorker();
        workers.push(w);
        w.onmessage = ({ data }) => {
            if (terminated) return;
            if (data.error) { onError(data.error); return; }
            onResult(data);
        };
        w.onerror = (e) => { if (!terminated) onError(e.message); };
        w.postMessage({ text1: t1, text2: t2, doNormalize: false, ignorePunctuation: false });
        return cleanup;
    }

    // ── Parallel path ─────────────────────────────────────────────────────────
    const numCores = Math.min(navigator.hardwareConcurrency || 4, 8);
    const anchors = findAnchors(lines1, lines2, numCores - 1);

    // Fewer than 2 anchors → texts are too different; fall back to full-text single worker
    if (anchors.length < 2) {
        onProgress(0);
        const truncLines = Math.min(lines1.length, lines2.length, 20_000);
        const w = new DiffWorker();
        workers.push(w);
        w.onmessage = ({ data }) => { if (!terminated) { onProgress(100); onResult(data); } };
        w.onerror = (e) => { if (!terminated) onError(e.message); };
        w.postMessage({ text1: t1, text2: t2, doNormalize: false, ignorePunctuation: false });
        return cleanup;
    }

    const segments = splitAtAnchors(lines1, lines2, anchors);
    const diffSegs = segments
        .map((s, idx) => ({ ...s, segIdx: idx }))
        .filter(s => !s.anchorLine);

    let completed = 0;
    const segResults = new Map();   // segIdx → entries[]

    const tryMerge = () => {
        if (completed < diffSegs.length) return;

        // Merge in original segment order
        const allEntries = [];
        for (const seg of segments) {
            if (seg.anchorLine !== undefined) {
                allEntries.push({ tag: 'equal', aLines: [seg.anchorLine], bLines: [] });
            } else {
                const res = segResults.get(
                    segments.findIndex(s => s === seg)
                );
                if (res) allEntries.push(...res);
            }
        }

        const similarity = similarityFromEntries(allEntries, nb1, nb2);
        onResult({ similarity, entries: allEntries, truncated: false });
    };

    // ── Worker pool (round-robin queue) ───────────────────────────────────────
    const pool = Array.from(
        { length: Math.min(numCores, diffSegs.length) },
        () => { const w = new ChunkWorker(); workers.push(w); return { w, busy: false }; }
    );

    const queue = [...diffSegs];   // copy

    const dispatch = () => {
        for (const slot of pool) {
            if (!slot.busy && queue.length > 0) {
                const task = queue.shift();
                slot.busy = true;
                slot.w.onmessage = ({ data }) => {
                    if (terminated) return;
                    if (data.error) { onError(data.error); return; }
                    segResults.set(task.segIdx, data.entries);
                    completed++;
                    onProgress(Math.round((completed / diffSegs.length) * 100));
                    slot.busy = false;
                    dispatch();      // pick up next task from queue
                    tryMerge();
                };
                slot.w.onerror = (e) => { if (!terminated) onError(e.message); };
                slot.w.postMessage({ chunkId: task.segIdx, text1: task.text1, text2: task.text2 });
            }
        }
    };

    onProgress(0);
    dispatch();

    return cleanup;
}
