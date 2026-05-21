import { db } from "./firebase-config.js";
import { getTranslation } from "./i18n.js";
import {
  collection,
  addDoc,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteField,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  increment,
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// State Global Chat
let currentUser = null;
let currentUserRole = "mahasiswa";
let activeChatStudentId = null; // Menyimpan ID mahasiswa yang sedang dichat (jika peran admin/staf)
let unsubChatList = null;       // Unsubscribe listener daftar chat (admin)
let unsubMessages = null;       // Unsubscribe listener pesan aktif
let unsubChatDoc = null;        // Unsubscribe listener dokumen chat (untuk typing indicator, dll)
let unsubPresence = null;       // Unsubscribe listener presence status (Header online)
let isChatOpen = false;
let typingTimeout = null;

// State edit pesan
let editingMessageId = null;   // ID dokumen pesan yang sedang diedit
let editingStudentId = null;   // studentId room chat yang sedang diedit

// Listener unload untuk membersihkan presence
const handleBeforeUnload = () => setUserOnlineStatus(false);
const handleVisibilityChange = () => {
  if (document.visibilityState === 'hidden') setUserOnlineStatus(false);
  else setUserOnlineStatus(true);
};

// Elemen DOM Chat Melayang
let chatBtn = null;
let chatPanel = null;

/**
 * Mendapatkan SVG avatar profil default letsknowledge.
 * @param {string} size - Ukuran lebar dan tinggi SVG
 */
function getDefaultAvatarSVG(size = "22px") {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#111827" style="width: ${size}; height: ${size};"><path fill-rule="evenodd" d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z" clip-rule="evenodd"></path></svg>`;
}

/**
 * Mendapatkan SVG Logo Utama Letsknowledge.
 * @param {string} size - Ukuran lebar dan tinggi SVG
 */
function getLetsknowledgeLogoSVG(size = "24px") {
  return `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="width: ${size}; height: ${size}; color: #111827;">
    <path stroke-linecap="round" stroke-linejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09l2.846.813-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a2.25 2.25 0 0 0-1.506-1.506L15.2 7l1.035-.259a2.25 2.25 0 0 0 1.506-1.506L18 4.2l.259 1.035a2.25 2.25 0 0 0 1.506 1.506L20.8 7l-1.035.259a2.25 2.25 0 0 0-1.506 1.506Z" />
  </svg>`;
}

/**
 * Update Status Online pengguna ke Firestore
 */
async function setUserOnlineStatus(isOnline) {
  if (!currentUser) return;
  try {
    const userRef = doc(db, "users", currentUser.uid);
    await updateDoc(userRef, { isOnline: isOnline });
  } catch (error) {
    console.warn("Gagal update status online:", error);
  }
}

/**
 * Inisialisasi Fitur Chat
 * @param {Object} firebaseUser - Objek user dari Firebase Auth
 */
export async function initChat(firebaseUser) {
  if (!firebaseUser) return;
  
  // Bersihkan chat lama jika ada terlebih dahulu (untuk menghindari currentUser ditimpa null)
  destroyChat();

  currentUser = firebaseUser;
  currentUserRole = "mahasiswa";
  
  // Tentukan Pangkat/Role Pengguna
  try {
    const userRef = doc(db, "users", firebaseUser.uid);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      const userData = userSnap.data();
      if (userData.thekingoflibrary === true || userData.role === "developer") {
        currentUserRole = "developer";
      } else if (userData.role) {
        currentUserRole = userData.role.toLowerCase();
      }
    }
  } catch (error) {
    console.warn("Gagal mendapatkan role untuk chat:", error);
  }

  // Buat DOM Obrolan
  createChatDOM();
  
  // Buka Pendengar Notifikasi (Lencana Unread) Real-Time
  listenToUnreadNotifications();

  // Set status online dan pasang event listener
  setUserOnlineStatus(true);
  window.addEventListener("beforeunload", handleBeforeUnload);
  document.addEventListener("visibilitychange", handleVisibilityChange);
}

/**
 * Bersihkan Obrolan & Hapus Pendengar (Cleanup)
 */
export function destroyChat() {
  stopAllListeners();
  if (chatBtn) {
    chatBtn.remove();
    chatBtn = null;
  }
  if (chatPanel) {
    chatPanel.remove();
    chatPanel = null;
  }
  
  // Set offline
  setUserOnlineStatus(false);
  window.removeEventListener("beforeunload", handleBeforeUnload);
  document.removeEventListener("visibilitychange", handleVisibilityChange);

  currentUser = null;
  currentUserRole = "mahasiswa";
  activeChatStudentId = null;
  isChatOpen = false;
}

/**
 * Hentikan Seluruh Listener Firestore Real-Time
 */
function stopAllListeners() {
  if (unsubChatList) { unsubChatList(); unsubChatList = null; }
  if (unsubMessages) { unsubMessages(); unsubMessages = null; }
  if (unsubChatDoc)  { unsubChatDoc();  unsubChatDoc = null;  }
  if (unsubPresence) { unsubPresence(); unsubPresence = null; }
}

/**
 * Membuat Elemen DOM Chat Melayang
 */
