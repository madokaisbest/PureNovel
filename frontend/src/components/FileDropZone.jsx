import { useCallback, useState, useMemo } from 'react';
import { getT } from '../lib/i18n';

export default function FileDropZone({ label, file, onFile, lang }) {
    const [dragging, setDragging] = useState(false);
    const t = useMemo(() => getT(lang), [lang]);

    const handle = useCallback((f) => {
        if (!f) return;
        const ext = f.name.split('.').pop().toLowerCase();
        if (!['txt', 'epub'].includes(ext)) { alert(t('alertFormat')); return; }
        onFile(f);
    }, [onFile, t]);

    return (
        <label
            className={`dropzone${dragging ? ' dragging' : ''}${file ? ' has-file' : ''}`}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => { e.preventDefault(); setDragging(false); handle(e.dataTransfer.files[0]); }}
        >
            <input type="file" accept=".txt,.epub" hidden onChange={(e) => handle(e.target.files[0])} />
            <div className="dz-icon">{file ? '✅' : '📄'}</div>
            <div className="dz-label">{label}</div>
            {file
                ? <div className="dz-filename">{file.name}</div>
                : <div className="dz-hint">{t('dropHint')}<br /><small>{t('dropSub')}</small></div>
            }
        </label>
    );
}
