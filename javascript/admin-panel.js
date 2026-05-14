import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import {
  doc,
  getDoc,
  collection,
  getDocs,
  updateDoc,
  onSnapshot,
  query,
  deleteDoc,
  orderBy,
  arrayRemove,
  arrayUnion,
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { updateBookStock } from "./db-logic.js";
import { renderCustomSelect } from "./selection.js";
import { getTranslation } from "./i18n.js";

document.body.style.display = "none";

onAuthStateChanged(auth, async (user) => {
  if (user) {
    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      const uData = userSnap.data();
      if (
        uData.thekingoflibrary === true ||
        uData.role === "admin" ||
        uData.role === "pustakawan"
      ) {
        document.body.style.display = "block";
        window.userRoleContext = uData;
        initDashboard();
      } else {
        window.location.href = "home.html";
      }
    } else {
      window.location.href = "home.html";
    }
  } else {
    window.location.href = "home.html";
  }
});

const adminMain = document.querySelector(".container");
let modalChart = null;

const adminIcons = {
  BOOKS: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" /></svg>`,
  USERS: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-2.533-4.656 6.966 6.966 0 0 1-5.111-4.702 4.125 4.125 0 0 0-3.327-3.086 6.967 6.967 0 0 1-4.887-4.108c-.08-.18-.163-.359-.247-.538a1.25 1.25 0 0 0-2.204.032l-.4 1.11a1.25 1.25 0 0 0 .141 1.255c.294.398.54.823.733 1.272a4.125 4.125 0 0 0 3.033 2.53 6.966 6.966 0 0 1 4.717 5.143 4.125 4.125 0 0 0 3.167 3.321c.218.044.437.081.656.111a1.25 1.25 0 0 0 1.201-.746l.163-.442Z" /></svg>`,
  ACTIVITY: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>`,
};

const iconRequest = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" /></svg>`;
const iconManage = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" /></svg>`;
const iconUser = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-2.533-4.656 6.966 6.966 0 0 1-5.111-4.702 4.125 4.125 0 0 0-3.327-3.086 6.967 6.967 0 0 1-4.887-4.108c-.08-.18-.163-.359-.247-.538a1.25 1.25 0 0 0-2.204.032l-.4 1.11a1.25 1.25 0 0 0 .141 1.255c.294.398.54.823.733 1.272a4.125 4.125 0 0 0 3.033 2.53 6.966 6.966 0 0 1 4.717 5.143 4.125 4.125 0 0 0 3.167 3.321c.218.044.437.081.656.111a1.25 1.25 0 0 0 1.201-.746l.163-.442Z" /></svg>`;
const iconBack = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3" /></svg>`;
const chatSvg = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="width: 18px; height: 18px;"><path stroke-linecap="round" stroke-linejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1.75 0zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1.75 0zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" /></svg>`;
const iconEdit = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="width: 18px; height: 18px;"><path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" /></svg>`;
const iconTrash = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="width: 18px; height: 18px;"><path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>`;
const checkSvg = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" style="width: 20px; height: 20px;"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>`;

// --- FUNGSI DATA PROCESSING ---

function processWeeklyData(snapshot) {
  const counts = [0, 0, 0, 0, 0, 0, 0];
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  snapshot.forEach((doc) => {
    const data = doc.data();
    const timestamp = data.timestamp || data.createdAt || data.borrowDate;

    if (timestamp) {
      const date = timestamp.toDate();
      const compareDate = new Date(date);
      compareDate.setHours(0, 0, 0, 0);

      const diffInTime = now.getTime() - compareDate.getTime();
      const diffInDays = Math.round(diffInTime / (1000 * 60 * 60 * 24));

      if (diffInDays >= 0 && diffInDays < 7) {
        counts[6 - diffInDays]++;
      }
    }
  });
  return counts;
}

function processAdvancedData(snapshot, range) {
  const now = new Date();
  let labels = [];
  let dataPoints = [];

  if (range === "monthly") {
    labels = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "Mei",
      "Jun",
      "Jul",
      "Agu",
      "Sep",
      "Okt",
      "Nov",
      "Des",
    ];
    dataPoints = new Array(12).fill(0);
    snapshot.forEach((doc) => {
      const date = (
        doc.data().timestamp ||
        doc.data().createdAt ||
        doc.data().borrowDate
      )?.toDate();
      if (date && date.getFullYear() === now.getFullYear()) {
        dataPoints[date.getMonth()]++;
      }
    });
  } else if (range === "yearly") {
    const curYear = now.getFullYear();
    labels = [curYear - 2, curYear - 1, curYear];
    dataPoints = new Array(3).fill(0);
    snapshot.forEach((doc) => {
      const date = (
        doc.data().timestamp ||
        doc.data().createdAt ||
        doc.data().borrowDate
      )?.toDate();
      if (date) {
        const idx = labels.indexOf(date.getFullYear());
        if (idx !== -1) dataPoints[idx]++;
      }
    });
  }
  return { labels, data: dataPoints };
}

function getLast7DaysLabels() {
  const days = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
  const labels = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    labels.push(days[date.getDay()]);
  }
  return labels;
}

// --- CORE FUNCTIONS ---

async function initDashboard() {
  try {
    const [booksSnap, usersSnap, historySnap, peminjamanSnap] =
      await Promise.all([
        getDocs(collection(db, "books")),
        getDocs(collection(db, "users")),
        getDocs(collection(db, "user_history")),
        getDocs(collection(db, "peminjaman")),
      ]);

    const labels = getLast7DaysLabels();
    renderDashboard(booksSnap.size, usersSnap.size, historySnap.size);

    createCharts(
      labels,
      processWeeklyData(booksSnap),
      processWeeklyData(usersSnap),
      processWeeklyData(historySnap),
      processWeeklyData(peminjamanSnap)
    );

    setupClickEvents(booksSnap, usersSnap, historySnap, peminjamanSnap);

    if (window.userRoleContext && !window.userRoleContext.thekingoflibrary) {
      document.getElementById("btnUserControlToggle").style.display = "none";

      if (window.userRoleContext.role === "admin") {
        document.getElementById("btnManageBookToggle").style.display = "none";
      } else if (window.userRoleContext.role === "pustakawan") {
        document.getElementById("btnRequestToggle").style.display = "none";
      }
    }

    setTimeout(() => {
      const homeBtn = document.querySelector('a[href="home.html"]');
      if (homeBtn) {
        homeBtn.classList.remove("active");
      }
    }, 800);
  } catch (error) {
    console.error("Gagal muat data real:", error);
  }
}

function setupClickEvents(booksSnap, usersSnap, historySnap, peminjamanSnap) {
  const configs = [
    {
      id: "chartBooks",
      title: getTranslation("admin_chart_books") || "Detail Koleksi Buku",
      color: "#3b82f6",
      snap: booksSnap,
    },
    {
      id: "chartUsers",
      title: getTranslation("admin_chart_users") || "Detail Pertumbuhan Mahasiswa",
      color: "#22c55e",
      snap: usersSnap,
    },
    {
      id: "chartActivity",
      title: getTranslation("admin_chart_activity") || "Detail Log Aktivitas",
      color: "#f97316",
      snap: historySnap,
    },
    {
      id: "chartPeminjaman",
      title: getTranslation("admin_chart_traffic") || "Detail Trafik Peminjaman",
      color: "#8b5cf6",
      snap: peminjamanSnap,
    },
  ];

  configs.forEach((config) => {
    const el = document.getElementById(config.id);
    if (el) {
      el.style.cursor = "pointer";
      el.onclick = () => openModal(config);
    }
  });
}

function openModal(config) {
  const modal = document.getElementById("chartDetailModal");
  const hiddenInput = document.getElementById("timeRangeFilter");

  document.getElementById("modalChartTitle").textContent = config.title;
  modal.classList.remove("hidden");
  setTimeout(() => (modal.style.opacity = "1"), 10);

  renderCustomSelect({
    containerId: "wadahFilterModal",
    inputId: "timeRangeFilter",
    placeholder: getTranslation("admin_time_range") || "Rentang Waktu",
    defaultValue: "monthly",
    options: [
      { value: "monthly", label: getTranslation("admin_per_month") || "Per Bulan" },
      { value: "yearly", label: getTranslation("admin_per_year") || "Per Tahun" },
    ],
    onChange: () => refreshModalChart(),
  });

  const refreshModalChart = () => {
    const { labels, data } = processAdvancedData(
      config.snap,
      hiddenInput.value
    );
    renderModalCanvas(labels, data, config.color);
  };

  refreshModalChart();

  document.getElementById("closeChartModal").onclick = () => {
    modal.style.opacity = "0";
    setTimeout(() => {
      modal.classList.add("hidden");
      if (modalChart) modalChart.destroy();
    }, 300);
  };
}

function renderModalCanvas(labels, data, color) {
  const ctx = document.getElementById("modalCanvas").getContext("2d");
  if (modalChart) modalChart.destroy();

  modalChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [{ data: data, backgroundColor: color, borderRadius: 6 }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true } },
    },
  });
}

