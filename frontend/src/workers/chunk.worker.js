/**
 * chunk.worker.js — Lightweight worker that diffs ONE segment.
 * Spawned by the parallel orchestrator, one per CPU core.
 */
import { diffLines } from 'diff';

function splitLines(value) {
    const lines = value.split('\n');
    if (lines.at(-1) === '') lines.pop();
    return lines;
}

self.onmessage = function ({ data: { chunkId, text1, text2 } }) {
    try {
        const changes = diffLines(text1 ?? '', text2 ?? '');
        const entries = [];
        let i = 0;
        while (i < changes.length) {
            const c = changes[i];
            if (c.removed && changes[i + 1]?.added) {
                entries.push({ tag: 'replace', aLines: splitLines(c.value), bLines: splitLines(changes[i + 1].value) });
                i += 2;
            } else if (c.added) { entries.push({ tag: 'insert', aLines: [], bLines: splitLines(c.value) }); i++; }
            else if (c.removed) { entries.push({ tag: 'delete', aLines: splitLines(c.value), bLines: [] }); i++; }
            else { entries.push({ tag: 'equal', aLines: splitLines(c.value), bLines: [] }); i++; }
        }
        self.postMessage({ chunkId, entries });
    } catch (err) {
        self.postMessage({ chunkId, error: err.message });
    }
};
