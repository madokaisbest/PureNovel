import { useMemo } from 'react';
import { getT } from '../lib/i18n';

export default function ScoreCard({ score, stats, lang }) {
    const t = useMemo(() => getT(lang), [lang]);
    const cls = score >= 95 ? 'high' : score >= 80 ? 'mid' : 'low';
    const verdict = score >= 95 ? t('highSim') : score >= 80 ? t('midSim') : t('lowSim');
    const { w1, c1, w2, c2 } = stats;

    return (
        <div className="score-card">
            <div className="score-lbl">{t('similarityScore')}</div>
            <div className={`score-val ${cls}`}>{score.toFixed(2)}%</div>
            <div className={`score-badge badge-${cls}`}>{verdict}</div>
            <div className="stats-row">
                {[[t('file1Words'), w1], [t('file1Chars'), c1], [t('file2Words'), w2], [t('file2Chars'), c2]].map(([lbl, val]) => (
                    <div key={lbl} className="stat-pill">
                        <div className="val">{val.toLocaleString()}</div>
                        <div className="lbl">{lbl}</div>
                    </div>
                ))}
            </div>
        </div>
    );
}
