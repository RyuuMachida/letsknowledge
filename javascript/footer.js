import { getTranslation } from "./i18n.js";

export function initFooter() {
  if (document.getElementById("king-footer")) return;

  const style = document.createElement("style");
  style.innerHTML = `
    #king-footer {
      background-color: #ffffff;
      border-top: 1px solid #e5e7eb;
      padding: 50px 20px 24px;
      margin-top: 80px; 
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      font-family: inherit;
    }
    .footer-content {
      max-width: 600px;
      margin-bottom: 35px;
    }
    .footer-brand {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      margin-bottom: 12px;
    }
    .footer-desc {
      color: #6b7280;
      font-size: 0.9rem;
      line-height: 1.6;
      margin: 0;
    }
    .footer-links {
      display: flex;
      gap: 25px;
      margin-bottom: 35px;
      flex-wrap: wrap;
      justify-content: center;
    }
    .footer-links a {
      color: #4b5563;
      text-decoration: none;
      font-size: 0.9rem;
      font-weight: 600;
      transition: color 0.2s, transform 0.2s;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .footer-links a:hover {
      color: #111827;
      transform: translateY(-2px);
    }
    .footer-bottom {
      width: 100%;
      max-width: 1000px;
      border-top: 1px solid #f3f4f6;
      padding-top: 24px;
      color: #9ca3af;
      font-size: 0.8rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 10px;
    }
    @media (max-width: 600px) {
      .footer-bottom {
        justify-content: center;
        text-align: center;
      }
    }
  `;
  document.head.appendChild(style);

  const footer = document.createElement("footer");
  footer.id = "king-footer";

  const currentYear = new Date().getFullYear();

  footer.innerHTML = `
    <div class="footer-content">
      <div class="footer-brand">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="width: 28px; height: 28px; color: #111827;">
          <path stroke-linecap="round" stroke-linejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09l2.846.813-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a2.25 2.25 0 0 0-1.506-1.506L15.2 7l1.035-.259a2.25 2.25 0 0 0 1.506-1.506L18 4.2l.259 1.035a2.25 2.25 0 0 0 1.506 1.506L20.8 7l-1.035.259a2.25 2.25 0 0 0-1.506 1.506Z" />
        </svg>
        <span style="font-size: 1.5rem; letter-spacing: -0.5px">
          <span style="font-weight: 800; color: #111827">lets</span><span style="font-weight: 400; color: #4b5563">knowledge.</span>
        </span>
      </div>
      <p class="footer-desc" data-i18n="footer_desc">${getTranslation("footer_desc")}</p>
    </div>
    
    <div class="footer-links">
      <a href="home.html" data-i18n="footer_home">${getTranslation("footer_home")}</a>
      <a href="perpus.html" data-i18n="footer_library">${getTranslation("footer_library")}</a>
      <a href="riwayat.html" data-i18n="footer_history">${getTranslation("footer_history")}</a>
    </div>

    <div class="footer-bottom">
      <span>&copy; ${currentYear} letsknowledge. All rights reserved.</span>
      <span style="display: flex; align-items: center; gap: 6px;">
        Developed by 
        <a href="https://github.com/RyuuMachida" target="_blank" title="Kunjungi GitHub RyuuMachida" style="display: flex; align-items: center; gap: 6px; text-decoration: none; color: #111827;">
          <img src="assets/dev.jpeg" alt="ryuumachida" style="width: 22px; height: 22px; border-radius: 50%; object-fit: cover; border: 1px solid #e5e7eb;">
          <strong style="font-weight: 800;">RyuuMachida</strong>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="#24292e" style="width: 11px; height: 11px;">
            <path d="M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.31 2.69.94 0 .67.01 1.3.01 1.49 0 .21-.15.45-.55.38A7.995 7.995 0 0 1 0 8c0-4.42 3.58-8 8-8Z"></path>
          </svg>
        </a>
      </span>
    </div>
  `;

  document.body.appendChild(footer);
}
