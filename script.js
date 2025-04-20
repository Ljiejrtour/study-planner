// ⚠️ 改成你實際部署後的 Apps Script 網址
const apiUrl = "https://script.google.com/macros/s/AKfycbwkbqoGCHeK3h9aGSYVJvRhk79xtDNr9NkLGt9XShJrlMqwJaMvUO9R1SOnNs_YhyXt/exec";

let fullData = [];

// 提交表單
async function submitSchedule(e) {
  e.preventDefault();

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
    alert(result === "Success" ? "新增成功！" : "新增成功！" + result);

    document.getElementById("schedule-form").reset();
    fetchAndDisplayToday(); // 重新取得資料

  } catch (err) {
    console.error("提交失敗：", err);
    alert("發生錯誤，請稍後再試！");
  }
}

// 載入今天以後的資料
async function fetchAndDisplayToday() {
  try {
    const res = await fetch(apiUrl);
    const data = await res.json();

    fullData = data.map(([date, time, content]) => ({
      date,
      time: time.length > 5 ? new Date(`1970-01-01T${time}`).toTimeString().substring(0, 5) : time,
      content
    }));

    filterSchedule(); // 根據篩選顯示
  } catch (err) {
    console.error("載入資料錯誤：", err);
    alert("無法載入計畫資料！");
  }
}

// 篩選資料顯示
function filterSchedule() {
  const range = document.getElementById("filter-range").value;
  const now = new Date();
  const todayStr = formatDate(now);
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

// 顯示資料在表格中
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

// 日期格式 yyyy-mm-dd
function formatDate(d) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

// 拖放排序（僅前端視覺）
new Sortable(document.getElementById("schedule-body"), {
  animation: 150,
  onEnd: function (evt) {
    console.log(`從 ${evt.oldIndex} 拖到 ${evt.newIndex}`);
  }
});

// 載入時顯示今天及之後的資料
window.addEventListener("DOMContentLoaded", fetchAndDisplayToday);
