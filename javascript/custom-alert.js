const AppAlert = {
  icons: {
    success: `<svg fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="#059669" style="width: 45px; height: 45px;"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>`,
    error: `<svg fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="#dc2626" style="width: 45px; height: 45px;"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>`,
    info: `<svg fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="#2563eb" style="width: 45px; height: 45px;"><path stroke-linecap="round" stroke-linejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" /></svg>`,
    confirm: `<svg fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="#d97706" style="width: 45px; height: 45px;"><path stroke-linecap="round" stroke-linejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" /></svg>`,
  },

  init() {
    if (document.getElementById("globalAppAlert")) return;

    const modalHTML = `
      <div id="globalAppAlert" class="app-alert-overlay hidden">
        <div class="app-alert-box">
          <div id="appAlertIcon" class="app-alert-icon"></div>
          <h3 id="appAlertTitle" class="app-alert-title">Title</h3>
          <p id="appAlertText" class="app-alert-text">Message goes here...</p>
          
          <div class="app-alert-actions">
            <button id="appAlertBtnCancel" class="btn-secondary hidden" style="flex: 1; padding: 10px;">Batal</button>
            <button id="appAlertBtnOk" class="btn-primary" style="flex: 1; padding: 10px;">OK</button>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML("beforeend", modalHTML);
  },

  _close() {
    const overlay = document.getElementById("globalAppAlert");
    const alertBox = overlay.querySelector(".app-alert-box");

    anime({
      targets: alertBox,
      scale: [1, 0.8],
      opacity: [1, 0],
      duration: 200,
      easing: "easeInQuad",
      complete: () => {
        if (overlay) overlay.classList.add("hidden");
      },
    });
  },

  _animateBounce(alertBox) {
    alertBox.style.transition = "none";
    alertBox.style.transform = "scale(0)";
    alertBox.style.opacity = "0";

    anime({
      targets: alertBox,
      scale: [0.5, 1],
      opacity: [0, 1],
      duration: 800,
      easing: "easeOutElastic(1, .6)",
    });
  },

  // 1. ALERT Success, Error, Info
  show(title, text, type = "info") {
    this.init();
    return new Promise((resolve) => {
      const overlay = document.getElementById("globalAppAlert");
      const alertBox = overlay.querySelector(".app-alert-box");
      const iconEl = document.getElementById("appAlertIcon");
      const titleEl = document.getElementById("appAlertTitle");
      const textEl = document.getElementById("appAlertText");
      const btnOk = document.getElementById("appAlertBtnOk");
      const btnCancel = document.getElementById("appAlertBtnCancel");
 
      iconEl.innerHTML = this.icons[type] || this.icons.info;

      titleEl.innerHTML = title;
      textEl.innerHTML = text;

      btnCancel.classList.add("hidden");

      btnOk.className = type === "error" ? "btn-primary1 bg-red" : "btn-primary1";
      btnOk.textContent = "OK Mengerti";

      overlay.classList.remove("hidden");

      this._animateBounce(alertBox);

      const newBtnOk = btnOk.cloneNode(true);
      btnOk.parentNode.replaceChild(newBtnOk, btnOk);

      newBtnOk.addEventListener("click", () => {
        this._close();
        resolve(true);
      });
    });
  },

  // 2. ALERT KONFIRMASI
  confirm(title, text) {
    this.init();
    return new Promise((resolve) => {
      const overlay = document.getElementById("globalAppAlert");
      const alertBox = overlay.querySelector(".app-alert-box");
      const iconEl = document.getElementById("appAlertIcon");
      const titleEl = document.getElementById("appAlertTitle");
      const textEl = document.getElementById("appAlertText");
      const btnOk = document.getElementById("appAlertBtnOk");
      const btnCancel = document.getElementById("appAlertBtnCancel");

      iconEl.innerHTML = this.icons.confirm;

      titleEl.innerHTML = title;
      textEl.innerHTML = text;

      btnCancel.classList.remove("hidden");
      btnOk.className = "btn-primary";
      btnOk.textContent = "Ya, Lanjutkan";

      overlay.classList.remove("hidden");

      this._animateBounce(alertBox);

      const newBtnOk = btnOk.cloneNode(true);
      btnOk.parentNode.replaceChild(newBtnOk, btnOk);

      const newBtnCancel = btnCancel.cloneNode(true);
      btnCancel.parentNode.replaceChild(newBtnCancel, btnCancel);

      newBtnCancel.addEventListener("click", () => {
        this._close();
        resolve(false);
      });

      newBtnOk.addEventListener("click", () => {
        this._close();
        resolve(true);
      });
    });
  },
};

window.AppAlert = AppAlert;
