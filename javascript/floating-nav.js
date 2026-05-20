import { showLoadingAndExecute } from "./utils.js";

export function initFloatingNav() {
  const floatingNav = document.getElementById("floatingNav");

  if (floatingNav) {
    floatingNav.style.touchAction = "none";

    let currentFile = window.location.pathname.split("/").pop() || "home.html";
    
    if (currentFile === "" || currentFile === "/") currentFile = "home";
    if (currentFile.endsWith(".html")) currentFile = currentFile.replace(".html", "");
    
    const navItems = floatingNav.querySelectorAll(".nav-item");

    navItems.forEach((item) => {
      const href = item.getAttribute("href");
      if (href) {
        let hrefFile = href.endsWith(".html") ? href.replace(".html", "") : href;
        if (hrefFile === currentFile) {
          item.classList.add("active");
        }
      }
    });

    let isDraggingNav = false;
    let isMoved = false;
    let startX, startY, initialLeft, initialTop;

    const dragStart = (e) => {
      isDraggingNav = true;
      isMoved = false;

      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;

      startX = clientX;
      startY = clientY;

      const rect = floatingNav.getBoundingClientRect();
      initialLeft = rect.left;
      initialTop = rect.top;

      floatingNav.style.transform = "none";
      floatingNav.style.right = "auto";
      floatingNav.style.left = initialLeft + "px";
      floatingNav.style.top = initialTop + "px";
      floatingNav.style.transition = "none";
    };

    const dragMove = (e) => {
      if (!isDraggingNav) return;

      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;

      const dx = clientX - startX;
      const dy = clientY - startY;

      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
        isMoved = true;
        floatingNav.style.left = initialLeft + dx + "px";
        floatingNav.style.top = initialTop + dy + "px";
      }
    };

    const dragEnd = () => {
      isDraggingNav = false;
    };

    floatingNav.addEventListener("mousedown", dragStart);
    document.addEventListener("mousemove", dragMove);
    document.addEventListener("mouseup", dragEnd);

    floatingNav.addEventListener("touchstart", dragStart, { passive: false });
    document.addEventListener("touchmove", dragMove, { passive: false });
    document.addEventListener("touchend", dragEnd);

    const navLinks = floatingNav.querySelectorAll("a.nav-item");
    navLinks.forEach((link) => {
      link.addEventListener("click", (e) => {
        if (isMoved) {
          e.preventDefault();
          e.stopPropagation();
          return;
        }

        e.preventDefault();
        const targetUrl = link.getAttribute("href");
        // Normalize target URL for comparison
        let targetFile = targetUrl.endsWith(".html") ? targetUrl.replace(".html", "") : targetUrl;
        if (targetFile === currentFile) return;

        showLoadingAndExecute(() => {
          window.location.href = targetUrl;
        }, 2000);
      });
    });
  } 

  const settingsModal = document.getElementById("settingsModal");
  const openSettingsBtn = document.getElementById("openSettingsBtn");
  const closeSettingsBtn = document.getElementById("closeSettingsBtn");

  if (openSettingsBtn && settingsModal) {
    openSettingsBtn.addEventListener("click", () => {
      showLoadingAndExecute(() => {
        settingsModal.classList.remove("hidden");
      }, 500);
    });

    closeSettingsBtn.addEventListener("click", () => {
      settingsModal.classList.add("hidden");
    });

    settingsModal.addEventListener("click", (e) => {
      if (e.target === settingsModal) {
        settingsModal.classList.add("hidden");
      }
    });
  }
}
