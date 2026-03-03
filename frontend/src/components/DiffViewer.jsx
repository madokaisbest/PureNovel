import { useMemo } from 'react';
import { getT } from '../lib/i18n';

const MAX_EQUAL = 4;
const MAX_BLOCKS = 800;
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export default function DiffViewer({ entries, showEqual, lang }) {
    const t = useMemo(() => getT(lang), [lang]);

    const { html, nIns, nDel, nEq } = useMemo(() => {
        if (!entries?.length) return { html: '', nIns: 0, nDel: 0, nEq: 0 };

        let nIns = 0, nDel = 0, nEq = 0, blocks = 0;
        const parts = [];

        for (const e of entries) {
            if (blocks >= MAX_BLOCKS) {
                parts.push(`<div class="diff-trunc">${t('diffTruncated', MAX_BLOCKS)}</div>`);
                break;
            }

            // equal
            if (e.tag === 'equal') {
                const lines = e.aLines;
                nEq += lines.length;
                if (!showEqual) { blocks++; continue; }
                if (lines.length > MAX_EQUAL) {
                    lines.slice(0, 2).forEach(l => parts.push(`<div class="dline eq">  ${esc(l) || '&nbsp;'}</div>`));
                    parts.push(`<div class="dfold">${t('collapsed', lines.length - 4)}</div>`);
                    lines.slice(-2).forEach(l => parts.push(`<div class="dline eq">  ${esc(l) || '&nbsp;'}</div>`));
                } else {
                    lines.forEach(l => parts.push(`<div class="dline eq">  ${esc(l) || '&nbsp;'}</div>`));
                }
                parts.push('<div class="dsep"></div>');
                blocks++;
                continue;
            }

            // delete / replace
            if (e.tag === 'delete' || e.tag === 'replace') {
                e.aLines.forEach(l => { nDel++; parts.push(`<div class="dline del">− ${esc(l) || '&nbsp;'}</div>`); });
            }
            // insert / replace
            if (e.tag === 'insert' || e.tag === 'replace') {
                e.bLines.forEach(l => { nIns++; parts.push(`<div class="dline ins">+ ${esc(l) || '&nbsp;'}</div>`); });
            }
            parts.push('<div class="dsep"></div>');
            blocks++;
        }

        return { html: parts.join(''), nIns, nDel, nEq };
    }, [entries, showEqual, t]);

    if (!entries?.length) return null;

    const allSame = entries.every(e => e.tag === 'equal');
    if (allSame) return <div className="all-match">{t('perfectMatch')}</div>;

    return (
        <div>
            <div className="legend">
                <span><span className="dot ins-dot" />{t('added')} {nIns} {t('lines')}</span>
                <span><span className="dot del-dot" />{t('deleted')} {nDel} {t('lines')}</span>
                <span><span className="dot eq-dot" />{t('same')} {nEq} {t('lines')}（{t('folded')}）</span>
            </div>
            <div className="diff-box" dangerouslySetInnerHTML={{ __html: html }} />
        </div>
    );
}