function createChatDOM() {
  // 1. Buat Tombol Melayang
  chatBtn = document.createElement("button");
  chatBtn.className = "wa-chat-btn";
  chatBtn.id = "waChatBtn";
  chatBtn.title = "Chat dengan Kami";
  chatBtn.innerHTML = `
    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M12.003 2c-5.502 0-9.997 4.478-9.997 9.958a9.882 9.882 0 0 0 1.516 5.253L2.003 22l5.034-1.47a9.897 9.897 0 0 0 4.966 1.328c5.502 0 9.997-4.478 9.997-9.958S17.505 2 12.003 2zm0 1.66c4.593 0 8.337 3.727 8.337 8.298s-3.744 8.298-8.337 8.298a8.272 8.272 0 0 1-4.223-1.156l-.303-.178-3.13.914.937-3.037-.197-.312A8.257 8.257 0 0 1 3.667 11.96c0-4.57 3.743-8.297 8.336-8.297z"/>
    </svg>
    <div class="wa-chat-badge hidden" id="waChatBadge">0</div>
  `;
  document.body.appendChild(chatBtn);

  // 2. Buat Panel Chat
  chatPanel = document.createElement("div");
  chatPanel.className = "wa-chat-panel";
  chatPanel.id = "waChatPanel";
  document.body.appendChild(chatPanel);

  // Pasang Listener Klik
  chatBtn.addEventListener("click", toggleChatWindow);
}

/**
 * Membuka/Menutup Panel Chat
 */
function toggleChatWindow() {
  isChatOpen = !isChatOpen;
  
  if (isChatOpen) {
    chatPanel.classList.add("active");
    chatBtn.classList.remove("pulsing");
    
    // Suara klik ringan
    playPopSound();
    
    // Muat Tampilan Sesuai Role
    renderChatInterface();
  } else {
    chatPanel.classList.remove("active");
    stopAllListeners();
    activeChatStudentId = null;
  }
}

/**
 * Suara Notifikasi Ringan Tanpa File Eksternal
 */
function playPopSound() {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(450, audioCtx.currentTime); // Hz
    oscillator.frequency.exponentialRampToValueAtTime(800, audioCtx.currentTime + 0.1);
    
    gainNode.gain.setValueAtTime(0.04, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);
    
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 0.15);
  } catch (e) {
    // Abaikan jika browser memblokir audio otomatis
  }
}

/**
 * Suara Notifikasi Kirim Pesan (Swoosh)
 */
function playSendSound() {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(600, audioCtx.currentTime); // Hz sedikit lebih tinggi
    oscillator.frequency.exponentialRampToValueAtTime(300, audioCtx.currentTime + 0.1);
    
    gainNode.gain.setValueAtTime(0.02, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);
    
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 0.15);
  } catch (e) {
    // Abaikan
  }
}

/**
 * Menampilkan Antarmuka Chat Berdasarkan Peran Pengguna
 */
function renderChatInterface() {
  if (!currentUser) return;
  const isStaff = ["developer", "admin", "pustakawan"].includes(currentUserRole);

  if (isStaff) {
    if (activeChatStudentId) {
      // Jika admin sedang berada di dalam room chat tertentu
      openConversation(activeChatStudentId);
    } else {
      // Jika admin baru membuka panel, tunjukkan Inbox list
      renderAdminInbox();
    }
  } else {
    // Jika mahasiswa, langsung buka room chat miliknya
    openConversation(currentUser.uid);
  }
}

/**
 * ==========================================
 * 1. ALUR PENGGUNA (MAHASISWA) & ROOM DETAIL
 * ==========================================
 */

/**
 * Membuka Percakapan Tertentu (Detail Chat)
 * @param {string} studentId - UID mahasiswa pemilik obrolan
 */
