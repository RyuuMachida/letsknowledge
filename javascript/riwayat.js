import { auth } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { getUserHistory, getAllBooks, deleteHistory } from "./db-logic.js";
import { initFloatingNav } from "./floating-nav.js";
import { showLoadingAndExecute } from "./utils.js";
import { getTranslation } from "./i18n.js";

const historyList = document.getElementById("historyList");

window.isSelectMode = false;
window.selectedHistoryIds = new Set();
window.justLongPressed = false;
let pressTimer;

const icons = {
  LOGIN: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="icon-sm"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m-1.5-6-3 3m0 0 3 3m-3-3H21" /></svg>`,
  INFO: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="icon-sm"><path stroke-linecap="round" stroke-linejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" /></svg>`,
  BORROW: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="icon-sm"><path stroke-linecap="round" stroke-linejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z" /></svg>`,
  READ: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="icon-sm"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" /></svg>`,
};

async function reloadHistory() {
  if (auth.currentUser) {
    const [logs, books] = await Promise.all([
      getUserHistory(auth.currentUser.uid),
      getAllBooks(),
    ]);
    renderHistoryGrouped(logs, books);
  }
}

onAuthStateChanged(auth, (user) => {
  if (user) {
    showLoadingAndExecute(async () => {
      await reloadHistory();
    }, 2000);
  } else {
    window.location.href = "home.html";
  }
});

