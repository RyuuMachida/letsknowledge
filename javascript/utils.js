import { db, auth } from "./firebase-config.js";
import { getTranslation } from "./i18n.js";
import {
  collection,
  getDocs,
  doc,
  setDoc,
  getDoc,
  deleteDoc,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

const starCardSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#eab308" style="width: 16px; height: 16px;"><path fill-rule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clip-rule="evenodd" /></svg>`;

export function getBookCoverHTML(coverStr, title) {
  if (coverStr === "tech") {
    return `
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="icon-lg" style="width: 50px; height: 50px; color: #4b5563;">
        <path stroke-linecap="round" stroke-linejoin="round" d="M14.25 9.75 16.5 12l-2.25 2.25m-4.5 0L7.5 12l2.25-2.25M6 20.25h12A2.25 2.25 0 0 0 20.25 18V6A2.25 2.25 0 0 0 18 3.75H6A2.25 2.25 0 0 0 3.75 6v12A2.25 2.25 0 0 0 6 20.25Z" />
      </svg>`;
  } else if (coverStr === "people") {
    return `
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="icon-lg" style="width: 50px; height: 50px; color: #4b5563;">
        <path stroke-linecap="round" stroke-linejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
      </svg>`;
  } else if (coverStr === "globe") {
    return `
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="icon-lg" style="width: 50px; height: 50px; color: #4b5563;">
        <path stroke-linecap="round" stroke-linejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-1.605.42-3.113 1.157-4.418" />
      </svg>`;
  } else if (!coverStr || coverStr === "default" || coverStr.trim() === "") {
    return `
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="icon-lg" style="width: 50px; height: 50px; color: #4b5563;">
        <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
      </svg>`;
  } else {
    return `<img src="${coverStr}" alt="Cover ${title}" style="width: 100%; height: 100%; object-fit: contain; border-radius: 4px;" />`;
  }
}

export function createBookCard(book) {
  const views = book.views || 0;

  const totalStock = book.totalStock || 1;
  const currentStock = book.stock !== undefined ? book.stock : 1;

  const isAvailable = currentStock > 0;

  const statusText = isAvailable ? getTranslation("available") : getTranslation("borrowed");
  const statusColor = isAvailable ? "#059669" : "#dc2626";
  const statusBg = isAvailable ? "#d1fae5" : "#fee2e2";

  setTimeout(async () => {
    try {
      const reviewsSnap = await getDocs(
        collection(db, "books", book.id, "reviews")
      );
      const ratingEl = document.getElementById(`card-rating-${book.id}`);

      if (ratingEl) {
        if (reviewsSnap.empty) {
          ratingEl.innerText = "0.0";
        } else {
          let totalStars = 0;
          reviewsSnap.forEach((doc) => {
            totalStars += doc.data().rating || 0;
          });
          const avg = (totalStars / reviewsSnap.size).toFixed(1);
          ratingEl.innerText = avg;
        }
      }
    } catch (error) {
      console.error(`Gagal load rating untuk ${book.title}:`, error);
      const ratingEl = document.getElementById(`card-rating-${book.id}`);
      if (ratingEl) ratingEl.innerText = "-";
    }

    if (auth.currentUser) {
      try {
        const favRef = doc(
          db,
          "users",
          auth.currentUser.uid,
          "favorites",
          book.id
        );
        const favSnap = await getDoc(favRef);
        const favBtn = document.getElementById(`fav-btn-${book.id}`);
        const favIcon = document.getElementById(`fav-icon-${book.id}`);

        if (favSnap.exists() && favBtn && favIcon) {
          favBtn.style.color = "#ef4444";
          favIcon.setAttribute("fill", "currentColor");
          favIcon.innerHTML = `<path d="m11.645 20.91-.007-.003-.022-.012a15.247 15.247 0 0 1-.383-.218 25.18 25.18 0 0 1-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0 1 12 5.052 5.5 5.5 0 0 1 16.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 0 1-4.244 3.17 15.247 15.247 0 0 1-.383.219l-.022.012-.007.004-.003.001a.752.752 0 0 1-.704 0l-.003-.001Z" />`;
        }
      } catch (e) {
        console.error("Gagal cek status favorit:", e);
      }
    }
  }, 500);

  return `
      <div class="book-card" style="display: flex; flex-direction: column; height: 100%;">
          
        <div class="book-cover" style="flex-shrink: 0; position: relative;">
          
            <button id="fav-btn-${
              book.id
            }" onclick="window.handleFavoriteBook('${
    book.id
  }', '${book.title.replace(/'/g, "\\'")}')" 
              style="position: absolute; top: 10px; right: 10px; background: rgba(255, 255, 255, 0.9); border: 1px solid #e5e7eb; border-radius: 50%; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: transform 0.2s; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); z-index: 10; color: #9ca3af;" >
              <svg id="fav-icon-${
                book.id
              }" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" style="width: 18px; height: 18px; color: inherit;">
                <path stroke-linecap="round" stroke-linejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
              </svg>
            </button>
          ${
            book.cover.startsWith("<svg")
              ? book.cover
              : `<img src="${book.cover}" alt="${book.title}" style="width:100%; height:100%; object-fit:contain;" />`
          }
        </div>
      
      <div class="book-info" style="display: flex; flex-direction: column; flex: 1;">
        
        <div>
          <h3 style="margin: 0 0 8px 0; font-size: 1.1rem; font-weight: 800; color: #111827; line-height: 1.4;">${
            book.title
          } (${book.year})</h3>
          <p class="author" style="margin: 0; color: #6b7280; font-size: 0.9rem;">${
            book.author
          }</p>
        </div>
        
        <div style="margin-top: auto; padding-top: 20px;">
          
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; font-size: 0.8rem; color: #6b7280;">
            
            <div style="display: flex; gap: 12px; align-items: center;">
              <div style="display: flex; align-items: center; gap: 4px;" title="${getTranslation("viewed_times")} ${views}">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="width: 14px; height: 14px;">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                </svg>
                ${views}
              </div>

              <div style="display: flex; align-items: center; gap: 4px;" title="${getTranslation("rating_review")}">
                ${starCardSvg}
                <span id="card-rating-${
                  book.id
                }" style="font-weight: 700; color: #374151;">...</span>
              </div>
            </div>
            
            <div style="display: flex; gap: 10px; align-items: center;">
              <span style="background: ${statusBg}; color: ${statusColor}; padding: 4px 10px; border-radius: 12px; font-weight: 700; font-size: 0.75rem;">
                ${statusText}
              </span>

              <div style="font-weight: 700; color: #111827; cursor: default;" title="Tersedia ${currentStock} dari ${totalStock} buku">
                ${currentStock}/${totalStock}
              </div>
            </div>
          </div>

          <div class="action-buttons">
            <button class="btn-primary w-full info-btn" data-id="${
              book.id
            }" style="width: 100%; padding: 12px; border-radius: 8px; font-weight: 700; background: #000; color: #fff; border: none; cursor: pointer; font-family: inherit;">${getTranslation("book_detail")}</button>
          </div>

        </div>

      </div>
    </div>
  `;
}

export function showLoadingAndExecute(actionCallback, delay = 2000) {
  const loaderOverlay = document.getElementById("globalLoader");

  if (loaderOverlay) {
    loaderOverlay.classList.remove("hidden");

    setTimeout(() => {
      loaderOverlay.classList.add("hidden");
      actionCallback();
    }, delay);
  } else {
    actionCallback();
  }
}

export function openReadBookModal(book) {
  let modal = document.getElementById("readBookModal");

  if (!modal) {
    modal = document.createElement("div");
    modal.id = "readBookModal";
    modal.style.position = "fixed";
    modal.style.top = "0";
    modal.style.left = "0";
    modal.style.width = "100vw";
    modal.style.height = "100vh";
    modal.style.background = "rgba(17, 24, 39, 0.7)";
    modal.style.backdropFilter = "blur(5px)";
    modal.style.webkitBackdropFilter = "blur(5px)";
    modal.style.zIndex = "100000";
    modal.style.display = "none";
    modal.style.justifyContent = "center";
    modal.style.alignItems = "center";
    modal.style.opacity = "0";
    modal.style.transition = "opacity 0.3s ease";

    document.body.appendChild(modal);
  }

  const currentStock = book.stock !== undefined ? book.stock : 1;
  const isAvailable = currentStock > 0;

  const iconBack = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" style="width: 18px; height: 18px;"><path stroke-linecap="round" stroke-linejoin="round" d="M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3" /></svg>`;
  const iconPinjam = isAvailable
    ? `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" style="width: 18px; height: 18px;"><path stroke-linecap="round" stroke-linejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z" /></svg>`
    : `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" style="width: 18px; height: 18px;"><path stroke-linecap="round" stroke-linejoin="round" d="M18.364 18.364A9 9 0 0 0 5.636 5.636m12.728 12.728A9 9 0 0 1 5.636 5.636m12.728 12.728L5.636 5.636" /></svg>`;

  modal.innerHTML = `
    <style>
      .notebook-container { 
        display: flex; 
        flex-direction: row; 
        max-width: 950px; 
        width: 95%; 
        height: 85vh;
        background: #fff; 
        border-radius: 12px; 
        box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5); 
        overflow: hidden; 
        position: relative; 
      }
      
      .notebook-left { 
        width: 320px; x
        background: #fff; 
        border-right: 1px solid #e2e8f0; 
        padding: 40px 30px; 
        display: flex; 
        flex-direction: column; 
        align-items: center; 
        justify-content: center; 
      }
      .notebook-cover-wrap { width: 170px; height: 240px; border-radius: 4px; margin-bottom: 30px; overflow: hidden; background: transparent; display: flex; align-items: center; justify-content: center; }
      
      .notebook-left-actions { width: 100%; display: flex; flex-direction: column; gap: 12px; }

      .notebook-right-wrapper {
        flex: 1;
        display: flex;
        flex-direction: column;
        background-color: #fff;
        position: relative;
        min-height: 0;
      }

      .notebook-header-sticky {
        padding: 40px 40px 20px 40px;
        background: #fff;
        border-bottom: 1px solid #e2e8f0;
        z-index: 10;
      }
      .notebook-header-top { 
        display: flex; justify-content: space-between; align-items: flex-start; 
        font-family: 'Courier New', monospace; font-size: 0.85rem; color: #64748b; 
        margin-bottom: 15px; line-height: normal; 
      }
      .notebook-brand { font-weight: 800; color: #94a3b8; letter-spacing: 1px; }
      .notebook-date { text-align: right; line-height: 1.8; }
      .notebook-title { margin: 0; font-size: 1.6rem; font-weight: 800; color: #0f172a; line-height: 1.2; }
      .notebook-author { margin: 5px 0 0 0; font-size: 0.95rem; color: #64748b; font-weight: 600; }

      .notebook-scrollable-content { 
        flex: 1; 
        overflow-y: auto; 
        padding: 10px 40px 40px 40px; 
        background-color: #fff; 
        background-image: repeating-linear-gradient(transparent, transparent 31px, #cbd5e1 31px, #cbd5e1 32px); 
        background-attachment: local; 
        background-position: 0 1.5px;
        line-height: 32px; 
        font-family: 'Georgia', serif; 
        font-size: 1.05rem; 
        color: #334155; 
        text-align: justify; 
        -webkit-overflow-scrolling: touch;
      }

      .hilang-scroll::-webkit-scrollbar { display: none; }
      .hilang-scroll { -ms-overflow-style: none; scrollbar-width: none; }

      @media (max-width: 768px) {
        .notebook-container { flex-direction: column; height: 92vh; }
        
        .notebook-left { 
          width: 100%; 
          padding: 40px 20px 15px 20px; 
          border-right: none; 
          border-bottom: 1px solid #e2e8f0; 
          flex-direction: row; 
          justify-content: flex-start;
          align-items: center;
          gap: 15px;
        }
        
        .notebook-cover-wrap { 
          width: 70px; 
          height: 100px; 
          margin-bottom: 0; 
        }
        
        .notebook-left-actions { 
          flex: 1; 
          gap: 8px;
          justify-content: center;
        }
        
        .notebook-left-actions button { 
          padding: 8px 12px; 
          font-size: 0.85rem; 
          width: 100%; 
        }
        
        .notebook-header-sticky { padding: 15px 20px 10px 20px; }
        .notebook-header-top { margin-bottom: 10px; }
        .notebook-title { font-size: 1.3rem; }
        
        .notebook-scrollable-content { padding: 10px 20px 40px 20px; }
      }
    </style>

    <div class="notebook-container hilang-scroll">
      
      <button id="closeReadModalX" style="position: absolute; top: 15px; right: 15px; background: none; border: none; cursor: pointer; color: #94a3b8; z-index: 20; transition: 0.2s;" onmouseover="this.style.color='#ef4444'" onmouseout="this.style.color='#94a3b8'">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
      </button>

      <div class="notebook-left">
        <div class="notebook-cover-wrap">
          ${getBookCoverHTML(book.cover, book.title)}
        </div>

        <div class="notebook-left-actions">
          <button id="btnBackToDetail" style="width: 100%; padding: 12px; background: #111827; color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; transition: 0.2s;" onmouseover="this.style.background='#374151'" onmouseout="this.style.background='#111827'">
            ${iconBack} Kembali
          </button>

          <button id="btnPinjamFromRead" ${
            !isAvailable ? "disabled" : ""
          } style="width: 100%; padding: 12px; background: ${
    isAvailable ? "#fff" : "#fee2e2"
  }; color: ${isAvailable ? "#374151" : "#dc2626"}; border: 1px solid ${
    isAvailable ? "#d1d5db" : "#fca5a5"
  }; border-radius: 8px; font-weight: 600; cursor: ${
    isAvailable ? "pointer" : "not-allowed"
  }; display: flex; align-items: center; justify-content: center; gap: 8px; transition: 0.2s;" ${
    isAvailable
      ? `onmouseover="this.style.background='#e5e7eb'" onmouseout="this.style.background='#f3f4f6'"`
      : ""
  }>
            ${iconPinjam} ${isAvailable ? "Pinjam Offline" : "Stok Habis"}
          </button>
        </div>
      </div>

      <div class="notebook-right-wrapper">
        
        <div class="notebook-header-sticky">
          <div class="notebook-header-top">
            <div class="notebook-brand">letsknowledge</div>
            <div class="notebook-date">
              No. ....................<br>
              Date: ..................
            </div>
          </div>
          <h2 class="notebook-title">${book.title}</h2>
          <p class="notebook-author">Oleh: ${book.author}</p>
        </div>

        <div class="notebook-scrollable-content hilang-scroll">
          ${
            book.story && book.story.trim() !== ""
              ? book.story.replace(/\n/g, "<br>")
              : "Isi cerita belum tersedia..."
          }
        </div>

      </div>
    </div>
  `;

  modal.style.display = "flex";
  setTimeout(() => {
    modal.style.opacity = "1";
  }, 10);

  const backToDetail = () => {
    modal.style.opacity = "0";
    setTimeout(() => {
      modal.style.display = "none";
      const detailModal = document.getElementById("detailBookModal");
      if (detailModal) detailModal.style.display = "flex";
    }, 300);
  };

  document
    .getElementById("btnBackToDetail")
    .addEventListener("click", backToDetail);
  document.getElementById("closeReadModalX").addEventListener("click", () => {
    modal.style.opacity = "0";
    setTimeout(() => {
      modal.style.display = "none";
    }, 300);
  });

  document.getElementById("btnPinjamFromRead").addEventListener("click", () => {
    if (!isAvailable) return;
    modal.style.display = "none";
    const detailModal = document.getElementById("detailBookModal");
    if (detailModal) {
      detailModal.style.display = "flex";
      const pinjamBtnOri = document.getElementById("actionBtnPinjam");
      if (pinjamBtnOri) pinjamBtnOri.click();
    }
  });

  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      modal.style.opacity = "0";
      setTimeout(() => {
        modal.style.display = "none";
      }, 300);
    }
  });
}

