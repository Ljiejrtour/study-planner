// ⚠️ 將此網址改成你實際部署後的 Google Apps Script 網址
const apiUrl = "https://script.google.com/macros/s/AKfycbzr1nGgij48AeFXNO-O3o_7z63ebCr7HR8gwjVEhDfZZX5KYHY6QFKzlQ6qOgfqfkvA/exec";

let fullData = [];

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
            mode: "no-cors", // 加這行可以暫時繞過，但不會有回傳值！
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
async function fetchAndDisplayByDate() {
    const viewDate = document.getElementById("view-date").value;
    if (!viewDate) return;

    try {
        const res = await fetch(apiUrl);
        const data = await res.json();

         // 過濾掉表頭
    fullData = data.slice(1).map(([date, time, content]) => {
        return {
          date: formatDate(new Date(date)),
          time: time.length > 5 ? new Date(time).toTimeString().substring(0, 5) : time,
          content
        };
      });
  
      filterSchedule(); // 根據目前篩選選項顯示
    } catch (err) {
        alert("讀取資料時出錯！");
    }
}
function filterSchedule() {
    const range = document.getElementById("filter-range").value;
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  
    let filtered = fullData;
  
    if (range === "week") {
      filtered = fullData.filter(item => new Date(item.date) >= startOfWeek);
    } else if (range === "month") {
      filtered = fullData.filter(item => new Date(item.date) >= startOfMonth);
    }
  
    renderTable(filtered);
  }
  
  // 渲染表格內容
  function renderTable(data) {
    const tbody = document.getElementById("schedule-body");
    tbody.innerHTML = "";
  
    data.sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));
  
    data.forEach(({ date, time, content }) => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${date}</td>
        <td>${time}</td>
        <td>${content}</td>
      `;
      tbody.appendChild(row);
    });
  }
  
  // 日期格式化 yyyy-mm-dd
  function formatDate(d) {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
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