async function openConversation(studentId) {
  stopAllListeners();
  
  const isStaff = ["developer", "admin", "pustakawan"].includes(currentUserRole);
  let studentName = getTranslation("chat_support_title");
  let studentEmail = "";

  // Dapatkan Detail Profil
  try {
    const docRef = doc(db, "users", studentId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      studentName = docSnap.data().displayName || docSnap.data().userName || "Mahasiswa";
      studentEmail = docSnap.data().email || "";
    }
  } catch (err) {
    console.error("Gagal mendapatkan info user obrolan:", err);
  }

  // Set Dokumen Aktif
  activeChatStudentId = studentId;

  // 1. Gambar Struktur Layar WA
  chatPanel.innerHTML = `
    <!-- Header WA -->
    <header class="wa-chat-header">
      <div class="wa-chat-header-left">
        ${isStaff ? `
          <button class="wa-chat-back-btn" id="waChatBackBtn" title="Kembali">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        ` : ""}
        <div class="wa-chat-avatar">
          ${isStaff ? getDefaultAvatarSVG("24px") : `
            <img src="assets/dev.jpeg" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" style="width: 100%; height: 100%; object-fit: cover;" />
            <div style="display: none; width: 100%; height: 100%; align-items: center; justify-content: center;">
              ${getDefaultAvatarSVG("24px")}
            </div>
          `}
        </div>
        <div class="wa-chat-header-info">
          <span class="wa-chat-header-title">${isStaff ? studentName : getTranslation("chat_support_title")}</span>
          <span class="wa-chat-header-subtitle" id="waHeaderStatus">
            <span id="waHeaderPresenceContainer">
              <span class="wa-chat-online-dot"></span> <span id="waHeaderTextStatus">${getTranslation("chat_online")}</span>
            </span>
            <span id="waHeaderTypingContainer" class="hidden" style="font-style: italic; color: #a7f3d0; font-weight: 600;">
              ${getTranslation("chat_typing") || "Mengetik..."}
            </span>
          </span>
        </div>
      </div>
      <button class="wa-chat-close-btn" id="waChatCloseBtn" title="${getTranslation("close_btn")}">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </header>

    <!-- Body Pesan WA -->
    <div class="wa-chat-body wa-scrollbar" id="waChatBody">
      <div class="wa-chat-messages-container" id="waChatMessages">
        <div class="wa-chat-system-msg">Pesan Enkripsi letsknowledge.</div>
      </div>
      <!-- Indikator Mengetik -->
      <div class="wa-typing-indicator hidden" id="waTypingIndicator">
        <span></span><span></span><span></span>
      </div>
    </div>

    <!-- Edit Bar (tersembunyi secara default) -->
    <div class="wa-chat-edit-bar hidden" id="waEditBar">
      <div class="wa-chat-edit-bar-content">
        <span class="wa-chat-edit-label">✏️ Edit Pesan</span>
        <span class="wa-chat-edit-text" id="waEditBarText"></span>
      </div>
      <button class="wa-chat-edit-cancel" id="waEditCancelBtn" title="Batal">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>

    <!-- Footer Input WA -->
    <footer class="wa-chat-footer">
      <div class="wa-chat-input-container">
        <input type="text" id="waChatInput" placeholder="${getTranslation("chat_input_placeholder")}" autocomplete="off"/>
      </div>
      <button class="wa-chat-send-btn" id="waChatSendBtn" title="Kirim">
        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
        </svg>
      </button>
    </footer>
  `;

  const inputEl = document.getElementById("waChatInput");
  const sendBtn = document.getElementById("waChatSendBtn");
  const closeBtn = document.getElementById("waChatCloseBtn");
  const backBtn = document.getElementById("waChatBackBtn");
  const editCancelBtn = document.getElementById("waEditCancelBtn");

  // Pasang Handler
  sendBtn.addEventListener("click", () => sendMessage(studentId));
  inputEl.addEventListener("keydown", (e) => {
    if (e.key === "Enter") sendMessage(studentId);
  });
  inputEl.addEventListener("input", () => triggerTypingStatus(studentId));

  closeBtn.addEventListener("click", toggleChatWindow);
  if (backBtn) {
    backBtn.addEventListener("click", () => {
      cancelEdit();
      activeChatStudentId = null;
      renderAdminInbox();
    });
  }
  if (editCancelBtn) {
    editCancelBtn.addEventListener("click", cancelEdit);
  }

  // 2. Beritahu Firestore & DOM Bahwa Pesan Telah Dibaca
  //    - Langsung reset badge DOM supaya tidak perlu nunggu listener
  //    - Set unreadCount di Firestore
  //    - Restart listener badge global supaya update real-time lagi
  resetUnreadCount(studentId);
  updateGlobalBadge(0);
  listenToUnreadNotifications(); // restart karena stopAllListeners() tadi mematikannya

  // 3. Dengarkan Pesan Masuk Secara Real-Time
  listenToMessages(studentId);

  // 4. Dengarkan Status Mengetik Pihak Lawan
  listenToChatDocument(studentId);

  // Jalankan Listener Kehadiran (Presence) sesuai peran
  if (isStaff) {
    // Admin melihat status online 1 mahasiswa
    listenToStudentPresence(studentId);
  } else {
    // Mahasiswa melihat berapa admin yang online
    listenToStaffPresence();
  }

  // Jika belum ada chat document, buat (hanya untuk mahasiswa)
  if (!isStaff) {
    checkAndCreateChatDoc(studentId);
  }
  // Scroll Otomatis ke Bawah
  scrollToBottom();
}

/**
 * Mengirimkan Pesan Ke Firestore
 * @param {string} studentId - UID mahasiswa room chat
 */
async function sendMessage(studentId) {
  const inputEl = document.getElementById("waChatInput");
  const text = inputEl.value.trim();
  if (!text) return;

  // Jika sedang dalam mode edit, commit edit bukan kirim baru
  if (editingMessageId && editingStudentId === studentId) {
    await commitEdit(studentId, editingMessageId, text);
    inputEl.value = "";
    cancelEdit();
    return;
  }

  // Kosongkan Kolom Input & Hentikan Status Mengetik
  inputEl.value = "";
  stopTyping(studentId);

  const isStaff = ["developer", "admin", "pustakawan"].includes(currentUserRole);
  
  let senderRoleText = null;
  if (isStaff) {
    if (currentUserRole === "developer") {
      senderRoleText = "THE KING";
    } else if (currentUserRole) {
      senderRoleText = currentUserRole.toUpperCase();
    } else {
      senderRoleText = "ADMIN";
    }
  }

  try {
    // 1. Tulis Objek Pesan Baru
    const messagesRef = collection(db, "chats", studentId, "messages");
    await addDoc(messagesRef, {
      senderId: currentUser.uid,
      senderName: currentUser.displayName || (isStaff ? "Support Team" : "Mahasiswa"),
      senderRole: senderRoleText,
      message: text,
      timestamp: serverTimestamp(),
      read: false,
    });

    // 2. Perbarui Dokumen Utama Chat Percakapan
    const chatDocRef = doc(db, "chats", studentId);
    
    // Periksa apakah dokumen chat sudah ada, jika belum buat baru
    const chatSnap = await getDoc(chatDocRef);
    if (!chatSnap.exists()) {
      await setDoc(chatDocRef, {
        userId: studentId,
        userName: isStaff ? "Mahasiswa" : (currentUser.displayName || "Mahasiswa"),
        userEmail: currentUser.email || "",
        lastMessage: text,
        lastMessageTime: serverTimestamp(),
        unreadCountAdmin: isStaff ? 0 : 1,
        unreadCountUser: isStaff ? 1 : 0,
        typingStatus: "none",
      });
    } else {
      const updateData = {
        lastMessage: text,
        lastMessageTime: serverTimestamp(),
      };
      
      // Tambah Lencana Unread
      if (isStaff) {
        updateData.unreadCountUser = increment(1);
        updateData.unreadCountAdmin = 0;
      } else {
        updateData.unreadCountAdmin = increment(1);
        updateData.unreadCountUser = 0;
      }
      
      await updateDoc(chatDocRef, updateData);
    }

    // Mainkan suara kirim pesan sukses (Swoosh)
    playSendSound();

    // Langsung pindah scroll ke paling bawah
    scrollToBottom();
  } catch (error) {
    console.error("Gagal mengirim pesan:", error);
  }
}