function renderHistoryGrouped(logs, books) {
  if (logs.length === 0) {
    historyList.innerHTML = `
      <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 60px 20px; background-color: #ffffff; border: 1.5px dashed #ced1d6; border-radius: 16px; margin-top: 20px; text-align: center;">
        <svg xmlns="http://www.w3.org/2000/svg" fill="#9ca3af" viewBox="0 0 24 24" style="width: 80px; height: 80px; margin-bottom: 20px;">
          <g><path d="M12 5c3.859.001 7 3.142 7 7.001 0 3.858-3.141 6.998-7 6.999-3.859 0-7-3.14-7-6.999s3.141-7 7-7.001m0-2c-4.971.001-9 4.03-9 9.001 0 4.97 4.029 8.999 9 8.999 4.97-.001 9-4.03 9-8.999 0-4.971-4.029-9-9-9.001zM16.182 7.819c-.129-.128-.315-.178-.491-.127l-5.951 1.706c-.166.048-.295.177-.342.343l-1.707 5.951c-.051.175-.002.363.127.491.095.095.223.146.354.146l.138-.02 5.95-1.708c.165-.047.295-.177.342-.343l1.707-5.949c.05-.173.002-.361-.127-.49zm-7.282 7.282l1.383-4.817 3.434 3.435-4.817 1.382z"/></g>
        </svg>
        <h3 style="font-size: 1.25rem; font-weight: 700; color: #111827; margin-bottom: 8px; letter-spacing: -0.5px;">${getTranslation("history_empty_title") || "Jejak Eksplorasi Kosong"}</h3>
        <p style="color: #6b7280; font-size: 0.95rem; max-width: 380px; margin-bottom: 28px; line-height: 1.6;">${getTranslation("history_empty_desc") || "Belum ada aktivitas yang tercatat. Mulai jelajahi koleksi buku kami dan temukan wawasan baru untuk mengisi riwayatmu."}</p>
        <button class="btn-primary" onclick="window.location.href='perpus.html'" style="padding: 12px 24px; font-size: 0.95rem; border-radius: 8px;">${getTranslation("history_empty_btn") || "Mulai Eksplorasi"}</button>
      </div>
    `;
    return;
  }

  let htmlContent = `
    <style>
      .select-mode-active .delete-history-btn { display: none !important; }
      .select-mode-active .group-delete-container { display: flex !important; }
      .history-item { transition: background-color 0.2s, border 0.2s; border: 1px solid transparent; border-radius: 8px; padding: 8px; margin-bottom: 4px; }
      .history-item.selected-card { background-color: #eff6ff !important; border: 1px solid #93c5fd; }

      .group-select-all-btn { display: none !important; background: transparent; border: none; padding: 4px; cursor: pointer; color: #9ca3af; align-items: center; margin-right: 8px; transition: color 0.2s; border-radius: 4px; }
      .select-mode-active .group-select-all-btn { display: flex !important; }
      .group-select-all-btn:hover { color: #3b82f6; }
      .group-select-all-btn.all-selected { color: #dc2626 !important; }
    </style>
  `;

  const todayStr = new Date().toLocaleDateString("id-ID", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const groupedArray = [];
  let currentGroup = null;

  logs.forEach((log) => {
    const dateObj = log.timestamp?.toDate() || new Date();
    const dateStr = dateObj.toLocaleDateString("id-ID", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    const timeStr = dateObj.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    });

    if (!currentGroup || currentGroup.date !== dateStr) {
      currentGroup = { date: dateStr, items: [] };
      groupedArray.push(currentGroup);
    }
    currentGroup.items.push({ ...log, timeStr, isClickable: !!log.bookId });
  });

  groupedArray.forEach((group) => {
    const isToday = group.date === todayStr;
    const containerDisplay = isToday ? "flex" : "none";
    const arrowRotation = isToday ? "rotate(180deg)" : "rotate(0deg)";

    const svgArrow = `<svg class="toggle-arrow" style="transform: ${arrowRotation}; transition: transform 0.3s ease; width: 20px; height: 20px; color: #6b7280;" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" /></svg>`;

    const svgChecklist = `
      <button class="group-select-all-btn" onclick="toggleGroupSelection(event, this)" title="Pilih Semua di Tanggal Ini">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" style="width: 20px; height: 20px;">
          <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
        </svg>
      </button>
    `;

    htmlContent += `
      <div class="history-group" style="margin-bottom: 25px;">
        <div class="history-header" style="display: flex; align-items: center; cursor: pointer; margin-bottom: 15px;" onclick="toggleHistoryGroup(this)">
          <span style="font-weight: 600; font-size: 0.95rem; color: #111827; white-space: nowrap;">${group.date}</span>
          <div style="flex-grow: 1; height: 1px; background-color: #e5e7eb; margin: 0 15px;"></div>
          ${svgChecklist}
          ${svgArrow}
        </div>
        <div class="history-items-container" style="display: ${containerDisplay}; flex-direction: column; gap: 8px;">
    `;



    group.items.forEach((item) => {
      let thumbnailHTML = "";
      if (item.bookId) {
        const bookData = books.find((b) => b.id === item.bookId);
        const bookCover =
          bookData?.cover ||
          bookData?.coverData ||
          bookData?.image ||
          bookData?.coverUrl;
        if (bookData && bookCover) {
          if (
            typeof bookCover === "string" &&
            bookCover.trim().startsWith("<svg")
          ) {
            thumbnailHTML = `<div class="history-thumbnail">${bookCover}</div>`;
          } else {
            thumbnailHTML = `<div class="history-thumbnail"><img src="${bookCover}" alt="Cover Buku" style="width: 100%; height: 100%; object-fit: contain; padding: 4px;" /></div>`;
          }
        }
      }

      const deleteBtnHTML = `
        <button class="delete-history-btn" onclick="handleDeleteSingle('${item.id}', event)" title="${getTranslation('history_del_btn') || 'Hapus Riwayat'}" style="background: transparent; border: none; padding: 0 5px 0 15px; cursor: pointer; color: #9ca3af; margin-left: auto; display: flex; align-items: center; justify-content: center; z-index: 2;">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" style="width: 20px; height: 20px;" onmouseover="this.style.color='#dc2626'" onmouseout="this.style.color='#9ca3af'">
            <path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
          </svg>
        </button>
      `;

      const hoverClass = item.isClickable ? "clickable-card" : "";
      const bookIdParam = item.bookId ? `'${item.bookId}'` : "null";

      htmlContent += `
        <div class="history-item ${hoverClass}" id="card-${item.id}"
             onmousedown="startLongPress(event, '${item.id}')" 
             onmouseup="cancelLongPress()" 
             onmouseleave="cancelLongPress()" 
             ontouchstart="startLongPress(event, '${item.id}')" 
             ontouchend="cancelLongPress()"
             ontouchmove="cancelLongPress()" onclick="handleCardClick(event, '${
               item.id
             }', ${bookIdParam})"
             style="display: flex; justify-content: space-between; align-items: center; position: relative; cursor: pointer;">
             
          <div style="display: flex; align-items: center; gap: 15px; flex-grow: 1; pointer-events: none;">
            <div class="history-icon">${icons[item.action] || icons.INFO}</div>
            <div class="history-text">
              <p class="history-detail" style="margin:0; font-size:0.95rem; color:#111827;">${
                item.detail
              }</p>
              <span class="history-time" style="font-size:0.8rem; color:#6b7280;">${
                item.timeStr
              }</span>
            </div>
          </div>
          <div style="pointer-events: none;">${thumbnailHTML}</div>
          ${deleteBtnHTML}
        </div>
      `;
    });

    htmlContent += `</div></div>`;
  });

  htmlContent += `
    <div id="dynamicIslandDelete" style="
      position: fixed; 
      top: 95px;
      left: 50%; 
      transform: translate(-50%, -20px);
      background: rgba(255, 255, 255, 0.95); 
      backdrop-filter: blur(10px); 
      border: 1px solid #e5e7eb;
      padding: 8px 16px;
      border-radius: 30px; 
      display: flex; 
      align-items: center; 
      gap: 15px;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05); 
      z-index: 9999; 
      opacity: 0; 
      transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      pointer-events: none;
    ">
      
      <button onclick="cancelSelectMode(event)" title="${getTranslation('history_cancel_btn') || 'Batal'}" style="background: #f3f4f6; border: none; padding: 6px; border-radius: 50%; cursor: pointer; color: #6b7280; display: flex; align-items: center; transition: all 0.2s;" onmouseover="this.style.background='#e5e7eb'; this.style.color='#111827'" onmouseout="this.style.background='#f3f4f6'; this.style.color='#6b7280'">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" style="width: 16px; height: 16px;">
          <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
        </svg>
      </button>
      
      <div style="color: #111827; font-weight: 700; font-size: 0.85rem; display: flex; align-items: center; gap: 8px;">
        <span class="select-count-text" style="background: #dc2626; color: white; border-radius: 50%; width: 20px; height: 20px; display: inline-flex; align-items: center; justify-content: center; font-size: 0.75rem; font-weight: 800;">0</span>
        ${getTranslation('history_selected') || 'Terpilih'}
      </div>

      <button onclick="handleDeleteSelected(event)" style="background: #fef2f2; border: none; padding: 6px 14px; border-radius: 20px; cursor: pointer; color: #dc2626; font-weight: 700; font-size: 0.85rem; display: flex; align-items: center; gap: 4px; transition: background 0.2s;" onmouseover="this.style.background='#fee2e2'" onmouseout="this.style.background='#fef2f2'">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" style="width: 16px; height: 16px;">
          <path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
        </svg>
        ${getTranslation('history_del_btn') || 'Hapus'}
      </button>
      
    </div>
  `;

  historyList.innerHTML = htmlContent;

  window.isSelectMode = false;
  window.selectedHistoryIds.clear();
  historyList.classList.remove("select-mode-active");
}