function renderDashboard(books, users, history) {
  adminMain.innerHTML = `

    <style>
      .hilang-scroll::-webkit-scrollbar {
        display: none;
      }
      .hilang-scroll {
        -ms-overflow-style: none;
        scrollbar-width: none;
      }
      .badge-denda {
        display: inline-block;
        margin-top: 8px;
        font-weight: 700;
        font-size: 0.75rem;
        padding: 6px 10px;
        border-radius: 6px;
        width: max-content;
        line-height: 1.4;
      }
      .badge-denda.lunas { background: #dcfce7; color: #166534; }
      .badge-denda.belum-lunas { background: #fef2f2; color: #dc2626; }
      @media (max-width: 768px) {
        .badge-denda {
          font-size: 0.65rem;
          padding: 4px 8px;
          margin-top: 10px;
        }
      }
      textarea.no-scrollbar::-webkit-scrollbar {
        display: none;
      }
      textarea.no-scrollbar {
        -ms-overflow-style: none;
        scrollbar-width: none;
      }
    </style>

    <header style="margin: 30px 0;">
      <h1 style="font-size: 2rem; font-weight: 800; color: #111827; letter-spacing: -1px;">${getTranslation("admin_title") || "Admin Dashboard"}</h1>
      <p id="adminSubtitle" style="color: #6b7280; transition: all 0.3s ease;">${getTranslation("admin_subtitle_graphs") || "Klik grafik untuk analisis mendalam per bulan/tahun."}</p>
    </header>

    <div id="chartsContainer">
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-bottom: 30px;">
        <div class="stats-card" style="background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); border: 1px solid #bfdbfe; padding: 25px; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
          <div style="display: flex; justify-content: space-between; align-items: flex-start;">
            <div><span style="color: #1e40af; font-size: 0.8rem; font-weight: 700;">${getTranslation("admin_total_books") || "TOTAL BUKU"}</span><h2 style="font-size: 2.5rem; font-weight: 800; margin: 5px 0; color: #1e3a8a;">${books}</h2></div>
            <div style="width: 45px; height: 45px; color: #3b82f6;">${adminIcons.BOOKS}</div>
          </div>
        </div>
        <div class="stats-card" style="background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border: 1px solid #bbf7d0; padding: 25px; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
          <div style="display: flex; justify-content: space-between; align-items: flex-start;">
            <div><span style="color: #166534; font-size: 0.8rem; font-weight: 700;">${getTranslation("admin_total_users") || "TOTAL MAHASISWA"}</span><h2 style="font-size: 2.5rem; font-weight: 800; margin: 5px 0; color: #14532d;">${users}</h2></div>
            <div style="width: 45px; height: 45px; color: #22c55e;">${adminIcons.USERS}</div>
          </div>
        </div>
        <div class="stats-card" style="background: linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%); border: 1px solid #fed7aa; padding: 25px; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
          <div style="display: flex; justify-content: space-between; align-items: flex-start;">
            <div><span style="color: #9a3412; font-size: 0.8rem; font-weight: 700;">${getTranslation("admin_total_activity") || "LOG AKTIVITAS"}</span><h2 style="font-size: 2.5rem; font-weight: 800; margin: 5px 0; color: #7c2d12;">${history}</h2></div>
            <div style="width: 45px; height: 45px; color: #f97316;">${adminIcons.ACTIVITY}</div>
          </div>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin-bottom: 50px;">
        <div style="background: white; padding: 20px; border-radius: 12px; border: 1px solid #e5e7eb; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
          <h3 style="font-size: 0.9rem; margin-bottom: 15px; color: #4b5563;">${getTranslation("admin_trend_books") || "Tren Penambahan Buku"}</h3>
          <canvas id="chartBooks"></canvas>
        </div>
        <div style="background: white; padding: 20px; border-radius: 12px; border: 1px solid #e5e7eb; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
          <h3 style="font-size: 0.9rem; margin-bottom: 15px; color: #4b5563;">${getTranslation("admin_trend_users") || "Pertumbuhan User"}</h3>
          <canvas id="chartUsers"></canvas>
        </div>
        <div style="background: white; padding: 20px; border-radius: 12px; border: 1px solid #e5e7eb; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
          <h3 style="font-size: 0.9rem; margin-bottom: 15px; color: #4b5563;">${getTranslation("admin_trend_activity") || "Intensitas Aktivitas"}</h3>
          <canvas id="chartActivity"></canvas>
        </div>
      </div>
    </div>

    <div id="requestSection" class="hidden" style="margin-bottom: 50px;">
      
      <div style="background: white; padding: 20px; border-radius: 12px; border: 1px solid #e5e7eb; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); margin-bottom: 25px;">
        <h3 style="font-size: 0.9rem; margin-bottom: 15px; color: #4b5563;">${getTranslation("admin_traffic_borrow") || "Trafik Peminjaman Buku"}</h3>
        <div style="height: 200px; width: 100%;">
          <canvas id="chartPeminjaman"></canvas>
        </div>
      </div>

      <div style="background: white; border-radius: 12px; border: 1px solid #e5e7eb; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.05); padding-bottom: 120px; position: relative;">
        
        <div style="padding: 24px; border-bottom: 1px solid #e5e7eb; background: #fafafa; border-radius: 12px 12px 0 0;">
          <h2 style="font-size: 1.2rem; font-weight: 800; color: #111827; margin: 0;">${getTranslation("admin_log_borrow") || "Log Peminjaman Buku"}</h2>
        </div>
    
        <div class="hilang-scroll" style="width: 100%; overflow-x: auto; -webkit-overflow-scrolling: touch;">
          <table style="width: 100%; border-collapse: collapse; text-align: left; min-width: 850px;"> 
            <thead>
              <tr style="background: #f3f4f6; color: #4b5563; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.5px;">
                <th style="padding: 16px 24px; white-space: nowrap;">${getTranslation("admin_th_title") || "Judul Buku"}</th>
                <th style="padding: 16px 24px; white-space: nowrap;">${getTranslation("admin_th_applicant") || "Pemohon"}</th>
                <th style="padding: 16px 24px; white-space: nowrap;">${getTranslation("admin_th_time") || "Waktu"}</th>
                <th style="padding: 16px 24px; width: 180px; white-space: nowrap; text-align: center;">${getTranslation("admin_th_status") || "Status"}</th>
              </tr>
            </thead>
            <tbody id="requestListContainer">
            </tbody>
          </table>
        </div>
    
      </div>
    </div>

    <div id="manageBookSection" class="hidden" style="margin-bottom: 50px;">
      <div style="background: white; border-radius: 12px; border: 1px solid #e5e7eb; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.05);">
        <div style="padding: 24px; border-bottom: 1px solid #e5e7eb; background: #fafafa; border-radius: 12px 12px 0 0; display: flex; justify-content: space-between; align-items: center;">
          <div>
            <h2 style="font-size: 1.2rem; font-weight: 800; color: #111827; margin: 0;">${getTranslation("admin_collection_title") || "Koleksi Buku"}</h2>
            <p style="font-size: 0.8rem; color: #6b7280; margin: 5px 0 0 0;">${getTranslation("admin_collection_subtitle") || "Kelola data, stok, dan hapus buku"}</p>
          </div>
          <div style="display: flex; gap: 10px; align-items: center;">
            <button id="btnSwitchMode" style="background: #111827; color: white; border: none; padding: 10px 18px; border-radius: 8px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 8px; font-family: inherit; font-size: 0.85rem; transition: 0.2s;" onmouseover="this.style.background='#374151'" onmouseout="this.style.background='#111827'">
              <span id="switchIcon" style="display: flex; align-items: center;">${chatSvg}</span>
              <span id="switchText">${getTranslation("admin_manage_reviews") || "Kelola Ulasan"}</span>
            </button>
        
            <button id="btnAddNewBook" onclick="window.location.href='upload.html'" style="background: #111827; color: white; border: none; padding: 10px 18px; border-radius: 8px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 8px; font-family: inherit; font-size: 0.85rem; transition: 0.2s;" onmouseover="this.style.background='#374151'" onmouseout="this.style.background='#111827'">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" style="width: 16px; height: 16px;">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>${getTranslation("admin_add_book") || "Tambah Buku"}</button>
          </div>
        </div>
        <div class="hilang-scroll" style="width: 100%; overflow-x: auto;">
          <table style="width: 100%; border-collapse: collapse; text-align: left; min-width: 800px;">
            <thead>
              <tr style="background: #f3f4f6; color: #4b5563; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.5px;">
                <th style="padding: 16px 24px; border-bottom: 1px solid #e5e7eb;">${getTranslation("admin_th_book_info") || "Info Buku"}</th>
                <th style="padding: 16px 24px; border-bottom: 1px solid #e5e7eb;">${getTranslation("admin_th_category") || "Kategori"}</th>
                <th style="padding: 16px 24px; border-bottom: 1px solid #e5e7eb; text-align: center;">${getTranslation("admin_th_stock") || "Stok"}</th>
                <th style="padding: 16px 24px; border-bottom: 1px solid #e5e7eb; text-align: right;">${getTranslation("admin_th_action") || "Aksi"}</th>
              </tr>
            </thead>
            <tbody id="bookListContainer">
               <tr><td colspan="4" style="text-align: center; padding: 30px; color: #6b7280;">${getTranslation("admin_loading_books") || "Memuat koleksi buku..."}</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <div id="userControlSection" class="hidden" style="margin-bottom: 50px;">
      <div style="background: white; border-radius: 12px; border: 1px solid #e5e7eb; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.05);">
        
        <div style="padding: 24px; border-bottom: 1px solid #e5e7eb; background: #fafafa; border-radius: 12px 12px 0 0; display: flex; justify-content: space-between; align-items: center;">
          <div>
            <h2 style="font-size: 1.2rem; font-weight: 800; color: #111827; margin: 0;">${getTranslation("admin_user_title") || "Data Mahasiswa & Admin"}</h2>
            <p style="font-size: 0.8rem; color: #6b7280; margin: 5px 0 0 0;">${getTranslation("admin_user_subtitle") || "Kelola data dan berikan pangkat khusus"}</p>
          </div>
          <button id="btnAturPangkat" style="background: #111827; color: white; border: none; padding: 10px 18px; border-radius: 8px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 8px; font-family: inherit; font-size: 0.85rem; transition: 0.2s;" onmouseover="this.style.background='#374151'" onmouseout="this.style.background='#111827'">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" style="width: 16px; height: 16px;">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z" />
            </svg>${getTranslation("admin_set_role") || "Atur Pangkat"}</button>
        </div>

        <div class="hilang-scroll" style="width: 100%; overflow-x: auto;">
          <table style="width: 100%; border-collapse: collapse; text-align: left; min-width: 700px;">
            <thead>
              <tr style="background: #f3f4f6; color: #4b5563; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.5px;">
                <th style="padding: 16px 24px; border-bottom: 1px solid #e5e7eb;">${getTranslation("admin_th_fullname") || "Nama Lengkap"}</th>
                <th style="padding: 16px 24px; border-bottom: 1px solid #e5e7eb;">${getTranslation("admin_th_email") || "Email"}</th>
                <th style="padding: 16px 24px; border-bottom: 1px solid #e5e7eb;">${getTranslation("admin_th_role") || "Pangkat"}</th>
                <th style="padding: 16px 24px; border-bottom: 1px solid #e5e7eb; text-align: right;">${getTranslation("admin_th_action") || "Aksi"}</th>
              </tr>
            </thead>
            <tbody id="userListContainer">
               <tr><td colspan="4" style="text-align: center; padding: 30px; color: #6b7280;">${getTranslation("admin_loading_users") || "Memuat data mahasiswa..."}</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <div id="modalAturPangkat" class="hidden" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(17, 24, 39, 0.6); backdrop-filter: blur(4px); z-index: 100000; display: flex; justify-content: center; align-items: center; opacity: 0; transition: opacity 0.3s ease;">
      <div style="background: white; padding: 30px; border-radius: 16px; width: 90%; max-width: 450px; position: relative; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25);">
        <h2 style="font-size: 1.25rem; font-weight: 800; color: #111827; margin: 0 0 5px 0;">${getTranslation("admin_set_role_title") || "Atur Pangkat Mahasiswa"}</h2>
        <p style="font-size: 0.85rem; color: #6b7280; margin-bottom: 20px;">${getTranslation("admin_set_role_subtitle") || "Berikan wewenang pada user untuk mengelola perpustakaan."}</p>

        <form id="formAturPangkat" style="display: flex; flex-direction: column; gap: 15px;">
          <div>
            <label style="font-size: 0.85rem; font-weight: 700; color: #4b5563; display: block; margin-bottom: 6px;">${getTranslation("admin_select_user") || "Pilih Mahasiswa"}</label>
            <div id="wadahSelectUser"></div> 
            <input type="hidden" id="selectPangkatUser" required> 
          </div>
          <div>
            <label style="font-size: 0.85rem; font-weight: 700; color: #4b5563; display: block; margin-bottom: 6px;">${getTranslation("admin_select_role") || "Pilih Pangkat"}</label>
            <div id="wadahSelectRole"></div> 
            <input type="hidden" id="selectPangkatRole" required> 
          </div>
          <div style="display: flex; gap: 10px; margin-top: 10px;">
            <button type="button" id="btnCancelPangkat" style="flex: 1; background: #f3f4f6; color: #4b5563; border: none; padding: 12px; border-radius: 8px; font-weight: 600; cursor: pointer; transition: 0.2s;" onmouseover="this.style.background='#e5e7eb'" onmouseout="this.style.background='#f3f4f6'">${getTranslation("btn_cancel") || getTranslation("btn_cancel") || "Batal"}</button>
            <button type="submit" id="btnSavePangkat" style="flex: 1; background: #111827; color: white; border: none; padding: 12px; border-radius: 8px; font-weight: 600; cursor: pointer; transition: 0.2s;" onmouseover="this.style.background='#374151'" onmouseout="this.style.background='#111827'">${getTranslation("admin_save_role") || "Simpan Pangkat"}</button>
          </div>
        </form>
      </div>
    </div>

    <div style="display: flex; justify-content: center; flex-wrap: wrap; gap: 20px; margin-top: 30px;">  
      
      <div id="btnRequestToggle" class="admin-action-btn" style="width: 100%; max-width: 330px; background: white; border: 1px solid #e5e7eb; padding: 20px; border-radius: 12px; cursor: pointer; display: flex; align-items: center; gap: 15px; transition: all 0.3s ease; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
        <div class="icon-wrap" style="width: 40px; height: 40px; color: #6b7280;">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
          </svg>
        </div>
        <div class="text-wrap">
          <h4 style="font-size: 1rem; font-weight: 700; color: #111827; margin: 0;">${getTranslation("admin_card_req_title") || "Request Buku"}</h4>
          <p style="font-size: 0.75rem; color: #6b7280; margin: 0;">${getTranslation("admin_card_req_desc") || "Cek permintaan mahasiswa"}</p>
        </div>
      </div>

      <div id="btnManageBookToggle" class="admin-action-btn" style="width: 100%; max-width: 330px; background: white; border: 1px solid #e5e7eb; padding: 20px; border-radius: 12px; cursor: pointer; display: flex; align-items: center; gap: 15px; transition: all 0.3s ease; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
        <div class="icon-wrap" style="width: 40px; height: 40px; color: #6b7280;">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
          </svg>
        </div>
        <div class="text-wrap">
          <h4 style="font-size: 1rem; font-weight: 700; color: #111827; margin: 0;">${getTranslation("admin_card_manage_title") || "Manage Buku"}</h4>
          <p style="font-size: 0.75rem; color: #6b7280; margin: 0;">${getTranslation("admin_card_manage_desc") || "Edit / Hapus koleksi"}</p>
        </div>
      </div>

      <div id="btnUserControlToggle" class="admin-action-btn" style="width: 100%; max-width: 330px; background: white; border: 1px solid #e5e7eb; padding: 20px; border-radius: 12px; cursor: pointer; display: flex; align-items: center; gap: 15px; transition: all 0.3s ease; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
        <div class="icon-wrap" style="width: 40px; height: 40px; color: #6b7280;">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-2.533-4.656 6.966 6.966 0 0 1-5.111-4.702 4.125 4.125 0 0 0-3.327-3.086 6.967 6.967 0 0 1-4.887-4.108c-.08-.18-.163-.359-.247-.538a1.25 1.25 0 0 0-2.204.032l-.4 1.11a1.25 1.25 0 0 0 .141 1.255c.294.398.54.823.733 1.272a4.125 4.125 0 0 0 3.033 2.53 6.966 6.966 0 0 1 4.717 5.143 4.125 4.125 0 0 0 3.167 3.321c.218.044.437.081.656.111a1.25 1.25 0 0 0 1.201-.746l.163-.442Z" />
          </svg>
        </div>
        <div class="text-wrap">
          <h4 style="font-size: 1rem; font-weight: 700; color: #111827; margin: 0;">${getTranslation("admin_card_user_title") || "User Control"}</h4>
          <p style="font-size: 0.75rem; color: #6b7280; margin: 0;">${getTranslation("admin_card_user_desc") || "Kelola data mahasiswa"}</p>
        </div>
      </div>

    </div>

    <div id="editBookModal" class="hidden" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(17, 24, 39, 0.6); backdrop-filter: blur(4px); z-index: 100000; display: flex; justify-content: center; align-items: center; opacity: 0; transition: opacity 0.3s ease;">
      <div class="hilang-scroll" style="background: white; border-radius: 24px; width: 95%; max-width: 900px; max-height: 90vh; overflow-y: auto; position: relative; padding: clamp(20px, 5vw, 40px); box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25); box-sizing: border-box;">
        
        <button id="closeEditModalBtn" style="position: absolute; top: 20px; right: 20px; background: #f3f4f6; border: none; width: 40px; height: 40px; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; color: #6b7280; transition: 0.2s;" onmouseover="this.style.background='#e5e7eb'; this.style.color='#111827';" onmouseout="this.style.background='#f3f4f6'; this.style.color='#6b7280';">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" style="width: 20px; height: 20px;"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
        </button>

        <header style="margin-bottom: 30px; text-align: left">
          <h1 style="font-size: 2rem; font-weight: 800; color: #111827; letter-spacing: -1px;">${getTranslation("admin_edit_book_title") || "Update Koleksi Buku"}</h1>
          <p style="color: #6b7280; margin-top: 5px;">${getTranslation("admin_edit_book_subtitle") || "Edit detail di sebelah kiri dan pantau perubahan kartu di sebelah kanan."}</p>
        </header>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(350px, 1fr)); gap: 30px; align-items: start;">
          
          <!-- BAGIAN KIRI: FORM EDIT -->
          <div>
            <form id="editBookForm" style="display: flex; flex-direction: column; gap: 18px">
              <input type="hidden" id="editBookId" /> 
              
              <!-- Input Judul -->
              <div style="position: relative;">
                <label style="font-size: 0.85rem; font-weight: 700; color: #4b5563; display: block; margin-bottom: 6px;">${getTranslation("admin_th_title") || "Judul Buku"}</label>
                <input type="text" id="editTitle" maxlength="100" style="width: 100%; padding: 12px 16px; border-radius: 10px; border: 1px solid #d1d5db; outline: none; font-family: inherit; box-sizing: border-box;" required />
                <span id="warnEditTitle" style="font-size: 11px; color: #dc2626; font-weight: bold; position: absolute; bottom: -18px; left: 0; display: none;">${getTranslation("upload_warn_title_limit") || "Limit 100 karakter tercapai!"}</span>
              </div>

              <!-- Input Penulis & Stok -->
              <div style="display: flex; gap: 15px; margin-top: 5px;">
                <div style="flex: 2; position: relative;">
                  <label style="font-size: 0.85rem; font-weight: 700; color: #4b5563; display: block; margin-bottom: 6px;">${getTranslation("upload_form_author") || "Penulis"}</label>
                  <input type="text" id="editAuthor" maxlength="50" style="width: 100%; padding: 12px 16px; border-radius: 10px; border: 1px solid #d1d5db; outline: none; font-family: inherit; box-sizing: border-box;" required />
                  <span id="warnEditAuthor" style="font-size: 11px; color: #dc2626; font-weight: bold; position: absolute; bottom: -18px; left: 0; display: none;">${getTranslation("upload_warn_author_limit") || "Limit 50 karakter tercapai!"}</span>
                </div>
                <div style="flex: 1;">
                  <label style="font-size: 0.85rem; font-weight: 700; color: #4b5563; display: block; margin-bottom: 6px;">${getTranslation("admin_th_stock") || "Stok"}</label>
                  <input type="number" id="editStock" min="0" style="width: 100%; padding: 12px 16px; border-radius: 10px; border: 1px solid #d1d5db; outline: none; font-family: inherit; box-sizing: border-box;" required />
                </div>
              </div>

              <!-- TAHUN, PENERBIT, GENRE -->
              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 15px; margin-top: 5px;">
                <div>
                  <label style="font-size: 0.85rem; font-weight: 700; color: #4b5563; display: block; margin-bottom: 6px;">${getTranslation("upload_form_year") || "Tahun"}</label>
                  <input type="number" id="editYear" style="width: 100%; height: 46px; padding: 0 16px; border-radius: 10px; border: 1px solid #d1d5db; outline: none; font-family: inherit; box-sizing: border-box;" required />
                </div>
                <div>
                  <label style="font-size: 0.85rem; font-weight: 700; color: #4b5563; display: block; margin-bottom: 6px;">${getTranslation("upload_form_publisher") || "Penerbit"}</label>
                  <input type="text" id="editPublisher" style="width: 100%; height: 46px; padding: 0 16px; border-radius: 10px; border: 1px solid #d1d5db; outline: none; font-family: inherit; box-sizing: border-box;" required />
                </div>
                <div>
                  <label style="font-size: 0.85rem; font-weight: 700; color: #4b5563; display: block; margin-bottom: 6px;">${getTranslation("upload_form_genre") || "Genre"}</label>
                  <div id="wadahEditGenre" style="height: 46px;"></div>
                  <input type="hidden" id="editGenre" required> 
                </div>
              </div>

              <div>
                <label style="font-size: 0.85rem; font-weight: 700; color: #4b5563; display: block; margin-bottom: 6px;">${getTranslation("upload_form_cover") || "URL / Path Cover"}</label>
                <input type="text" id="editCoverInput" style="width: 100%; padding: 12px 16px; border-radius: 10px; border: 1px solid #d1d5db; outline: none; font-family: inherit; box-sizing: border-box;" placeholder="Mendukung URL Image atau kode SVG" required />
              </div>

              <div>
                <label style="font-size: 0.85rem; font-weight: 700; color: #4b5563; display: block; margin-bottom: 6px;">${getTranslation("upload_form_synopsis") || "Sinopsis Singkat"}</label>
                <textarea id="editSynopsis" class="no-scrollbar" rows="4" style="width: 100%; padding: 12px 16px; border-radius: 10px; border: 1px solid #d1d5db; outline: none; font-family: inherit; resize: vertical; box-sizing: border-box;" required></textarea>
              </div>
              
              <div>
                <label style="font-size: 0.85rem; font-weight: 700; color: #4b5563; display: block; margin-bottom: 6px;">${getTranslation("upload_form_content") || "Isi Cerita / Bab 1"}</label>
                <textarea id="editStory" class="no-scrollbar" rows="6" style="width: 100%; padding: 12px 16px; border-radius: 10px; border: 1px solid #d1d5db; outline: none; font-family: inherit; resize: vertical; box-sizing: border-box;" placeholder="Tulis atau paste isi cerita di sini..." required></textarea>
              </div>
              
              <button type="submit" style="background: #111827; color: white; padding: 16px; border: none; border-radius: 12px; font-weight: 700; font-size: 1rem; cursor: pointer; margin-top: 10px; transition: 0.2s;" onmouseover="this.style.background='#374151'" onmouseout="this.style.background='#111827'">${getTranslation("admin_btn_save_changes") || "Simpan Perubahan"}</button>
            </form>
          </div>

          <!-- LIVE PREVIEW -->
          <div style="background: #f9fafb; padding: 15px; border-radius: 20px; border: 1px dashed #d1d5db; display: flex; flex-direction: column; align-items: center; justify-content: flex-start; position: sticky; top: 0;">
            <p style="font-weight: 700; color: #6b7280; font-size: 0.8rem; text-transform: uppercase; margin-bottom: 20px; letter-spacing: 1px;">${getTranslation("upload_preview_title") || "Live Preview Card"}</p>
            
            <!-- KUNCI MATI KARTU -->
            <div id="livePreviewCard" style="background: white; border-radius: 12px; border: 1px solid #e5e7eb; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); width: 340px; min-width: 340px; max-width: 340px; overflow: hidden; display: flex; flex-direction: column;">
              
              <div id="editPreviewCover" style="width: 100%; height: 250px; background: #ffffff; border-bottom: 1px solid #e5e7eb; display: flex; justify-content: center; align-items: center; overflow: hidden; padding: 20px; box-sizing: border-box;">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="#9ca3af" style="width: 120px; height: 120px;">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
                </svg>
              </div>

              <div style="padding: 24px; width: 100%; box-sizing: border-box;">
                <h3 id="editPreviewTitle" style="width: 100%; box-sizing: border-box; font-size: 1.2rem; font-weight: 800; color: #111827; margin: 0 0 8px 0; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; white-space: normal; word-break: normal; overflow-wrap: break-word;">Judul Buku (2026)</h3>
                <p id="editPreviewAuthor" style="width: 100%; box-sizing: border-box; font-size: 0.95rem; color: #6b7280; margin: 0 0 24px 0; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; white-space: normal; word-break: normal; overflow-wrap: break-word;">Nama Penulis</p>
                
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; font-size: 0.9rem;">
                  <div style="display: flex; gap: 12px; align-items: center;">
                    <div style="display: flex; align-items: center; gap: 4px; color: #6b7280;">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="width: 18px; height: 18px;">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                        <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                      </svg>
                      0
                    </div>
                    <div style="display: flex; align-items: center; gap: 4px; color: #374151; font-weight: 700;">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#eab308" style="width: 16px; height: 16px;"><path fill-rule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clip-rule="evenodd" /></svg>
                      <span id="editPreviewRating">...</span>
                    </div>
                  </div>
                  <div style="display: flex; gap: 10px; align-items: center;">
                    <span id="editPreviewBadge" style="background: #dcfce7; color: #166534; padding: 6px 14px; border-radius: 16px; font-weight: 700; font-size: 0.8rem;">${getTranslation("borrow_status_available") || "Tersedia"}</span>
                    <div id="editPreviewStock" style="font-weight: 700; color: #111827; font-size: 0.9rem;">1/1</div>
                  </div>
                </div>
                <button disabled style="width: 100%; padding: 14px; background: #000000; color: white; border: none; border-radius: 8px; font-weight: 700; font-size: 0.95rem; cursor: not-allowed; font-family: inherit;">${getTranslation("book_detail_btn") || "Detail Buku"}</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div id="brutalistEditModal" class="hidden" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(17, 24, 39, 0.6); backdrop-filter: blur(4px); z-index: 100000; display: flex; justify-content: center; align-items: center; opacity: 0; transition: opacity 0.3s ease;">
      <div style="background: white; padding: 40px; border-radius: 12px; width: 90%; max-width: 550px; position: relative; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25);">
        
        <button id="closeEditReviewModalBtn" style="position: absolute; top: 15px; right: 15px; background: none; border: none; color: #6b7280; cursor: pointer; transition: 0.2s;" onmouseover="this.style.color='#111827'" onmouseout="this.style.color='#6b7280'">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" style="width: 24px; height: 24px;"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
        </button>

        <br>
        
        <div class="brutalist-container" style="display: flex; flex-direction: row; gap: 10px; align-items: flex-end; position: relative;">
          <div class="brutalist-input-wrapper" style="flex: 1; position: relative;">
            
            <div class="brutalist-label-wrapper" style="position: absolute; left: -3px; top: -38px; display: flex; align-items: center; gap: 10px; z-index: 1;">
              <span class="brutalist-label-text" style="font-size: 12px; font-weight: bold; color: #fff; background-color: #000; padding: 3px 8px; transform: rotate(-1deg);">${getTranslation("admin_edit_comment") || "EDIT KOMENTAR"}</span>
              <div class="brutalist-label-rating" id="editModalStars" style="display: flex; gap: 2px; padding: 2px 6px; transform: rotate(1deg); align-items: center;">
              </div>
            </div>

            <input id="editModalInput" type="text" maxlength="100" class="brutalist-input" style="box-sizing: border-box; width: 100%; padding: 12px; font-size: 16px; font-weight: bold; color: #000; background-color: #fff; border: 3px solid #000; border-radius: 0; outline: none; box-shadow: 4px 4px 0 #000; transition: all 0.2s;" />
            <div id="editCharWarning" style="font-family: monospace; font-size: 11px; font-weight: bold; color: #dc2626; position: absolute; bottom: -22px; left: 0; white-space: nowrap; display: none;">${getTranslation("admin_warn_limit") || "Telah melebihi limit (Maks 100 Karakter)!"}</div>
          </div>

          <button id="btnSaveEditReview" style="background: #000; color: #fff; border: 3px solid #000; padding: 0; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s; box-shadow: 4px 4px 0 #3b82f6; margin-bottom: 0; flex-shrink: 0; width: 50px; height: 48px;" onmouseover="this.style.transform='translate(-2px, -2px)'; this.style.boxShadow='6px 6px 0 #3b82f6';" onmouseout="this.style.transform='translate(0, 0)'; this.style.boxShadow='4px 4px 0 #3b82f6';">
            ${checkSvg}
          </button>
        </div>

      </div>
    </div>
  `;

  initRequestLogic();
  initUserControlLogic();
  initManageBookLogic();

  renderCustomSelect({
    containerId: "wadahEditGenre",
    inputId: "editGenre",
    placeholder: "Pilih Genre",
    options: [
      { value: "Filsafat", label: "Filsafat" },
      { value: "Politik", label: "Politik" },
      { value: "Sastra", label: "Sastra" },
      { value: "Sosial", label: "Sosial" },
      { value: "Fiksi", label: "Fiksi" },
      { value: "Biografi", label: "Biografi" },
      { value: "Teknologi", label: "Teknologi" },
    ],
  });
}

