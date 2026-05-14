import { auth } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import {
  getBorrowings,
  updateBorrowStatus,
  addHistory,
  deleteBorrowing,
  updateBookStock,
} from "./db-logic.js";
import { initFloatingNav } from "./floating-nav.js";
import { showLoadingAndExecute } from "./utils.js";
import { getTranslation } from "./i18n.js";

const tableBody = document.getElementById("borrowTableBody");
const emptyStateContainer = document.getElementById("emptyStateContainer");

onAuthStateChanged(auth, (user) => {
  if (user) {
    loadBorrowingData(user.uid);
  } else {
    window.location.href = "home.html";
  }
});

async function loadBorrowingData(uid) {
  showLoadingAndExecute(async () => {
    try {
      const borrowings = await getBorrowings(uid);
      renderBorrowTable(borrowings);
    } catch (error) {
      tableBody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:red; padding: 20px;">${getTranslation("fetch_error") || "Gagal memuat data."}</td></tr>`;
    }
  }, 1500);
}

function renderBorrowTable(borrowings) {
  if (borrowings.length === 0) {
    tableBody.innerHTML = "";
    emptyStateContainer.innerHTML = `<p style="text-align:center; color:gray; padding: 40px;">${getTranslation("borrow_empty_desc") || "Belum ada data peminjaman."}</p>`;
    return;
  }

  emptyStateContainer.innerHTML = "";
  tableBody.innerHTML = borrowings
    .map((item, index) => {
      const d = item.borrowDate?.toDate();
      const borrowDate = d ? d.toLocaleDateString("id-ID") : "-";

      let lateDays = 0;
      let denda = 0;
      let dendaBadgeHtml = "";

      if (
        d &&
        (item.status === "Sedang Dipinjam" ||
          item.status === "Request Pengembalian")
      ) {
        const deadlineDate = new Date(d);
        deadlineDate.setDate(deadlineDate.getDate() + 7);

        const now = new Date();
        // now.setDate(now.getDate() + 10); // hapus ini

        if (now > deadlineDate) {
          const diffTime = Math.abs(now - deadlineDate);
          lateDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          denda = lateDays * 1000;

          dendaBadgeHtml = `
            <br>
            <div style="margin-top: 6px; background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; font-size: 0.7rem; font-weight: 700; padding: 4px 8px; border-radius: 6px; display: inline-block;">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" style="width: 12px; height: 12px; display: inline-block; vertical-align: text-bottom; margin-right: 2px;">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              ${getTranslation("borrow_fine") || "Denda: Rp "} ${denda.toLocaleString("id-ID")}
            </div>`;
        }
      }

      if (item.dendaDibayar) {
        dendaBadgeHtml = `
           <br>
           <div style="margin-top: 6px; background: #dcfce7; color: #166534; border: 1px solid #bbf7d0; font-size: 0.7rem; font-weight: 700; padding: 4px 8px; border-radius: 6px; display: inline-block;">
             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" style="width: 12px; height: 12px; display: inline-block; vertical-align: text-bottom; margin-right: 2px;">
               <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
             </svg>
             ${getTranslation("borrow_paid") || "Lunas: Rp "} ${item.dendaDibayar.toLocaleString("id-ID")}
           </div>`;
      }

      let badgeClass = "badge-neutral";
      if (item.status === "Menunggu Pengambilan") badgeClass = "badge-warning";
      if (item.status === "Sedang Dipinjam") badgeClass = "badge-success";
      if (item.status === "Request Pengembalian") badgeClass = "badge-warning";
      if (item.status === "Selesai" || item.status === "Dikembalikan")
        badgeClass = "badge-neutral";

      const isReturned =
        item.status === "Selesai" || item.status === "Dikembalikan";

      let deadlineStyle = "";
      if (isReturned) {
        deadlineStyle = "color: #9ca3af; text-decoration: line-through;";
      } else {
        deadlineStyle = "color: #dc2626; font-weight: 600;";
      }

      let actionButton = "";

      if (isReturned) {
        actionButton = `
        <button onclick="handleDeleteBorrowing('${item.id}', '${item.title}')" title="${getTranslation('history_del_btn') || 'Hapus Riwayat'}" style="background: transparent; border: none; padding: 5px; cursor: pointer; color: #dc2626; display: flex; align-items: center; justify-content: center; transition: transform 0.2s;">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" style="width: 22px; height: 22px;">
            <path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
          </svg>
        </button> 
      `;
      } else if (item.status === "Request Pengembalian") {
        actionButton = `
        <button disabled title="${getTranslation('borrow_wait_admin') || 'Menunggu Konfirmasi Admin'}" style="background: transparent; border: none; padding: 5px; cursor: not-allowed; color: #d97706; display: flex; align-items: center; justify-content: center;">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" style="width: 22px; height: 22px;">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
          </svg>
        </button>
      `;
      } else if (item.status === "Sedang Dipinjam") {
        actionButton = `
        <button onclick="handleRequestReturn('${item.id}', '${item.title}', ${lateDays}, ${denda})" title="${getTranslation('borrow_req_return') || 'Request Pengembalian Buku'}" style="background: transparent; border: none; padding: 5px; cursor: pointer; color: #111827; display: flex; align-items: center; justify-content: center; transition: transform 0.2s;">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" style="width: 22px; height: 22px;">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3" />
          </svg>
        </button>
      `;
      } else if (item.status === "Menunggu Diambil") {
        actionButton = `
        <button disabled title="${getTranslation('borrow_not_taken') || 'Buku Belum Diambil dari Perpus'}" style="background: transparent; border: none; padding: 5px; cursor: not-allowed; color: #9ca3af; display: flex; align-items: center; justify-content: center;">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" style="width: 22px; height: 22px;">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
          </svg>
        </button>
        `;
      }

      return `
      <tr>
        <td style="white-space: nowrap;">${index + 1}</td>
        <td style="min-width: 220px;">
          <div style="display: flex; align-items: center; gap: 10px;">
            <div class="table-thumb">${
              item.cover.startsWith("<svg")
                ? item.cover
                : `<img src="${item.cover}" style="width: 100%; height: 100%; object-fit: contain;" />`
            }</div>
            <span style="font-weight: 600; white-space: normal;">${
              item.title
            }</span>
          </div>
        </td>
        <td style="white-space: nowrap;">${borrowDate}</td>
        <td style="line-height: 1.4; white-space: nowrap;">
          <span style="${deadlineStyle}">${
        item.deadline
      }</span>${dendaBadgeHtml}
        </td>
        <td style="white-space: nowrap;">
          <span class="${badgeClass} table-badge">${item.status}</span>
        </td>
        <td style="white-space: nowrap;">${actionButton}</td>
      </tr>
    `;
    })
    .join("");
}

