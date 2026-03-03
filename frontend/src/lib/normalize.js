/**
 * normalize.js — Port of Python's parser.normalize_for_comparison()
 */
const RE_SEPARATOR = /^\s*[=\-_*~#＝－＿＊～]{3,}\s*$/;
const RE_TXT_META = /^(题名[：:]|作者[：:]|原始网址[：:]|封面图片地址[：:]|简介[：:]|[#＃]{2,}|更新时间[：:]|字数[：:]|状态[：:]|分类[：:]|下载时间[：:]|本文件由|本书由|软件地址[：:]|https?:\/\/)/;
const RE_EPUB_NAV = /^(html|Table of Contents|目录|封面|版权|版权页|扉页)$/i;

/** Collapse consecutive blank lines to at most 1, strip trailing whitespace. */
export function collapseBlankLines(text) {
    const lines = text.split('\n').map(l => l.replace(/\s+$/, ''));
    const out = [];
    let blanks = 0;
    for (const l of lines) {
        if (l === '') { if (++blanks <= 1) out.push(''); }
        else { blanks = 0; out.push(l); }
    }
    return out.join('\n').trim();
}

/** Strip format noise so TXT and EPUB of the same work compare fairly. */
export function normalizeForComparison(text) {
    const kept = [];
    for (const line of text.split('\n')) {
        const s = line.trim();
        if (RE_SEPARATOR.test(s)) continue;
        if (RE_TXT_META.test(s)) continue;
        if (RE_EPUB_NAV.test(s)) continue;
        kept.push(line);
    }
    return collapseBlankLines(kept.join('\n'));
}

/**
 * Remove all punctuation marks (except whitespace) from text.
 * Covers: ASCII punctuation, Chinese/Japanese/Korean punctuation,
 * full-width symbols, quotation marks, ellipses, dashes, etc.
 *
 * Uses Unicode property escape \p{P} (Punctuation) + \p{S} (Symbols like ×÷…)
 * and an explicit list of common CJK punctuation for maximum coverage.
 *
 * Spaces are intentionally preserved.
 */
export function stripPunctuation(text) {
    return text
        // Unicode punctuation + symbols (modern browsers support \p{} with /u flag)
        .replace(/[\p{P}\p{S}]/gu, '')
        // Collapse multiple spaces on a single line to one (but keep newlines)
        .replace(/[ \t]+/g, ' ')
        // Strip leading/trailing spaces per line
        .split('\n').map(l => l.trim()).join('\n');
}