function resetSemuaAdminUI() {
  chartsContainer.classList.add("hidden");
  requestSection.classList.add("hidden");
  manageBookSection.classList.add("hidden");
  userControlSection.classList.add("hidden");

  const subtitle = document.getElementById("adminSubtitle");
  if (subtitle) {
    subtitle.textContent =
      "Klik grafik untuk analisis mendalam per bulan/tahun.";
  }

  const configs = [
    {
      id: "btnRequestToggle",
      icon: iconRequest,
      title: "Request Buku",
      desc: "Cek permintaan mahasiswa",
    },
    {
      id: "btnManageBookToggle",
      icon: iconManage,
      title: "Manage Buku",
      desc: "Edit / Hapus koleksi",
    },
    {
      id: "btnUserControlToggle",
      icon: iconUser,
      title: "User Control",
      desc: "Kelola data mahasiswa",
    },
  ];

  configs.forEach((conf) => {
    const btn = document.getElementById(conf.id);
    if (btn) {
      btn.querySelector(".icon-wrap").style.color = "#6b7280";
      btn.querySelector(".icon-wrap").innerHTML = conf.icon;
      btn.querySelector(".text-wrap").innerHTML = `
        <h4 style="font-size: 1rem; font-weight: 700; color: #111827; margin: 0;">${conf.title}</h4>
        <p style="font-size: 0.75rem; color: #6b7280; margin: 0;">${conf.desc}</p>
      `;
    }
  });
}

