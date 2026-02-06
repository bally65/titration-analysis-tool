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
    const exportCsvBtn = document.getElementById('export-csv');
    const exportWordBtn = document.getElementById('export-word');
    const exportPdfBtn = document.getElementById('export-pdf');
    const historyTableBody = document.querySelector('#history-table tbody');
    const avgDisplay = document.getElementById('avg-result');

    let records = [];

    // --- Calculation Logic ---
    function calculate() {
        // If Initial Reading is empty, treat as 0.00
        if (inputA.value === "") {
            inputA.placeholder = "0.00";
        }
        
        const a = parseFloat(inputA.value) || 0;
        const b = parseFloat(inputB.value) || 0;
        const c = parseFloat(inputC.value) || 0;
        const f = parseFloat(inputF.value) || 1;

        errorDisplay.textContent = "";
        inputB.classList.remove('invalid');
        inputC.classList.remove('invalid');

        // Validation
        if (inputB.value && b < a) {
            errorDisplay.textContent = "⚠️ 最終讀數不可小於初始讀數";
            inputB.classList.add('invalid');
        }

        if (inputC.value && c === 0) {
            errorDisplay.textContent = "⚠️ 樣品重量不可為 0";
            inputC.classList.add('invalid');
        }

        // --- 強制邏輯：V 改為絕對值 ---
        const v = Math.abs(b - a);
        displayV.textContent = v.toFixed(2);

        if (c > 0) {
            // 公式：(V * 3.244) / 樣品重量
            // 這裡使用 F 作為變數，預設值已改為 3.244
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
            // We keep the Factor (F)
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
            inputF.value = "3.2440"; // Reset Factor to new default
            calculate();
            inputName.focus();
        });
    }

    // --- History Management ---
    addBtn.addEventListener('click', () => {
        const name = inputName.value || "未命名樣品";
        let a = parseFloat(inputA.value);
        if (isNaN(a)) a = 0.00; // Force 0.00 if empty

        const b = parseFloat(inputB.value);
        const c = parseFloat(inputC.value);
        const f = parseFloat(inputF.value);
        const v = b - a;
        const res = parseFloat(displayResult.textContent);

        if (isNaN(b) || isNaN(c) || Math.abs(v) < 0 || c <= 0) {
            alert("請輸入完整的最終讀數與重量數據再保存。");
            return;
        }

        const record = {
            id: Date.now(),
            name: name,
            a: a.toFixed(2),
            b: b.toFixed(2),
            v: Math.abs(v).toFixed(2),
            c: c.toFixed(4),
            result: res.toFixed(4)
        };

        records.push(record);
        updateTable();
        
        // Reset inputs (optional, keeping for sequence)
        // inputA.value = inputB.value; // Sequential titration often starts from last reading
        // inputB.value = "";
    });

    function updateTable() {
        historyTableBody.innerHTML = "";
        let sum = 0;

        records.forEach((rec, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td style="font-family:sans-serif; font-weight:bold; color:#999">#${index + 1}</td>
                <td style="font-family:sans-serif; color:#2c3e50">${rec.name}</td>
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
