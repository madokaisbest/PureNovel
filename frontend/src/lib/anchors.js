/**
 * anchors.js — Find split points for parallel diff.
 *
 * An "anchor" is a line that appears exactly once in both texts, in
 * monotonically increasing order — guaranteed to be at the same logical
 * position, so we can split the diff problem at these points safely.
 */

/**
 * @param {string[]} lines1
 * @param {string[]} lines2
 * @param {number}   maxAnchors  Target number of split points
 * @returns {{ i1: number, i2: number }[]}
 */
export function findAnchors(lines1, lines2, maxAnchors = 15) {
    const MIN_LEN = 12;   // Ignore very short lines (too likely to repeat)

    // Count occurrences of each line in lines2
    const count2 = new Map();
    for (const l of lines2) {
        const t = l.trim();
        if (t.length >= MIN_LEN) count2.set(t, (count2.get(t) || 0) + 1);
    }
    // Build index: unique-in-lines2 content → index
    const index2 = new Map();
    for (let j = 0; j < lines2.length; j++) {
        const t = lines2[j].trim();
        if (count2.get(t) === 1) index2.set(t, j);
    }

    // Count occurrences of each line in lines1
    const count1 = new Map();
    for (const l of lines1) {
        const t = l.trim();
        if (t.length >= MIN_LEN) count1.set(t, (count1.get(t) || 0) + 1);
    }

    // Collect candidates: unique in both texts
    const candidates = [];
    for (let i = 0; i < lines1.length; i++) {
        const t = lines1[i].trim();
        if (count1.get(t) === 1 && index2.has(t)) {
            candidates.push({ i1: i, i2: index2.get(t) });
        }
    }

    // Keep only monotonically increasing order in i2
    candidates.sort((a, b) => a.i1 - b.i1);
    const monotonic = [];
    let maxI2 = -1;
    for (const c of candidates) {
        if (c.i2 > maxI2) { monotonic.push(c); maxI2 = c.i2; }
    }

    // Evenly subsample to maxAnchors
    if (monotonic.length <= maxAnchors) return monotonic;
    const step = monotonic.length / maxAnchors;
    return Array.from({ length: maxAnchors }, (_, k) => monotonic[Math.floor(k * step)]);
}

/**
 * Split two line arrays into paired segments at anchor points.
 * Returns alternating diff-segments and anchor-entries.
 *
 * @returns {{ text1:string, text2:string }|{ anchorLine:string }[]}
 */
export function splitAtAnchors(lines1, lines2, anchors) {
    const segs = [];
    let p1 = 0, p2 = 0;
    for (const { i1, i2 } of anchors) {
        segs.push({ text1: lines1.slice(p1, i1).join('\n'), text2: lines2.slice(p2, i2).join('\n') });
        segs.push({ anchorLine: lines1[i1] });   // Guaranteed-equal line
        p1 = i1 + 1;
        p2 = i2 + 1;
    }
    segs.push({ text1: lines1.slice(p1).join('\n'), text2: lines2.slice(p2).join('\n') });
    return segs;
}