function initUserControlLogic() {
  const btnUserToggle = document.getElementById("btnUserControlToggle");
  const chartsContainer = document.getElementById("chartsContainer");
  const userSection = document.getElementById("userControlSection");
  const bookSection = document.getElementById("manageBookSection");
  const reqSection = document.getElementById("requestSection");
  const userListContainer = document.getElementById("userListContainer");

  let isUserMode = false;

  btnUserToggle.addEventListener("click", () => {
    const sedangBuka = !userSection.classList.contains("hidden");

    resetSemuaAdminUI();

    if (!sedangBuka) {
      userSection.classList.remove("hidden");
      document.getElementById("adminSubtitle").textContent =
        getTranslation("admin_user_control_desc") || "Pantau daftar mahasiswa, cek pangkat, dan kelola akses akun.";
      btnUserToggle.querySelector(".icon-wrap").style.color = "#3b82f6";
      btnUserToggle.querySelector(".icon-wrap").innerHTML = iconBack;
      btnUserToggle.querySelector(".text-wrap").innerHTML = `
      <h4 style="font-size: 1rem; font-weight: 700; color: #1e40af; margin: 0;">${getTranslation("admin_back_stats") || "Kembali ke Statistik"}</h4>
      <p style="font-size: 0.75rem; color: #3b82f6; margin: 0;">${getTranslation("admin_close_control") || "Tutup kontrol mahasiswa"}</p>
    `;
      loadUsersRealtime();
    } else {
      chartsContainer.classList.remove("hidden");
    }
  });

  function loadUsersRealtime() {
    onSnapshot(collection(db, "users"), (snapshot) => {
      let htmlContent = "";
      snapshot.forEach((uDoc) => {
        const u = uDoc.data();
        const uid = uDoc.id;

        let displayRole = "Mahasiswa";
        let badgeBg = "#f3f4f6",
          badgeColor = "#4b5563",
          badgeBorder = "#e5e7eb";

        if (u.thekingoflibrary) {
          displayRole = "DEVELOPER";
          badgeBg = "#fefce8";
          badgeColor = "#a16207";
          badgeBorder = "#fef08a";
        } else if (u.role === "admin") {
          displayRole = "ADMIN";
          badgeBg = "#eff6ff";
          badgeColor = "#1e40af";
          badgeBorder = "#bfdbfe";
        } else if (u.role === "pustakawan") {
          displayRole = "PUSTAKAWAN";
          badgeBg = "#f0fdf4";
          badgeColor = "#166534";
          badgeBorder = "#bbf7d0";
        }

        htmlContent += `
          <tr style="border-bottom: 1px solid #e5e7eb;">
            <td style="padding: 16px 24px; font-weight: 700; color: #111827;">${
              u.displayName || "Anonim"
            }</td>
            <td style="padding: 16px 24px; color: #6b7280;">${u.email}</td>
            <td style="padding: 16px 24px;">
               <span style="background: ${badgeBg}; color: ${badgeColor}; padding: 4px 10px; border-radius: 8px; font-size: 0.75rem; font-weight: 700; border: 1px solid ${badgeBorder};">
                ${displayRole}
               </span>
            </td>
            <td style="padding: 16px 24px; text-align: right;">
              <button onclick="handleDeleteUser('${uid}', '${
          u.displayName
        }')" style="background: #fef2f2; color: #dc2626; border: none; padding: 8px 12px; border-radius: 8px; font-weight: 600; cursor: pointer; transition: 0.2s;" onmouseover="this.style.background='#fee2e2'" onmouseout="this.style.background='#fef2f2'">Hapus Akun</button>
            </td>
          </tr>
        `;
      });
      userListContainer.innerHTML = htmlContent;
    });

    const btnAturPangkat = document.getElementById("btnAturPangkat");
    const modalAturPangkat = document.getElementById("modalAturPangkat");
    const formAturPangkat = document.getElementById("formAturPangkat");
    const selectPangkatUser = document.getElementById("selectPangkatUser");
    const btnCancelPangkat = document.getElementById("btnCancelPangkat");

    if (btnAturPangkat) {
      btnAturPangkat.addEventListener("click", async () => {
        modalAturPangkat.classList.remove("hidden");
        setTimeout(() => (modalAturPangkat.style.opacity = "1"), 10);

        const AVAILABLE_ROLES = [
          { value: "mahasiswa", label: "Mahasiswa (Default)" },
          { value: "admin", label: "Admin (Pengelola Peminjaman)" },
          { value: "pustakawan", label: "Pustakawan (Pengelola Buku)" },
        ];

        renderCustomSelect({
          containerId: "wadahSelectRole",
          inputId: "selectPangkatRole",
          placeholder: "-- Pilih Pangkat / Role --",
          options: AVAILABLE_ROLES,
        });

        renderCustomSelect({
          containerId: "wadahSelectUser",
          inputId: "selectPangkatUser",
          placeholder: "Memuat data...",
          options: [],
        });

        const usersSnap = await getDocs(collection(db, "users"));
        let userOptions = [];

        usersSnap.forEach((doc) => {
          const d = doc.data();
          if (!d.thekingoflibrary) {
            userOptions.push({
              value: doc.id,
              label: `${d.displayName || d.email} (${d.email})`,
            });
          }
        });

        // 4. Update Dropdown mahasiswa setelah data kekumpul
        renderCustomSelect({
          containerId: "wadahSelectUser",
          inputId: "selectPangkatUser",
          placeholder: "-- Pilih mahasiswa --",
          options: userOptions,
        });
      });

      btnCancelPangkat.addEventListener("click", () => {
        modalAturPangkat.style.opacity = "0";
        setTimeout(() => modalAturPangkat.classList.add("hidden"), 300);
      });

      formAturPangkat.addEventListener("submit", async (e) => {
        e.preventDefault();
        const uid = selectPangkatUser.value;
        const newRole = document.getElementById("selectPangkatRole").value;

        if (!uid) return;

        const btnSave = document.getElementById("btnSavePangkat");
        btnSave.disabled = true;
        btnSave.textContent = "Menyimpan...";

        try {
          await updateDoc(doc(db, "users", uid), {
            role: newRole === "mahasiswa" ? null : newRole,
          });
          window.AppAlert.show(
            getTranslation("admin_success") || "Berhasil",
            "Pangkat mahasiswa sukses diperbarui!",
            "success"
          );
          btnCancelPangkat.click();
        } catch (err) {
          console.error(err);
          window.AppAlert.show("Gagal", "Gagal mengubah pangkat.", "error");
        } finally {
          btnSave.disabled = false;
          btnSave.textContent = "Simpan Pangkat";
        }
      });
    }
  }
}

window.handleDeleteUser = async (uid, name) => {
  const confirm = await window.AppAlert.confirm(
    "Hapus mahasiswa?",
    `Yakin mau membuang "${name}" dari kerajaan? Data peminjaman dia bakal jadi yatim piatu.`
  );
  if (confirm) {
    try {
      await deleteDoc(doc(db, "users", uid));
      window.AppAlert.show(
        getTranslation("admin_success") || "Berhasil",
        "Data user di Firestore dihapus. Catatan: Login Auth dia tetap ada sampai dia logout.",
        "success"
      );
    } catch (e) {
      window.AppAlert.show("Gagal", "Gagal hapus data user.", "error");
    }
  }
};

