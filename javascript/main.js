import { auth, db } from "./firebase-config.js";
import { getLanguage, setLanguage, applyTranslations, getTranslation } from "./i18n.js";

import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";

import { getAllBooks, incrementView } from "./db-logic.js";
import { createBookCard, showLoadingAndExecute } from "./utils.js";
import { openBookModal } from "./book-modal.js";
import { initFloatingNav } from "./floating-nav.js";
import { addHistory, getActiveBorrowCount } from "./db-logic.js";
import { initFooter } from "./footer.js";
import { initChat, destroyChat } from "./chat.js";
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

const authBtn = document.getElementById("authBtn");
const authBtnText = document.getElementById("authBtnText");
const userInfo = document.getElementById("userInfo");
const userNameEl = document.getElementById("userName");
const userStatusEl = document.getElementById("userStatus");
const bookGrid = document.getElementById("bookGrid");
const profileContainer = document.getElementById("profileContainer");
const profilePicture = document.getElementById("profilePicture");
const hoverUserName = document.getElementById("hoverUserName");
const hoverUserEmail = document.getElementById("hoverUserEmail");
const hoverUserStatus = document.getElementById("hoverUserStatus");
const hoverUserAvatar = document.getElementById("hoverUserAvatar");
const togglePasswordBtns = document.querySelectorAll(".toggle-password");
const globalLoader = document.getElementById("globalLoader");

const eyeOpenSvg = `
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
    <path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
    <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
  </svg>
`;

const eyeClosedSvg = `
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
    <path stroke-linecap="round" stroke-linejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
  </svg>
`;

const svgMahasiswa = `
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="width: 22px; height: 22px; color: #4b5563;">
    <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
  </svg>
`;

const svgIstimewa = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#111827" style="width: 22px; height: 22px;">
    <path fill-rule="evenodd" d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z" clip-rule="evenodd" />
  </svg>
`;

const viewIcon = `
<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="width: 18px; height: 18px;">
  <path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
  <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