/**
 * Mendengarkan Alur Pesan Masuk/Keluar Real-Time
 * @param {string} studentId - UID mahasiswa room chat
 */
function listenToMessages(studentId) {
  const q = query(
    collection(db, "chats", studentId, "messages"),
    orderBy("timestamp", "asc")
  );

  unsubMessages = onSnapshot(q, (snapshot) => {
    const msgContainer = document.getElementById("waChatMessages");
    if (!msgContainer) return;

    // Jaga Header System Info
    msgContainer.innerHTML = `<div class="wa-chat-system-msg">Pesan Enkripsi letsknowledge.</div>`;

    snapshot.forEach((messageDoc) => {
      const data = messageDoc.data();
      const msgId = messageDoc.id;
      const currentIsStaff = ["developer", "admin", "pustakawan"].includes(currentUserRole);

      // Apakah pengirim pesan ini adalah staf/admin?
      const senderIsStaff = data.senderRole !== null && data.senderRole !== undefined;

      // isOutgoing:
      // - Jika viewer adalah STAF: semua pesan dari staf mana pun tampil di kanan (outgoing),
      //   hanya pesan mahasiswa yang tampil di kiri (incoming).
      // - Jika viewer adalah MAHASISWA: hanya pesan miliknya sendiri yang tampil di kanan.
      let isOutgoing;
      if (currentIsStaff) {
        isOutgoing = senderIsStaff; // semua pesan staf → kanan
      } else {
        isOutgoing = data.senderId === currentUser.uid; // hanya pesan sendiri → kanan
      }

      // Hitung apakah masih dalam jendela aksi (3 menit dari timestamp pesan)
      const MSG_WINDOW_MS = 3 * 60 * 1000;
      let msElapsed = Infinity;
      if (data.timestamp) {
        msElapsed = Date.now() - data.timestamp.toDate().getTime();
      }
      const withinWindow = msElapsed <= MSG_WINDOW_MS;
      const isDeleted = data.deleted === true;

      // Header identitas pengirim:
      // - Di sisi MAHASISWA: tampilkan nama + badge role untuk setiap pesan masuk dari staf.
      // - Di sisi STAF: tampilkan nama + badge untuk SEMUA pesan staf (baik kiri maupun kanan),
      //   sehingga pustakawan bisa tahu siapa yang sudah menjawab, termasuk developer.
      let senderHeaderHtml = "";
      if (senderIsStaff) {
        const role = data.senderRole || "ADMIN";
        senderHeaderHtml = `
          <div style="display:flex;align-items:center;gap:5px;margin-bottom:4px;">
            <span style="font-size:0.75rem;font-weight:800;color:#111827;">${escapeHTML(data.senderName || "Support")}</span>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#3b82f6" style="width:13px;height:13px;flex-shrink:0;">
              <path fill-rule="evenodd" d="M8.603 3.799A4.49 4.49 0 0 1 12 2.25c1.357 0 2.573.6 3.397 1.549a4.49 4.49 0 0 1 3.498 1.307 4.491 4.491 0 0 1 1.307 3.497A4.49 4.49 0 0 1 21.75 12a4.49 4.49 0 0 1-1.549 3.397 4.491 4.491 0 0 1-1.307 3.497 4.491 4.491 0 0 1-3.497 1.307A4.49 4.49 0 0 1 12 21.75a4.49 4.49 0 0 1-3.397-1.549 4.49 4.49 0 0 1-3.498-1.306 4.491 4.491 0 0 1-1.307-3.498A4.49 4.49 0 0 1 2.25 12c0-1.357.6-2.573 1.549-3.397a4.49 4.49 0 0 1 1.307-3.497 4.49 4.49 0 0 1 3.497-1.307Zm7.007 6.387a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z" clip-rule="evenodd"/>
            </svg>
            <span style="background:#111827;color:#fff;padding:1.5px 6px;border-radius:4px;font-size:0.55rem;font-weight:800;letter-spacing:0.5px;text-transform:uppercase;font-family:monospace;">${role}</span>
          </div>
        `;
      }
      
      // Format Waktu Obrolan
      let timeStr = "";
      if (data.timestamp) {
        const dateObj = data.timestamp.toDate();
        const hrs = String(dateObj.getHours()).padStart(2, '0');
        const mins = String(dateObj.getMinutes()).padStart(2, '0');
        timeStr = `${hrs}:${mins}`;
      } else {
        timeStr = "...";
      }

      // Render konten gelembung (beda tampilan jika dihapus)
      const editCount = data.editCount || 0;
      const canEdit = isOutgoing && withinWindow && !isDeleted && editCount < 3;
      const canDelete = isOutgoing && withinWindow && !isDeleted;

      let bubbleContentHtml;
      if (isDeleted) {
        bubbleContentHtml = `
          <div class="wa-bubble-content wa-deleted-msg">
            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8zm-1-5h2v2h-2zm0-8h2v6h-2z" fill="currentColor" opacity="0"/>
              <path d="M18.364 5.636A9 9 0 1 0 5.636 18.364 9 9 0 0 0 18.364 5.636zM12 4a8 8 0 1 1-8 8 8 8 0 0 1 8-8zm-1 4h2v5h-2zm0 6h2v2h-2z" fill="currentColor"/>
            </svg>
            Pesan ini telah dihapus
          </div>`;
      } else {
        const editedTag = data.edited ? `<span class="wa-edited-tag">(diedit)</span>` : "";
        bubbleContentHtml = `<div class="wa-bubble-content">${escapeHTML(data.message)}${editedTag}</div>`;
      }

      // Tombol opsi (titik tiga) — hanya muncul di pesan sendiri & masih dalam batas waktu
      const optionsBtnHtml = (canEdit || canDelete) ? `
        <button class="wa-bubble-options-btn" data-msgid="${msgId}">
          <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/>
          </svg>
        </button>
        <div class="wa-bubble-menu hidden" id="menu-${msgId}">
          ${canEdit ? `
          <button class="wa-bubble-menu-item" data-action="edit" data-msgid="${msgId}">
            <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
            Edit
          </button>` : ""}
          ${canDelete ? `
          <button class="wa-bubble-menu-item danger" data-action="delete" data-msgid="${msgId}">
            <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
            Hapus
          </button>` : ""}
        </div>` : "";

      const bubbleWrap = document.createElement("div");
      // Tambahkan class 'staff-bubble' pada pesan dari staf agar tampilan berbeda dari mahasiswa
      const staffBubbleClass = senderIsStaff ? " staff-bubble" : "";
      bubbleWrap.className = `wa-bubble-wrap ${isOutgoing ? "outgoing" : "incoming"}${staffBubbleClass}`;
      bubbleWrap.innerHTML = `
        <div class="wa-bubble">
          ${senderHeaderHtml}
          ${bubbleContentHtml}
          ${optionsBtnHtml}
          <div class="wa-bubble-meta">
            <span>${timeStr}</span>
            ${isOutgoing ? `
              <span class="wa-bubble-ticks">
                <svg viewBox="0 0 16 15" width="16" height="15"><path fill="currentColor" d="M15.01 3.316l-.478-.372a.365.365 0 0 0-.51.063L8.666 9.879a.32.32 0 0 1-.484.033L5.438 7.162a.365.365 0 0 0-.51.015l-.426.421a.365.365 0 0 0-.007.51l3.36 3.41a.32.32 0 0 0 .48.008l6.732-7.71a.365.365 0 0 0-.057-.51zM11.666 3.316l-.478-.372a.365.365 0 0 0-.51.063l-5.356 6.182-.266-.277a.365.365 0 0 0-.51.015l-.426.421a.365.365 0 0 0-.007.51l1.19 1.208a.32.32 0 0 0 .48.008l5.942-6.846a.365.365 0 0 0-.057-.51z"/></svg>
              </span>
            ` : ""}
          </div>
        </div>
      `;

      // Event listener untuk tombol opsi & context menu
      if (canEdit || canDelete) {
        const optBtn = bubbleWrap.querySelector(".wa-bubble-options-btn");
        const menu = bubbleWrap.querySelector(`#menu-${msgId}`);
        if (optBtn && menu) {
          optBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            // Tutup menu lain yang terbuka
            document.querySelectorAll(".wa-bubble-menu").forEach(m => {
              if (m !== menu) m.classList.add("hidden");
            });
            menu.classList.toggle("hidden");
          });
          menu.querySelectorAll(".wa-bubble-menu-item").forEach((btn) => {
            btn.addEventListener("click", (e) => {
              e.stopPropagation();
              const action = btn.dataset.action;
              menu.classList.add("hidden");
              if (action === "delete") {
                deleteMessage(studentId, msgId);
              } else if (action === "edit") {
                startEdit(studentId, msgId, data.message);
              }
            });
          });
        }
      }

      msgContainer.appendChild(bubbleWrap);

      // Tutup semua context menu saat klik di luar
      document.addEventListener("click", () => {
        document.querySelectorAll(".wa-bubble-menu").forEach(m => m.classList.add("hidden"));
      }, { once: true });
    });

    // Reset hitungan unread secara berkala saat pesan dibaca di layar
    resetUnreadCount(studentId);

    // Scroll Mulus ke Bawah
    scrollToBottom();
  }, (error) => {
    console.warn("Gagal mendengarkan pesan real-time:", error);
  });
}

