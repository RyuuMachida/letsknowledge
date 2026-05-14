import {
  getBookCoverHTML,
  showLoadingAndExecute,
  openReadBookModal,
} from "./utils.js";
import { db, auth } from "./firebase-config.js";
import {
  addHistory,
  addBorrowing,
  updateBookStock,
  getActiveBorrowCount,
} from "./db-logic.js";
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  doc,
  getDoc,
  updateDoc,
  arrayUnion,
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

export function openBookModal(book) {
  let modal = document.getElementById("detailBookModal");

  if (!modal) {
    modal = document.createElement("div");
    modal.id = "detailBookModal";
    modal.style.position = "fixed";
    modal.style.top = "0";
    modal.style.left = "0";
    modal.style.width = "100vw";
    modal.style.height = "100vh";
    modal.style.background = "rgba(17, 24, 39, 0.8)";
    modal.style.backdropFilter = "blur(4px)";
    modal.style.webkitBackdropFilter = "blur(4px)";
    modal.style.zIndex = "10000";
    modal.style.display = "flex";
    modal.style.justifyContent = "center";
    modal.style.alignItems = "center";

    document.body.appendChild(modal);
  }

  let isStaff = false;
  let currentUserData = null;
  if (auth.currentUser) {
    getDoc(doc(db, "users", auth.currentUser.uid)).then((uSnap) => {
      if (uSnap.exists()) {
        currentUserData = uSnap.data();
        if (
          currentUserData.thekingoflibrary ||
          currentUserData.role === "admin" ||
          currentUserData.role === "pustakawan"
        ) {
          isStaff = true;
        }
      }
    });
  }

  const closeSvg = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" style="width: 24px; height: 24px;"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>`;
  const chatSvg = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" style="width: 18px; height: 18px;"><path stroke-linecap="round" stroke-linejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" /></svg>`;
  const sendSvg = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" style="width: 20px; height: 20px;"><path stroke-linecap="round" stroke-linejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" /></svg>`;

  const getStarSvg = (isFilled) => `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${
      isFilled ? "#eab308" : "#e5e7eb"
    }" style="width: 16px; height: 14px; transition: fill 0.2s;">
      <path fill-rule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clip-rule="evenodd" />
    </svg>
  `;

  const currentStock = book.stock !== undefined ? book.stock : 1;
  const isAvailable = currentStock > 0;

  const pinjamBtnHTML = isAvailable
    ? `<button id="actionBtnPinjam" class="btn-secondary" style="width: 100%; padding: 10px; display: flex; align-items: center; justify-content: center; gap: 8px; border-radius: 6px; background: #fff; color: #374151; border: 1px solid #d1d5db; font-weight: 500; cursor: pointer; transition: all 0.2s;">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" style="width: 18px; height: 18px;">
            <path stroke-linecap="round" stroke-linejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z" />
          </svg>
          Pinjam Offline
       </button>`
    : `<button id="actionBtnPinjam" class="btn-secondary" disabled style="width: 100%; padding: 10px; display: flex; align-items: center; justify-content: center; gap: 8px; border-radius: 6px; background: #fee2e2; color: #dc2626; border: 1px solid #fca5a5; font-weight: 600; cursor: not-allowed; opacity: 0.8;">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" style="width: 18px; height: 18px;">
            <path stroke-linecap="round" stroke-linejoin="round" d="M18.364 18.364A9 9 0 0 0 5.636 5.636m12.728 12.728A9 9 0 0 1 5.636 5.636m12.728 12.728L5.636 5.636" />
          </svg>
          Stok Habis
       </button>`;

  modal.innerHTML = `
    <style>
      .modal-inner-box { 
        background: #fff; padding: 25px; border-radius: 12px; max-width: 750px; width: 90%; 
        position: relative; display: flex; gap: 25px; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); 
        max-height: 90vh; overflow-y: auto; 
      }
      .modal-col-left { flex: 0 0 200px; display: flex; flex-direction: column; gap: 15px; position: sticky; top: 0; }
      .modal-col-right { flex: 1; display: flex; flex-direction: column; justify-content: flex-start; min-width: 0; }
      .modal-divider { width: 1px; background-color: #e5e7eb; margin: 5px 0; }
      .modal-title-text { margin: 0 0 15px 0; font-size: 1.5rem; color: #111827; line-height: 1.3; white-space: normal;word-break: normal;overflow-wrap: break-word; }
      .modal-meta-grid {  display: grid;  grid-template-columns: 80px 1fr;  gap: 8px;  font-size: 0.9rem;  color: #4b5563;  margin-bottom: 20px; }
      .modal-meta-grid span {white-space: normal;word-break: normal;overflow-wrap: break-word;}
      
      .fade-in { animation: fadeIn 0.3s ease-in-out; }
      @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
      
      @keyframes skeleton-loading {
        0% { background-color: #f3f4f6; }
        50% { background-color: #e5e7eb; }
        100% { background-color: #f3f4f6; }
      }
      .skeleton-item { height: 12px; border-radius: 4px; animation: skeleton-loading 1.5s infinite ease-in-out; margin-bottom: 8px; }
    
      .brutalist-container { position: relative; width: 100%; font-family: monospace; margin-top: 40px; display: flex; align-items: flex-end; gap: 15px; }
      .brutalist-input-wrapper { position: relative; flex: 1; }
      
      .brutalist-input {
        box-sizing: border-box; width: 100%; padding: 12px; font-size: 16px; font-weight: bold; 
        color: #000; background-color: #fff; border: 3px solid #000; border-radius: 0; outline: none; 
        transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1); box-shadow: 4px 4px 0 #000;
      }
      .brutalist-input:focus { box-shadow: 7px 7px 0 #000; transform: translate(-2px, -2px); border-color: #111827; }
      .brutalist-input.error { border-color: #dc2626 !important; box-shadow: 4px 4px 0 #dc2626 !important; }
    
      .brutalist-label-wrapper { position: absolute; left: -3px; top: -30px; display: flex; align-items: center; gap: 10px; z-index: 1; }
      .brutalist-label-text { font-size: 12px; font-weight: bold; color: #fff; background-color: #000; padding: 3px 8px; transform: rotate(-1deg); }
      .brutalist-label-rating { display: flex; gap: 2px; background: transparent; padding: 2px 6px; align-items: center; }
    
      .btn-brutalist-send {
        background: #000; color: #fff; border: 3px solid #000; padding: 10px; cursor: pointer; 
        display: flex; align-items: center; justify-content: center; transition: all 0.2s; box-shadow: 4px 4px 0 #4a90e2; margin-bottom: 4px;
      }
      .btn-brutalist-send:hover { transform: translate(-2px, -2px); box-shadow: 6px 6px 0 #4a90e2; }
      .btn-brutalist-send:active { transform: translate(0, 0); box-shadow: 2px 2px 0 #4a90e2; }
  
      .char-limit-warning { font-family: monospace; font-size: 11px; font-weight: bold; color: #dc2626; margin-top: 8px; display: none; position: absolute; bottom: -22px;left: 0;width: 100%;white-space: nowrap; }
    
      .modal-inner-box, #reviewsListContainer, .modal-col-right { -ms-overflow-style: none; scrollbar-width: none; }
      .modal-inner-box::-webkit-scrollbar, #reviewsListContainer::-webkit-scrollbar, .modal-col-right::-webkit-scrollbar { display: none; }
    
      @media (max-width: 640px) {
        .modal-inner-box {
            flex-direction: column !important;
            padding: 20px !important;
            width: 95% !important;
            max-height: 95vh !important;
        }
        
        .modal-col-left {
            width: 100% !important;
            position: relative !important;
            flex: none !important;
        }
    
        .brutalist-container {
            flex-direction: row !important;
            align-items: flex-end !important;
            gap: 10px !important;
            margin-top: 45px !important;
        }
    
        .brutalist-input-wrapper {
            flex: 1 !important;
            width: auto !important;
        }
    
        .btn-brutalist-send {
            width: 50px !important;
            height: 48px !important;
            margin-top: 0 !important;
            margin-bottom: 0 !important;
            padding: 0 !important;
            justify-content: center;
        }
    
        .brutalist-label-wrapper {
            top: -38px !important; 
            width: max-content;
        }
    
        .modal-divider {
            display: none !important;
        }
      }
      .hilang-scroll::-webkit-scrollbar { display: none; }
      .hilang-scroll { -ms-overflow-style: none; scrollbar-width: none; }
    </style>

    <div class="modal-inner-box">
        <button id="closeDetailBtn" style="position: absolute; top: 15px; right: 15px; background: none; border: none; cursor: pointer; color: #6b7280; z-index: 10;">
            ${closeSvg}
        </button>
        
        <!-- KOLOM KIRI (Statis) -->
        <div class="modal-col-left">
            <!-- SUMMARY RATING (Bakal diupdate dinamis via JS) -->
            <div id="summaryRatingContainer" style="display: flex; align-items: center; justify-content: center; gap: 6px; font-weight: 700; color: #374151; font-size: 0.9rem;">
               ${getStarSvg(
                 true
               )} <span id="avgRatingText">0.0</span> <span style="color: #9ca3af; font-weight: 500; font-size: 0.8rem;">(<span id="totalReviewText">0</span> Ulasan)</span>
            </div>

            <div class="book-cover" style="width: 100%; height: 240px; overflow: hidden; border-radius: 8px; display: flex; align-items: center; justify-content: center; background: transparent;">
                ${getBookCoverHTML(book.cover, book.title)}
            </div>

            <div style="display: flex; flex-direction: column; gap: 10px;">
                <button class="btn-primary btn-baca-web" style="width: 100%; padding: 10px; display: flex; align-items: center; justify-content: center; gap: 8px; border-radius: 6px; background: #111827; color: #fff; border: none; font-weight: 500; cursor: pointer;">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" style="width: 18px; height: 18px;">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
                    </svg>
                    Baca di Web
                </button>
                
                ${pinjamBtnHTML}

                <!-- TOMBOL TOGGLE -->
                <button id="btnToggleReview" style="display: flex; align-items: center; justify-content: center; gap: 8px; width: 100%; padding: 10px; border: 1px solid #d1d5db; background: transparent; color: #374151; border-radius: 6px; cursor: pointer; font-weight: 600; transition: 0.2s;">
                  <span id="iconToggleReview" style="display: flex;">${chatSvg}</span>
                  <span id="textToggleReview">Lihat Ulasan</span>
                </button>
            </div>
        </div>

        <div class="modal-divider"></div>

        <!-- KOLOM KANAN -->
        <div class="modal-col-right">
            
            <div id="viewSynopsis" class="fade-in" style="display: block;">
                <h2 class="modal-title-text">${book.title}</h2>
                <div class="modal-meta-grid">
                    <strong>Penulis</strong> <span>: ${book.author}</span>
                    <strong>Penerbit</strong> <span>: ${book.publisher}</span>
                    <strong>Tahun</strong> <span>: ${book.year}</span>
                    <strong>Genre</strong> <span>: ${book.genre}</span>
                    <strong>Dilihat</strong> <span>: ${
                      book.views || 0
                    } kali</span>
                </div>
                
                <div style="border-top: 1px solid #e5e7eb; padding-top: 15px; display: flex; flex-direction: column;">
                    <!-- Judul Sinopsis (Tetap Diam) -->
                    <strong style="font-size: 0.95rem; color: #111827; margin-bottom: 8px;">Sinopsis:</strong>
                    
                    <div class="hilang-scroll" style="max-height: 160px; overflow-y: auto; padding-right: 5px;">
                        <p style="font-size: 0.9rem; color: #4b5563; margin: 0; line-height: 1.6; text-align: justify;">
                            ${
                              book.synopsis ||
                              "Sinopsis belum tersedia untuk buku ini."
                            }
                        </p>
                    </div>
                </div>
            </div>

            <div id="viewReview" class="fade-in" style="display: none">
              <h3
                style="
                  margin: 0 0 50px 0;
                  border-bottom: 1px solid #e5e7eb;
                  padding-bottom: 8px;
                  color: #111827;
                "
              >
                Ulasan Mahasiswa
              </h3>
        
              <div class="brutalist-container">
                <div class="brutalist-input-wrapper">
                  <div class="brutalist-label-wrapper">
                    <span class="brutalist-label-text">BERIKAN KOMENTAR</span>
                    <div class="brutalist-label-rating" id="starInputContainer"></div>
                  </div>
        
                  <input
                    id="reviewTextInput"
                    placeholder="TULIS PENDAPATMU..."
                    class="brutalist-input"
                    type="text"
                    maxlength="100"
                  />
                  <div id="charWarning" class="char-limit-warning">
                    Telah melebihi limit (Maks 100 Karakter)!
                  </div>
                </div>
        
                <button id="btnSubmitReview" class="btn-brutalist-send">
                  ${sendSvg}
                </button>
              </div>
        
              <div
                id="reviewsListContainer"
                style="
                  max-height: 250px;
                  overflow-y: auto;
                  margin-top: 40px;
                  padding-right: 10px;
                "
              ></div>
            </div>
        </div>
    </div>
  `;

  modal.style.display = "flex";

  let currentSelectedRating = 5;
  const starContainer = document.getElementById("starInputContainer");

  const renderInputStars = (rating) => {
    starContainer.innerHTML = "";
    for (let i = 1; i <= 5; i++) {
      const starWrapper = document.createElement("div");
      starWrapper.innerHTML = getStarSvg(i <= rating);
      starWrapper.addEventListener("click", () => {
        currentSelectedRating = i;
        renderInputStars(currentSelectedRating);
      });
      starContainer.appendChild(starWrapper);
    }
  };
  renderInputStars(currentSelectedRating);

  const btnSubmitReview = document.getElementById("btnSubmitReview");
  const reviewTextInput = document.getElementById("reviewTextInput");
  const reviewInput = document.getElementById("reviewTextInput");
  const charWarning = document.getElementById("charWarning");
  const MAX_CHAR = 100;

  reviewInput.addEventListener("input", (e) => {
    if (reviewInput.value.length > MAX_CHAR) {
      reviewInput.value = reviewInput.value.substring(0, MAX_CHAR);
    }

    const currentLength = reviewInput.value.length;

    if (currentLength >= MAX_CHAR) {
      reviewInput.classList.add("error");
      charWarning.style.display = "block";
    } else {
      reviewInput.classList.remove("error");
      charWarning.style.display = "none";
    }
  });

  btnSubmitReview.addEventListener("click", async () => {
    if (!auth.currentUser) {
      window.AppAlert.show(
        "Akses Ditolak",
        "Anda harus login dulu buat ngasih ulasan!",
        "error"
      );
      return;
    }

    const comment = reviewTextInput.value.trim();

    if (!comment) {
      window.AppAlert.show("Oops!", "Komentarnya jangan dikosongin.", "error");
      return;
    }

    if (comment.length > 100) {
      window.AppAlert.show(
        "Oops!",
        "Komentar anda kepanjangan, potong dikit lah.",
        "error"
      );
      return;
    }

    btnSubmitReview.innerHTML = `<span style="font-size: 14px; font-weight: bold; color: white;">...</span>`;
    btnSubmitReview.disabled = true;

    try {
      const reviewsRef = collection(db, "books", book.id, "reviews");

      let postName =
        auth.currentUser.displayName ||
        auth.currentUser.email.split("@")[0] ||
        "Mahasiswa";
      let postRole = null;

      if (currentUserData) {
        postName =
          currentUserData.displayName ||
          auth.currentUser.displayName ||
          auth.currentUser.email.split("@")[0];

        if (currentUserData.thekingoflibrary) {
          postRole = "THE KING";
        } else if (currentUserData.role) {
          postRole = currentUserData.role.toUpperCase();
        }
      }

      await addDoc(reviewsRef, {
        userId: auth.currentUser.uid,
        userName: postName,
        role: postRole,
        rating: currentSelectedRating,
        comment: comment,
        timestamp: serverTimestamp(),
      });

      document.dispatchEvent(new Event("refreshLibrary"));

      reviewTextInput.value = "";
      currentSelectedRating = 5;
      renderInputStars(5);
    } catch (error) {
      console.error("Gagal kirim review:", error);
      if (window.AppAlert)
        window.AppAlert.show("Error", "Gagal mengirim ulasan.", "error");
      else alert("Gagal mengirim ulasan.");
    } finally {
      btnSubmitReview.innerHTML = sendSvg;
      btnSubmitReview.disabled = false;
    }
  });

  const reviewsListContainer = document.getElementById("reviewsListContainer");
  const avgRatingText = document.getElementById("avgRatingText");
  const totalReviewText = document.getElementById("totalReviewText");

  const skeletonHTML = `
    <div class="fade-in">
      ${[1, 2, 3]
        .map(
          () => `
        <div style="border-bottom: 1px solid #f3f4f6; padding-bottom: 16px; margin-bottom: 16px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
            <div class="skeleton-item" style="width: 80px;"></div>
            <div class="skeleton-item" style="width: 60px;"></div>
          </div>
          <div class="skeleton-item" style="width: 100px; height: 10px; margin-bottom: 12px;"></div>
          <div class="skeleton-item" style="width: 100%;"></div>
          <div class="skeleton-item" style="width: 70%;"></div>
        </div>
      `
        )
        .join("")}
    </div>
  `;

  reviewsListContainer.innerHTML = skeletonHTML;

  const reviewsQuery = query(
    collection(db, "books", book.id, "reviews"),
    orderBy("timestamp", "desc")
  );

  const unsubscribeReviews = onSnapshot(reviewsQuery, (snapshot) => {
    if (snapshot.empty) {
      reviewsListContainer.innerHTML = `
        <div class="fade-in" style="text-align: center; padding: 40px 20px; color: #9ca3af;">
          <div style="margin-bottom: 12px; display: flex; justify-content: center;">
           <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="width: 48px; height: 48px; opacity: 0.5;">
             <path stroke-linecap="round" stroke-linejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
           </svg>
          </div>
          <strong style="display: block; color: #4b5563; font-size: 1rem; margin-bottom: 4px;">Belum Ada Ulasan</strong>
          <p style="font-size: 0.85rem; margin: 0;">Jadilah mahasiswa pertama yang memberikan pendapat tentang buku ini!</p>
        </div>
      `;
      avgRatingText.innerText = "0.0";
      totalReviewText.innerText = "0";
      return;
    }

    let htmlContent = `<div class="fade-in" style="padding-bottom: 20px;">`;
    let totalStars = 0;
    let reviewCount = 0;

    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const reviewId = docSnap.id;
      totalStars += data.rating || 0;
      reviewCount++;

      let timeString = "Baru saja";
      if (data.timestamp) {
        timeString = data.timestamp.toDate().toLocaleDateString("id-ID", {
          day: "numeric",
          month: "short",
          year: "numeric",
        });
      }

      let starsHtml = "";
      for (let i = 1; i <= 5; i++) {
        starsHtml += getStarSvg(i <= (data.rating || 0));
      }

      let repliesHtml = "";
      if (data.replies && data.replies.length > 0) {
        data.replies.forEach((reply) => {
          let replyTime = "Baru Saja";
          if (reply.timestamp) {
            const rt = new Date(reply.timestamp);
            replyTime = rt.toLocaleDateString("id-ID", {
              day: "numeric",
              month: "short",
              year: "numeric",
            });
          }

          repliesHtml += `
            <div style="display: flex; gap: 8px; margin-top: 12px; margin-left: 12px;">
              <!-- SVG PANAH BENGKOK -->
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 18px; height: 18px; color: #9ca3af; margin-top: 2px; flex-shrink: 0;">
                <path d="M8 0v12c0 2.2 1.8 4 4 4h8"></path>
                <polyline points="16 12 20 16 16 20"></polyline>
              </svg>
      
              <div style="flex: 1;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 2px;">
                  <div style="display: flex; align-items: center; gap: 6px;">
                    <span style="font-size: 0.85rem; font-weight: 800; color: #111827;">${
                      reply.name
                    }</span>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#3b82f6" style="width: 16px; height: 16px;">
                      <path fill-rule="evenodd" d="M8.603 3.799A4.49 4.49 0 0 1 12 2.25c1.357 0 2.573.6 3.397 1.549a4.49 4.49 0 0 1 3.498 1.307 4.491 4.491 0 0 1 1.307 3.497A4.49 4.49 0 0 1 21.75 12a4.49 4.49 0 0 1-1.549 3.397 4.491 4.491 0 0 1-1.307 3.497 4.491 4.491 0 0 1-3.497 1.307A4.49 4.49 0 0 1 12 21.75a4.49 4.49 0 0 1-3.397-1.549 4.49 4.49 0 0 1-3.498-1.306 4.491 4.491 0 0 1-1.307-3.498A4.49 4.49 0 0 1 2.25 12c0-1.357.6-2.573 1.549-3.397a4.49 4.49 0 0 1 1.307-3.497 4.49 4.49 0 0 1 3.497-1.307Zm7.007 6.387a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z" clip-rule="evenodd" />
                    </svg>
                    <span style="background: #111827; color: white; padding: 2px 6px; border-radius: 4px; font-size: 0.6rem; font-weight: bold; letter-spacing: 0.5px;">${reply.role.toUpperCase()}</span>

                  </div>
                  <span style="color: #9ca3af; font-size: 0.7rem;">${replyTime}</span>
                </div>
                <p style="font-size: 0.85rem; color: #4b5563; margin: 0; line-height: 1.5;">${
                  reply.text
                }</p>
              </div>
            </div>
          `;
        });
      }

      let replyFormHtml = "";
      if (isStaff) {
        replyFormHtml = `
          <button onclick="document.getElementById('reply-form-${reviewId}').classList.toggle('hidden')" style="background: none; border: none; color: #3b82f6; font-size: 0.8rem; font-weight: 700; cursor: pointer; padding: 0; margin-top: 12px; display: flex; align-items: center; gap: 6px; transition: 0.2s;" onmouseover="this.style.color='#1d4ed8'" onmouseout="this.style.color='#3b82f6'">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" style="width: 14px; height: 14px;">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3" />
            </svg>
            Balas Ulasan Ini
          </button>
          
          <div id="reply-form-${reviewId}" class="hidden" style="margin-top: 10px; margin-left: 28px; display: flex; align-items: stretch; gap: 10px;">
            <input type="text" id="reply-input-${reviewId}" placeholder="Tulis balasan..." style="flex: 1; padding: 10px 12px; font-size: 0.85rem; font-weight: bold; color: #000; background-color: #fff; border: 2px solid #000; border-radius: 0; outline: none; box-shadow: 3px 3px 0 #000; transition: all 0.2s;" onfocus="this.style.boxShadow='4px 4px 0 #111827'; this.style.transform='translate(-1px, -1px)';" onblur="this.style.boxShadow='3px 3px 0 #000'; this.style.transform='translate(0, 0)';">
            
            <button onclick="window.submitAdminReply('${book.id}', '${reviewId}')" style="background: #000; color: #fff; border: 2px solid #000; padding: 0 16px; cursor: pointer; display: flex; align-items: center; justify-content: center; box-shadow: 3px 3px 0 #4a90e2; transition: all 0.2s;" onmouseover="this.style.transform='translate(-1px, -1px)'; this.style.boxShadow='4px 4px 0 #4a90e2';" onmouseout="this.style.transform='translate(0, 0)'; this.style.boxShadow='3px 3px 0 #4a90e2';">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" style="width: 18px; height: 18px;"><path stroke-linecap="round" stroke-linejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" /></svg>
            </button>
          </div>
        `;
      }

      let reviewerNameHtml = `<strong style="font-size: 0.9rem; color: #111827;">${data.userName}</strong>`;

      if (data.role) {
        reviewerNameHtml = `
          <div style="display: flex; align-items: center; gap: 6px;">
            <strong style="font-size: 0.9rem; color: #111827;">${data.userName}</strong>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#3b82f6" style="width: 14px; height: 14px;">
              <path fill-rule="evenodd" d="M8.603 3.799A4.49 4.49 0 0 1 12 2.25c1.357 0 2.573.6 3.397 1.549a4.49 4.49 0 0 1 3.498 1.307 4.491 4.491 0 0 1 1.307 3.497A4.49 4.49 0 0 1 21.75 12a4.49 4.49 0 0 1-1.549 3.397 4.491 4.491 0 0 1-1.307 3.497 4.491 4.491 0 0 1-3.497 1.307A4.49 4.49 0 0 1 12 21.75a4.49 4.49 0 0 1-3.397-1.549 4.49 4.49 0 0 1-3.498-1.306 4.491 4.491 0 0 1-1.307-3.498A4.49 4.49 0 0 1 2.25 12c0-1.357.6-2.573 1.549-3.397a4.49 4.49 0 0 1 1.307-3.497 4.49 4.49 0 0 1 3.497-1.307Zm7.007 6.387a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z" clip-rule="evenodd" />
            </svg>
            <span style="background: #111827; color: white; padding: 2px 6px; border-radius: 4px; font-size: 0.55rem; font-weight: bold; letter-spacing: 0.5px;">${data.role}</span>
          </div>
        `;
      }

      htmlContent += `
        <div style="border-bottom: 1px solid #f3f4f6; padding-bottom: 16px; margin-bottom: 16px;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 4px;">
            ${reviewerNameHtml}
            <span style="color: #9ca3af; font-size: 0.75rem; margin-top: 2px;">${timeString}</span>
          </div>
          <div style="display: flex; gap: 2px; margin-bottom: 6px;">${starsHtml}</div>
          <p style="margin: 0; color: #4b5563; font-size: 0.85rem; line-height: 1.5; word-wrap: break-word;">${data.comment}</p>
          
          ${repliesHtml}
          ${replyFormHtml}
        </div>
      `;
    });

    htmlContent += `</div>`;
    reviewsListContainer.innerHTML = htmlContent;

    const avgScore = (totalStars / reviewCount).toFixed(1);
    avgRatingText.innerText = avgScore;
    totalReviewText.innerText = reviewCount;
  });

  const btnToggleReview = document.getElementById("btnToggleReview");
  const viewSynopsis = document.getElementById("viewSynopsis");
  const viewReview = document.getElementById("viewReview");
  const textToggle = document.getElementById("textToggleReview");
  const iconToggle = document.getElementById("iconToggleReview");

  const backSvg = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" style="width: 18px; height: 18px;"><path stroke-linecap="round" stroke-linejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" /></svg>`;

  btnToggleReview.addEventListener("click", () => {
    if (viewSynopsis.style.display === "block") {
      viewSynopsis.style.display = "none";
      viewReview.style.display = "block";

      textToggle.innerText = "Kembali";
      iconToggle.innerHTML = backSvg;
      btnToggleReview.style.background = "#f3f4f6";
    } else {
      viewSynopsis.style.display = "block";
      viewReview.style.display = "none";

      textToggle.innerText = "Lihat Ulasan";
      iconToggle.innerHTML = chatSvg;
      btnToggleReview.style.background = "transparent";
    }
  });

  const closeModal = () => {
    unsubscribeReviews();
    modal.style.display = "none";
  };

  document
    .getElementById("closeDetailBtn")
    .addEventListener("click", closeModal);

  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      closeModal();
    }
  });

  if (auth.currentUser) {
    addHistory(
      auth.currentUser.uid,
      "INFO",
      `Membaca info buku: ${book.title}`,
      book.id
    );
  }

  const btnBaca = modal.querySelector(".btn-baca-web");
  const btnPinjam = document.getElementById("actionBtnPinjam");

  btnBaca?.addEventListener("click", () => {
    if (auth.currentUser) {
      addHistory(
        auth.currentUser.uid,
        "READ",
        `Membaca isi singkat dari buku: ${book.title}`,
        book.id
      );
    }
    closeModal();
    openReadBookModal(book);
  });

  btnPinjam?.addEventListener("click", async () => {
    if (!isAvailable) return;

    if (!auth.currentUser) {
      window.AppAlert.show(
        "Akses Ditolak",
        "Login dulu buat minjem buku!",
        "error"
      );
      return;
    }

    const activeCount = await getActiveBorrowCount(auth.currentUser.uid);
    if (activeCount >= 3) {
      window.AppAlert.show(
        "Limit Maksimal (3/3)",
        "Kuota pinjam lu udah penuh. Balikin dulu minimal 1 buku ke kerajaan buat minjem yang baru.",
        "error"
      );
      return;
    }

    const borrowModal = document.getElementById("borrowConfirmModal");
    if (!borrowModal) return;

    const titleEl = document.getElementById("borrowBookTitle");
    const synopsisEl = document.getElementById("borrowBookSynopsis");
    const deadlineEl = document.getElementById("borrowDeadline");
    const coverEl = document.getElementById("borrowBookCover");

    if (coverEl && book.cover) {
      if (
        typeof book.cover === "string" &&
        book.cover.trim().startsWith("<svg")
      ) {
        coverEl.innerHTML = book.cover;
        const svg = coverEl.querySelector("svg");
        if (svg) {
          svg.style.width = "40px";
          svg.style.height = "40px";
        }
      } else {
        coverEl.innerHTML = `<img src="${book.cover}" alt="Cover Buku" style="width: 100%; height: 100%; object-fit: contain;" />`;
      }
    } else if (coverEl) {
      coverEl.innerHTML = `<span style="font-size: 10px; color: #9ca3af;">Kosong</span>`;
    }

    if (titleEl) titleEl.textContent = book.title;
    if (synopsisEl)
      synopsisEl.textContent = book.synopsis || "Tidak ada sinopsis.";

    const deadlineDate = new Date();
    deadlineDate.setDate(deadlineDate.getDate() + 7);
    const options = {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    };
    if (deadlineEl)
      deadlineEl.textContent = deadlineDate.toLocaleDateString(
        "id-ID",
        options
      );

    borrowModal.classList.remove("hidden");
    closeModal();

    const btnConfirm = document.getElementById("btnConfirmBorrow");
    const btnCancel = document.getElementById("btnCancelBorrow");

    const newBtnConfirm = btnConfirm.cloneNode(true);
    btnConfirm.parentNode.replaceChild(newBtnConfirm, btnConfirm);

    const newBtnCancel = btnCancel.cloneNode(true);
    btnCancel.parentNode.replaceChild(newBtnCancel, btnCancel);

    newBtnCancel.addEventListener("click", () => {
      borrowModal.classList.add("hidden");
      modal.style.display = "flex";
    });

    newBtnConfirm.addEventListener("click", () => {
      borrowModal.classList.add("hidden");

      showLoadingAndExecute(async () => {
        if (auth.currentUser) {
          try {
            const deadlineString = deadlineDate.toLocaleDateString(
              "id-ID",
              options
            );
            await addBorrowing(
              auth.currentUser.uid,
              book.id,
              book.title,
              book.cover,
              deadlineString
            );

            const currentStock = book.stock !== undefined ? book.stock : 1;
            const newStock = Math.max(0, currentStock - 1);
            await updateBookStock(book.id, -1, newStock);

            await addHistory(
              auth.currentUser.uid,
              "BORROW",
              `Meminjam buku: ${book.title}`,
              book.id
            );
            document.dispatchEvent(new Event("refreshLibrary"));

            if (window.AppAlert) {
              await window.AppAlert.show(
                "Berhasil Di-booking!",
                `Buku "${book.title}" berhasil di-booking. Silakan ambil di perpustakaan.`,
                "success"
              );
            }
          } catch (error) {
            if (window.AppAlert) {
              window.AppAlert.show(
                "Gagal",
                "Terjadi kesalahan saat memproses.",
                "error"
              );
            }
          }
        }
      }, 2000);
    });
  });

  window.submitAdminReply = async (bookId, reviewId) => {
    const inputEl = document.getElementById(`reply-input-${reviewId}`);
    const replyText = inputEl.value.trim();

    if (!replyText) {
      if (window.AppAlert)
        window.AppAlert.show("Gagal", "Balasan tidak boleh kosong.", "error");
      else
        window.AppAlert.show("Gagal", "Balasan tidak boleh kosong.", "error");
      return;
    }

    let adminName = "Staf Kerajaan";
    let adminRole = "ADMIN";

    if (currentUserData) {
      adminName =
        currentUserData.displayName ||
        auth.currentUser.displayName ||
        auth.currentUser.email.split("@")[0];
      if (currentUserData.thekingoflibrary) {
        adminRole = "THE KING";
      } else if (currentUserData.role) {
        adminRole = currentUserData.role.toUpperCase();
      }
    }

    try {
      await updateDoc(doc(db, "books", bookId, "reviews", reviewId), {
        replies: arrayUnion({
          text: replyText,
          name: adminName,
          role: adminRole,
          timestamp: new Date().toISOString(),
        }),
      });

      document.dispatchEvent(new Event("refreshLibrary"));

      inputEl.value = "";
      document.getElementById(`reply-form-${reviewId}`).classList.add("hidden");
    } catch (error) {
      console.error("Error submitting reply:", error);
      if (window.AppAlert)
        window.AppAlert.show("Error", "Gagal memproses balasan.", "error");
    }
  };
}