window.toggleHistoryGroup = function (headerElement) {
  const container = headerElement.nextElementSibling;
  const arrow = headerElement.querySelector(".toggle-arrow");

  if (container.style.display === "none") {
    container.style.display = "flex";
    arrow.style.transform = "rotate(180deg)";
  } else {
    container.style.display = "none";
    arrow.style.transform = "rotate(0deg)";
  }
};

window.updateSelectCountDisplay = function () {
  const count = window.selectedHistoryIds.size;
  const countTexts = document.querySelectorAll(".select-count-text");
  countTexts.forEach((el) => {
    el.textContent = `${count}`;
  });

  const dynamicIsland = document.getElementById("dynamicIslandDelete");
  if (dynamicIsland) {
    if (count > 0 && window.isSelectMode) {
      dynamicIsland.style.transform = "translate(-50%, 0)";
      dynamicIsland.style.opacity = "1";
      dynamicIsland.style.pointerEvents = "auto";
    } else {
      dynamicIsland.style.transform = "translate(-50%, -20px)";
      dynamicIsland.style.opacity = "0";
      dynamicIsland.style.pointerEvents = "none";
    }
  }
};

function activateSelectMode(firstDocId) {
  window.isSelectMode = true;
  window.selectedHistoryIds.add(firstDocId);
  document.getElementById("historyList").classList.add("select-mode-active");

  const cardElement = document.getElementById("card-" + firstDocId);
  if (cardElement) {
    cardElement.classList.add("selected-card");
    const container = cardElement.closest(".history-items-container");
    if (container) window.checkGroupSelectionState(container);
  }
  updateSelectCountDisplay();
  if (navigator.vibrate) navigator.vibrate(50);
}

window.cancelSelectMode = function (event) {
  if (event) event.stopPropagation();
  window.isSelectMode = false;
  window.selectedHistoryIds.clear();
  document.getElementById("historyList").classList.remove("select-mode-active");

  const selectedCards = document.querySelectorAll(".selected-card");
  selectedCards.forEach((card) => card.classList.remove("selected-card"));

  document
    .querySelectorAll(".group-select-all-btn")
    .forEach((btn) => btn.classList.remove("all-selected"));

  updateSelectCountDisplay();
};

window.startLongPress = function (e, docId) {
  if (window.isSelectMode || e.target.closest(".delete-history-btn")) return;

  window.justLongPressed = false;

  pressTimer = setTimeout(() => {
    window.justLongPressed = true;
    activateSelectMode(docId);
  }, 500);
};

window.cancelLongPress = function () {
  clearTimeout(pressTimer);
};

