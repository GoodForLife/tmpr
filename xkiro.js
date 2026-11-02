// ==UserScript==
// @name         xKiro Free Models — Filter & Copy
// @namespace    https://xkiro.com/
// @version      1.0.0
// @description  Filter dan copy semua ID model AI gratis dari xkiro.com/models
// @author       you
// @match        https://xkiro.com/models*
// @match        https://www.xkiro.com/models*
// @run-at       document-idle
// @grant        GM_setClipboard
// @grant        GM_registerMenuCommand
// ==/UserScript==

(function () {
    'use strict';

    const PANEL_ID = 'xkiro-free-toolkit';
    const STYLE_ID = 'xkiro-free-filter-style';
    const TOAST_ID = 'xkiro-free-toast';
    let filterActive = false;

    /* ---------- Core helpers ---------- */

    // Free model ditandai dengan cell <td class="mk-ct-free">Free</td>
    const isFree   = (tr) => !!tr.querySelector('.mk-ct-free');
    const allRows  = () => Array.from(document.querySelectorAll('section[id^="p-"] tr[data-id]'));
    const freeRows = () => allRows().filter(isFree);
    const visibleFreeRows = () => freeRows().filter(tr => !tr.hasAttribute('hidden'));
    const rowId    = (tr) => tr.dataset.id || tr.querySelector('[data-copy]')?.dataset.copy || '';

    function copy(text) {
        if (typeof GM_setClipboard === 'function') {
            GM_setClipboard(text, { type: 'text', mimetype: 'text/plain' });
        } else {
            navigator.clipboard.writeText(text);
        }
    }

    function toast(msg, isError = false) {
        let t = document.getElementById(TOAST_ID);
        if (!t) {
            t = document.createElement('div');
            t.id = TOAST_ID;
            document.body.appendChild(t);
        }
        t.style.cssText = `
            position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%);
            background: ${isError ? '#dc2626' : '#16a34a'}; color: #fff;
            padding: 10px 20px; border-radius: 8px;
            font-family: system-ui, -apple-system, sans-serif; font-size: 14px;
            z-index: 9999999; box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            opacity: 1; transition: opacity 0.3s;
            pointer-events: none; font-weight: 600; white-space: nowrap;
        `;
        t.textContent = msg;
        clearTimeout(t._to);
        t._to = setTimeout(() => { t.style.opacity = '0'; }, 2000);
    }

    /* ---------- Actions ---------- */

    function copyAllFree() {
        const ids = freeRows().map(rowId).filter(Boolean);
        if (!ids.length) return toast('Tidak ada model gratis ditemukan', true);
        copy(ids.join('\n'));
        toast(`✅ ${ids.length} ID model gratis ter-copy`);
    }

    function copyVisibleFree() {
        const ids = visibleFreeRows().map(rowId).filter(Boolean);
        if (!ids.length) return toast('Tidak ada model gratis yang tampil', true);
        copy(ids.join('\n'));
        toast(`✅ ${ids.length} ID model gratis (visible) ter-copy`);
    }

    function copyAsJson() {
        const rows = freeRows();
        if (!rows.length) return toast('Tidak ada model gratis ditemukan', true);
        const json = rows.map(tr => {
            const caps = tr.querySelector('.mk-ct-caps')?.textContent?.trim() || '';
            // hapus prefix "1M context · " dari capabilities
            const capsClean = caps.replace(/^\d+(\.\d+)?[KM]\s+context\s*·\s*/i, '');
            return {
                id: rowId(tr),
                name: tr.querySelector('.mk-ct-name')?.textContent?.trim() || '',
                context: tr.querySelector('.mk-ct-ctx')?.textContent?.trim() || '',
                capabilities: capsClean.split('·').map(s => s.trim()).filter(Boolean),
            };
        });
        copy(JSON.stringify(json, null, 2));
        toast(`✅ ${json.length} model gratis ter-copy (JSON)`);
    }

    function toggleFilter() {
        filterActive = !filterActive;
        const existing = document.getElementById(STYLE_ID);

        if (filterActive) {
            if (!existing) {
                const s = document.createElement('style');
                s.id = STYLE_ID;
                s.textContent = `
                    section[id^="p-"] tr[data-id]:not(:has(.mk-ct-free)) { display: none !important; }
                    section[id^="p-"]:not(:has(tr[data-id] .mk-ct-free)) { display: none !important; }
                `;
                document.head.appendChild(s);
            }
            document.querySelectorAll('nav a[href^="#p-"]').forEach(a => {
                const anchor = a.getAttribute('href')?.slice(1);
                const sec = anchor && document.getElementById(anchor);
                if (sec && !sec.querySelector('tr[data-id] .mk-ct-free')) {
                    a.style.display = 'none';
                }
            });
            toast('🔍 Hanya menampilkan model gratis');
        } else {
            existing?.remove();
            document.querySelectorAll('nav a[href^="#p-"]').forEach(a => a.style.display = '');
            toast('👁 Menampilkan semua model');
        }
        updatePanelState();
    }

    /* ---------- UI ---------- */

    function updatePanelState() {
        const toggleBtn = document.querySelector(`#${PANEL_ID} [data-action="toggle-filter"]`);
        const allBtn    = document.querySelector(`#${PANEL_ID} [data-action="copy-all"]`);
        const visBtn    = document.querySelector(`#${PANEL_ID} [data-action="copy-visible"]`);
        const jsonBtn   = document.querySelector(`#${PANEL_ID} [data-action="copy-json"]`);

        if (toggleBtn) {
            toggleBtn.textContent = filterActive ? '👁 Show All Models' : '🔍 Show Free Only';
            toggleBtn.style.background = filterActive ? '#dc2626' : '#1f2937';
        }
        if (allBtn)  allBtn.textContent  = `📋 Copy All Free IDs (${freeRows().length})`;
        if (visBtn)  visBtn.textContent  = `👁 Copy Visible Free IDs (${visibleFreeRows().length})`;
        if (jsonBtn) jsonBtn.textContent = `🧾 Copy as JSON (${freeRows().length})`;
    }

    function buildPanel() {
        if (document.getElementById(PANEL_ID)) return;

        const panel = document.createElement('div');
        panel.id = PANEL_ID;
        panel.style.cssText = `
            position: fixed; bottom: 20px; right: 20px; z-index: 99999;
            display: flex; flex-direction: column; gap: 8px;
            font-family: system-ui, -apple-system, sans-serif;
        `;

        const style = document.createElement('style');
        style.textContent = `
            #${PANEL_ID} button {
                background: #16a34a; color: #fff; border: none;
                padding: 10px 16px; border-radius: 8px; cursor: pointer;
                font-size: 13px; font-weight: 600;
                box-shadow: 0 4px 12px rgba(0,0,0,0.25);
                transition: transform 0.15s, background 0.15s;
                min-width: 230px; text-align: left;
                font-family: inherit;
            }
            #${PANEL_ID} button:hover { background: #15803d; transform: translateY(-1px); }
            #${PANEL_ID} button:active { transform: translateY(0); }
            #${PANEL_ID} button[data-action="copy-visible"],
            #${PANEL_ID} button[data-action="copy-json"],
            #${PANEL_ID} button[data-action="toggle-filter"] { background: #1f2937; }
            #${PANEL_ID} button[data-action="copy-visible"]:hover,
            #${PANEL_ID} button[data-action="copy-json"]:hover { background: #111827; }
            #${PANEL_ID} button[data-action="toggle-filter"]:hover { background: #111827; }
        `;
        document.head.appendChild(style);

        const mkBtn = (action, label, handler) => {
            const b = document.createElement('button');
            b.dataset.action = action;
            b.textContent = label;
            b.onclick = handler;
            return b;
        };

        panel.appendChild(mkBtn('copy-all',      '📋 Copy All Free IDs',        copyAllFree));
        panel.appendChild(mkBtn('copy-visible',  '👁 Copy Visible Free IDs',    copyVisibleFree));
        panel.appendChild(mkBtn('copy-json',     '🧾 Copy as JSON',             copyAsJson));
        panel.appendChild(mkBtn('toggle-filter', '🔍 Show Free Only',           toggleFilter));

        document.body.appendChild(panel);
        updatePanelState();

        // Update counts berkala (React bisa re-render DOM kapan saja)
        setInterval(updatePanelState, 1500);

        console.log('[xKiro Free Toolkit] panel mounted');
    }

    /* ---------- Bootstrap ---------- */

    function tryInit() {
        if (!document.querySelector('section[id^="p-"] tr[data-id]')) {
            setTimeout(tryInit, 500);
            return;
        }
        buildPanel();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', tryInit);
    } else {
        tryInit();
    }

    // Re-mount setelah SPA navigation
    const obs = new MutationObserver(() => {
        if (document.querySelector('section[id^="p-"] tr[data-id]') &&
            !document.getElementById(PANEL_ID)) {
            buildPanel();
        }
    });
    obs.observe(document.body, { childList: true, subtree: true });

    /* ---------- Menu & Hotkeys ---------- */

    if (typeof GM_registerMenuCommand === 'function') {
        GM_registerMenuCommand('📋 Copy All Free IDs',     copyAllFree);
        GM_registerMenuCommand('👁 Copy Visible Free IDs', copyVisibleFree);
        GM_registerMenuCommand('🧾 Copy as JSON',          copyAsJson);
        GM_registerMenuCommand('🔍 Toggle Free Filter',    toggleFilter);
    }

    document.addEventListener('keydown', (e) => {
        if (e.target.matches('input, textarea, [contenteditable]')) return;
        if (e.altKey && e.key.toLowerCase() === 'f') { e.preventDefault(); copyAllFree(); }
        if (e.altKey && e.key.toLowerCase() === 'v') { e.preventDefault(); copyVisibleFree(); }
        if (e.altKey && e.key.toLowerCase() === 'j') { e.preventDefault(); copyAsJson(); }
    });

})();