/**
 * Mendengarkan Dokumen Chat untuk Mendapatkan Status Mengetik (Typing Indicator)
 * @param {string} studentId - UID mahasiswa room chat
 */
function listenToChatDocument(studentId) {
  const docRef = doc(db, "chats", studentId);
  
  unsubChatDoc = onSnapshot(docRef, (docSnap) => {
    const typingIndicator = document.getElementById("waTypingIndicator");
    const statusTextEl = document.getElementById("waHeaderStatus");
    if (!docSnap.exists() || !typingIndicator) return;

    const data = docSnap.data();
    const status = data.typingStatus || "none";
    const isStaff = ["developer", "admin", "pustakawan"].includes(currentUserRole);

    let isOtherPartyTyping = false;
    if (isStaff && status === "student") {
      isOtherPartyTyping = true;
    } else if (!isStaff && status === "staff") {
      isOtherPartyTyping = true;
    }

    if (isOtherPartyTyping) {
      typingIndicator.classList.remove("hidden");
      const presenceCont = document.getElementById("waHeaderPresenceContainer");
      const typingCont = document.getElementById("waHeaderTypingContainer");
      if (presenceCont) presenceCont.classList.add("hidden");
      if (typingCont) typingCont.classList.remove("hidden");
      scrollToBottom();
    } else {
      typingIndicator.classList.add("hidden");
      const presenceCont = document.getElementById("waHeaderPresenceContainer");
      const typingCont = document.getElementById("waHeaderTypingContainer");
      if (presenceCont) presenceCont.classList.remove("hidden");
      if (typingCont) typingCont.classList.add("hidden");
    }
  }, (error) => {
    console.warn("Gagal mendengarkan status dokumen chat:", error);
  });
}

