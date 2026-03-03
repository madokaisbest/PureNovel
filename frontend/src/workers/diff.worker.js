/**
 * diff.worker.js — Web Worker: off-main-thread diff + similarity computation.
 *
 * Uses the `diff` package (Myers algorithm, O(n*d)) — much faster than
 * Python's SequenceMatcher for large inputs; UI stays 100% responsive.
 */
import { diffLines } from 'diff';
import { normalizeForComparison, stripPunctuation } from '../lib/normalize.js';

const MAX_LINES = 20_000;   // Display truncation; similarity uses full text.

function splitLines(value) {
    const lines = value.split('\n');
    if (lines.at(-1) === '') lines.pop();  // trailing newline artifact
    return lines;
}

function computeSimilarity(t1, t2) {
    const nb1 = t1.split('\n').filter(l => l.trim());
    const nb2 = t2.split('\n').filter(l => l.trim());
    if (!nb1.length && !nb2.length) return 100;
    if (!nb1.length || !nb2.length) return 0;

    const changes = diffLines(nb1.join('\n'), nb2.join('\n'));
    let matched = 0;
    for (const c of changes)
        if (!c.added && !c.removed) matched += splitLines(c.value).length;

    return Math.round((2 * matched / (nb1.length + nb2.length)) * 10000) / 100;
}

self.onmessage = function ({ data: { text1, text2, doNormalize, ignorePunctuation } }) {
    try {
        let t1 = doNormalize ? normalizeForComparison(text1) : text1;
        let t2 = doNormalize ? normalizeForComparison(text2) : text2;

        if (ignorePunctuation) {
            t1 = stripPunctuation(t1);
            t2 = stripPunctuation(t2);
        }

        // --- Similarity (full text, no truncation) ---
        const similarity = computeSimilarity(t1, t2);

        // --- Display diff (truncated for browser performance) ---
        let lines1 = t1.split('\n');
        let lines2 = t2.split('\n');
        let truncated = false;
        if (lines1.length > MAX_LINES) { lines1 = lines1.slice(0, MAX_LINES); truncated = true; }
        if (lines2.length > MAX_LINES) { lines2 = lines2.slice(0, MAX_LINES); truncated = true; }

        const rawChanges = diffLines(lines1.join('\n'), lines2.join('\n'));

        // Merge consecutive delete+insert into replace blocks
        const entries = [];
        let i = 0;
        while (i < rawChanges.length) {
            const c = rawChanges[i];
            if (c.removed && rawChanges[i + 1]?.added) {
                entries.push({ tag: 'replace', aLines: splitLines(c.value), bLines: splitLines(rawChanges[i + 1].value) });
                i += 2;
            } else if (c.added) { entries.push({ tag: 'insert', aLines: [], bLines: splitLines(c.value) }); i++; }
            else if (c.removed) { entries.push({ tag: 'delete', aLines: splitLines(c.value), bLines: [] }); i++; }
            else { entries.push({ tag: 'equal', aLines: splitLines(c.value), bLines: [] }); i++; }
        }

        self.postMessage({ similarity, entries, truncated });
    } catch (err) {
        self.postMessage({ error: err.message });
    }
};