function initManageBookLogic() {
  let isReviewMode = false;
  let unsubscribeReviews = null;

  const btnManageBookToggle = document.getElementById("btnManageBookToggle");
  const manageBookSection = document.getElementById("manageBookSection");
  const bookListContainer = document.getElementById("bookListContainer");
  const btnSwitchMode = document.getElementById("btnSwitchMode");
  const switchText = document.getElementById("switchText");
  const switchIcon = document.getElementById("switchIcon");

  btnManageBookToggle.addEventListener("click", () => {
    const sedangBuka = !manageBookSection.classList.contains("hidden");

    resetSemuaAdminUI();

    if (!sedangBuka) {
      manageBookSection.classList.remove("hidden");
      document.getElementById("adminSubtitle").textContent =
        "Tambah, edit detail, atau hapus koleksi buku di perpustakaan.";

      btnManageBookToggle.querySelector(".icon-wrap").style.color = "#3b82f6";
      btnManageBookToggle.querySelector(".icon-wrap").innerHTML = iconBack;
      btnManageBookToggle.querySelector(".text-wrap").innerHTML = `
        <h4 style="font-size: 1rem; font-weight: 700; color: #1e40af; margin: 0;">${getTranslation("admin_back_stats") || "Kembali ke Statistik"}</h4>
        <p style="font-size: 0.75rem; color: #3b82f6; margin: 0;">Tutup menu kelola buku</p>
      `;

      isReviewMode = false;
      const title = manageBookSection.querySelector("h2");
      const btnTambah = document.getElementById("btnAddNewBook");
      const tableHead = manageBookSection.querySelector("thead tr");

      title.innerText = "Koleksi Buku";
      switchText.innerText = "Kelola Ulasan";
      switchIcon.innerHTML = chatSvg;
      btnTambah.style.display = "flex";
      tableHead.innerHTML = `
        <th style="padding: 16px 24px; border-bottom: 1px solid #e5e7eb;">Info Buku</th>
        <th style="padding: 16px 24px; border-bottom: 1px solid #e5e7eb;">Kategori</th>
        <th style="padding: 16px 24px; border-bottom: 1px solid #e5e7eb; text-align: center;">Stok</th>
        <th style="padding: 16px 24px; border-bottom: 1px solid #e5e7eb; text-align: right;">Aksi</th>
      `;

      loadBooksRealtime();
    } else {
      chartsContainer.classList.remove("hidden");
    }
  });

  btnSwitchMode.addEventListener("click", () => {
    isReviewMode = !isReviewMode;
    const title = manageBookSection.querySelector("h2");
    const subtitle = manageBookSection.querySelector("p");
    const btnTambah = document.getElementById("btnAddNewBook");
    const tableHead = manageBookSection.querySelector("thead tr");

    if (unsubscribeReviews) {
      unsubscribeReviews();
      unsubscribeReviews = null;
    }

    if (isReviewMode) {
      title.innerText = "Moderasi Ulasan mahasiswa";
      subtitle.innerText = "Edit rating atau hapus komentar yang tidak pantas.";
      switchText.innerText = "Kelola Buku";
      switchIcon.innerHTML = adminIcons.BOOKS;
      btnTambah.style.display = "none";

      tableHead.innerHTML = `
        <th style="padding: 16px 24px; border-bottom: 1px solid #e5e7eb;">User</th>
        <th style="padding: 16px 24px; border-bottom: 1px solid #e5e7eb;">Buku</th>
        <th style="padding: 16px 24px; border-bottom: 1px solid #e5e7eb;">Rating</th>
        <th style="padding: 16px 24px; border-bottom: 1px solid #e5e7eb; width: 35%;">Komentar</th>
        <th style="padding: 16px 24px; border-bottom: 1px solid #e5e7eb; text-align: right;">Aksi</th>
      `;
      loadAllReviewsRealtime();
    } else {
      title.innerText = "Koleksi Buku";
      subtitle.innerText = "Kelola data, stok, dan hapus buku";
      switchText.innerText = "Kelola Ulasan";
      switchIcon.innerHTML = chatSvg;
      btnTambah.style.display = "flex";

      tableHead.innerHTML = `
        <th style="padding: 16px 24px; border-bottom: 1px solid #e5e7eb;">Info Buku</th>
        <th style="padding: 16px 24px; border-bottom: 1px solid #e5e7eb;">Kategori</th>
        <th style="padding: 16px 24px; border-bottom: 1px solid #e5e7eb; text-align: center;">Stok</th>
        <th style="padding: 16px 24px; border-bottom: 1px solid #e5e7eb; text-align: right;">Aksi</th>
      `;
      loadBooksRealtime();
    }
  });

  async function loadAllReviewsRealtime() {
    bookListContainer.innerHTML = `<tr><td colspan="4" style="text-align: center; padding: 30px;"><div class="loader" style="margin: 0 auto;"></div></td></tr>`;
    const booksSnap = await getDocs(collection(db, "books"));

    booksSnap.forEach((bookDoc) => {
      const bId = bookDoc.id;
      onSnapshot(collection(db, "books", bId, "reviews"), (snap) => {
        renderReviewRows(booksSnap);
      });
    });
  }

  async function renderReviewRows(booksSnap) {
    let htmlContent = "";

    for (const bDoc of booksSnap.docs) {
      const bData = bDoc.data();
      const bId = bDoc.id;

      const bookTitle = bData.title || "Tanpa Judul";
      const coverHtml =
        bData.cover && bData.cover.startsWith("<svg")
          ? bData.cover
          : `<img src="${
              bData.cover || "https://via.placeholder.com/40"
            }" style="width: 40px; height: 55px; border-radius: 4px; object-fit: contain;" />`;

      const revSnap = await getDocs(
        query(
          collection(db, "books", bId, "reviews"),
          orderBy("timestamp", "desc")
        )
      );

      revSnap.forEach((rDoc) => {
        const r = rDoc.data();
        const rId = rDoc.id;

        let timeStr = "-";
        if (r.timestamp) {
          const d = r.timestamp.toDate();
          timeStr = `${d.getDate().toString().padStart(2, "0")} ${
            [
              "Jan",
              "Feb",
              "Mar",
              "Apr",
              "Mei",
              "Jun",
              "Jul",
              "Agu",
              "Sep",
              "Okt",
              "Nov",
              "Des",
            ][d.getMonth()]
          } ${d.getFullYear()} • ${d.getHours().toString().padStart(2, "0")}:${d
            .getMinutes()
            .toString()
            .padStart(2, "0")}`;
        }

        let stars = "";
        for (let i = 1; i <= 5; i++) {
          stars += `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${
            i <= r.rating ? "#eab308" : "#e5e7eb"
          }" style="width: 14px; height: 14px;"><path d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" /></svg>`;
        }

        let repliesHtml = "";
        if (r.replies && r.replies.length > 0) {
          repliesHtml += `<div style="margin-top: 12px; display: flex; flex-direction: column; gap: 8px;">`;
          r.replies.forEach((reply) => {
            const encodedReply = encodeURIComponent(JSON.stringify(reply));
            const currentBookId = typeof bId !== "undefined" ? bId : bookId;

            repliesHtml += `
              <div style="display: flex; gap: 8px; background: #f8fafc; border: 1px solid #e2e8f0; padding: 10px; border-radius: 8px;">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 14px; height: 14px; color: #9ca3af; margin-top: 2px; flex-shrink: 0;"><path d="M8 0v12c0 2.2 1.8 4 4 4h8"></path><polyline points="16 12 20 16 16 20"></polyline></svg>
                <div style="flex: 1;">
                  <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 4px;">
                    <div style="display: flex; align-items: center; gap: 6px;">
                      <span style="font-size: 0.8rem; font-weight: 800; color: #111827;">${
                        reply.name
                      }</span>
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#3b82f6" style="width: 14px; height: 14px;">
                        <path fill-rule="evenodd" d="M8.603 3.799A4.49 4.49 0 0 1 12 2.25c1.357 0 2.573.6 3.397 1.549a4.49 4.49 0 0 1 3.498 1.307 4.491 4.491 0 0 1 1.307 3.497A4.49 4.49 0 0 1 21.75 12a4.49 4.49 0 0 1-1.549 3.397 4.491 4.491 0 0 1-1.307 3.497 4.491 4.491 0 0 1-3.497 1.307A4.49 4.49 0 0 1 12 21.75a4.49 4.49 0 0 1-3.397-1.549 4.49 4.49 0 0 1-3.498-1.306 4.491 4.491 0 0 1-1.307-3.498A4.49 4.49 0 0 1 2.25 12c0-1.357.6-2.573 1.549-3.397a4.49 4.49 0 0 1 1.307-3.497 4.49 4.49 0 0 1 3.497-1.307Zm7.007 6.387a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z" clip-rule="evenodd" />
                      </svg>
                      <span style="background: #111827; color: white; padding: 2px 6px; border-radius: 4px; font-size: 0.55rem; font-weight: bold; letter-spacing: 0.5px;">${reply.role.toUpperCase()}</span>
                    </div>
                    <div style="display: flex; gap: 8px; align-items: center;">
                      <button onclick="window.handleEditAdminReply('${currentBookId}', '${rId}', '${encodedReply}')" style="background: none; border: none; color: #3b82f6; cursor: pointer; padding: 0;" title="Edit Balasan">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" style="width: 14px; height: 14px;">
                          <path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                        </svg>
                      </button>
                      
                      <button onclick="window.handleDeleteReply('${currentBookId}', '${rId}', '${encodedReply}')" style="background: none; border: none; color: #ef4444; cursor: pointer; padding: 0;" title="Hapus Balasan">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" style="width: 14px; height: 14px;"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
                      </button>
                    </div>
                  </div>
                  <p style="font-size: 0.8rem; color: #4b5563; margin: 0; line-height: 1.4;">${
                    reply.text
                  }</p>
                </div>
              </div>
            `;
          });
          repliesHtml += `</div>`;
        }

        htmlContent += `
          <tr style="border-bottom: 1px solid #e5e7eb; transition: background 0.2s ease;" onmouseover="this.style.background='#f9fafb'" onmouseout="this.style.background='transparent'">
            
            <td style="padding: 16px 24px; min-width: 150px; white-space: nowrap; vertical-align: top;">
              <div style="font-weight: 700; color: #111827; font-size: 0.9rem;">${
                r.userName
              }</div>
              <div style="font-size: 0.75rem; color: #6b7280; margin-top: 4px;">${timeStr}</div>
            </td> 

            <td style="padding: 16px 24px; min-width: 250px; vertical-align: top;">
              <div style="display: flex; align-items: center; gap: 12px;">
                <div style="width: 35px; height: 50px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; overflow: hidden;">
                  ${coverHtml}
                </div>
                <div style="font-weight: 700; color: #111827; font-size: 0.85rem; line-height: 1.4; white-space: normal;">
                  ${bookTitle}
                </div>
              </div>
            </td>
            
            <td style="padding: 16px 24px; min-width: 120px; white-space: nowrap; vertical-align: top;">
              <div style="display: flex; gap: 2px;">${stars}</div>
            </td>
            
            <td style="padding: 16px 24px; min-width: 300px; font-size: 0.85rem; color: #4b5563; line-height: 1.5; vertical-align: top; white-space: normal;">
              <div style="word-break: break-word;">
                ${r.comment}
              </div>
              ${repliesHtml}
            </td>
            
            <td style="padding: 16px 24px; text-align: right; vertical-align: top; white-space: nowrap;">
              <div style="display: flex; gap: 8px; justify-content: flex-end;">
                <!-- Hati-hati di sini: pastikan escape single quote kalau ada di comment -->
                <button onclick="window.handleEditReview('${bId}', '${rId}', '${r.comment.replace(
          /'/g,
          "\\'"
        )}', ${
          r.rating
        })" style="background: #eff6ff; color: #1e40af; border: none; padding: 8px; border-radius: 6px; cursor: pointer;">${iconEdit}</button>
                <button onclick="handleDeleteReview('${bId}', '${rId}')" style="background: #fef2f2; color: #dc2626; border: none; padding: 8px; border-radius: 6px; cursor: pointer;">${iconTrash}</button>
              </div>
            </td>
            
          </tr>
        `;
      });
    }

    bookListContainer.innerHTML =
      htmlContent ||
      `<tr><td colspan="4" style="text-align: center; padding: 30px;">Belum ada ulasan mahasiswa.</td></tr>`;
  }

  async function loadSpecificBookReviews(bookId, bookTitle) {
    bookListContainer.innerHTML = `<tr><td colspan="4" style="text-align: center; padding: 30px;"><div class="loader" style="margin: 0 auto;"></div></td></tr>`;

    const reviewsRef = collection(db, "books", bookId, "reviews");
    const q = query(reviewsRef, orderBy("timestamp", "desc"));

    unsubscribeReviews = onSnapshot(q, (snapshot) => {
      let htmlContent = "";

      snapshot.forEach((rDoc) => {
        const r = rDoc.data();
        const rId = rDoc.id;

        let timeStr = "-";
        if (r.timestamp) {
          const d = r.timestamp.toDate();
          timeStr = `${d.getDate().toString().padStart(2, "0")} ${
            [
              "Jan",
              "Feb",
              "Mar",
              "Apr",
              "Mei",
              "Jun",
              "Jul",
              "Agu",
              "Sep",
              "Okt",
              "Nov",
              "Des",
            ][d.getMonth()]
          } ${d.getFullYear()} • ${d.getHours().toString().padStart(2, "0")}:${d
            .getMinutes()
            .toString()
            .padStart(2, "0")}`;
        }

        let stars = "";
        for (let i = 1; i <= 5; i++) {
          stars += `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${
            i <= r.rating ? "#eab308" : "#e5e7eb"
          }" style="width: 14px; height: 14px;"><path d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" /></svg>`;
        }

        let repliesHtml = "";
        if (r.replies && r.replies.length > 0) {
          repliesHtml += `<div style="margin-top: 12px; display: flex; flex-direction: column; gap: 8px;">`;
          r.replies.forEach((reply) => {
            const encodedReply = encodeURIComponent(JSON.stringify(reply));

            repliesHtml += `
              <div style="display: flex; gap: 8px; background: #f8fafc; border: 1px solid #e2e8f0; padding: 10px; border-radius: 8px;">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 14px; height: 14px; color: #9ca3af; margin-top: 2px; flex-shrink: 0;"><path d="M8 0v12c0 2.2 1.8 4 4 4h8"></path><polyline points="16 12 20 16 16 20"></polyline></svg>
                <div style="flex: 1;">
                  <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 4px;">
                    <div style="display: flex; align-items: center; gap: 6px;">
                      <span style="font-size: 0.8rem; font-weight: 800; color: #111827;">${
                        reply.name
                      }</span>
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#3b82f6" style="width: 14px; height: 14px;">
                        <path fill-rule="evenodd" d="M8.603 3.799A4.49 4.49 0 0 1 12 2.25c1.357 0 2.573.6 3.397 1.549a4.49 4.49 0 0 1 3.498 1.307 4.491 4.491 0 0 1 1.307 3.497A4.49 4.49 0 0 1 21.75 12a4.49 4.49 0 0 1-1.549 3.397 4.491 4.491 0 0 1-1.307 3.497 4.491 4.491 0 0 1-3.497 1.307A4.49 4.49 0 0 1 12 21.75a4.49 4.49 0 0 1-3.397-1.549 4.49 4.49 0 0 1-3.498-1.306 4.491 4.491 0 0 1-1.307-3.498A4.49 4.49 0 0 1 2.25 12c0-1.357.6-2.573 1.549-3.397a4.49 4.49 0 0 1 1.307-3.497 4.49 4.49 0 0 1 3.497-1.307Zm7.007 6.387a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z" clip-rule="evenodd" />
                      </svg>
                      <span style="background: #111827; color: white; padding: 2px 6px; border-radius: 4px; font-size: 0.55rem; font-weight: bold; letter-spacing: 0.5px;">${reply.role.toUpperCase()}</span>
                    </div>
                    
                    <div style="display: flex; gap: 8px; align-items: center;">
                      <!-- TOMBOL EDIT BALASAN -->
                      <button onclick="window.handleEditAdminReply('${bookId}', '${rId}', '${encodedReply}')" style="background: none; border: none; color: #3b82f6; cursor: pointer; padding: 0;" title="Edit Balasan">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" style="width: 14px; height: 14px;"><path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" /></svg>
                      </button>
                      <!-- TOMBOL HAPUS BALASAN -->
                      <button onclick="window.handleDeleteReply('${bookId}', '${rId}', '${encodedReply}')" style="background: none; border: none; color: #ef4444; cursor: pointer; padding: 0;" title="Hapus Balasan">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" style="width: 14px; height: 14px;"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
                      </button>
                    </div>
                  </div>
                  <p style="font-size: 0.8rem; color: #4b5563; margin: 0; line-height: 1.4;">${
                    reply.text
                  }</p>
                </div>
              </div>
            `;
          });
          repliesHtml += `</div>`;
        }

        htmlContent += `
          <tr style="border-bottom: 1px solid #e5e7eb;">
            <td style="padding: 16px 24px; vertical-align: top;">
              <div style="font-weight: 700; color: #111827;">${r.userName}</div>
              <div style="font-size: 0.75rem; color: #6b7280; margin-top: 4px;">${timeStr}</div>
            </td>
            <td style="padding: 16px 24px; vertical-align: top;">${stars}</td>
            <td style="padding: 16px 24px; font-size: 0.85rem; color: #4b5563; line-height: 1.5; width: 50%; vertical-align: top;">
              <div style="word-break: break-word;">${r.comment}</div>
              ${repliesHtml}
            </td>
            <td style="padding: 16px 24px; text-align: right; vertical-align: top;">
              <div style="display: flex; gap: 8px; justify-content: flex-end;">
                <button onclick="window.handleEditReview('${bookId}', '${rId}', '${r.comment}', ${r.rating})" style="background: #eff6ff; color: #1e40af; border: none; padding: 8px; border-radius: 6px; cursor: pointer;">${iconEdit}</button>
                <button onclick="window.handleDeleteReview('${bookId}', '${rId}')" style="background: #fef2f2; color: #dc2626; border: none; padding: 8px; border-radius: 6px; cursor: pointer;">${iconTrash}</button>
              </div>
            </td>
          </tr>
        `;
      });

      bookListContainer.innerHTML =
        htmlContent ||
        `<tr><td colspan="4" style="text-align: center; padding: 30px;">Buku ini belum memiliki ulasan.</td></tr>`;
    });
  }

  function loadBooksRealtime() {
    bookListContainer.innerHTML = `<tr><td colspan="4" style="text-align: center; padding: 30px;"><div class="loader" style="margin: 0 auto;"></div></td></tr>`;

    try {
      onSnapshot(collection(db, "books"), (snapshot) => {
        let htmlContent = "";

        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          const docId = docSnap.id;

          const coverHtml =
            data.cover && data.cover.startsWith("<svg")
              ? data.cover
              : `<img src="${
                  data.cover || "https://via.placeholder.com/40"
                }" style="width: 40px; height: 55px; border-radius: 4px; object-fit: contain;" />`;

          const stockColor = data.stock > 0 ? "#166534" : "#dc2626";
          const stockBg = data.stock > 0 ? "#f0fdf4" : "#fef2f2";

          htmlContent += `
            <tr style="border-bottom: 1px solid #e5e7eb; transition: background 0.2s ease;" onmouseover="this.style.background='#f9fafb'" onmouseout="this.style.background='transparent'">
              <td style="padding: 16px 24px;">
                <div style="display: flex; align-items: center; gap: 15px;">
                  ${coverHtml}
                  <div>
                    <h4 style="margin: 0 0 4px 0; font-weight: 700; color: #111827; font-size: 0.95rem;">${
                      data.title || "Tanpa Judul"
                    }</h4>
                    <p style="margin: 0; font-size: 0.8rem; color: #6b7280;">${
                      data.author || "Penulis Anonim"
                    }</p>
                  </div>
                </div>
              </td>
              <td style="padding: 16px 24px; color: #4b5563; font-weight: 500; font-size: 0.85rem;">${
                data.genre || "-"
              }</td>
              <td style="padding: 16px 24px; text-align: center;">
                <span style="background: ${stockBg}; color: ${stockColor}; padding: 6px 12px; border-radius: 20px; font-weight: 700; font-size: 0.8rem;">
                  ${data.stock} Sisa
                </span>
              </td>
              <td style="padding: 16px 24px; text-align: right;">
                <div style="display: flex; gap: 10px; justify-content: flex-end;">
                  <button class="btn-view-reviews" data-id="${docId}" data-title="${
            data.title
          }" title="Kelola Ulasan" style="background: #f0fdf4; color: #166534; border: none; width: 36px; height: 36px; border-radius: 8px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: 0.2s;" onmouseover="this.style.background='#dcfce7'" onmouseout="this.style.background='#f0fdf4'">
                    ${chatSvg}
                  </button>
                  <button class="btn-edit-book" data-id="${docId}" title="Edit Buku" style="background: #eff6ff; color: #1e40af; border: none; width: 36px; height: 36px; border-radius: 8px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: 0.2s;" onmouseover="this.style.background='#dbeafe'" onmouseout="this.style.background='#eff6ff'">
                    ${iconEdit}
                  </button>
                  <button class="btn-delete-book" data-id="${docId}" data-title="${
            data.title
          }" title="Hapus Buku" style="background: #fef2f2; color: #dc2626; border: none; width: 36px; height: 36px; border-radius: 8px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: 0.2s;" onmouseover="this.style.background='#fee2e2'" onmouseout="this.style.background='#fef2f2'">
                    ${iconTrash}
                  </button>
                </div>
              </td>
            </tr>
          `;
        });

        if (htmlContent === "") {
          bookListContainer.innerHTML = `<tr><td colspan="4" style="text-align: center; padding: 30px; color: #6b7280; font-weight: 500;">Koleksi buku masih kosong.</td></tr>`;
        } else {
          bookListContainer.innerHTML = htmlContent;
          attachBookActionListeners();
        }
      });
    } catch (error) {
      console.error("Gagal load buku:", error);
    }
  }

  function attachBookActionListeners() {
    const editBtns = document.querySelectorAll(".btn-edit-book");
    const reviewBtns = document.querySelectorAll(".btn-view-reviews");

    editBtns.forEach((btn) => {
      btn.onclick = async () => {
        const id = btn.getAttribute("data-id");
        const modal = document.getElementById("editBookModal");

        try {
          const docSnap = await getDoc(doc(db, "books", id));
          if (!docSnap.exists()) {
            window.AppAlert.show(
              "Oops!",
              "Buku tidak ditemukan di database!",
              "error"
            );
            return;
          }

          const data = docSnap.data();

          document.getElementById("editBookId").value = id;
          document.getElementById("editTitle").value = data.title || "";
          document.getElementById("editAuthor").value = data.author || "";
          document.getElementById("editStock").value = data.stock || 0;
          document.getElementById("editYear").value =
            data.year || new Date().getFullYear();
          document.getElementById("editPublisher").value = data.publisher || "";
          document.getElementById("editGenre").value = data.genre || "Filsafat";
          document.getElementById("editCoverInput").value = data.cover || "";
          document.getElementById("editSynopsis").value = data.synopsis || "";
          document.getElementById("editStory").value = data.story || "";

          const ratingSpan = document.getElementById("editPreviewRating");
          if (ratingSpan) {
            getDocs(collection(db, "books", id, "reviews"))
              .then((snap) => {
                if (snap.empty) {
                  ratingSpan.innerText = "0.0";
                } else {
                  let sum = 0;
                  snap.forEach((d) => (sum += d.data().rating || 0));
                  ratingSpan.innerText = (sum / snap.size).toFixed(1);
                }
              })
              .catch(() => (ratingSpan.innerText = "-"));
          }

          updateEditPreview();

          modal.classList.remove("hidden");
          setTimeout(() => {
            modal.style.opacity = "1";
          }, 10);
        } catch (error) {
          console.error("Gagal ambil data edit:", error);
        }
      };
    });

    reviewBtns.forEach((btn) => {
      btn.onclick = () => {
        const bookId = btn.getAttribute("data-id");
        const bookTitle = btn.getAttribute("data-title");

        isReviewMode = true;

        const title = manageBookSection.querySelector("h2");
        const subtitle = manageBookSection.querySelector("p");
        const btnTambah = document.getElementById("btnAddNewBook");
        const switchText = document.getElementById("switchText");
        const switchIcon = document.getElementById("switchIcon");
        const tableHead = manageBookSection.querySelector("thead tr");

        title.innerText = `Ulasan: ${bookTitle}`;
        subtitle.innerText = `Memoderasi ulasan mahasiswa khusus untuk buku ini.`;
        switchText.innerText = "Kembali ke Koleksi";
        switchIcon.innerHTML = adminIcons.BOOKS;
        btnTambah.style.display = "none";

        tableHead.innerHTML = `
        <th style="padding: 16px 24px; border-bottom: 1px solid #e5e7eb; vertical-align: top;">User</th>
        <th style="padding: 16px 24px; border-bottom: 1px solid #e5e7eb; vertical-align: top;">Rating</th>
        <th style="padding: 16px 24px; border-bottom: 1px solid #e5e7eb; width: 50%; vertical-align: top;">Komentar</th>
        <th style="padding: 16px 24px; border-bottom: 1px solid #e5e7eb; text-align: right; vertical-align: top;">Aksi</th>
        `;

        loadSpecificBookReviews(bookId, bookTitle);
      };
    });

    const updateEditPreview = () => {
      const title = document.getElementById("editTitle").value || "Judul Buku";
      const author =
        document.getElementById("editAuthor").value || "Nama Penulis";
      const stock = parseInt(document.getElementById("editStock").value) || 0;
      const year =
        document.getElementById("editYear").value || new Date().getFullYear();
      const cover = document.getElementById("editCoverInput").value;

      document.getElementById(
        "editPreviewTitle"
      ).textContent = `${title} (${year})`;
      document.getElementById("editPreviewAuthor").textContent = author;
      document.getElementById(
        "editPreviewStock"
      ).textContent = `${stock}/${stock}`;

      const badge = document.getElementById("editPreviewBadge");
      if (stock > 0) {
        badge.textContent = "Tersedia";
        badge.style.background = "#dcfce7";
        badge.style.color = "#166534";
      } else {
        badge.textContent = "Habis";
        badge.style.background = "#fef2f2";
        badge.style.color = "#991b1b";
      }

      const coverContainer = document.getElementById("editPreviewCover");
      if (cover.startsWith("<svg")) {
        coverContainer.innerHTML = cover;
        const svg = coverContainer.querySelector("svg");
        if (svg) {
          svg.style.width = "120px";
          svg.style.height = "120px";
          svg.style.color = "#9ca3af";
        }
      } else if (cover.length > 5) {
        coverContainer.innerHTML = `<img src="${cover}" style="width: 100%; height: 100%; object-fit: contain;" onerror="this.src='https://via.placeholder.com/200x250?text=Gambar+Rusak'" />`;
      } else {
        coverContainer.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="#9ca3af" style="width: 120px; height: 120px;">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
          </svg>
        `;
      }
    };

    const editInputs = document.querySelectorAll(
      "#editBookForm input, #editBookForm select, #editBookForm textarea"
    );
    editInputs.forEach((input) => {
      input.addEventListener("input", updateEditPreview);
    });

    const editForm = document.getElementById("editBookForm");
    editForm.onsubmit = async (e) => {
      e.preventDefault();
      const id = document.getElementById("editBookId").value;
      const submitBtn = editForm.querySelector('button[type="submit"]');

      submitBtn.textContent = "Menyimpan...";
      submitBtn.disabled = true;

      try {
        await updateDoc(doc(db, "books", id), {
          title: document.getElementById("editTitle").value,
          author: document.getElementById("editAuthor").value,
          stock: parseInt(document.getElementById("editStock").value),
          totalStock: parseInt(document.getElementById("editStock").value),
          year: parseInt(document.getElementById("editYear").value),
          publisher: document.getElementById("editPublisher").value,
          genre: document.getElementById("editGenre").value,
          cover: document.getElementById("editCoverInput").value,
          synopsis: document.getElementById("editSynopsis").value,
          story: document.getElementById("editStory").value,
        });

        const modal = document.getElementById("editBookModal");
        modal.style.opacity = "0";
        setTimeout(() => {
          modal.classList.add("hidden");
        }, 300);

        window.AppAlert.show(
          "Berhasil!",
          "Data buku telah diperbarui.",
          "success"
        );
      } catch (error) {
        console.error("Gagal simpan editan:", error);
        window.AppAlert.show(
          "Gagal",
          "Terjadi kesalahan saat menyimpan data.",
          "error"
        );
      } finally {
        submitBtn.textContent = "Simpan Perubahan";
        submitBtn.disabled = false;
      }
    };

    document.getElementById("closeEditModalBtn").onclick = () => {
      const modal = document.getElementById("editBookModal");
      modal.style.opacity = "0";
      setTimeout(() => {
        modal.classList.add("hidden");
      }, 300);
    };

    const deleteBtns = document.querySelectorAll(".btn-delete-book");
    deleteBtns.forEach((btn) => {
      btn.onclick = async () => {
        const id = btn.getAttribute("data-id");
        const title = btn.getAttribute("data-title");

        const confirmDel = await window.AppAlert.confirm(
          "Hapus Koleksi?",
          `Yakin mau ngehapus buku "${title}" dari perpus? Tindakan ini gak bisa dibatalin.`
        );

        if (confirmDel) {
          try {
            await deleteDoc(doc(db, "books", id));
          } catch (error) {
            console.error("Gagal hapus:", error);
            window.AppAlert.show(
              "Gagal",
              "Buku gagal dihapus, cek koneksi internet.",
              "error"
            );
          }
        }
      };
    });
  }

  const editTitle = document.getElementById("editTitle");
  const warnEditTitle = document.getElementById("warnEditTitle");

  if (editTitle && warnEditTitle) {
    editTitle.addEventListener("input", (e) => {
      const currentLength = e.target.value.length;

      if (currentLength >= 100) {
        e.target.style.borderColor = "#dc2626";
        warnEditTitle.style.display = "block";
      } else {
        e.target.style.borderColor = "";
        warnEditTitle.style.display = "none";
      }
    });
  }

  const editAuthor = document.getElementById("editAuthor");
  const warnEditAuthor = document.getElementById("warnEditAuthor");

  if (editAuthor && warnEditAuthor) {
    editAuthor.addEventListener("input", (e) => {
      const currentLength = e.target.value.length;

      if (currentLength >= 50) {
        e.target.style.borderColor = "#dc2626";
        warnEditAuthor.style.display = "block";
      } else {
        e.target.style.borderColor = "";
        warnEditAuthor.style.display = "none";
      }
    });
  }
}

window.handleDeleteReview = async (bookId, reviewId) => {
  const confirm = await window.AppAlert.confirm(
    "Hapus Ulasan?",
    "Ulasan ini bakal hilang permanen dari buku. Yakin My Lord?"
  );
  if (confirm) {
    try {
      await deleteDoc(doc(db, "books", bookId, "reviews", reviewId));
      window.AppAlert.show(
        getTranslation("admin_success") || "Berhasil",
        "Ulasan mahasiswa telah dimusnahkan.",
        "success"
      );
    } catch (e) {
      console.error(e);
    }
  }
};

window.handleDeleteReply = async (bookId, reviewId, encodedReply) => {
  const confirm = await window.AppAlert.confirm(
    "Hapus Balasan?",
    "Yakin mau narik kembali titah/balasan ini? Rakyat gak akan bisa lihat lagi."
  );

  if (confirm) {
    try {
      const replyObj = JSON.parse(decodeURIComponent(encodedReply));

      await updateDoc(doc(db, "books", bookId, "reviews", reviewId), {
        replies: arrayRemove(replyObj),
      });

      window.AppAlert.show(getTranslation("admin_success") || "Berhasil", "Balasan berhasil ditarik.", "success");
    } catch (e) {
      console.error(e);
      window.AppAlert.show(
        "Gagal",
        "Terjadi kesalahan saat menghapus balasan.",
        "error"
      );
    }
  }
};

window.handleEditAdminReply = (bookId, reviewId, encodedReply) => {
  isEditingReply = true;
  currentEditBookId = bookId;
  currentEditReviewId = reviewId;
  currentEditReplyObj = JSON.parse(decodeURIComponent(encodedReply));

  document.getElementById("editModalInput").value = currentEditReplyObj.text;

  document.querySelector(
    "#brutalistEditModal .brutalist-label-text"
  ).innerText = "EDIT BALASAN";
  document.getElementById("editModalStars").style.display = "none";

  const modal = document.getElementById("brutalistEditModal");
  modal.classList.remove("hidden");
  setTimeout(() => {
    modal.style.opacity = "1";
  }, 10);
};

let currentEditBookId = "";
let currentEditReviewId = "";
let currentEditRating = 5;

let isEditingReply = false;
let currentEditReplyObj = null;

function renderModalEditStars(rating) {
  const container = document.getElementById("editModalStars");
  if (!container) return;

  let starsHtml = "";
  for (let i = 1; i <= 5; i++) {
    const fill = i <= rating ? "#eab308" : "#e5e7eb";
    starsHtml += `
      <svg data-val="${i}" class="modal-star-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${fill}" style="width: 14px; height: 14px; cursor: pointer; transition: fill 0.2s;">
        <path d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" />
      </svg>
    `;
  }
  container.innerHTML = starsHtml;

  container.querySelectorAll(".modal-star-icon").forEach((star) => {
    star.onclick = (e) => {
      currentEditRating = parseInt(e.currentTarget.getAttribute("data-val"));
      renderModalEditStars(currentEditRating);
    };
  });
}

window.handleEditReview = (bookId, reviewId, oldComment, oldRating) => {
  isEditingReply = false;
  currentEditBookId = bookId;
  currentEditReviewId = reviewId;
  currentEditRating = parseInt(oldRating);

  document.getElementById("editModalInput").value = oldComment;

  document.querySelector(
    "#brutalistEditModal .brutalist-label-text"
  ).innerText = "EDIT KOMENTAR";
  document.getElementById("editModalStars").style.display = "flex";
  renderModalEditStars(currentEditRating);

  const modal = document.getElementById("brutalistEditModal");
  modal.classList.remove("hidden");
  setTimeout(() => {
    modal.style.opacity = "1";
  }, 10);
};

document.addEventListener("input", (e) => {
  if (e.target && e.target.id === "editModalInput") {
    const warning = document.getElementById("editCharWarning");
    const currentLength = e.target.value.length;

    if (currentLength >= 100) {
      e.target.style.borderColor = "#dc2626";
      e.target.style.boxShadow = "4px 4px 0 #dc2626";
      if (warning) warning.style.display = "block";
    } else {
      e.target.style.borderColor = "#000";
      e.target.style.boxShadow = "4px 4px 0 #000";
      if (warning) warning.style.display = "none";
    }
  }
});

document.addEventListener("click", (e) => {
  if (e.target.closest("#closeEditReviewModalBtn")) {
    const modal = document.getElementById("brutalistEditModal");
    modal.style.opacity = "0";
    setTimeout(() => {
      modal.classList.add("hidden");
    }, 300);
  }
});

document.addEventListener("click", async (e) => {
  const btnSave = e.target.closest("#btnSaveEditReview");
  if (btnSave) {
    const newText = document.getElementById("editModalInput").value.trim();

    if (!newText) {
      window.AppAlert.show("Oops!", "Teks gak boleh kosong.", "error");
      return;
    }

    if (newText.length > 100) {
      window.AppAlert.show(
        "Oops!",
        "Teks anda kepanjangan, potong dikit lah.",
        "error"
      );
      return;
    }

    btnSave.innerHTML = `<span style="font-size: 12px; font-weight: bold;">...</span>`;
    btnSave.disabled = true;

    try {
      if (isEditingReply) {
        await updateDoc(
          doc(db, "books", currentEditBookId, "reviews", currentEditReviewId),
          {
            replies: arrayRemove(currentEditReplyObj),
          }
        );

        const updatedReply = { ...currentEditReplyObj, text: newText };
        await updateDoc(
          doc(db, "books", currentEditBookId, "reviews", currentEditReviewId),
          {
            replies: arrayUnion(updatedReply),
          }
        );

        window.AppAlert.show(
          getTranslation("admin_success") || "Berhasil",
          "Balasan admin telah diperbarui.",
          "success"
        );
      } else {
        await updateDoc(
          doc(db, "books", currentEditBookId, "reviews", currentEditReviewId),
          {
            comment: newText,
            rating: currentEditRating,
          }
        );
        window.AppAlert.show(
          getTranslation("admin_success") || "Berhasil",
          "Ulasan mahasiswa telah diperbarui.",
          "success"
        );
      }

      const modal = document.getElementById("brutalistEditModal");
      modal.style.opacity = "0";
      setTimeout(() => {
        modal.classList.add("hidden");
      }, 300);
    } catch (error) {
      console.error(error);
      window.AppAlert.show("Gagal", "Terjadi kesalahan sistem.", "error");
    } finally {
      btnSave.innerHTML = checkSvg;
      btnSave.disabled = false;
    }
  }
});

function initRequestLogic() {
  const btnRequestToggle = document.getElementById("btnRequestToggle");
  const chartsContainer = document.getElementById("chartsContainer");
  const requestSection = document.getElementById("requestSection");
  const requestListContainer = document.getElementById("requestListContainer");

  let isRequestMode = false;

  const iconRequest = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" /></svg>`;
  const iconBack = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3" /></svg>`;
  const iconChevron = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" style="width: 14px; height: 14px;"><path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" /></svg>`;

  btnRequestToggle.addEventListener("click", () => {
    const sedangBuka = !requestSection.classList.contains("hidden");

    resetSemuaAdminUI();

    if (!sedangBuka) {
      requestSection.classList.remove("hidden");
      document.getElementById("adminSubtitle").textContent =
        "Pantau dan proses antrean peminjaman buku dari mahasiswa.";
      btnRequestToggle.querySelector(".icon-wrap").style.color = "#3b82f6";
      btnRequestToggle.querySelector(".icon-wrap").innerHTML = iconBack;
      btnRequestToggle.querySelector(".text-wrap").innerHTML = `
      <h4 style="font-size: 1rem; font-weight: 700; color: #1e40af; margin: 0;">${getTranslation("admin_back_stats") || "Kembali ke Statistik"}</h4>
      <p style="font-size: 0.75rem; color: #3b82f6; margin: 0;">Tutup daftar request</p>
    `;
      loadRequestData();
    } else {
      chartsContainer.classList.remove("hidden");
    }
  });

  async function loadRequestData() {
    requestListContainer.innerHTML = `<tr><td colspan="4" style="text-align: center; padding: 30px;"><div class="loader" style="margin: 0 auto;"></div></td></tr>`;

    try {
      const [userSnap, booksSnap] = await Promise.all([
        getDocs(collection(db, "users")),
        getDocs(collection(db, "books")),
      ]);

      const usersMap = {};
      userSnap.forEach((u) => {
        const d = u.data();
        let name = d.displayName;
        if (!name || name.trim() === "") name = d.email || "Mahasiswa";
        if (d.thekingoflibrary === true) {
          const adminSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" style="width: 14px; height: 14px; color: #eab308; margin-left: 4px; display: inline-block; vertical-align: middle;"><path fill-rule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.005Z" clip-rule="evenodd" /></svg>`;
          name = `<span style="display: inline-flex; align-items: center;">Developer ${adminSvg}</span>`;
        }
        usersMap[u.id] = name;
      });

      const booksMap = {};
      booksSnap.forEach((b) => {
        booksMap[b.id] = {
          title: b.data().title || "Buku Tidak Diketahui",
          cover: b.data().cover || "",
        };
      });

      const q = query(
        collection(db, "peminjaman"),
        orderBy("borrowDate", "desc")
      );

      onSnapshot(q, (snapshot) => {
        let htmlContent = "";

        const counts = [0, 0, 0, 0, 0, 0, 0];
        const now = new Date();
        now.setHours(0, 0, 0, 0);

        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          const docId = docSnap.id;
          const bookId = data.bookId;

          const userName = usersMap[data.userId] || "Mahasiswa";
          const bookDataInfo = booksMap[data.bookId] || {};
          const bookTitle =
            data.bookTitle || bookDataInfo.title || "Judul Misterius";
          const bookCover = data.bookCover || bookDataInfo.cover || "";

          const timestamp = data.createdAt || data.borrowDate;
          if (timestamp) {
            const date = timestamp.toDate();
            const compareDate = new Date(date);
            compareDate.setHours(0, 0, 0, 0);

            const diffInTime = now.getTime() - compareDate.getTime();
            const diffInDays = Math.round(diffInTime / (1000 * 60 * 60 * 24));

            if (diffInDays >= 0 && diffInDays < 7) {
              counts[6 - diffInDays]++;
            }
          }

          const coverHtml =
            bookCover && bookCover.startsWith("<svg")
              ? bookCover
              : `<img src="${
                  bookCover || "https://via.placeholder.com/40"
                }" style="width: 100%; height: 100%; object-fit: contain; border-radius: 4px;" />`;

          let dateStr = "Waktu Tidak Tercatat";
          let lateDays = 0;
          let denda = 0;

          if (data.createdAt || data.borrowDate) {
            const d = (data.createdAt || data.borrowDate).toDate();
            dateStr = `${d.getDate().toString().padStart(2, "0")}/${(
              d.getMonth() + 1
            )
              .toString()
              .padStart(2, "0")}/${d.getFullYear()} • ${d
              .getHours()
              .toString()
              .padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;

            const deadlineDate = new Date(d);
            deadlineDate.setDate(deadlineDate.getDate() + 7);

            const checkNow = new Date();

            if (
              data.status === "Sedang Dipinjam" ||
              data.status === "Request Pengembalian"
            ) {
              if (checkNow > deadlineDate) {
                const diffTime = Math.abs(checkNow - deadlineDate);
                lateDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                denda = lateDays * 1000;
              }
            }
          }

          let currentStatus = data.status || "Menunggu Pengambilan";
          let statusBg = "#f3f4f6",
            statusColor = "#4b5563",
            statusBorder = "#e5e7eb";
          let isReturned = false;

          if (currentStatus === "Sedang Dipinjam") {
            statusBg = "#eff6ff";
            statusColor = "#1e40af";
            statusBorder = "#bfdbfe";
          } else if (currentStatus === "Dikembalikan") {
            statusBg = "#f0fdf4";
            statusColor = "#166534";
            statusBorder = "#bbf7d0";
            isReturned = true;
          } else if (currentStatus === "Request Pengembalian") {
            statusBg = "#fffbeb";
            statusColor = "#d97706";
            statusBorder = "#fde68a";
          } else if (currentStatus === "Ditolak") {
            statusBg = "#fef2f2";
            statusColor = "#991b1b";
            statusBorder = "#fecaca";
            isReturned = true;
          }

          let menuOptions = "";

          if (currentStatus === "Menunggu Pengambilan") {
            menuOptions = `
              <div class="status-option" data-id="${docId}" data-book="${bookId}" data-val="Sedang Dipinjam" data-denda="0" style="padding: 12px 14px; cursor: pointer; color: #1e40af; font-weight: 600; font-size: 0.85rem; border-bottom: 1px solid #f3f4f6;" onmouseover="this.style.background='#eff6ff'" onmouseout="this.style.background='transparent'">Konfirmasi</div>
              <div class="status-option" data-id="${docId}" data-book="${bookId}" data-val="Ditolak" data-denda="0" style="padding: 12px 14px; cursor: pointer; color: #dc2626; font-weight: 600; font-size: 0.85rem;" onmouseover="this.style.background='#fef2f2'" onmouseout="this.style.background='transparent'">${getTranslation("admin_btn_reject") || "Tolak"}</div>
            `;
          } else if (currentStatus === "Request Pengembalian") {
            if (lateDays > 0) {
              menuOptions = `
                <div class="status-option" data-id="${docId}" data-book="${bookId}" data-val="Dikembalikan" data-denda="${denda}" style="padding: 12px 14px; cursor: pointer; color: #dc2626; font-weight: 800; font-size: 0.85rem; border-bottom: 1px solid #f3f4f6;" onmouseover="this.style.background='#fef2f2'" onmouseout="this.style.background='transparent'">Terima Denda & Selesai</div>
                <div class="status-option" data-id="${docId}" data-book="${bookId}" data-val="Sedang Dipinjam" data-denda="0" style="padding: 12px 14px; cursor: pointer; color: #9a3412; font-weight: 600; font-size: 0.85rem;" onmouseover="this.style.background='#fff7ed'" onmouseout="this.style.background='transparent'">Tolak Pengembalian</div>
              `;
            } else {
              menuOptions = `
                <div class="status-option" data-id="${docId}" data-book="${bookId}" data-val="Dikembalikan" data-denda="0" style="padding: 12px 14px; cursor: pointer; color: #166534; font-weight: 600; font-size: 0.85rem; border-bottom: 1px solid #f3f4f6;" onmouseover="this.style.background='#f0fdf4'" onmouseout="this.style.background='transparent'">Setujui (Selesai)</div>
                <div class="status-option" data-id="${docId}" data-book="${bookId}" data-val="Sedang Dipinjam" data-denda="0" style="padding: 12px 14px; cursor: pointer; color: #9a3412; font-weight: 600; font-size: 0.85rem;" onmouseover="this.style.background='#fff7ed'" onmouseout="this.style.background='transparent'">Tolak Pengembalian</div>
              `;
            }
          } else if (currentStatus === "Sedang Dipinjam") {
            if (lateDays > 0) {
              menuOptions = `
                <div class="status-option" data-id="${docId}" data-book="${bookId}" data-val="Dikembalikan" data-denda="${denda}" style="padding: 12px 14px; cursor: pointer; color: #dc2626; font-weight: 800; font-size: 0.85rem;" onmouseover="this.style.background='#fef2f2'" onmouseout="this.style.background='transparent'">Terima Denda & Selesai</div>
              `;
            } else {
              menuOptions = `
                <div class="status-option" data-id="${docId}" data-book="${bookId}" data-val="Dikembalikan" data-denda="0" style="padding: 12px 14px; cursor: pointer; color: #166534; font-weight: 600; font-size: 0.85rem;" onmouseover="this.style.background='#f0fdf4'" onmouseout="this.style.background='transparent'">Dikembalikan (Selesai)</div>
              `;
            }
          }

          let dendaBadgeHtml = "";
          if (data.dendaDibayar) {
            dendaBadgeHtml = `<div style="display: block; width: fit-content; margin-top: 6px; color: #166534; font-weight: 700; font-size: 0.75rem; background: #dcfce7; padding: 4px 8px; border-radius: 6px;"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" style="width: 14px; height: 14px; display: inline-block; vertical-align: text-bottom; margin-right: 4px;"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>Denda Lunas: Rp ${data.dendaDibayar.toLocaleString(
              "id-ID"
            )}</div>`;
          } else if (lateDays > 0) {
            dendaBadgeHtml = `<div style="display: block; width: fit-content; margin-top: 6px; color: #dc2626; font-weight: 700; font-size: 0.75rem; background: #fef2f2; padding: 4px 8px; border-radius: 6px;"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" style="width: 14px; height: 14px; display: inline-block; vertical-align: text-bottom; margin-right: 4px;"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>Telat ${lateDays} Hari • Rp ${denda.toLocaleString(
              "id-ID"
            )}</div>`;
          }

          htmlContent += `
            <tr style="border-bottom: 1px solid #e5e7eb; transition: background 0.2s ease;" onmouseover="this.style.background='#f9fafb'" onmouseout="this.style.background='transparent'">
              <td style="padding: 16px 24px; min-width: 250px; white-space: normal;">
                <div style="display: flex; align-items: center; gap: 12px;">
                  <div style="width: 35px; height: 50px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; overflow: hidden;">
                    ${coverHtml}
                  </div>
                  <span style="font-weight: 600; color: #111827; font-size: 0.85rem; line-height: 1.4;">
                    ${bookTitle}
                  </span>
                </div>
              </td>
              <td style="padding: 16px 24px; white-space: nowrap;">
                <div style="display: flex; align-items: center; gap: 8px; color: #4b5563; font-weight: 500;">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="width: 16px; height: 16px; color: #9ca3af;">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                  </svg>
                  ${userName}
                </div>
              </td>
              <td style="padding: 16px 24px; color: #6b7280; font-size: 0.85rem; white-space: nowrap;">
                ${dateStr}
                ${dendaBadgeHtml}
              </td>
              <td style="padding: 16px 24px; position: relative; white-space: nowrap; text-align: center;">
                <button ${
                  isReturned ? "disabled" : `class="custom-status-btn"`
                } data-id="${docId}" style="width: fit-content; min-width: 160px; margin: 0 auto; display: inline-flex; justify-content: ${
            isReturned ? "center" : "space-between"
          }; align-items: center; gap: 10px; padding: 10px 16px; background: ${statusBg}; color: ${statusColor}; border: 1px solid ${statusBorder}; border-radius: 8px; font-weight: 600; ${
            isReturned
              ? "cursor: not-allowed; opacity: 0.8;"
              : "cursor: pointer;"
          } transition: 0.3s; font-family: inherit;">
                   <span id="status-text-${docId}">${currentStatus}</span>
                   ${isReturned ? "" : iconChevron}
                </button>

                ${
                  !isReturned
                    ? `<div id="status-menu-${docId}" class="custom-status-menu hidden" style="position: absolute; top: calc(100% - 10px); left: 50%; transform: translateX(-50%); background: white; border: 1px solid #e5e7eb; border-radius: 8px; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.2); z-index: 9989; overflow: hidden; min-width: 220px; text-align: left;">${menuOptions}</div>`
                    : ""
                }
              </td>
            </tr>
          `;
        });

        if (htmlContent === "") {
          requestListContainer.innerHTML = `<tr><td colspan="4" style="text-align: center; padding: 30px; color: #6b7280; font-weight: 500;">Belum ada request peminjaman.</td></tr>`;
        } else {
          requestListContainer.innerHTML = htmlContent;
          attachStatusListeners();
        }

        const ctx = document.getElementById("chartPeminjaman");
        if (ctx) {
          if (window.peminjamanChartInstance) {
            window.peminjamanChartInstance.destroy();
          }

          window.peminjamanChartInstance = new Chart(ctx, {
            type: "line",
            data: {
              labels: getLast7DaysLabels(),
              datasets: [
                {
                  data: counts,
                  borderColor: "#8b5cf6",
                  tension: 0.4,
                  fill: true,
                  backgroundColor: "rgba(139, 92, 246, 0.1)",
                },
              ],
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { display: false } },
              scales: {
                y: { beginAtZero: true, grid: { display: false } },
                x: { grid: { display: false } },
              },
            },
          });

          ctx.style.cursor = "pointer";
          ctx.onclick = () => {
            openModal({
              title: getTranslation("admin_chart_traffic") || "Detail Trafik Peminjaman",
              color: "#8b5cf6",
              snap: snapshot,
            });
          };
        }
      });
    } catch (error) {
      console.error("Gagal load request:", error);
    }
  }

  function attachStatusListeners() {
    const triggerBtns = document.querySelectorAll(".custom-status-btn");
    triggerBtns.forEach((btn) => {
      btn.onclick = (e) => {
        e.stopPropagation();
        const docId = btn.getAttribute("data-id");
        const targetMenu = document.getElementById(`status-menu-${docId}`);
        document.querySelectorAll(".custom-status-menu").forEach((menu) => {
          if (menu !== targetMenu) menu.classList.add("hidden");
        });
        if (targetMenu) targetMenu.classList.toggle("hidden");
      };
    });

    const options = document.querySelectorAll(".status-option");
    options.forEach((opt) => {
      opt.onclick = async (e) => {
        e.stopPropagation();
        const docId = opt.getAttribute("data-id");
        const newVal = opt.getAttribute("data-val");
        const bookId = opt.getAttribute("data-book");

        const dendaVal = parseInt(opt.getAttribute("data-denda")) || 0;

        const currentStatusText = document.getElementById(
          `status-text-${docId}`
        ).textContent;

        try {
          const updateData = { status: newVal };

          if (newVal === "Dikembalikan" && dendaVal > 0) {
            updateData.dendaDibayar = dendaVal;
          }

          await updateDoc(doc(db, "peminjaman", docId), updateData);

          if (
            currentStatusText === "Menunggu Pengambilan" &&
            newVal === "Ditolak"
          ) {
            await updateBookStock(bookId, 1);
            window.AppAlert?.show(
              "Pinjaman Ditolak",
              "Status pinjaman dibatalkan dan stok buku telah dikembalikan.",
              "info"
            );
          } else if (newVal === "Dikembalikan") {
            await updateBookStock(bookId, 1);

            if (dendaVal > 0) {
              window.AppAlert?.show(
                "Denda Lunas!",
                `Buku telah diterima dan Denda sebesar Rp ${dendaVal.toLocaleString(
                  "id-ID"
                )} sukses masuk kas negara.`,
                "success"
              );
            } else {
              window.AppAlert?.show(
                getTranslation("admin_success") || "Berhasil",
                "Buku telah diterima kembali dan stok bertambah.",
                "success"
              );
            }
          } else if (
            currentStatusText === "Request Pengembalian" &&
            newVal === "Sedang Dipinjam"
          ) {
            window.AppAlert?.show(
              "Dibatalkan",
              "Dikembalikan ke status 'Sedang Dipinjam'. Pastikan fisik buku sudah anda terima sbelum approve.",
              "warning"
            );
          }
        } catch (error) {
          console.error("Gagal update status:", error);
          window.AppAlert.show(
            "Gagal",
            "Terjadi kesalahan sistem saat memperbarui status.",
            "error"
          );
        }
      };
    });

    document.onclick = () => {
      document
        .querySelectorAll(".custom-status-menu")
        .forEach((menu) => menu.classList.add("hidden"));
    };
  }
}

function createCharts(labels, booksData, usersData, historyData) {
  const chartOptions = {
    responsive: true,
    plugins: { legend: { display: false } },
    scales: {
      y: { beginAtZero: true, grid: { display: false } },
      x: { grid: { display: false } },
    },
  };

  new Chart(document.getElementById("chartBooks"), {
    type: "line",
    data: {
      labels: labels,
      datasets: [
        {
          data: booksData,
          borderColor: "#3b82f6",
          tension: 0.4,
          fill: true,
          backgroundColor: "rgba(59, 130, 246, 0.1)",
        },
      ],
    },
    options: chartOptions,
  });

  new Chart(document.getElementById("chartUsers"), {
    type: "bar",
    data: {
      labels: labels,
      datasets: [
        { data: usersData, backgroundColor: "#22c55e", borderRadius: 5 },
      ],
    },
    options: chartOptions,
  });

  new Chart(document.getElementById("chartActivity"), {
    type: "line",
    data: {
      labels: labels,
      datasets: [
        {
          data: historyData,
          borderColor: "#f97316",
          tension: 0.4,
          fill: true,
          backgroundColor: "rgba(249, 115, 22, 0.1)",
        },
      ],
    },
    options: chartOptions,
  });
}