/**
 * Pemicu Perubahan Status Mengetik
 * @param {string} studentId 
 */
function triggerTypingStatus(studentId) {
  const isStaff = ["developer", "admin", "pustakawan"].includes(currentUserRole);
  const typingRole = isStaff ? "staff" : "student";
  
  // Set Typing Status di Firestore
  const chatDocRef = doc(db, "chats", studentId);
  updateDoc(chatDocRef, { typingStatus: typingRole }).catch(() => {});

  // Set timeout pembersihan status jika berhenti mengetik selama 2.5 detik
  clearTimeout(typingTimeout);
  typingTimeout = setTimeout(() => {
    stopTyping(studentId);
  }, 2500);
}

/**
 * Hentikan Mengetik
 * @param {string} studentId 
 */
function stopTyping(studentId) {
  clearTimeout(typingTimeout);
  const chatDocRef = doc(db, "chats", studentId);
  updateDoc(chatDocRef, { typingStatus: "none" }).catch(() => {});
}

/**
 * Mengatur Ulang Jumlah Pesan Belum Dibaca ke 0
 * Langsung kirim updateDoc tanpa getDoc untuk kecepatan & kehandalan.
 * @param {string} studentId 
 */
function resetUnreadCount(studentId) {
  if (!studentId) return;
  const isStaff = ["developer", "admin", "pustakawan"].includes(currentUserRole);
  const chatDocRef = doc(db, "chats", studentId);

  if (isStaff) {
    updateDoc(chatDocRef, { unreadCountAdmin: 0 }).catch(() => {});
  } else {
    updateDoc(chatDocRef, { unreadCountUser: 0 }).catch(() => {});
  }
}

/**
 * Scroll Kontainer Obrolan ke Paling Bawah
 * Menargetkan semua elemen yang bisa scroll dalam panel chat.
 */
function scrollToBottom() {
  const doScroll = () => {
    // Elemen yang sebenarnya bisa scroll adalah messages container
    const msgContainer = document.getElementById("waChatMessages");
    const bodyEl = document.getElementById("waChatBody");

    if (msgContainer) {
      msgContainer.scrollTop = msgContainer.scrollHeight;
    }
    if (bodyEl) {
      bodyEl.scrollTop = bodyEl.scrollHeight;
    }
  };

  // Jalankan setelah browser selesai render DOM (lebih andal dari setTimeout saja)
  requestAnimationFrame(() => {
    doScroll();
    // Double-fire dengan delay kecil sebagai fallback (untuk animasi/layout lambat)
    setTimeout(doScroll, 80);
  });
}

/**
 * ==========================================
 * FITUR PRESENCE (Status Online)
 * ==========================================
 */

/**
 * Mendengarkan Status Kehadiran (isOnline) milik satu Mahasiswa tertentu.
 */
function listenToStudentPresence(studentId) {
  if (unsubPresence) { unsubPresence(); unsubPresence = null; }
  
  const docRef = doc(db, "users", studentId);
  unsubPresence = onSnapshot(docRef, (docSnap) => {
    const statusDot = document.querySelector(".wa-chat-online-dot");
    const statusText = document.getElementById("waHeaderTextStatus");
    if (!statusDot || !statusText) return;

    if (docSnap.exists() && docSnap.data().isOnline === true) {
      statusDot.style.backgroundColor = "#25d366";
      statusText.textContent = getTranslation("chat_online") || "Aktif";
    } else {
      statusDot.style.backgroundColor = "#9ca3af";
      statusText.textContent = "Offline";
    }
  }, (err) => {
    console.warn("Gagal listen ke profil student:", err);
  });
}

/**
 * Mendengarkan Seluruh Staf untuk menghitung berapa yang Online/Offline.
 */
function listenToStaffPresence() {
  if (unsubPresence) { unsubPresence(); unsubPresence = null; }
  
  // Mengambil semua user agar bisa filter field thekingoflibrary (boolean) dan role (string)
  // Ini menghindari error index missing di Firestore.
  const usersRef = collection(db, "users");
  
  unsubPresence = onSnapshot(usersRef, (snapshot) => {
    let onlineCount = 0;
    let offlineCount = 0;
    
    snapshot.forEach(d => {
      const data = d.data();
      const isStaffMember = data.thekingoflibrary === true || ["developer", "admin", "pustakawan"].includes(data.role?.toLowerCase());
      
      if (isStaffMember) {
        if (data.isOnline === true) {
          onlineCount++;
        } else {
          offlineCount++;
        }
      }
    });
    
    const statusDot = document.querySelector(".wa-chat-online-dot");
    const statusText = document.getElementById("waHeaderTextStatus");
    if (!statusDot || !statusText) return;

    if (onlineCount > 0) {
      statusDot.style.backgroundColor = "#25d366";
      statusText.textContent = `${onlineCount} Online, ${offlineCount} Offline`;
    } else {
      statusDot.style.backgroundColor = "#9ca3af";
      statusText.textContent = `${offlineCount} Offline`;
    }
  }, (err) => {
    console.warn("Gagal listen ke profil staf:", err);
    const statusText = document.getElementById("waHeaderTextStatus");
    if (statusText) statusText.textContent = "Err: " + err.message;
  });
}

