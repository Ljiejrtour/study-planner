// ⚠️ 將此網址改成你實際部署後的 Google Apps Script 網址
const apiUrl = "https://script.google.com/a/macros/stu.tcssh.tc.edu.tw/s/AKfycbxKr9lqrm0hP-nFnexflPuj1msfzLMbErYSGBmqtHAeZxZnDQh5ScqBsVvCU-bcZolD/exec";


// 提交表單後送資料到 Google Sheet
async function submitSchedule(e) {
    e.preventDefault(); // 不重新整理頁面

    const date = document.getElementById("date").value;
    const time = document.getElementById("time").value;
    const content = document.getElementById("content").value;

    if (!date || !time || !content) {
        alert("請完整填寫所有欄位！");
        return;
    }

    try {
        const res = await fetch(apiUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ date, time, content })
        });

        const result = await res.text();
        alert(result === "Success" ? "新增成功！" : "儲存失敗：" + result);

        // 清空表單
        document.getElementById("schedule-form").reset();
        // 重新顯示今日資料
        fetchAndDisplayToday();

    } catch (err) {
        console.error("提交時發生錯誤：", err);
        alert("發生錯誤，請稍後再試！");
    }
}

// 取得今天的資料並顯示在表格
async function fetchAndDisplayToday() {
    try {
        const res = await fetch(apiUrl);
        const data = await res.json();

        const today = new Date().toISOString().split("T")[0]; // yyyy-mm-dd
        const todayData = data.filter(row => row[0] === today); // 日期比對
        todayData.sort((a, b) => a[1].localeCompare(b[1])); // 依時間排序

        const tbody = document.getElementById("schedule-body");
        tbody.innerHTML = "";

        todayData.forEach(([date, time, content]) => {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${time}</td>
                <td>${content}</td>
            `;
            tbody.appendChild(row);
        });

    } catch (err) {
        console.error("載入資料錯誤：", err);
        alert("無法取得資料，請稍後再試！");
    }
}

// 啟用拖放功能（僅前端視覺排序）
new Sortable(document.getElementById("schedule-body"), {
    animation: 150,
    onEnd: function (evt) {
        console.log(`從 ${evt.oldIndex} 拖到 ${evt.newIndex}`);
        // 若要儲存順序可加擴充功能
    }
});

// 初始載入
window.addEventListener("DOMContentLoaded", fetchAndDisplayToday);
