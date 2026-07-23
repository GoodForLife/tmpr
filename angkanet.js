// ==UserScript==
// @name         Export Angkanet
// @namespace    http://tampermonkey.net/
// @version      1.7
// @description  Mengekstrak ID dari skOpenTrek('...'), filter #, buat nama file dari kode dan posisi
// @author       JAMBAL
// @include      *://angkanet*.*/scanner-angkanet-pro/*
// @grant        none
// @run-at       document-end
// ==/UserScript==
(function() {
    'use strict';

    // --- Mapping kode posisi ke nama ---
    const positionMap = {
        'k': 'KEPALA',
        'e': 'EKOR',
        'c': 'COP',
        'a': 'AS',
        'cb': 'COLOK_BEBAS',
        'ai': 'AI_2D_BELAKANG',
        'aid': 'AI_2D_DEPAN'
    };

    // --- 1. Ekstrak semua ID yang diawali '#' ---
    function extractData() {
        const html = document.documentElement.innerHTML;
        const pattern = /skOpenTrek\('([^']+)'\)/g;
        const matches = [];
        let match;
        while ((match = pattern.exec(html)) !== null) {
            const value = match[1];
            if (value.startsWith('#')) {
                matches.push(value);
            }
        }
        return matches;
    }

    // --- 2. Ambil kode pasaran dan posisi dari ID pertama ---
    function getCodesFromFirstId(ids) {
        if (!ids || ids.length === 0) {
            return { pasaran: 'data', posisi: 'data' };
        }
        const first = ids[0];
        const parts = first.split('_');
        if (parts.length < 3) {
            // Format tidak sesuai, fallback
            return { pasaran: 'data', posisi: 'data' };
        }
        // parts[0] = "#HKG", parts[1] = "k", parts[2] = sisanya
        let pasaran = parts[0].substring(1); // hapus '#'
        let posisi = parts[1];
        // Mapping posisi (jika tidak ada, tetap pakai asli)
        let posisiMapped = positionMap[posisi] || posisi;
        return { pasaran, posisi: posisiMapped };
    }

    // --- 3. Format tanggal dd_mm_yyyy ---
    function getFormattedDate() {
        const now = new Date();
        const dd = String(now.getDate()).padStart(2, '0');
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const yyyy = now.getFullYear();
        return `${dd}_${mm}_${yyyy}`;
    }

    // --- 4. Download file .txt ---
    function downloadTxt(lines, filename) {
        if (!lines || lines.length === 0) {
            alert('Tidak ada data ditemukan!');
            return;
        }
        const content = lines.join('\n');
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    // --- 5. Handler tombol export ---
    function handleExport() {
        const data = extractData();
        if (data.length === 0) {
            alert('Tidak ada ID dengan awalan # ditemukan!');
            return;
        }
        const codes = getCodesFromFirstId(data);
        const dateStr = getFormattedDate();
        const filename = `${codes.pasaran}_${codes.posisi}_${dateStr}.txt`;
        //const filename = `Export_${codes.pasaran}_${codes.posisi}_${dateStr}.txt`;
        downloadTxt(data, filename);
    }

    // --- 6. Buat tombol melayang ---
    const button = document.createElement('button');
    button.textContent = '📤 Export';
    button.style.position = 'fixed';
    button.style.bottom = '30px';
    button.style.right = '30px';
    button.style.zIndex = '99999';
    button.style.padding = '12px 28px';
    button.style.backgroundColor = '#2563eb';
    button.style.color = 'white';
    button.style.border = 'none';
    button.style.borderRadius = '50px';
    button.style.cursor = 'pointer';
    button.style.fontSize = '16px';
    button.style.fontWeight = 'bold';
    button.style.boxShadow = '0 4px 12px rgba(37, 99, 235, 0.4)';
    button.style.transition = 'all 0.2s ease';

    button.addEventListener('mouseenter', () => {
        button.style.backgroundColor = '#1d4ed8';
        button.style.transform = 'scale(1.05)';
    });
    button.addEventListener('mouseleave', () => {
        button.style.backgroundColor = '#2563eb';
        button.style.transform = 'scale(1)';
    });

    button.addEventListener('click', handleExport);

    // --- 7. Tambahkan tombol ke halaman ---
    function appendButton() {
        if (document.body) {
            document.body.appendChild(button);
        } else {
            setTimeout(appendButton, 100);
        }
    }
    appendButton();
})();