/**
 * ==========================================
 * HAPUS & EDIT PESAN
 * ==========================================
 */

/**
 * Menandai pesan sebagai dihapus (soft-delete) di Firestore
 * @param {string} studentId
 * @param {string} msgId
 */
async function deleteMessage(studentId, msgId) {
  try {
    const msgRef = doc(db, "chats", studentId, "messages", msgId);
    const snap = await getDoc(msgRef);
    if (!snap.exists()) return;
    const data = snap.data();

    // Periksa jendela 3 menit
    const MSG_WINDOW_MS = 3 * 60 * 1000;
    if (data.timestamp && Date.now() - data.timestamp.toDate().getTime() > MSG_WINDOW_MS) {
      console.warn("Waktu hapus pesan sudah habis.");
      return;
    }

    await updateDoc(msgRef, { deleted: true, message: "" });
  } catch (err) {
    console.warn("Gagal menghapus pesan:", err);
  }
}

/**
 * Mulai mode edit — mengisi input dengan teks lama & tampilkan edit bar
 * @param {string} studentId
 * @param {string} msgId
 * @param {string} originalText
 */
function startEdit(studentId, msgId, originalText) {
  editingMessageId = msgId;
  editingStudentId = studentId;

  const inputEl = document.getElementById("waChatInput");
  const editBar = document.getElementById("waEditBar");
  const editBarText = document.getElementById("waEditBarText");

  if (inputEl) {
    inputEl.value = originalText;
    inputEl.focus();
  }
  if (editBar) editBar.classList.remove("hidden");
  if (editBarText) editBarText.textContent = originalText;
}

/**
 * Batalkan mode edit — kembalikan UI ke kondisi normal
 */
function cancelEdit() {
  editingMessageId = null;
  editingStudentId = null;

  const inputEl = document.getElementById("waChatInput");
  const editBar = document.getElementById("waEditBar");

  if (inputEl) inputEl.value = "";
  if (editBar) editBar.classList.add("hidden");
}

/**
 * Kirim perubahan edit ke Firestore
 * @param {string} studentId
 * @param {string} msgId
 * @param {string} newText
 */
async function commitEdit(studentId, msgId, newText) {
  try {
    const msgRef = doc(db, "chats", studentId, "messages", msgId);
    const snap = await getDoc(msgRef);
    if (!snap.exists()) return;
    const data = snap.data();

    // Periksa jendela 3 menit
    const MSG_WINDOW_MS = 3 * 60 * 1000;
    if (data.timestamp && Date.now() - data.timestamp.toDate().getTime() > MSG_WINDOW_MS) {
      console.warn("Waktu edit pesan sudah habis.");
      cancelEdit();
      return;
    }

    // Periksa batas 3x edit
    const editCount = data.editCount || 0;
    if (editCount >= 3) {
      console.warn("Batas edit pesan (3x) sudah tercapai.");
      cancelEdit();
      return;
    }

    await updateDoc(msgRef, {
      message: newText,
      edited: true,
      editCount: editCount + 1,
    });
  } catch (err) {
    console.warn("Gagal mengedit pesan:", err);
  }
}

/**
 * ==========================================
 * 2. ALUR ADMIN / STAF (INBOX / CHAT LIST)
 * ==========================================
 */

/**
 * Menggambar UI Daftar Obrolan Masuk (Inbox) Bagi Admin
 */
function renderAdminInbox() {
  stopAllListeners();
  
  chatPanel.innerHTML = `
    <!-- Header WA Inbox -->
    <header class="wa-chat-header">
      <div class="wa-chat-header-left">
        <div class="wa-chat-avatar" style="background: transparent;">
          ${getLetsknowledgeLogoSVG("28px")}
        </div>
        <div class="wa-chat-header-info">
          <span class="wa-chat-header-title">letsknowledge.</span>
          <span class="wa-chat-header-subtitle">kelola pesan masuk dari mahasiswa.</span>
        </div>
      </div>
      <button class="wa-chat-close-btn" id="waChatCloseBtn" title="${getTranslation("close_btn")}">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </header>

    <!-- Daftar Inbox Obrolan -->
    <div class="wa-chat-inbox wa-scrollbar">
      <div class="wa-chat-inbox-search">
        <input type="text" id="waInboxSearch" placeholder="Cari percakapan mahasiswa..." autocomplete="off"/>
      </div>
      <div class="wa-chat-inbox-list" id="waInboxList">
        <div class="wa-chat-inbox-empty">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M20 13V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v7m16 0a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2m16 0v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-5" />
          </svg>
          <span>${getTranslation("chat_no_messages")}</span>
        </div>
      </div>
    </div>
  `;

  document.getElementById("waChatCloseBtn").addEventListener("click", toggleChatWindow);

  // Jalankan Listener Tautan Obrolan
  listenToAdminInboxList();

  // Pendengar Pencarian
  const searchInput = document.getElementById("waInboxSearch");
  searchInput.addEventListener("input", (e) => {
    const val = e.target.value.toLowerCase();
    document.querySelectorAll(".wa-chat-inbox-item").forEach((item) => {
      const name = item.querySelector(".wa-chat-inbox-item-name").textContent.toLowerCase();
      if (name.includes(val)) {
        item.style.display = "flex";
      } else {
        item.style.display = "none";
      }
    });
  });
}

