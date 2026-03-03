/**
 * txt.js — Extract text from a .txt File object with multi-encoding detection.
 *
 * Priority:
 *   1. BOM 检测 (UTF-8 BOM / UTF-16 LE / UTF-16 BE)
 *   2. 无错误的 UTF-8
 *   3. GBK  ← 中文小说最常见编码
 *   4. GB18030
 *   5. Big5 (繁体中文)
 *   6. ISO-8859-1 兜底（永不抛异常）
 */
import { collapseBlankLines } from './normalize.js';

async function detectAndDecode(buffer) {
    const bytes = new Uint8Array(buffer);

    // ── BOM detection ──────────────────────────────────────────────────────────
    if (bytes[0] === 0xEF && bytes[1] === 0xBB && bytes[2] === 0xBF)
        return new TextDecoder('utf-8').decode(buffer);           // UTF-8 BOM

    if (bytes[0] === 0xFF && bytes[1] === 0xFE)
        return new TextDecoder('utf-16le').decode(buffer);        // UTF-16 LE BOM

    if (bytes[0] === 0xFE && bytes[1] === 0xFF)
        return new TextDecoder('utf-16be').decode(buffer);        // UTF-16 BE BOM

    // ── Try strict UTF-8 ───────────────────────────────────────────────────────
    try {
        const text = new TextDecoder('utf-8', { fatal: true }).decode(buffer);
        return text;   // Perfectly valid UTF-8, no replacement chars
    } catch { /* fall through */ }

    // ── Non-UTF-8: try common Chinese encodings in order ──────────────────────
    for (const enc of ['gbk', 'gb18030', 'big5']) {
        try {
            return new TextDecoder(enc, { fatal: true }).decode(buffer);
        } catch { /* try next */ }
    }

    // ── Last resort: latin-1 (maps every byte 0x00–0xFF, never throws) ─────────
    return new TextDecoder('iso-8859-1').decode(buffer);
}

export async function extractTxt(file) {
    const buffer = await file.arrayBuffer();
    const text = await detectAndDecode(buffer);
    return collapseBlankLines(text);
}