window.handleRequestReturn = async function (
  docId,
  bookTitle,
  lateDays = 0,
  denda = 0
) {
  let titleAlert = getTranslation("borrow_req_return_title") || "Request Pengembalian?";
  let textAlert = (getTranslation("borrow_req_return_desc") || `Ajukan request pengembalian untuk buku "<strong>{book}</strong>"?`).replace("{book}", bookTitle);

  if (lateDays > 0) {
    titleAlert = getTranslation("borrow_fine_warn") || "Peringatan Denda!";

    const badgeHtml = `
      <div style="margin: 15px 0; display: flex; justify-content: center;">
        <div style="display: inline-flex; align-items: center; gap: 6px; background: #fef2f2; border: 1px solid #fca5a5; color: #dc2626; padding: 6px 16px; border-radius: 50px; font-weight: 800; font-size: 1rem;">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" style="width: 18px; height: 18px;">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          ${getTranslation("borrow_price") || "Seharga: Rp "} ${denda.toLocaleString("id-ID")}
        </div>
      </div>
    `;

    textAlert = (getTranslation("borrow_fine_desc") || `Anda terlambat <strong>{days} hari</strong>! Ajukan request pengembalian untuk buku "<strong>{book}</strong>"?<br>{badge}Pastikan Anda membawa uang pas untuk membayar denda ke Admin saat mengembalikan fisik buku.`).replace("{days}", lateDays).replace("{book}", bookTitle).replace("{badge}", badgeHtml);
  }

  const confirmReturn = await window.AppAlert.confirm(titleAlert, textAlert);

  if (confirmReturn) {
    showLoadingAndExecute(async () => {
      try {
        await updateBorrowStatus(docId, "Request Pengembalian");

        if (auth.currentUser) {
          await addHistory(
            auth.currentUser.uid,
            "INFO",
            `Mengajukan request pengembalian: ${bookTitle}`,
            null
          );
        }

        window.AppAlert.show(
          getTranslation("borrow_req_sent") || "Request Terkirim", getTranslation("borrow_req_sent_desc") || "Request dikirim! Harap pergi ke perpus untuk mengembalikan fisik buku agar admin dapat memprosesnya.",
          "info"
        );

        loadBorrowingData(auth.currentUser.uid);
      } catch (error) {
        window.AppAlert.show(
          getTranslation("borrow_fail") || "Gagal", getTranslation("borrow_fail_req") || "Gagal memproses request pengembalian. Silakan coba lagi.",
          "error"
        );
      }
    }, 2000);
  }
};

window.handleDeleteBorrowing = async function (docId, bookTitle) {
  const confirmDelete = await window.AppAlert.confirm(
    getTranslation("history_del_confirm_title") || "Hapus Riwayat?", (getTranslation("borrow_del_confirm_desc") || `Yakin ingin menghapus buku "{book}" dari daftar pinjaman? Data ini tidak bisa dikembalikan.`).replace("{book}", bookTitle)
  );

  if (confirmDelete) {
    showLoadingAndExecute(async () => {
      try {
        await deleteBorrowing(docId);

        await window.AppAlert.show(
          getTranslation("history_success_title") || "Terhapus!", (getTranslation("borrow_del_success") || `Riwayat pinjaman "{book}" berhasil dihapus dari daftar Anda.`).replace("{book}", bookTitle),
          "success"
        );

        loadBorrowingData(auth.currentUser.uid);
      } catch (error) {
        window.AppAlert.show(
          getTranslation("borrow_fail") || "Gagal", getTranslation("borrow_fail_del") || "Gagal menghapus riwayat pinjaman. Silakan coba lagi.",
          "error"
        );
      }
    }, 1500);
  }
};

initFloatingNav();
