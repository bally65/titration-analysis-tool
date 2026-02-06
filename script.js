document.addEventListener('DOMContentLoaded', () => {
    const inputA = document.getElementById('initial-reading');
    const inputB = document.getElementById('final-reading');
    const inputC = document.getElementById('sample-weight');
    const inputF = document.getElementById('factor');
    
    const displayV = document.getElementById('v-diff');
    const displayResult = document.getElementById('final-result');
    const errorDisplay = document.getElementById('error-display');
    
    const addBtn = document.getElementById('add-record');
    const exportBtn = document.getElementById('export-csv');
    const historyTableBody = document.querySelector('#history-table tbody');
    const avgDisplay = document.getElementById('avg-result');

    let records = [];

    // --- Calculation Logic ---
    function calculate() {
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

        const v = b - a;
        displayV.textContent = v.toFixed(2);

        if (c > 0 && v >= 0) {
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

    // --- History Management ---
    addBtn.addEventListener('click', () => {
        const a = parseFloat(inputA.value);
        const b = parseFloat(inputB.value);
        const c = parseFloat(inputC.value);
        const f = parseFloat(inputF.value);
        const v = b - a;
        const res = parseFloat(displayResult.textContent);

        if (isNaN(a) || isNaN(b) || isNaN(c) || v < 0 || c <= 0) {
            alert("請輸入完整的有效數據再保存。");
            return;
        }

        const record = {
            id: Date.now(),
            a: a.toFixed(2),
            b: b.toFixed(2),
            v: v.toFixed(2),
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
                <td>#${index + 1}</td>
                <td>${rec.a}</td>
                <td>${rec.b}</td>
                <td>${rec.v}</td>
                <td>${rec.c}</td>
                <td style="font-weight:bold; color:#2980b9">${rec.result}</td>
                <td><button class="delete-btn" onclick="deleteRecord(${rec.id})">刪除</button></td>
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

    // --- Export ---
    exportBtn.addEventListener('click', () => {
        if (records.length === 0) return;
        
        let csvContent = "data:text/csv;charset=utf-8,案號,初始(mL),最終(mL),消耗(mL),重量(g),結果\n";
        records.forEach((r, i) => {
            csvContent += `${i+1},${r.a},${r.b},${r.v},${r.c},${r.result}\n`;
        });

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "titration_results.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });
});
