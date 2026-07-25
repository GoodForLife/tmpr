// ==UserScript==
// @name         Export Angkanet scanner-angkanet-pro
// @namespace    http://tampermonkey.net/
// @version      2.2
// @description  Ekstrak data dari tabel #sk-saved-body, tampilkan DataTable, export CSV/JSON
// @author       JAMBAL (modified)
// @include      *://angkanet*.*/scanner-angkanet-pro/*
// @grant        none
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';

    // --- 1. Ekstrak data dari tabel #sk-saved-body ---
    function extractDataFromTable() {
        const tbody = document.getElementById('sk-saved-body');
        if (!tbody) {
            alert('Tabel #sk-saved-body tidak ditemukan di halaman!');
            return [];
        }

        const rows = tbody.querySelectorAll('tr');
        const data = [];

        rows.forEach((row, index) => {
            // Ambil Jenis dari kolom ke-2 (td:nth-child(2)) span
            const jenisTd = row.querySelector('td:nth-child(2) span');
            const jenis = jenisTd ? jenisTd.textContent.trim() : '';

            // Ambil Value dari kolom ke-3 (td:nth-child(3)) span
            const valueTd = row.querySelector('td:nth-child(3) span');
            const value = valueTd ? valueTd.textContent.trim() : '';

            // Ambil Data Code dari checkbox dengan class sk-saved-cb di dalam baris
            const checkbox = row.querySelector('input.sk-saved-cb');
            const dataCode = checkbox ? checkbox.value : '';

            // No = index + 1
            const no = index + 1;

            data.push({
                no: no,
                name: jenis,      // name diisi dari Jenis
                hari: '',         // tidak ada data hari, dikosongkan
                value: value,
                dataCode: dataCode
            });
        });

        return data;
    }

    // --- 2. Format tanggal untuk nama file ---
    function getFormattedDate() {
        const now = new Date();
        const dd = String(now.getDate()).padStart(2, '0');
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const yyyy = now.getFullYear();
        return `${dd}_${mm}_${yyyy}`;
    }

    // --- 3. Download file ---
    function downloadFile(content, filename, mimeType = 'text/plain') {
        const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    // --- 4. Generate CSV ---
    function generateCSV(dataArray) {
        // Header sesuai permintaan: No,name,hari,value,dataCode
        const header = 'No,name,hari,value,dataCode';
        const rows = dataArray.map(row =>
            [row.no, row.name, row.hari, row.value, row.dataCode].join(',')
        );
        return [header, ...rows].join('\n');
    }

    // --- 5. Generate JSON ---
    function generateJSON(dataArray) {
        return JSON.stringify(dataArray, null, 2);
    }

    // --- 6. Muat library eksternal (jQuery + DataTables) ---
    function loadScript(src) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    function loadCSS(href) {
        return new Promise((resolve, reject) => {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = href;
            link.onload = resolve;
            link.onerror = reject;
            document.head.appendChild(link);
        });
    }

    async function loadLibraries() {
        if (typeof window.jQuery === 'undefined') {
            await loadScript('https://code.jquery.com/jquery-3.6.0.min.js');
        }
        await loadCSS('https://cdn.datatables.net/1.13.6/css/jquery.dataTables.min.css');
        if (typeof window.jQuery.fn.DataTable === 'undefined') {
            await loadScript('https://cdn.datatables.net/1.13.6/js/jquery.dataTables.min.js');
        }
    }

    // --- 7. Tampilkan modal dengan DataTable ---
    async function showDataTable() {
        const dataArray = extractDataFromTable();
        if (dataArray.length === 0) {
            alert('Tidak ada data ditemukan di tabel!');
            return;
        }

        // Buat modal overlay
        const overlay = document.createElement('div');
        overlay.id = 'dataTableModal';
        overlay.style.cssText = `
            position: fixed;
            top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.6);
            z-index: 999999;
            display: flex;
            justify-content: center;
            align-items: center;
            font-family: Arial, sans-serif;
        `;

        const modalBox = document.createElement('div');
        modalBox.style.cssText = `
            background: white;
            padding: 20px;
            border-radius: 8px;
            max-width: 95%;
            max-height: 95%;
            overflow: auto;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
            position: relative;
        `;

        // Tombol tutup
        const closeBtn = document.createElement('button');
        closeBtn.textContent = '✕';
        closeBtn.style.cssText = `
            position: sticky;
            top: 0;
            float: right;
            background: #ef4444;
            color: white;
            border: none;
            border-radius: 50%;
            width: 32px;
            height: 32px;
            font-size: 18px;
            cursor: pointer;
            margin-bottom: 10px;
        `;
        closeBtn.onclick = () => overlay.remove();

        // Tombol export
        const btnContainer = document.createElement('div');
        btnContainer.style.cssText = 'margin-bottom: 15px; display: flex; gap: 10px; flex-wrap: wrap;';

        const csvBtn = document.createElement('button');
        csvBtn.textContent = '📥 Export CSV';
        csvBtn.style.cssText = `
            padding: 8px 18px;
            background: #16a34a;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-weight: bold;
        `;
        csvBtn.onclick = () => {
            const csv = generateCSV(dataArray);
            const date = getFormattedDate();
            downloadFile(csv, `data_${date}.csv`, 'text/csv');
        };

        const jsonBtn = document.createElement('button');
        jsonBtn.textContent = '📥 Export JSON';
        jsonBtn.style.cssText = `
            padding: 8px 18px;
            background: #2563eb;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-weight: bold;
        `;
        jsonBtn.onclick = () => {
            const json = generateJSON(dataArray);
            const date = getFormattedDate();
            downloadFile(json, `data_${date}.json`, 'application/json');
        };

        btnContainer.appendChild(csvBtn);
        btnContainer.appendChild(jsonBtn);

        // Buat tabel
        const table = document.createElement('table');
        table.id = 'dataTable';
        table.className = 'display';
        table.style.width = '100%';

        // Header (4 kolom: No, Jenis, Value, Data Code)
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        ['No', 'Jenis', 'Value', 'Data Code'].forEach(text => {
            const th = document.createElement('th');
            th.textContent = text;
            headerRow.appendChild(th);
        });
        thead.appendChild(headerRow);
        table.appendChild(thead);

        // Body
        const tbody = document.createElement('tbody');
        dataArray.forEach(row => {
            const tr = document.createElement('tr');
            [row.no, row.name, row.value, row.dataCode].forEach(val => {
                const td = document.createElement('td');
                td.textContent = val;
                tr.appendChild(td);
            });
            tbody.appendChild(tr);
        });
        table.appendChild(tbody);

        // Susun modal
        modalBox.appendChild(closeBtn);
        modalBox.appendChild(btnContainer);
        modalBox.appendChild(table);
        overlay.appendChild(modalBox);
        document.body.appendChild(overlay);

        // Pastikan library terload
        await loadLibraries();

        // Inisialisasi DataTable
        if (typeof window.jQuery !== 'undefined' && window.jQuery.fn.DataTable) {
            window.jQuery('#dataTable').DataTable({
                pageLength: 25,
                responsive: true,
                ordering: true,
                language: {
                    search: 'Cari:',
                    lengthMenu: 'Tampilkan _MENU_ data',
                    info: 'Menampilkan _START_ sampai _END_ dari _TOTAL_ data',
                    infoEmpty: 'Tidak ada data',
                    infoFiltered: '(difilter dari _MAX_ total data)'
                }
            });
        } else {
            console.error('DataTables gagal dimuat!');
        }
    }

    // --- 8. Buat tombol melayang ---
    const button = document.createElement('button');
    button.textContent = '📊 Tabel Data';
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

    button.addEventListener('click', showDataTable);

    // --- 9. Tambahkan tombol ke halaman ---
    function appendButton() {
        if (document.body) {
            document.body.appendChild(button);
        } else {
            setTimeout(appendButton, 100);
        }
    }
    appendButton();
})();