</svg>
`;

const authModal = document.getElementById("authModal");
const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");
const switchToLogin = document.getElementById("switchToLogin");
const switchToRegister = document.getElementById("switchToRegister");

const loginError = document.getElementById("loginError");
const regError = document.getElementById("regError");

let loginErrorTimer;
let regErrorTimer;

function showLoginError(pesan) {
  loginError.textContent = pesan;
  loginError.style.display = "block";

  clearTimeout(loginErrorTimer);
  loginErrorTimer = setTimeout(() => {
    loginError.style.display = "none";
    loginError.textContent = "";
  }, 4000);
}

function showRegError(pesan) {
  regError.textContent = pesan;
  regError.style.display = "block";

  clearTimeout(regErrorTimer);
  regErrorTimer = setTimeout(() => {
    regError.style.display = "none";
    regError.textContent = "";
  }, 4000);
}

togglePasswordBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    const targetId = btn.getAttribute("data-target");
    const inputEl = document.getElementById(targetId);

    if (inputEl.type === "password") {
      inputEl.type = "text";
      btn.innerHTML = eyeOpenSvg;
    } else {
      inputEl.type = "password";
      btn.innerHTML = eyeClosedSvg;
    }
  });
});

async function loadTopBooks() {
  if (!bookGrid) return;
  const books = await getAllBooks();
  const topBooks = books.sort((a, b) => b.views - a.views).slice(0, 6);
  bookGrid.innerHTML = topBooks.map((book) => createBookCard(book)).join("");

  const infoButtons = document.querySelectorAll(".info-btn");
  infoButtons.forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      const bookId = e.target.getAttribute("data-id");

      const selectedBook = books.find((b) => b.id === bookId);

      if (selectedBook) {
        incrementView(bookId);

        showLoadingAndExecute(() => {
          selectedBook.views += 1;
          openBookModal(selectedBook);
          loadTopBooks();
        }, 2000);
      }
    });
  });

  const urlParams = new URLSearchParams(window.location.search);
  const openBookId = urlParams.get("openBook");

  if (openBookId) {
    const bookToOpen = books.find((b) => b.id === openBookId);

    if (bookToOpen) {
      openBookModal(bookToOpen);

      window.history.replaceState(null, "", window.location.pathname);
    }
  }
}

switchToLogin?.addEventListener("click", () => {
  registerForm.classList.add("hidden");
  loginForm.classList.remove("hidden");
  regError.style.display = "none";
  regError.textContent = "";
});

switchToRegister?.addEventListener("click", () => {
  loginForm.classList.add("hidden");
  registerForm.classList.remove("hidden");
  loginError.style.display = "none";
  loginError.textContent = "";
});

onAuthStateChanged(auth, async (user) => {
  if (user) {
    let finalName = "";
    let userRole = "mahasiswa";

    try {
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const userData = userSnap.data();
        finalName = userData.displayName;

        if (userData.thekingoflibrary === true) {
          userRole = "developer";
        } else if (userData.role) {
          userRole = userData.role;
        }

        console.log(
          "Data Firestore ditemukan:",
          finalName,
          "| Pangkat:",
          userRole
        );
      }
    } catch (error) {
      console.error("Gagal verifikasi data user:", error);
    }

    if (!finalName) {
      finalName = user.displayName;
    }

    if (!sessionStorage.getItem("loginLogged")) {
      addHistory(user.uid, "LOGIN", "Masuk ke web");
      sessionStorage.setItem("loginLogged", "true");
    }

    authModal?.classList.add("hidden");
    profileContainer?.classList.remove("hidden");

    if (hoverUserName) {
      hoverUserName.textContent = finalName || getTranslation("user");
    }

    const isStaff =
      userRole === "developer" ||
      userRole === "admin" ||
      userRole === "pustakawan";

    if (isStaff) {
      console.log(`Welcome back, ${userRole.toUpperCase()}.`);

      setTimeout(() => {
        const adminContainer = document.getElementById("adminLinkContainer");
        if (adminContainer && !document.querySelector(".admin-link-added")) {
          let currentPath = window.location.pathname.split("/").pop();
          if (!currentPath || currentPath === "") currentPath = "home.html";

          const adminActive = currentPath === "paneladmin.html" ? "active" : "";
          const uploadActive = currentPath === "upload.html" ? "active" : "";

          let navHtml = `<div style="gap: 50px;">`;

          navHtml += `
            <a href="paneladmin.html" class="nav-item admin-link-added ${adminActive}" title="${getTranslation("nav_admin_panel")}" data-i18n-title="nav_admin_panel">
              <svg style="margin-right: -7%;" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="color: #6b7280;">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.744c0 5.561 3.28 10.355 8.006 12.523a11.94 11.94 0 0 0 8.006-12.522c0-1.304-.208-2.559-.598-3.74A11.952 11.952 0 0 1 12 2.744Z" />
              </svg>
            </a>
          `;

          if (userRole === "developer" || userRole === "pustakawan") {
            navHtml += `
              <br>
              <a href="upload.html" class="nav-item ${uploadActive}" title="${getTranslation("nav_add_book")}" data-i18n-title="nav_add_book">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="color: #10b981;">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
              </a>
            `;
          }

          navHtml += `</div>`;
          adminContainer.innerHTML = navHtml;

          if (adminActive || uploadActive) {
            document
              .querySelectorAll(".floating-nav .nav-item")
              .forEach((el) => {
                if (el.getAttribute("href") !== currentPath) {
                  el.classList.remove("active");
                }
              });
          }
        }
      }, 300);
    } else {
      const adminContainer = document.getElementById("adminLinkContainer");
      if (adminContainer) adminContainer.innerHTML = "";
    }

    if (hoverUserName) {
      hoverUserName.textContent = finalName || getTranslation("anonymous");
    }
    if (hoverUserEmail) {
      hoverUserEmail.textContent = user.email || "-";
    }

    if (hoverUserStatus && profilePicture && hoverUserAvatar) {
      if (
        userRole === "developer" ||
        userRole === "admin" ||
        userRole === "pustakawan"
      ) {
        profilePicture.innerHTML = svgIstimewa;
      } else {
        profilePicture.innerHTML = svgMahasiswa;
      }

      if (userRole === "developer") {
        hoverUserAvatar.innerHTML = `<img src="assets/dev.jpeg" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.style.display='none'"/>`;
        hoverUserAvatar.style.borderColor = "#fef08a";

        hoverUserStatus.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" style="width: 14px; height: 14px;">
            <path fill-rule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.005Z" clip-rule="evenodd" />
          </svg>
          THE KING
        `;
        hoverUserStatus.style.background =
          "linear-gradient(135deg, #fef08a 0%, #fde047 100%)";
        hoverUserStatus.style.color = "#854d0e";
        hoverUserStatus.style.border = "1px solid #fef08a";
        hoverUserStatus.style.boxShadow = "0 2px 8px rgba(253, 224, 71, 0.4)";
      } else if (userRole === "admin") {
        hoverUserAvatar.innerHTML = svgIstimewa;
        hoverUserAvatar.style.borderColor = "#bfdbfe";

        hoverUserStatus.setAttribute("data-i18n", "admin");
        hoverUserStatus.textContent = getTranslation("admin");
        hoverUserStatus.style.background = "#eff6ff";
        hoverUserStatus.style.color = "#1e40af";
        hoverUserStatus.style.border = "1px solid transparent";
        hoverUserStatus.style.boxShadow = "none";
      } else if (userRole === "pustakawan") {
        hoverUserAvatar.innerHTML = svgIstimewa;
        hoverUserAvatar.style.borderColor = "#bbf7d0";

        hoverUserStatus.setAttribute("data-i18n", "librarian");
        hoverUserStatus.textContent = getTranslation("librarian");
        hoverUserStatus.style.background = "#f0fdf4";
        hoverUserStatus.style.color = "#166534";
        hoverUserStatus.style.border = "1px solid transparent";
        hoverUserStatus.style.boxShadow = "none";
      } else {
        hoverUserAvatar.innerHTML = svgMahasiswa;
        hoverUserAvatar.style.borderColor = "#e5e7eb";

        hoverUserStatus.setAttribute("data-i18n", "student");
        hoverUserStatus.textContent = getTranslation("student");
        hoverUserStatus.style.background = "#f3f4f6";
        hoverUserStatus.style.color = "#4b5563";
        hoverUserStatus.style.border = "1px solid transparent";
        hoverUserStatus.style.boxShadow = "none";
      }
    }

    const kuotaEl = document.getElementById("textKuotaPinjamProfile");
    if (kuotaEl) {
      try {
        const activeCount = await getActiveBorrowCount(user.uid);
        let sisaKuota = 3 - activeCount;
        if (sisaKuota < 0) sisaKuota = 0;

        kuotaEl.innerHTML = `
          <span style="font-weight: 800; color: inherit; font-size: 0.85rem;">${sisaKuota}</span>
          <span style="color: #6b7280; font-size: 0.75rem; font-weight: 600;">/3 <span data-i18n="book_unit">${getTranslation("book_unit")}</span></span>
        `;

        if (sisaKuota === 0) {
          kuotaEl.style.color = "#dc2626";
          const iconSvg = kuotaEl.previousElementSibling;
          if (iconSvg) iconSvg.style.color = "#dc2626";
        } else {
          kuotaEl.style.color = "#111827";
          const iconSvg = kuotaEl.previousElementSibling;
          if (iconSvg) iconSvg.style.color = "#3b82f6";
        }
      } catch (error) {
        console.error("Gagal get kuota:", error);
        kuotaEl.textContent = "Error";
      }
    }

    if (authBtn) {
      authBtn.className = "btn-logout";
      authBtn.innerHTML = `<div class="sign"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75" /></svg></div><div class="text" data-i18n="logout">${getTranslation("logout")}</div>`;
    }

    if (bookGrid) bookGrid.classList.remove("hidden");
    if (typeof loadTopBooks === "function") await loadTopBooks();

    // Inisialisasi Chat Melayang
    initChat(user);

    globalLoader?.classList.add("hidden");
  } else {
    authModal?.classList.remove("hidden");
    profileContainer?.classList.add("hidden");

    const adminContainer = document.getElementById("adminLinkContainer");
    if (adminContainer) adminContainer.innerHTML = "";

    // Bersihkan Chat Melayang
    destroyChat();

    globalLoader?.classList.add("hidden");
  }
});

