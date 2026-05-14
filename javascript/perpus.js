import { getAllBooks, incrementView } from "./db-logic.js";
import { createBookCard, showLoadingAndExecute } from "./utils.js";
import { openBookModal } from "./book-modal.js";
import { initFloatingNav } from "./floating-nav.js";
import { renderCustomSelect } from "./selection.js";
import { getTranslation } from "./i18n.js";

const allBookGrid = document.getElementById("allBookGrid");
const searchInput = document.getElementById("searchInput");
const genreFilter = document.getElementById("genreFilter");
const sortFilter = document.getElementById("sortFilter");
const authModal = document.getElementById("authModal");

let cachedBooks = [];

async function initLibrary() {
  if (!allBookGrid) return;

  cachedBooks = await getAllBooks();
  renderBooks();
}

function renderBooks() {
  const searchText = searchInput.value.toLowerCase();
  const selectedGenre = genreFilter.value;
  const selectedSort = sortFilter ? sortFilter.value : "semua";

  let filteredBooks = cachedBooks.filter((book) => {
    const titleTarget = (book.syncedTitle || book.title || "").toLowerCase();
    const authorTarget = (book.author || "").toLowerCase();
    const yearTarget = (book.year || "").toString().toLowerCase();

    const matchSearch =
      titleTarget.includes(searchText) ||
      authorTarget.includes(searchText) ||
      yearTarget.includes(searchText);

    const matchGenre = selectedGenre === "All" || book.genre === selectedGenre;

    return matchSearch && matchGenre;
  });
  if (selectedSort === "populer") {
    filteredBooks.sort((a, b) => (b.views || 0) - (a.views || 0));
  } else if (selectedSort === "terbaru") {
    filteredBooks.sort((a, b) => {
      const yearA = parseInt(a.year) || 0;
      const yearB = parseInt(b.year) || 0;
      return yearB - yearA;
    });
  } else {
    filteredBooks.sort((a, b) => a.title.localeCompare(b.title));
  }

  if (filteredBooks.length === 0) {
    allBookGrid.innerHTML = `<p style="text-align:center; grid-column: 1 / -1; margin-top: 20px; color: #6b7280;">${getTranslation("book_not_found")}</p>`;
  } else {
    allBookGrid.innerHTML = filteredBooks
      .map((book) => createBookCard(book))
      .join("");
  }

  attachInfoListenersPerpus();
}

function attachInfoListenersPerpus() {
  const infoButtons = document.querySelectorAll(".info-btn");
  infoButtons.forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      const bookId = e.target.getAttribute("data-id");
      const selectedBook = cachedBooks.find((b) => b.id === bookId);

      if (selectedBook) {
        incrementView(bookId);

        showLoadingAndExecute(() => {
          selectedBook.views += 1;
          openBookModal(selectedBook);
          renderBooks();
        }, 2000);
      }
    });
  });
}

if (searchInput) searchInput.addEventListener("input", renderBooks);
if (genreFilter) genreFilter.addEventListener("change", renderBooks);
if (sortFilter) sortFilter.addEventListener("change", renderBooks);

initLibrary();

const observer = new MutationObserver(() => {
  if (authModal.classList.contains("hidden")) {
    allBookGrid.classList.remove("hidden");
  } else {
    allBookGrid.classList.add("hidden");
  }
});

if (authModal) {
  observer.observe(authModal, { attributes: true, attributeFilter: ["class"] });
}

document.addEventListener("refreshLibrary", () => {
  console.log("Menerima sinyal refresh... Memuat ulang rak buku!");
  initLibrary();
});

document.addEventListener("languageChanged", () => {
  // Update Dropdowns
  const sortFilterLabel = document.querySelector("#wadahSortFilter .custom-select-selected");
  if (sortFilterLabel && sortFilterLabel.textContent !== "Urutkan: Semua" && sortFilterLabel.textContent !== "Sort: All") {
    // If it's something specific, we might want to re-map it, but easiest is to re-render the whole dropdown
  }
  
  // Actually, easiest way is just to re-render the selects entirely
  document.getElementById("wadahSortFilter").innerHTML = "";
  document.getElementById("wadahGenreFilter").innerHTML = "";
  
  renderCustomSelect({
    containerId: "wadahSortFilter",
    inputId: "sortFilter",
    placeholder: getTranslation("sort_all"),
    options: [
      { value: "semua", label: getTranslation("sort_all") },
      { value: "terbaru", label: getTranslation("sort_newest") },
      { value: "populer", label: getTranslation("sort_popular") },
    ],
  });

  renderCustomSelect({
    containerId: "wadahGenreFilter",
    inputId: "genreFilter",
    placeholder: getTranslation("all_genres"),
    options: [
      { value: "All", label: getTranslation("all_genres") },
      { value: "Filsafat", label: "Filsafat" },
      { value: "Politik", label: "Politik" },
      { value: "Sastra", label: "Sastra" },
      { value: "Sosial", label: "Sosial" },
      { value: "Fiksi", label: "Fiksi" },
      { value: "Biografi", label: "Biografi" },
      { value: "Pendidikan", label: "Pendidikan" },
    ],
  });
});

renderCustomSelect({
  containerId: "wadahSortFilter",
  inputId: "sortFilter",
  placeholder: getTranslation("sort_all"),
  options: [
    { value: "semua", label: getTranslation("sort_all") },
    { value: "terbaru", label: getTranslation("sort_newest") },
    { value: "populer", label: getTranslation("sort_popular") },
  ],
});

renderCustomSelect({
  containerId: "wadahGenreFilter",
  inputId: "genreFilter",
  placeholder: getTranslation("all_genres"),
  options: [
    { value: "All", label: getTranslation("all_genres") },
    { value: "Filsafat", label: "Filsafat" },
    { value: "Politik", label: "Politik" },
    { value: "Sastra", label: "Sastra" },
    { value: "Sosial", label: "Sosial" },
    { value: "Fiksi", label: "Fiksi" },
    { value: "Biografi", label: "Biografi" },
    { value: "Pendidikan", label: "Pendidikan" },
  ],
});

initFloatingNav();
