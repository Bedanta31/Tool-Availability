import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getDatabase, ref, set, get, child } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyBPeaMc7JruzwEsYzq6-KEemZJhmXpMem8",
  authDomain: "tool-management-f69d2.firebaseapp.com",
  databaseURL: "https://tool-management-f69d2-default-rtdb.firebaseio.com",
  projectId: "tool-management-f69d2",
  storageBucket: "tool-management-f69d2.appspot.com",
  messagingSenderId: "839319720800",
  appId: "1:839319720800:web:aed9bb4ae86a7ae4d48405"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

const tools = ["Relay", "Switch", "Contactor", "MCB", "Light", "Fuse", "Sensor", "Timer", "Plug", "Cable"];
const toolList = document.getElementById("toolList");

tools.forEach(tool => {
  const label = document.createElement("label");
  label.innerHTML = `<input type="checkbox" value="${tool}"> ${tool}`;
  toolList.appendChild(label);
});

document.getElementById("submitForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const shift = document.getElementById("shift").value;
  const date = new Date().toISOString().split('T')[0];
  const path = `${date}/${shift}`;
  const dataRef = ref(db, path);
  const snapshot = await get(dataRef);

  if (snapshot.exists()) {
    alert(`Data already exists for ${date} ${shift}. You can't change it. Contact To Admin 📞`);
    return;
  }

  const data = {};
  toolList.querySelectorAll("input[type=checkbox]").forEach(cb => {
    data[cb.value] = cb.checked ? "Unavailable ❌" : "Available ✅";
  });

  await set(dataRef, data);
  alert(`Tools data saved for ${date} ${shift}`);
  e.target.reset();
});

window.toggleView = (viewId) => {
  const views = ["submitView", "checkView", "exportView"];
  views.forEach(id => document.getElementById(id).classList.add("hidden"));
  document.getElementById(viewId).classList.remove("hidden");

  const header = document.getElementById("headerButtons");
  if (viewId === "submitView") {
    header.innerHTML = `
      <button class="top-btn" onclick="toggleView('checkView')">Check Data</button>
      <button class="top-btn" onclick="toggleView('exportView')">Export Data</button>
    `;
  } else {
    header.innerHTML = `<button class="top-btn" onclick="toggleView('submitView')">← Back</button>`;
  }
};

window.loadData = async () => {
  const date = document.getElementById("dateInput").value;
  const shift = document.getElementById("shiftInput").value;
  const resultArea = document.getElementById("resultArea");
  resultArea.innerHTML = "";
  resultArea.style.display = "block";

  if (!date || !shift) {
    resultArea.innerHTML = "<div class='not-found'>❗ Please select both date and shift.</div>";
    return;
  }

  const snapshot = await get(child(ref(db), `${date}/${shift}`));
  if (snapshot.exists()) {
    const data = snapshot.val();
    Object.entries(data).forEach(([tool, status]) => {
      const div = document.createElement("div");
      div.textContent = `${tool}: ${status}`;
      div.style.marginBottom = "10px";
      resultArea.appendChild(div);
    });
  } else {
    resultArea.innerHTML = `<div class="not-found">🚫 No data found for ${shift} on ${date}</div>`;
  }
};

window.exportData = async () => {
  const start = document.getElementById("startDate").value;
  const end = document.getElementById("endDate").value;
  if (!start || !end) return alert("Select both start and end date.");

  const shifts = ["Shift A", "Shift B", "Shift C"];
  const header = ["Tool"];
  const dateShiftKeys = [];

  const dateList = [];
  for (let d = new Date(start); d <= new Date(end); d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split("T")[0];
    dateList.push(dateStr);
    shifts.forEach(shift => {
      header.push(`${dateStr} (${shift})`);
      dateShiftKeys.push({ date: dateStr, shift });
    });
  }

  const dataMatrix = [header];

  for (const tool of tools) {
    const row = [tool];
    for (const { date, shift } of dateShiftKeys) {
      const snapshot = await get(ref(db, `${date}/${shift}`));
      if (snapshot.exists() && snapshot.val()[tool]) {
        row.push(snapshot.val()[tool]);
      } else {
        row.push("-");
      }
    }
    dataMatrix.push(row);
  }

  const ws = XLSX.utils.aoa_to_sheet(dataMatrix);

  const colWidths = dataMatrix[0].map((_, colIndex) => {
    let maxLen = 6;
    dataMatrix.forEach(row => {
      const val = row[colIndex] ? row[colIndex].toString() : '';
      maxLen = Math.min(Math.max(maxLen, val.length), 17);
    });
    return { wch: maxLen };
  });
  ws['!cols'] = colWidths;

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Tool Availability");
  XLSX.writeFile(wb, `Tool_Availability_${new Date().toISOString().split("T")[0]}.xlsx`);
};