authBtn?.addEventListener("click", () => {
  if (auth.currentUser) {
    signOut(auth).catch((error) => console.error(error));
  }
});

registerForm?.addEventListener("submit", (e) => {
  e.preventDefault();
  const name = document.getElementById("regName").value;
  const email = document.getElementById("regEmail").value;
  const password = document.getElementById("regPassword").value;
  const confirmPassword = document.getElementById("regConfirmPassword").value;
  const btn = document.getElementById("regSubmitBtn");

  if (password !== confirmPassword) {
    showRegError(getTranslation("err_pwd_mismatch"));
    return;
  }

  globalLoader?.classList.remove("hidden");
  btn.disabled = true;

  createUserWithEmailAndPassword(auth, email, password)
    .then(async (userCredential) => {
      const user = userCredential.user;
      await updateProfile(user, { displayName: name });

      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        displayName: name,
        email: email,
        role: "Mahasiswa",
        thekingoflibrary: false,
        createdAt: serverTimestamp(),
      });

      registerForm.reset();
    })
    .catch((error) => {
      globalLoader?.classList.add("hidden");
      showRegError(error.message);
      btn.disabled = false;
      console.error("Gagal mendaftar:", error);
    });
});

loginForm?.addEventListener("submit", (e) => {
  e.preventDefault();
  const email = document.getElementById("loginEmail").value;
  const password = document.getElementById("loginPassword").value;
  const btn = document.getElementById("loginSubmitBtn");

  btn.textContent = getTranslation("processing");
  btn.disabled = true;

  signInWithEmailAndPassword(auth, email, password)
    .then(() => {
      loginForm.reset();
    })
    .catch((error) => {
      showLoginError(getTranslation("err_login_failed"));
      console.error(error);
    })
    .finally(() => {
      btn.textContent = getTranslation("login_btn");
      btn.disabled = false;
    });
});

