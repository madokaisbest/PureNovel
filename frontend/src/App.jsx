import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import FileDropZone from './components/FileDropZone';
import ScoreCard from './components/ScoreCard';
import DiffViewer from './components/DiffViewer';
import { extractEpub } from './lib/epub';
import { extractTxt } from './lib/txt';
import { runComparison } from './lib/parallelDiff';
import { getT, defaultLang } from './lib/i18n';

const S = { IDLE: 'idle', EXTRACT: 'extract', COMPUTE: 'compute', DONE: 'done', ERR: 'err' };

async function extractFile(file) {
    return file.name.toLowerCase().endsWith('.epub') ? extractEpub(file) : extractTxt(file);
}

export default function App() {
    const [file1, setFile1] = useState(null);
    const [file2, setFile2] = useState(null);
    const [status, setStatus] = useState(S.IDLE);
    const [error, setError] = useState('');
    const [result, setResult] = useState(null);
    const [truncated, setTrunc] = useState(false);
    const [progress, setProgress] = useState(0);      // 0–100 for parallel mode
    const [normalize, setNorm] = useState(true);
    const [showEq, setShowEq] = useState(true);
    const [ignorePunct, setIgnorePunct] = useState(true);
    const [lang, setLang] = useState(defaultLang);

    const t = useMemo(() => getT(lang), [lang]);

    const cleanupRef = useRef(null);   // terminates running workers
    const textsRef = useRef(null);   // cache extracted texts for re-diff on settings toggle

    // ── Start a fresh comparison ───────────────────────────────────────────────
    const startDiff = useCallback((text1, text2, doNorm, doIgnorePunct) => {
        cleanupRef.current?.();           // Kill previous workers if still running
        setStatus(S.COMPUTE);
        setProgress(0);

        const cleanup = runComparison(
            text1, text2,
            { doNormalize: doNorm, ignorePunctuation: doIgnorePunct },
            {
                onProgress: (pct) => setProgress(pct),
                onResult: ({ similarity, entries, truncated }) => {
                    setResult(prev => ({ ...prev, similarity, entries }));
                    setTrunc(truncated ?? false);
                    setStatus(S.DONE);
                },
                onError: (msg) => { setError(msg); setStatus(S.ERR); },
            }
        );
        cleanupRef.current = cleanup;
    }, []);

    // ── Extract → diff when both files are uploaded ────────────────────────────
    useEffect(() => {
        if (!file1 || !file2) return;
        let cancelled = false;
        (async () => {
            setStatus(S.EXTRACT); setError(''); setResult(null);
            try {
                const [text1, text2] = await Promise.all([extractFile(file1), extractFile(file2)]);
                if (cancelled) return;
                textsRef.current = { text1, text2 };
                setResult({ similarity: 0, entries: [], text1, text2 });
                startDiff(text1, text2, normalize, ignorePunct);
            } catch (e) { if (!cancelled) { setError(e.message); setStatus(S.ERR); } }
        })();
        return () => { cancelled = true; };
    }, [file1, file2]);   // eslint-disable-line react-hooks/exhaustive-deps

    // ── Re-diff when settings change (texts already cached) ───────────────────
    const rediff = useCallback((doNorm, doIgnorePunct) => {
        if (textsRef.current)
            startDiff(textsRef.current.text1, textsRef.current.text2, doNorm, doIgnorePunct);
    }, [startDiff]);

    const handleNorm = v => { setNorm(v); rediff(v, ignorePunct); };
    const handleIgnorePunct = v => { setIgnorePunct(v); rediff(normalize, v); };

    const busy = status === S.EXTRACT || status === S.COMPUTE;
    const stats = result ? {
        w1: result.text1.split(/\s+/).filter(Boolean).length, c1: result.text1.length,
        w2: result.text2.split(/\s+/).filter(Boolean).length, c2: result.text2.length,
    } : null;

    // How many CPU cores are being used
    const cores = Math.min(navigator.hardwareConcurrency || 4, 8);

    return (
        <div className="layout">
            {/* ── Sidebar ── */}
            <aside className="sidebar">
                <div className="sb-title">{t('settings')}</div>

                <div className="toggle-row">
                    <span className="tg-label">{t('lang')}</span>
                    <select className="lang-select" value={lang} onChange={e => setLang(e.target.value)}>
                        <option value="zh">简体中文</option>
                        <option value="zh_tw">繁體中文</option>
                        <option value="en">English</option>
                        <option value="ja">日本語</option>
                    </select>
                </div>

                <Toggle label={t('navNormalize')}
                    hint={t('navNormalizeHint')}
                    checked={normalize} onChange={handleNorm} />

                <Toggle label={t('ignorePunct')}
                    hint={t('ignorePunctHint')}
                    checked={ignorePunct} onChange={handleIgnorePunct} />

                <Toggle label={t('showEqual')}
                    hint={t('showEqualHint')}
                    checked={showEq} onChange={setShowEq} />

                <div className="sb-footer">
                    <div>{t('format')} <b>.txt · .epub</b></div>
                    <div>{t('algorithm')} <b>Myers Diff + Worker Pool</b></div>
                    <div>{t('cores')} <b>{cores} {t('threads')}</b></div>
                    <div className="privacy">{t('localOnly')}<br />{t('noUpload')}</div>
                </div>
            </aside>

            {/* ── Main ── */}
            <main className="main">
                <header className="hero">
                    <h1 className="hero-title">{t('heroTitle')}</h1>
                    <p className="hero-sub">{t('heroSub')}</p>
                    <p className="hero-intro">{t('intro')}</p>
                </header>

                {/* Upload */}
                <div className="upload-row">
                    <FileDropZone label={t('file1')} file={file1} onFile={setFile1} lang={lang} />
                    <div className="vs">{t('vs')}</div>
                    <FileDropZone label={t('file2')} file={file2} onFile={setFile2} lang={lang} />
                </div>

                {/* Loading */}
                {busy && (
                    <div className="loading">
                        <span className="spinner" />
                        <div className="loading-detail">
                            <span>{status === S.EXTRACT ? t('extracting') : t('comparing', cores)}</span>
                            {status === S.COMPUTE && progress > 0 && (
                                <div className="progress-bar-wrap">
                                    <div className="progress-bar" style={{ width: `${progress}%` }} />
                                    <span className="progress-pct">{progress}%</span>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {status === S.ERR && <div className="err-banner">❌ {t('error')}{error}</div>}

                {/* Results */}
                {status === S.DONE && result && (
                    <>
                        <ScoreCard score={result.similarity} stats={stats} lang={lang} />
                        <div className="sec-heading">{t('lineByLine')}</div>
                        {truncated && (
                            <div className="info-banner">
                                {t('truncationWarning')}
                            </div>
                        )}
                        <DiffViewer entries={result.entries} showEqual={showEq} lang={lang} />
                    </>
                )}

                {/* Placeholder */}
                {status === S.IDLE && (
                    <div className="placeholder">
                        <div className="ph-icon">📂</div>
                        <div className="ph-main">{t('placeholderMain')}</div>
                        <div className="ph-sub">{t('placeholderSub')}</div>
                    </div>
                )}
            </main>
        </div>
    );
}

function Toggle({ label, hint, checked, onChange }) {
    return (
        <label className="toggle-row" title={hint}>
            <span className="tg-label">{label}</span>
            <span className={`tg-switch${checked ? ' on' : ''}`} onClick={() => onChange(!checked)} />
        </label>
    );
}
