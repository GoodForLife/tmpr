// ==UserScript==
// @name         Angkanet bank-rumus exporter
// @namespace    http://tampermonkey.net/
// @version      3.1
// @description  Menampilkan data tabel dengan DataTables.net + export JSON/CSV (dengan timestamp)
// @author       IamJambal
// @include      *://angkanet*.*/bank-rumus/*
// @grant        GM_addStyle
// ==/UserScript==

(function() {
    'use strict';

    // ---------- Tambahkan CSS DataTables via GM_addStyle ----------
    GM_addStyle(`
        /* DataTables core CSS */
        @import url('https://cdn.datatables.net/2.3.8/css/dataTables.dataTables.css');

        /* Styling tambahan untuk modal */
        #kr-modal-overlay {
            position: fixed;
            top: 0; left: 0;
            width: 100%; height: 100%;
            background: rgba(0,0,0,0.6);
            z-index: 10000;
            display: flex;
            justify-content: center;
            align-items: center;
            backdrop-filter: blur(4px);
        }
        #kr-modal-overlay .modal-content {
            background: #fff;
            border-radius: 12px;
            max-width: 95%;
            max-height: 95%;
            width: 1100px;
            padding: 24px 28px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            overflow: auto;
            position: relative;
            font-family: system-ui, -apple-system, sans-serif;
        }
        #kr-modal-overlay .modal-content .close-btn {
            position: absolute;
            top: 12px; right: 16px;
            background: transparent;
            border: none;
            font-size: 28px;
            cursor: pointer;
            color: #555;
        }
        #kr-modal-overlay .modal-content .close-btn:hover {
            color: #000;
        }
        #kr-modal-overlay .modal-content h2 {
            margin: 0 0 16px 0;
            font-size: 22px;
            color: #1e293b;
        }
        #kr-modal-overlay .modal-content .export-buttons {
            display: flex;
            gap: 12px;
            justify-content: flex-end;
            margin-top: 16px;
            flex-wrap: wrap;
        }
        #kr-modal-overlay .modal-content .export-buttons button {
            padding: 8px 20px;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-weight: 500;
            font-size: 14px;
            color: #fff;
        }
        #kr-modal-overlay .modal-content .export-buttons .btn-json {
            background: #3b82f6;
        }
        #kr-modal-overlay .modal-content .export-buttons .btn-json:hover {
            background: #2563eb;
        }
        #kr-modal-overlay .modal-content .export-buttons .btn-csv {
            background: #22c55e;
        }
        #kr-modal-overlay .modal-content .export-buttons .btn-csv:hover {
            background: #16a34a;
        }
        /* Pastikan tabel DataTables full-width di modal */
        #kr-data-table {
            width: 100% !important;
        }
        .dataTables_wrapper .dataTables_filter input {
            border: 1px solid #ccc;
            border-radius: 4px;
            padding: 4px 8px;
        }
        .dataTables_wrapper .dataTables_paginate .paginate_button {
            padding: 4px 10px;
            border-radius: 4px;
            border: 1px solid #ddd;
            background: #f9f9f9;
            margin: 0 2px;
        }
        .dataTables_wrapper .dataTables_paginate .paginate_button.current {
            background: #3b82f6;
            color: #fff !important;
            border-color: #3b82f6;
        }
        .dataTables_wrapper .dataTables_paginate .paginate_button:hover {
            background: #e2e8f0;
        }
    `);

    // ---------- Fungsi Ekstrak Data ----------
    function extractData() {
        const tbody = document.getElementById('kr-tbody');
        if (!tbody) {
            console.warn('Tabel dengan id "kr-tbody" tidak ditemukan.');
            return [];
        }

        const rows = tbody.querySelectorAll('tr.kr-row-item');
        const data = [];

        rows.forEach(row => {
            const dataCode = row.getAttribute('data-code') || '';

            const nameSpan = row.querySelector('td:nth-child(2) div span:nth-child(1)');
            const jenisSpan = row.querySelector('td:nth-child(2) div span:nth-child(2)');
            const hariTd = row.querySelector('td:nth-child(3)');
            const valueSpan = row.querySelector('td:nth-child(4) div span.kr-ai-chip');

            const name = nameSpan ? nameSpan.textContent.trim() : '';
            const jenis = jenisSpan ? jenisSpan.textContent.trim() : '';
            const hari = hariTd ? hariTd.textContent.trim() : '';
            const value = valueSpan ? valueSpan.textContent.trim() : '';

            data.push({ dataCode, name, jenis, hari, value });
        });

        console.log('✅ Data diekstrak dari kr-tbody:', data);
        return data;
    }

    // ---------- Helper: timestamp untuk nama file ----------
    function getTimestamp() {
        const now = new Date();
        const pad = n => String(n).padStart(2, '0');
        const jam = pad(now.getHours());
        const menit = pad(now.getMinutes());
        const tanggal = pad(now.getDate());
        const bulan = pad(now.getMonth() + 1);
        const tahun = now.getFullYear();
        return `${jam}_${menit}_${tanggal}_${bulan}_${tahun}`;
    }

    // ---------- Fungsi Export ----------
    function exportToCSV(data) {
        if (!data || data.length === 0) return;

        const headers = ['No', 'name', 'hari', 'value', 'dataCode'];
        const rows = data.map((item, index) => ({
            No: index + 1,
            name: item.name,
            hari: item.hari,
            value: item.value,
            dataCode: item.dataCode
        }));

        const csvRows = [];
        csvRows.push(headers.join(','));

        rows.forEach(row => {
            const values = headers.map(header => {
                let val = row[header] !== undefined ? String(row[header]) : '';
                if (val.includes(',') || val.includes('"') || val.includes('\n')) {
                    val = val.replace(/"/g, '""');
                    val = `"${val}"`;
                }
                return val;
            });
            csvRows.push(values.join(','));
        });

        const csvString = csvRows.join('\n');
        const blob = new Blob(['\uFEFF' + csvString], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        const timestamp = getTimestamp();
        link.download = `data_csv_${timestamp}.csv`;  // Nama file dengan timestamp
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
    }

    function exportToJSON(data) {
        if (!data || data.length === 0) return;

        const jsonData = data.map((item, index) => ({
            No: index + 1,
            name: item.name,
            hari: item.hari,
            value: item.value,
            dataCode: item.dataCode
        }));

        const jsonString = JSON.stringify(jsonData, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        const timestamp = getTimestamp();
        link.download = `data_json_${timestamp}.json`;  // Nama file dengan timestamp
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
    }

    // ---------- Load DataTables dari CDN (jika belum ada) ----------
    function loadDataTables(callback) {
        if (typeof $.fn.DataTable !== 'undefined') {
            callback();
            return;
        }

        if (typeof jQuery === 'undefined') {
            const jqScript = document.createElement('script');
            jqScript.src = 'https://code.jquery.com/jquery-3.7.1.min.js';
            jqScript.onload = function() {
                loadDT();
            };
            document.head.appendChild(jqScript);
        } else {
            loadDT();
        }

        function loadDT() {
            const dtScript = document.createElement('script');
            dtScript.src = 'https://cdn.datatables.net/2.3.8/js/dataTables.js';
            dtScript.onload = function() {
                callback();
            };
            dtScript.onerror = function() {
                console.error('Gagal load DataTables.');
                alert('Gagal memuat DataTables. Periksa koneksi internet.');
            };
            document.head.appendChild(dtScript);
        }
    }

    // ---------- Tampilkan Modal dengan DataTables ----------
    function showDataModal(data) {
        if (!data || data.length === 0) {
            alert('Tidak ada data ditemukan.');
            return;
        }

        // Buat overlay
        const overlay = document.createElement('div');
        overlay.id = 'kr-modal-overlay';

        // Konten modal
        const modal = document.createElement('div');
        modal.className = 'modal-content';

        // Tombol close
        const closeBtn = document.createElement('button');
        closeBtn.className = 'close-btn';
        closeBtn.textContent = '✕';
        closeBtn.onclick = function() {
            if (window.dataTableInstance) {
                window.dataTableInstance.destroy();
                window.dataTableInstance = null;
            }
            document.body.removeChild(overlay);
        };

        // Judul
        const title = document.createElement('h2');
        title.textContent = '📋 Data Tabel';

        // Container untuk tabel
        const tableContainer = document.createElement('div');
        tableContainer.style.cssText = 'overflow: auto; margin-bottom: 12px;';

        // Buat elemen tabel
        const table = document.createElement('table');
        table.id = 'kr-data-table';
        table.className = 'display';
        table.style.cssText = 'width: 100%;';

        // Header
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        const headers = ['No', 'Name', 'Jenis', 'Hari', 'Value', 'Data Code'];
        headers.forEach(text => {
            const th = document.createElement('th');
            th.textContent = text;
            headerRow.appendChild(th);
        });
        thead.appendChild(headerRow);
        table.appendChild(thead);

        // Body
        const tbody = document.createElement('tbody');
        data.forEach((item, index) => {
            const tr = document.createElement('tr');
            const rowData = [
                index + 1,
                item.name,
                item.jenis,
                item.hari,
                item.value,
                item.dataCode
            ];
            rowData.forEach(text => {
                const td = document.createElement('td');
                td.textContent = text;
                tr.appendChild(td);
            });
            tbody.appendChild(tr);
        });
        table.appendChild(tbody);

        tableContainer.appendChild(table);

        // Tombol export
        const exportDiv = document.createElement('div');
        exportDiv.className = 'export-buttons';

        const btnJSON = document.createElement('button');
        btnJSON.className = 'btn-json';
        btnJSON.textContent = '📥 Export JSON';
        btnJSON.onclick = function() {
            if (window.dataTableInstance) {
                const currentData = window.dataTableInstance.rows().data().toArray();
                const mapped = currentData.map((row, idx) => ({
                    No: idx + 1,
                    name: row[1],
                    jenis: row[2],
                    hari: row[3],
                    value: row[4],
                    dataCode: row[5]
                }));
                exportToJSON(mapped);
            } else {
                exportToJSON(data);
            }
        };

        const btnCSV = document.createElement('button');
        btnCSV.className = 'btn-csv';
        btnCSV.textContent = '📥 Export CSV';
        btnCSV.onclick = function() {
            if (window.dataTableInstance) {
                const currentData = window.dataTableInstance.rows().data().toArray();
                const mapped = currentData.map((row, idx) => ({
                    No: idx + 1,
                    name: row[1],
                    jenis: row[2],
                    hari: row[3],
                    value: row[4],
                    dataCode: row[5]
                }));
                exportToCSV(mapped);
            } else {
                exportToCSV(data);
            }
        };

        exportDiv.appendChild(btnJSON);
        exportDiv.appendChild(btnCSV);

        modal.appendChild(closeBtn);
        modal.appendChild(title);
        modal.appendChild(tableContainer);
        modal.appendChild(exportDiv);
        overlay.appendChild(modal);

        overlay.addEventListener('click', function(e) {
            if (e.target === overlay) {
                if (window.dataTableInstance) {
                    window.dataTableInstance.destroy();
                    window.dataTableInstance = null;
                }
                document.body.removeChild(overlay);
            }
        });

        document.body.appendChild(overlay);

        // ---------- Inisialisasi DataTables ----------
        loadDataTables(function() {
            const dtTable = document.getElementById('kr-data-table');
            if (!dtTable) return;

            if (window.dataTableInstance) {
                window.dataTableInstance.destroy();
                window.dataTableInstance = null;
            }

            window.dataTableInstance = $(dtTable).DataTable({
                paging: true,
                searching: true,
                ordering: true,
                info: true,
                pageLength: 10,
                lengthMenu: [10, 25, 50, 100],
                columnDefs: [
                    { orderable: true, targets: [0, 1, 2, 3, 4, 5] }
                ],
                language: {
                    search: "Cari:",
                    lengthMenu: "Tampilkan _MENU_ data per halaman",
                    info: "Menampilkan _START_ sampai _END_ dari _TOTAL_ data",
                    infoEmpty: "Tidak ada data",
                    infoFiltered: "(difilter dari _MAX_ total data)",
                    paginate: {
                        first: "Pertama",
                        last: "Terakhir",
                        next: "→",
                        previous: "←"
                    }
                }
            });

            setTimeout(() => {
                $(dtTable).DataTable().columns.adjust();
            }, 100);
        });
    }

    // ---------- Eksekusi awal ----------
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', extractData);
    } else {
        extractData();
    }

    // ---------- Tombol apung ----------
    const button = document.createElement('button');
    button.textContent = '📊 Tampilkan Data Tabel';
    button.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        z-index: 9999;
        padding: 12px 24px;
        background: #3b82f6;
        color: #fff;
        border: none;
        border-radius: 8px;
        font-weight: bold;
        cursor: pointer;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        font-size: 14px;
        transition: background 0.2s;
    `;
    button.onmouseover = function() { this.style.background = '#2563eb'; };
    button.onmouseout = function() { this.style.background = '#3b82f6'; };
    button.onclick = function() {
        const data = extractData();
        showDataModal(data);
    };
    document.body.appendChild(button);

})();