document.addEventListener("refreshLibrary", async () => {
  console.log("Menerima sinyal refresh... Memuat ulang buku populer!");
  if (typeof loadTopBooks === "function") {
    loadTopBooks();
  }

  if (auth.currentUser) {
    const kuotaEl = document.getElementById("textKuotaPinjamProfile");
    if (kuotaEl) {
      try {
        const activeCount = await getActiveBorrowCount(auth.currentUser.uid);
        let sisaKuota = 3 - activeCount;
        if (sisaKuota < 0) sisaKuota = 0;

        kuotaEl.innerHTML = `
          <span style="font-weight: 800; color: inherit; font-size: 0.85rem;">${sisaKuota}</span>
          <span style="color: #6b7280; font-size: 0.75rem; font-weight: 600;">/3 <span data-i18n="book_unit">${getTranslation("book_unit")}</span></span>
        `;

        if (sisaKuota === 0) {
          kuotaEl.style.color = "#dc2626";
          if (kuotaEl.previousElementSibling)
            kuotaEl.previousElementSibling.style.color = "#dc2626";
        } else {
          kuotaEl.style.color = "#111827";
          if (kuotaEl.previousElementSibling)
            kuotaEl.previousElementSibling.style.color = "#3b82f6";
        }
      } catch (e) {
        console.error("Gagal refresh kuota", e);
      }
    }
  }
});

function initMain() {
  const track = document.getElementById("bannerTrack");
  const dotsContainer = document.getElementById("bannerDots");

  if (track && dotsContainer) {
    const slides = Array.from(track.children);
    const slideCount = slides.length;
    let currentIndex = 0;
    let autoSlideInterval;

    slides.forEach((_, index) => {
      const dot = document.createElement("span");
      dot.classList.add("dot");
      if (index === 0) dot.classList.add("active");

      dot.addEventListener("click", () => {
        goToSlide(index);
        resetAutoSlide();
      });

      dotsContainer.appendChild(dot);
    });

    const dots = Array.from(dotsContainer.children);

    function goToSlide(index) {
      currentIndex = index;
      track.style.transform = `translateX(-${currentIndex * 100}%)`;

      dots.forEach((d) => d.classList.remove("active"));
      dots[currentIndex].classList.add("active");
    }

    function startAutoSlide() {
      autoSlideInterval = setInterval(() => {
        let nextIndex = currentIndex + 1;
        if (nextIndex >= slideCount) nextIndex = 0;
        goToSlide(nextIndex);
      }, 5000);
    }

    function resetAutoSlide() {
      clearInterval(autoSlideInterval);
      startAutoSlide();
    }

    startAutoSlide();
  }

  const currentLang = getLanguage();
  applyTranslations(currentLang);

  const langToggle = document.getElementById("languageToggle");
  if (langToggle) {
    langToggle.checked = currentLang === 'en';
    langToggle.addEventListener("change", (e) => {
      const newLang = e.target.checked ? 'en' : 'id';
      
      const flash = document.createElement("div");
      flash.style.position = "fixed";
      flash.style.top = "0";
      flash.style.left = "0";
      flash.style.width = "100%";
      flash.style.height = "100%";
      flash.style.backgroundColor = "rgba(255, 255, 255, 0.8)";
      flash.style.zIndex = "999999";
      flash.style.pointerEvents = "none";
      flash.style.transition = "opacity 0.15s ease-in-out";
      flash.style.opacity = "0";
      document.body.appendChild(flash);

      // Trigger reflow
      void flash.offsetWidth;
      flash.style.opacity = "1";
      
      setTimeout(() => {
        setLanguage(newLang);
        
        document.dispatchEvent(new Event("refreshLibrary"));
        document.dispatchEvent(new CustomEvent("languageChanged", { detail: { lang: newLang } }));
        
        const authBtnText = document.querySelector("#authBtn .text");
        if (authBtnText) authBtnText.textContent = getTranslation("logout");
        
        flash.style.opacity = "0";
        setTimeout(() => flash.remove(), 200);
      }, 150);
    });
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initMain);
} else {
  initMain();
}

initFooter();
initFloatingNav();
