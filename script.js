document.addEventListener('DOMContentLoaded', () => {
    const inputName = document.getElementById('sample-name');
    const inputA = document.getElementById('initial-reading');
    const inputB = document.getElementById('final-reading');
    const inputC = document.getElementById('sample-weight');
    const inputF = document.getElementById('factor');
    
    const displayV = document.getElementById('v-diff');
    const displayResult = document.getElementById('final-result');
    const errorDisplay = document.getElementById('error-display');
    
    const addBtn = document.getElementById('add-record');
    const resetBtn = document.getElementById('reset-btn');
    const fullResetBtn = document.getElementById('full-reset-btn');
    const clearHistoryBtn = document.getElementById('clear-history');
    const exportCsvBtn = document.getElementById('export-csv');
    const exportWordBtn = document.getElementById('export-word');
    const exportPdfBtn = document.getElementById('export-pdf');
    const historyTableBody = document.querySelector('#history-table tbody');
    const avgDisplay = document.getElementById('avg-result');

    // Load from LocalStorage
    let records = JSON.parse(localStorage.getItem('titration_records')) || [];
    updateTable();

    // --- Calculation Logic ---
    function calculate() {
        // If Initial Reading is empty, treat as 0.00
        if (inputA.value === "") {
            inputA.placeholder = "0.00";
        }
        
        const a = parseFloat(inputA.value) || 0;
        const b = parseFloat(inputB.value) || 0;
        const c = parseFloat(inputC.value) || 0;
        const f = parseFloat(inputF.value) || 3.2440;

        errorDisplay.textContent = "";
        inputB.classList.remove('invalid');
        inputC.classList.remove('invalid');

        // Validation
        if (inputB.value && b < a && (b-a) !== 0) {
            // Keep warning if B < A, but absolute value will be used anyway
            errorDisplay.textContent = "💡 已自動切換為絕對值計算";
        }

        if (inputC.value && c === 0) {
            errorDisplay.textContent = "⚠️ 樣品重量不可為 0";
            inputC.classList.add('invalid');
        }

        // --- 強制邏輯：V 改為絕對值 ---
        const v = Math.abs(b - a);
        displayV.textContent = v.toFixed(2);

        if (c > 0) {
            const result = (v * f) / c;
            displayResult.textContent = result.toFixed(4);
        } else {
            displayResult.textContent = "0.0000";
        }
    }

    // --- Events for real-time update ---
    [inputA, inputB, inputC, inputF].forEach(el => {
        el.addEventListener('input', calculate);
    });

    // --- Reset Functionality ---
    if (resetBtn) {
        resetBtn.addEventListener('click', (e) => {
            e.preventDefault();
            inputName.value = "";
            inputA.value = "";
            inputB.value = "";
            inputC.value = "";
            calculate();
            inputName.focus();
        });
    }

    if (fullResetBtn) {
        fullResetBtn.addEventListener('click', (e) => {
            e.preventDefault();
            inputName.value = "";
            inputA.value = "";
            inputB.value = "";
            inputC.value = "";
            inputF.value = "3.2440";
            calculate();
            inputName.focus();
        });
    }

    if (clearHistoryBtn) {
        clearHistoryBtn.addEventListener('click', () => {
            if (confirm("確定要清空所有實驗紀錄嗎？此動作無法復原。")) {
                records = [];
                saveToLocalStorage();
                updateTable();
            }
        });
    }

    // --- History Management ---
    addBtn.addEventListener('click', () => {
        const name = inputName.value || "未命名樣品";
        let a = parseFloat(inputA.value);
        if (isNaN(a)) a = 0.00;

        const b = parseFloat(inputB.value);
        const c = parseFloat(inputC.value);
        const f = parseFloat(inputF.value) || 3.2440;
        const v = Math.abs(b - a);
        const res = parseFloat(displayResult.textContent);

        if (isNaN(b) || isNaN(c) || c <= 0) {
            alert("請輸入完整的最終讀數與重量數據再保存。");
            return;
        }

        const record = {
            id: Date.now(),
            name: name,
            a: a.toFixed(2),
            b: b.toFixed(2),
            v: v.toFixed(2),
            c: c.toFixed(4),
            result: res.toFixed(4)
        };

        records.push(record);
        saveToLocalStorage();
        updateTable();
    });

    function saveToLocalStorage() {
        localStorage.setItem('titration_records', JSON.stringify(records));
    }

    function updateTable() {
        historyTableBody.innerHTML = "";
        let sum = 0;

        records.forEach((rec, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td style="font-family:sans-serif; font-weight:bold; color:#999">#${index + 1}</td>
                <td style="font-family:sans-serif; color:#2c3e50; min-width:120px">${rec.name}</td>
                <td>${rec.a}</td>
                <td>${rec.b}</td>
                <td style="color:#e67e22; font-weight:bold">${rec.v}</td>
                <td>${rec.c}</td>
                <td class="result-cell">${rec.result}</td>
                <td><button class="delete-btn" onclick="deleteRecord(${rec.id})">移除</button></td>
            `;
            historyTableBody.appendChild(row);
            sum += parseFloat(rec.result);
        });

        if (records.length > 0) {
            avgDisplay.textContent = (sum / records.length).toFixed(4);
        } else {
            avgDisplay.textContent = "---";
        }
    }

    window.deleteRecord = function(id) {
        records = records.filter(r => r.id !== id);
        saveToLocalStorage();
        updateTable();
    };

    // --- Export CSV ---
    exportCsvBtn.addEventListener('click', () => {
        if (records.length === 0) return;
        
        let csvContent = "data:text/csv;charset=utf-8,案號,樣品名稱,初始(mL),最終(mL),消耗(mL),重量(g),結果\n";
        records.forEach((r, i) => {
            csvContent += `${i+1},${r.name},${r.a},${r.b},${r.v},${r.c},${r.result}\n`;
        });

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "titration_results.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });

    // --- Export Word (.doc) ---
    exportWordBtn.addEventListener('click', () => {
        if (records.length === 0) return;

        let content = `
            <html>
            <head><meta charset='utf-8'></head>
            <body>
                <h2 style='text-align:center'>滴定實驗紀錄報告</h2>
                <table border='1' style='width:100%; border-collapse:collapse; text-align:center'>
                    <thead style='background-color:#f2f2f2'>
                        <tr>
                            <th>案號</th><th>樣品名稱</th><th>初始 (mL)</th><th>最終 (mL)</th><th>消耗 (mL)</th><th>重量 (g)</th><th>結果</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        records.forEach((r, i) => {
            content += `
                <tr>
                    <td>#${i+1}</td><td>${r.name}</td><td>${r.a}</td><td>${r.b}</td><td>${r.v}</td><td>${r.c}</td><td>${r.result}</td>
                </tr>
            `;
        });

        content += `
                    </tbody>
                </table>
                <p style='text-align:right'><b>平均值: ${avgDisplay.textContent}</b></p>
                <p style='font-size:0.8em; color:#888'>匯出時間: ${new Date().toLocaleString()}</p>
            </body>
            </html>
        `;

        const blob = new Blob(['\ufeff', content], { type: 'application/msword' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'titration_report.doc';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });

    // --- Export PDF ---
    exportPdfBtn.addEventListener('click', () => {
        if (records.length === 0) return;
        
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        doc.text("Titration Analysis Report", 14, 15);
        
        const tableData = records.map((r, i) => [
            `#${i+1}`, r.name, r.a, r.b, r.v, r.c, r.result
        ]);

        doc.autoTable({
            head: [['ID', 'Name', 'Initial (mL)', 'Final (mL)', 'Vol (mL)', 'Weight (g)', 'Result']],
            body: tableData,
            startY: 20,
        });

        const finalY = doc.lastAutoTable.finalY;
        doc.text(`Average Result: ${avgDisplay.textContent}`, 14, finalY + 10);
        
        doc.save("titration_report.pdf");
    });
});