window.handleFavoriteBook = async (bookId, bookTitle) => {
  if (!auth.currentUser) {
    if (window.AppAlert)
      window.AppAlert.show(
        "Akses Ditolak",
        "Login dulu buat nyimpen buku ke favorit!",
        "error"
      );
    return;
  }

  const favBtn = document.getElementById(`fav-btn-${bookId}`);
  const favIcon = document.getElementById(`fav-icon-${bookId}`);

  try {
    const favRef = doc(db, "users", auth.currentUser.uid, "favorites", bookId);
    const favSnap = await getDoc(favRef);

    if (favSnap.exists()) {
      await deleteDoc(favRef);

      if (window.location.pathname.includes("favorit.html")) {
        const bookCard = favBtn.closest(".book-card");
        if (bookCard) {
          bookCard.style.transition = "all 0.3s ease";
          bookCard.style.opacity = "0";
          bookCard.style.transform = "scale(0.8)";

          setTimeout(() => {
            bookCard.remove();
          }, 300);
        }
      } else {
        if (favBtn && favIcon) {
          favBtn.style.color = "#9ca3af";
          favIcon.setAttribute("fill", "none");
          favIcon.innerHTML = `<path stroke-linecap="round" stroke-linejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />`;
        }
      }

      if (window.AppAlert)
        window.AppAlert.show(
          "Dihapus",
          `Buku "${bookTitle}" dihapus dari favorit.`,
          "info"
        );
    } else {
      await setDoc(favRef, {
        bookId: bookId,
        title: bookTitle,
        addedAt: serverTimestamp(),
      });

      if (favBtn && favIcon) {
        favBtn.style.color = "#ef4444";
        favIcon.setAttribute("fill", "currentColor");
        favIcon.innerHTML = `<path d="m11.645 20.91-.007-.003-.022-.012a15.247 15.247 0 0 1-.383-.218 25.18 25.18 0 0 1-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0 1 12 5.052 5.5 5.5 0 0 1 16.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 0 1-4.244 3.17 15.247 15.247 0 0 1-.383.219l-.022.012-.007.004-.003.001a.752.752 0 0 1-.704 0l-.003-.001Z" />`;
      }
      if (window.AppAlert)
        window.AppAlert.show(
          "Berhasil Disimpan!",
          `Buku "${bookTitle}" sukses masuk ke rak favorit lu.`,
          "success"
        );
    }
  } catch (error) {
    console.error("Gagal toggle favorit:", error);
    if (window.AppAlert)
      window.AppAlert.show("Gagal", "Sistem lagi sibuk.", "error");
  }
};