/**
 * Mendengarkan Kumpulan Seluruh Obrolan Masuk Mahasiswa Secara Real-Time
 */
function listenToAdminInboxList() {
  const q = query(collection(db, "chats"), orderBy("lastMessageTime", "desc"));

  unsubChatList = onSnapshot(q, (snapshot) => {
    const listContainer = document.getElementById("waInboxList");
    if (!listContainer) return;

    if (snapshot.empty) {
      listContainer.innerHTML = `
        <div class="wa-chat-inbox-empty">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M20 13V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v7m16 0a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2m16 0v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-5" />
          </svg>
          <span>${getTranslation("chat_no_messages")}</span>
        </div>
      `;
      return;
    }

    listContainer.innerHTML = "";

    snapshot.forEach((chatDoc) => {
      const data = chatDoc.data();
      const studentId = chatDoc.id;
      const unreadCount = data.unreadCountAdmin || 0;
      
      // Hitung Waktu
      let timeStr = "";
      if (data.lastMessageTime) {
        const dateObj = data.lastMessageTime.toDate();
        const hrs = String(dateObj.getHours()).padStart(2, '0');
        const mins = String(dateObj.getMinutes()).padStart(2, '0');
        timeStr = `${hrs}:${mins}`;
      }

      const item = document.createElement("div");
      item.className = "wa-chat-inbox-item";
      item.innerHTML = `
        <div class="wa-chat-avatar">
          ${getDefaultAvatarSVG("24px")}
        </div>
        <div class="wa-chat-inbox-item-details">
          <div class="wa-chat-inbox-item-header">
            <span class="wa-chat-inbox-item-name">${escapeHTML(data.userName || "Mahasiswa")}</span>
            <span class="wa-chat-inbox-item-time">${timeStr}</span>
          </div>
          <div class="wa-chat-inbox-item-body">
            <span class="wa-chat-inbox-item-msg">${escapeHTML(data.lastMessage || "")}</span>
            ${unreadCount > 0 ? `<span class="wa-chat-inbox-item-badge">${unreadCount}</span>` : ""}
          </div>
        </div>
      `;

      item.addEventListener("click", () => {
        openConversation(studentId);
      });

      listContainer.appendChild(item);
    });
  }, (error) => {
    console.warn("Gagal mendengarkan inbox list:", error);
  });
}

/**
 * ==========================================
 * 3. LENCANA GLOBAL & NOTIFIKASI
 * ==========================================
 */

/**
 * Mendengarkan Notifikasi Pesan Belum Dibaca Secara Global saat Panel Ditutup
 */
function listenToUnreadNotifications() {
  if (!currentUser) return;
  const isStaff = ["developer", "admin", "pustakawan"].includes(currentUserRole);
  
  if (isStaff) {
    try {
      // Admin: Pantau akumulasi unreadCountAdmin dari semua dokumen percakapan
      const q = query(collection(db, "chats"), where("unreadCountAdmin", ">", 0));
      
      unsubChatList = onSnapshot(q, (snapshot) => {
        let totalUnread = 0;
        snapshot.forEach((d) => {
          totalUnread += d.data().unreadCountAdmin || 0;
        });
        updateGlobalBadge(totalUnread);
      }, (error) => {
        console.warn("Gagal mendengarkan notifikasi admin:", error);
      });
    } catch (e) {
      console.warn("Gagal inisialisasi kueri notifikasi admin:", e);
    }
  } else {
    try {
      // Mahasiswa: Pantau unreadCountUser di dokumen miliknya sendiri
      const docRef = doc(db, "chats", currentUser.uid);
      
      unsubChatDoc = onSnapshot(docRef, (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          const unreadCount = data.unreadCountUser || 0;
          updateGlobalBadge(unreadCount);
          
          // Putar suara popup jika menerima pesan saat panel tertutup
          if (unreadCount > 0 && !isChatOpen) {
            playPopSound();
          }
        } else {
          updateGlobalBadge(0);
        }
      }, (error) => {
        console.warn("Gagal mendengarkan notifikasi mahasiswa:", error);
      });
    } catch (e) {
      console.warn("Gagal inisialisasi kueri notifikasi mahasiswa:", e);
    }
  }
}

/**
 * Mengubah Tampilan Lencana Notifikasi di Tombol Melayang
 * @param {number} count - Jumlah pesan belum dibaca
 */
function updateGlobalBadge(count) {
  const badgeEl = document.getElementById("waChatBadge");
  const btnEl = document.getElementById("waChatBtn");
  if (!badgeEl) return;

  if (count > 0) {
    badgeEl.textContent = count;
    badgeEl.classList.remove("hidden");
    if (btnEl && !isChatOpen) {
      btnEl.classList.add("pulsing");
    }
  } else {
    badgeEl.classList.add("hidden");
    if (btnEl) {
      btnEl.classList.remove("pulsing");
    }
  }
}

/**
 * Membantu membersihkan tag HTML agar terhindar dari serangan XSS
 * @param {string} str 
 */
function escapeHTML(str) {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
