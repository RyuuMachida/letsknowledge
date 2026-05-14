import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import {
  collection,
  getDocs,
  doc,
  getDoc,
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

import { createBookCard, showLoadingAndExecute } from "./utils.js";
import { openBookModal } from "./book-modal.js";

const favoriteBookGrid = document.getElementById("favoriteBookGrid");
const searchFavInput = document.getElementById("searchFavInput");

let allFavoriteBooks = [];

onAuthStateChanged(auth, async (user) => {
  if (user) {
    await loadFavoriteBooks(user.uid);
  } else {
    favoriteBookGrid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 50px 20px;">
        <h3 style="color: #111827; margin-bottom: 10px;">${getTranslation("fav_access_denied_title") || "Akses Ditolak"}</h3>
        <p style="color: #6b7280; font-size: 0.9rem;">${getTranslation("fav_access_denied_desc") || "Silakan login terlebih dahulu untuk melihat koleksi favorit Anda."}</p>
      </div>
    `;
  }
});

async function loadFavoriteBooks(uid) {
  favoriteBookGrid.innerHTML = `<div style="grid-column: 1 / -1; text-align: center; padding: 40px;"><div class="loader" style="margin: 0 auto;"></div></div>`;

  try {
    const favRef = collection(db, "users", uid, "favorites");
    const favSnap = await getDocs(favRef);

    if (favSnap.empty) {
      favoriteBookGrid.innerHTML = `
        <div style="grid-column: 1 / -1; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 80px 20px; text-align: center;">
          
          <div style="background: #f3f4f6; padding: 24px; border-radius: 50%; margin-bottom: 24px;">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="width: 56px; height: 56px; color: #9ca3af;">
              <path stroke-linecap="round" stroke-linejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
            </svg>
          </div>

          <h3 style="color: #111827; font-size: 1.5rem; font-weight: 800; letter-spacing: -0.5px; margin-bottom: 12px;">${getTranslation("fav_empty_title") || "Rak Favorit Masih Sepi"}</h3>
          <p style="color: #6b7280; font-size: 1.05rem; max-width: 450px; line-height: 1.6; margin-bottom: 32px;">
            ${getTranslation("fav_empty_desc") || "Kelihatannya belum ada buku yang berhasil mencuri hatimu. Yuk, kembali ke perpustakaan dan temukan bacaan seru pertamamu!"}
          </p>

          <a href="home.html" style="display: inline-flex; align-items: center; gap: 8px; background: #111827; color: #fff; padding: 14px 28px; border-radius: 12px; font-weight: 600; text-decoration: none; transition: all 0.2s ease;" onmouseover="this.style.background='#374151'; this.style.transform='translateY(-2px)';" onmouseout="this.style.background='#111827'; this.style.transform='translateY(0)';">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" style="width: 20px; height: 20px;">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
            </svg>
            ${getTranslation("fav_empty_btn") || "Mulai Eksplorasi"}
          </a>

        </div>
      `;
      return;
    }
    allFavoriteBooks = [];

    for (const favDoc of favSnap.docs) {
      const bookId = favDoc.data().bookId;
      const bookRef = doc(db, "books", bookId);
      const bookSnap = await getDoc(bookRef);

      if (bookSnap.exists()) {
        allFavoriteBooks.push({ id: bookSnap.id, ...bookSnap.data() });
      }
    }

    renderFavorites(allFavoriteBooks);
  } catch (error) {
    console.error("Gagal memuat buku favorit:", error);
    favoriteBookGrid.innerHTML = `<div style="grid-column: 1 / -1; text-align: center; color: #dc2626; padding: 40px;">${getTranslation("fetch_error") || "Gagal memuat data dari server."}</div>`;
  }
}

function renderFavorites(booksToRender) {
  if (booksToRender.length === 0) {
    favoriteBookGrid.innerHTML = `<div style="grid-column: 1 / -1; text-align: center; color: #6b7280; padding: 40px;">${getTranslation("fav_not_found") || "Tidak ada buku yang cocok dengan pencarian."}</div>`;
    return;
  }

  favoriteBookGrid.innerHTML = booksToRender
    .map((book) => createBookCard(book))
    .join("");

  const infoButtons = favoriteBookGrid.querySelectorAll(".info-btn");
  infoButtons.forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      const bookId = e.target.getAttribute("data-id");
      const selectedBook = allFavoriteBooks.find((b) => b.id === bookId);

      if (selectedBook) {
        import("./db-logic.js").then((module) => module.incrementView(bookId));

        showLoadingAndExecute(() => {
          selectedBook.views = (selectedBook.views || 0) + 1;

          openBookModal(selectedBook);

          loadFavoriteBooks(auth.currentUser.uid);
        }, 1000);
      }
    });
  });
}

searchFavInput?.addEventListener("input", (e) => {
  const searchTerm = e.target.value.toLowerCase().trim();

  if (!searchTerm) {
    renderFavorites(allFavoriteBooks);
    return;
  }

  const filteredBooks = allFavoriteBooks.filter(
    (book) =>
      book.title.toLowerCase().includes(searchTerm) ||
      book.author.toLowerCase().includes(searchTerm)
  );

  renderFavorites(filteredBooks);
});

document.addEventListener("refreshLibrary", async () => {
  console.log("Menerima sinyal refresh di halaman favorit...");
  if (auth.currentUser) {
    await loadFavoriteBooks(auth.currentUser.uid);
  }
});