window.handleCardClick = function (e, docId, bookId) {
  if (e.target.closest(".delete-history-btn")) return;
  if (window.justLongPressed) {
    window.justLongPressed = false;
    return;
  }

  if (window.isSelectMode) {
    const card = e.currentTarget || document.getElementById("card-" + docId);
    if (window.selectedHistoryIds.has(docId)) {
      window.selectedHistoryIds.delete(docId);
      card.classList.remove("selected-card");
      if (window.selectedHistoryIds.size === 0) {
        cancelSelectMode();
      } else {
        updateSelectCountDisplay();
      }
    } else {
      window.selectedHistoryIds.add(docId);
      card.classList.add("selected-card");
      updateSelectCountDisplay();
    }

    const container = card.closest(".history-items-container");
    if (container) window.checkGroupSelectionState(container);
  } else {
    if (bookId && bookId !== "null")
      window.location.href = "home.html?openBook=" + bookId;
  }
};

window.handleDeleteSingle = async function (docId, event) {
  event.stopPropagation();
  const confirmDelete = await window.AppAlert.confirm(
    getTranslation("history_del_confirm_title") || "Hapus Riwayat?",
    getTranslation("history_del_confirm_desc") || "Yakin ingin menghapus catatan aktivitas ini?"
  );
  if (confirmDelete) {
    showLoadingAndExecute(async () => {
      try {
        await deleteHistory(docId);
        await reloadHistory();
      } catch (error) {
        window.AppAlert.show(getTranslation("history_fail_title") || "Gagal", getTranslation("history_fail_desc") || "Gagal menghapus riwayat.", "error");
      }
    }, 1000);
  }
};

window.handleDeleteSelected = async function (event) {
  event.stopPropagation();
  if (window.selectedHistoryIds.size === 0) return;

  const count = window.selectedHistoryIds.size;
  const confirmDelete = await window.AppAlert.confirm(
    (getTranslation("history_del_multi_title") || "Hapus {count} Riwayat?").replace('{count}', count),
    (getTranslation("history_del_multi_desc") || "Yakin ingin menghapus {count} aktivitas yang ditandai?").replace('{count}', count)
  );

  if (confirmDelete) {
    showLoadingAndExecute(async () => {
      try {
        const deletePromises = Array.from(window.selectedHistoryIds).map((id) =>
          deleteHistory(id)
        );
        await Promise.all(deletePromises);

        await reloadHistory();
        window.AppAlert.show(
          getTranslation("history_success_title") || "Terhapus!",
          (getTranslation("history_success_desc") || "{count} riwayat berhasil dibersihkan.").replace('{count}', count),
          "success"
        );
      } catch (error) {
        window.AppAlert.show(
          getTranslation("history_fail_title") || "Gagal",
          getTranslation("history_fail_multi_desc") || "Gagal menghapus beberapa riwayat.",
          "error"
        );
      }
    }, 1500);
  }
};

window.toggleGroupSelection = function (event, btn) {
  event.stopPropagation();
  const header = btn.closest(".history-header");
  const container = header.nextElementSibling;
  const cards = container.querySelectorAll(".history-item");

  if (cards.length === 0) return;

  let allSelected = true;
  const itemsToToggle = [];

  cards.forEach((card) => {
    const docId = card.id.replace("card-", "");
    itemsToToggle.push({ docId, card });
    if (!window.selectedHistoryIds.has(docId)) {
      allSelected = false;
    }
  });

  if (allSelected) {
    itemsToToggle.forEach((item) => {
      window.selectedHistoryIds.delete(item.docId);
      item.card.classList.remove("selected-card");
    });
  } else {
    itemsToToggle.forEach((item) => {
      window.selectedHistoryIds.add(item.docId);
      item.card.classList.add("selected-card");
    });
  }

  window.checkGroupSelectionState(container);

  if (window.selectedHistoryIds.size === 0) {
    cancelSelectMode();
  } else {
    updateSelectCountDisplay();
  }

  if (navigator.vibrate) navigator.vibrate(30);
};

window.checkGroupSelectionState = function (container) {
  const btnSelectAll = container.previousElementSibling.querySelector(
    ".group-select-all-btn"
  );
  if (!btnSelectAll) return;

  const cards = container.querySelectorAll(".history-item");
  if (cards.length === 0) return;

  let allSelected = true;
  cards.forEach((c) => {
    if (!c.classList.contains("selected-card")) {
      allSelected = false;
    }
  });

  if (allSelected) {
    btnSelectAll.classList.add("all-selected");
  } else {
    btnSelectAll.classList.remove("all-selected");
  }
};

initFloatingNav();
