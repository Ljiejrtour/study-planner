// ⚠️ 改成你實際部署後的 Apps Script 網址
const apiUrl = "https://script.google.com/macros/s/AKfycbyVlzGbGP5AcNqmbrsL5NvaoGKB927Zg7v_p_BW8lbtUDlwlwBPZBWHWWDPP7oFSJAb/exec";

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

    fullData = data.slice(1).map(([date, time, content]) => {
      const parsedDate = new Date(date);
      const parsedTime = time.length > 5 ? new Date(time).toTimeString().substring(0, 5) : time;
    
      return {
        date: formatDate(parsedDate), // yyyy-mm-dd 格式
        time: parsedTime,
        content
      };
    });

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
  fullData = data;

  data.sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));

  data.forEach((item, index) => {
    const { date, time, content } = item;
    const row = document.createElement("tr");
    row.innerHTML = `
    <td>${date}</td>
    <td>${time}</td>
    <td>${content}</td>
    <td></td> <!-- 倒數會在這裡填入 -->
    <td>
      <button onclick="editSchedule(${index})">編輯</button>
      <button onclick="deleteSchedule(${index})">刪除</button>
    </td>
  `;
  
  
    tbody.appendChild(row);
  });
  updateCountdown();
}
function updateCountdown() {
  const now = new Date();

  document.querySelectorAll("#schedule-body tr").forEach((row, i) => {
    const item = fullData[i];
    const planTime = new Date(`${item.date} ${item.time}`);
    const diff = planTime - now;

    let countdownText = "";
    if (diff > 0) {
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      countdownText = `剩 ${hours} 小時 ${mins} 分`;
    } else {
      countdownText = "已過期";
    }

    // 加一欄顯示倒數
    if (!row.cells[3]) {
      const td = document.createElement("td");
      td.textContent = countdownText;
      row.appendChild(td);
    } else {
      row.cells[3].textContent = countdownText;
    }
  });
}


function editSchedule(index) {
  const item = fullData[index];
  document.getElementById("date").value = item.date;
  document.getElementById("time").value = item.time;
  document.getElementById("content").value = item.content;

  // 記錄目前編輯的是哪一筆
  document.getElementById("schedule-form").dataset.editingIndex = index;
}
// 🗑️ 刪除功能
function deleteSchedule(index) {
  if (!confirm("確定要刪除這項排程嗎？")) return;

  const item = fullData[index];
  fetch(apiUrl, {
    method: "POST",
    mode: "no-cors",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ action: "delete", index }),
  }).then(() => {
    alert("刪除成功！");
    fetchAndDisplayToday(); // 重新載入
  }).catch(err => {
    alert("刪除失敗：" + err.message);
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
setInterval(updateCountdown, 60000); // 每分鐘更新倒數