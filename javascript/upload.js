import { auth, db } from "./firebase-config.js";
import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";

import { getAllBooks, incrementView, addBook, addHistory } from "./db-logic.js";
import { createBookCard, showLoadingAndExecute } from "./utils.js";
import { openBookModal } from "./book-modal.js";
import { initFloatingNav } from "./floating-nav.js";
import { initFooter } from "./footer.js";
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

import { renderCustomSelect } from "./selection.js";
import { getTranslation } from "./i18n.js";

document.body.style.display = "none";

onAuthStateChanged(auth, async (user) => {
  if (user) {
    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      const uData = userSnap.data();

      if (uData.thekingoflibrary === true || uData.role === "pustakawan") {
        document.body.style.display = "block";
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

renderCustomSelect({
  containerId: "wadahUpGenre",
  inputId: "upGenre",
  placeholder: getTranslation("upload_genre_ph") || "Pilih Genre",
  options: [
    { value: "Filsafat", label: getTranslation("genre_philosophy") || "Filsafat" },
    { value: "Politik", label: getTranslation("genre_politics") || "Politik" },
    { value: "Sastra", label: getTranslation("genre_literature") || "Sastra" },
    { value: "Sosial", label: getTranslation("genre_social") || "Sosial" },
    { value: "Fiksi", label: getTranslation("genre_fiction") || "Fiksi" },
    { value: "Biografi", label: getTranslation("genre_biography") || "Biografi" },
    { value: "Teknologi", label: getTranslation("genre_technology") || "Teknologi" },
  ],
});

renderCustomSelect({
  containerId: "wadahUpCover",
  inputId: "upCoverSelect",
  placeholder: getTranslation("upload_cover_ph") || "Pilih Jenis Cover",
  options: [
    { value: "default", label: getTranslation("cover_opt_std") || "Buku Standar (SVG)" },
    { value: "tech", label: getTranslation("cover_opt_tech") || "Teknologi / Kode (SVG)" },
    { value: "people", label: getTranslation("cover_opt_people") || "Tokoh / Biografi (SVG)" },
    { value: "globe", label: getTranslation("cover_opt_globe") || "Dunia / Sejarah (SVG)" },
    { value: "custom", label: getTranslation("cover_opt_custom") || "Ketik Path Gambar Internal..." },
  ],
});

const uploadForm = document.getElementById("uploadBookForm");
const submitBtn = document.getElementById("submitUploadBtn");
const uploadMessage = document.getElementById("uploadMessage");

const wadahUpCover = document.getElementById("wadahUpCover");
const coverSelect = document.getElementById("upCoverSelect");
const coverInput = document.getElementById("upCoverInput");
const coverHint = document.getElementById("coverHint");

const upTitle = document.getElementById("upTitle");
const upYear = document.getElementById("upYear");
const previewTitle = document.getElementById("previewTitle");

const upAuthor = document.getElementById("upAuthor");
const previewAuthor = document.getElementById("previewAuthor");

const upStock = document.getElementById("upStock");
const previewStock = document.getElementById("previewStock");

const previewCover = document.getElementById("previewCover");

const updateTitlePreview = () => {
  const titleVal = upTitle.value.trim() || (getTranslation("upload_preview_default_title") || "Judul Buku");
  const yearVal = upYear.value.trim() || "2026";
  previewTitle.textContent = `${titleVal} (${yearVal})`;
};

const warnTitle = document.getElementById("warnTitle");
const warnAuthor = document.getElementById("warnAuthor");

if (upTitle && warnTitle) {
  upTitle.addEventListener("input", (e) => {
    const currentLength = e.target.value.length;

    if (currentLength >= 100) {
      e.target.style.borderColor = "#dc2626";
      warnTitle.style.display = "block";
    } else {
      e.target.style.borderColor = "";
      warnTitle.style.display = "none";
    }
  });
}

if (upAuthor && warnAuthor) {
  upAuthor.addEventListener("input", (e) => {
    const currentLength = e.target.value.length;

    if (currentLength >= 50) {
      e.target.style.borderColor = "#dc2626";
      warnAuthor.style.display = "block";
    } else {
      e.target.style.borderColor = "";
      warnAuthor.style.display = "none";
    }
  });
}

if (coverSelect && coverInput && wadahUpCover) {
  coverSelect.addEventListener("change", (e) => {
    if (e.target.value === "custom") {
      wadahUpCover.style.display = "none";
      coverInput.classList.remove("hidden"); 
      coverInput.focus();
      coverHint.innerHTML = getTranslation("upload_cover_hint_custom") || "Isi dengan lokasi gambar lokal. <strong>Klik kiri 2x</strong> pada input untuk kembali ke pilihan SVG.";
      coverSelect.removeAttribute("required");
      coverInput.setAttribute("required", "true");
    }
    updatePreviewIcon();
  });

  coverInput.addEventListener("dblclick", () => {
    coverInput.classList.add("hidden"); 
    wadahUpCover.style.display = "block";

    coverSelect.value = "default";
    const triggerSpan = wadahUpCover.querySelector(
      ".custom-select-trigger span"
    );
    if (triggerSpan) triggerSpan.textContent = getTranslation("cover_opt_std") || "Buku Standar (SVG)";

    coverHint.textContent = getTranslation("upload_cover_hint") || "Pilih jenis cover SVG atau pilih 'Ketik Path Internal' untuk gambar lokal.";
    coverInput.removeAttribute("required");
    coverSelect.setAttribute("required", "true");
    coverInput.value = "";
    updatePreviewIcon();
  });
}

if (upTitle && previewTitle) {
  upTitle.addEventListener("input", updateTitlePreview);
}

if (upYear && previewTitle) {
  upYear.addEventListener("input", updateTitlePreview);
}

if (upAuthor && previewAuthor) {
  upAuthor.addEventListener("input", (e) => {
    previewAuthor.textContent = e.target.value || (getTranslation("upload_preview_default_author") || "Nama Penulis");
  });
}

if (upStock && previewStock) {
  upStock.addEventListener("input", (e) => {
    const val = e.target.value || "1";
    previewStock.textContent = `${val}/${val}`;
  });
}

const updatePreviewIcon = () => {
  const isCustom = coverSelect.value === "custom";
  const basePath = "assets/thumbnail/book/";

  if (isCustom && coverInput.value.trim() !== "") {
    const finalPath = basePath + coverInput.value.trim();
    previewCover.innerHTML = `<img src="${finalPath}" alt="Cover" style="width:100%; height:100%; object-fit:contain;" onerror="this.src='https://via.placeholder.com/150?text=No+Image'">`;
  } else {
    if (coverSelect.value === "tech") {
      previewCover.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="width: 50%; color: #9ca3af;"><path stroke-linecap="round" stroke-linejoin="round" d="M14.25 9.75L16.5 12l-2.25 2.25m-4.5 0L7.5 12l2.25-2.25M6 20.25h12A2.25 2.25 0 0020.25 18V6A2.25 2.25 0 0018 3.75H6A2.25 2.25 0 003.75 6v12A2.25 2.25 0 006 20.25z" /></svg>`;
    } else if (coverSelect.value === "people") {
      previewCover.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="width: 50%; color: #9ca3af;"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-2.533-4.656C18.175 12.872 16.666 12 15 12c-1.666 0-3.175.872-4.213 1.892a4.125 4.125 0 00-2.533 4.656 9.337 9.337 0 004.121.952 9.38 9.38 0 002.625-.372z" /><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>`;
    } else if (coverSelect.value === "globe") {
      previewCover.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="width: 50%; color: #9ca3af;"><path stroke-linecap="round" stroke-linejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-1.605.42-3.113 1.157-4.418" /></svg>`;
    } else {
      previewCover.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="width: 50%; color: #9ca3af;"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" /></svg>`;
    }
  }
};

updatePreviewIcon();

if (coverSelect) coverSelect.addEventListener("change", updatePreviewIcon);
if (coverInput) coverInput.addEventListener("input", updatePreviewIcon);

if (uploadForm) {
  uploadForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    submitBtn.textContent = getTranslation("uploading_btn") || "Mengupload...";
    submitBtn.disabled = true;
    uploadMessage.textContent = "";

    const title = upTitle.value;
    const author = upAuthor.value;
    const year = parseInt(document.getElementById("upYear").value);
    const publisher = document.getElementById("upPublisher").value;
    const genre = document.getElementById("upGenre").value;
    const stock = parseInt(upStock.value);
    const synopsis = document.getElementById("upSynopsis").value;
    const story = document.getElementById("upStory").value;

    let finalCoverValue = "";
    if (coverSelect.value === "custom") {
      finalCoverValue = "assets/thumbnail/book/" + coverInput.value.trim();
    } else {
      finalCoverValue = coverSelect.value;
    }

    const newBookData = {
      title: title,
      syncedTitle: title.toLowerCase(),
      author: author,
      year: year,
      publisher: publisher,
      genre: genre,
      cover: finalCoverValue,
      synopsis: synopsis,
      stock: stock,
      totalStock: stock,
      story: story,
      createdAt: serverTimestamp(),
      views: 0,
    };

    try {
      await addBook(newBookData);

      uploadMessage.style.color = "#10b981";
      uploadMessage.textContent = getTranslation("upload_success") || "Buku berhasil diupload ke database!";

      uploadForm.reset();

      coverInput.classList.add("hidden");
      if (wadahUpCover) wadahUpCover.style.display = "block";

      coverSelect.value = "default";
      const coverTriggerText = wadahUpCover?.querySelector(
        ".custom-select-trigger span"
      );
      if (coverTriggerText) coverTriggerText.textContent = getTranslation("cover_opt_std") || "Buku Standar (SVG)";

      document.getElementById("upGenre").value = "Filsafat";
      const genreTriggerText = document
        .getElementById("wadahUpGenre")
        ?.querySelector(".custom-select-trigger span");
      if (genreTriggerText) genreTriggerText.textContent = "Filsafat";

      coverHint.innerHTML = getTranslation("upload_cover_hint") || "Pilih jenis cover SVG atau pilih 'Ketik Path Internal' untuk gambar lokal.";
      coverInput.removeAttribute("required");
      coverSelect.setAttribute("required", "true");

      previewTitle.textContent = getTranslation("upload_preview_default_title") || "Judul Buku";
      previewAuthor.textContent = getTranslation("upload_preview_default_author") || "Nama Penulis";
      previewStock.textContent = "1/1";
      updatePreviewIcon();
    } catch (error) {
      console.error(error);
      uploadMessage.style.color = "#ef4444";
      uploadMessage.textContent = getTranslation("upload_error") || "Gagal mengupload buku. Pastikan koneksi stabil.";
    } finally {
      submitBtn.textContent = getTranslation("upload_btn_submit") || "Upload Buku ke Database";
      submitBtn.disabled = false;
    }
  });
}
