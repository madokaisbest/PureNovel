/**
 * epub.js — Extract visible text from an EPUB File object.
 * Uses JSZip + browser DOMParser; mirrors Python's extract_text_from_epub().
 */
import JSZip from 'jszip';
import { collapseBlankLines } from './normalize.js';

const BLOCK_TAGS = new Set(['p', 'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'li', 'tr', 'td', 'th', 'blockquote', 'pre', 'section', 'article', 'header', 'footer', 'nav']);
const IGNORE_TAGS = new Set(['style', 'script', 'img', 'figure', 'svg', 'math', 'head']);
const NAV_STEMS = new Set(['nav', 'toc', 'index', 'contents', 'cover', 'info',
    'message', 'colophon', 'copyright', 'titlepage', 'about']);

function domToText(root) {
    const parts = [];
    function walk(node) {
        if (node.nodeType === Node.TEXT_NODE) {
            if (node.textContent.trim()) parts.push(node.textContent);
        } else if (node.nodeType === Node.ELEMENT_NODE) {
            const tag = node.tagName.toLowerCase();
            if (IGNORE_TAGS.has(tag)) return;
            if (BLOCK_TAGS.has(tag)) parts.push('\n');
            for (const child of node.childNodes) walk(child);
            if (BLOCK_TAGS.has(tag)) parts.push('\n');
        }
    }
    walk(root);
    return parts.join('');
}

export async function extractEpub(file) {
    const zip = await JSZip.loadAsync(file);
    const parser = new DOMParser();

    // 1. Locate OPF via container.xml
    const containerXml = await zip.file('META-INF/container.xml')?.async('text');
    if (!containerXml) throw new Error('无效 EPUB：缺少 META-INF/container.xml');

    const containerDoc = parser.parseFromString(containerXml, 'application/xml');
    const opfPath = containerDoc.querySelector('rootfile')?.getAttribute('full-path');
    if (!opfPath) throw new Error('无效 EPUB：无法定位 OPF 路径');

    // 2. Parse OPF
    const opfXml = await zip.file(opfPath)?.async('text');
    if (!opfXml) throw new Error(`无效 EPUB：OPF 文件不存在 (${opfPath})`);

    const opfDoc = parser.parseFromString(opfXml, 'application/xml');
    const opfDir = opfPath.includes('/') ? opfPath.slice(0, opfPath.lastIndexOf('/') + 1) : '';

    // 3. Build manifest
    const manifest = {};
    for (const item of opfDoc.querySelectorAll('manifest > item')) {
        manifest[item.getAttribute('id')] = {
            href: item.getAttribute('href') || '',
            mediaType: item.getAttribute('media-type') || '',
            properties: (item.getAttribute('properties') || '').split(' '),
        };
    }

    // 4. Spine (reading order)
    const spineIds = [...opfDoc.querySelectorAll('spine > itemref')]
        .map(r => r.getAttribute('idref'))
        .filter(id => id && manifest[id]);

    // 5. Extract chapter text
    const chapters = [];
    for (const id of spineIds) {
        const item = manifest[id];
        if (!item) continue;
        if (item.properties.includes('nav')) continue;

        const stem = item.href.split('/').pop().replace(/\.[^.]+$/, '').toLowerCase();
        if (NAV_STEMS.has(stem) || ['toc', 'nav', 'ncx'].includes(stem)) continue;
        if (!item.mediaType.includes('html')) continue;

        const fullPath = opfDir + decodeURIComponent(item.href);
        const content = await (zip.file(fullPath) ?? zip.file(opfDir + item.href))?.async('text');
        if (!content) continue;

        let doc = parser.parseFromString(content, 'application/xhtml+xml');
        if (doc.querySelector('parsererror'))
            doc = parser.parseFromString(content, 'text/html');

        doc.querySelector('head')?.remove();
        const text = domToText(doc.querySelector('body') ?? doc.documentElement);
        if (text.trim()) chapters.push(text);
    }

    return collapseBlankLines(chapters.join('\n\n'));
}
