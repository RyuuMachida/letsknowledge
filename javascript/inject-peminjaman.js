const fs = require('fs');

let file = 'c:/INFOKOM/PPLG/semester-2/april/web perpus/javascript/peminjaman.js';
let content = fs.readFileSync(file, 'utf8');

// Line 38
content = content.replace(
  /Belum ada data peminjaman\./g, 
  '${getTranslation("borrow_empty_desc") || "Belum ada data peminjaman."}'
);

// Line 74
content = content.replace(
  /Denda: Rp \$\{denda/g, 
  '${getTranslation("borrow_fine") || "Denda: Rp "} ${denda'
);

// Line 86
content = content.replace(
  /Lunas: Rp \$\{item\.dendaDibayar/g, 
  '${getTranslation("borrow_paid") || "Lunas: Rp "} ${item.dendaDibayar'
);

// Line 111
content = content.replace(
  /title="Hapus Riwayat"/g,
  'title="${getTranslation(\'history_del_btn\') || \'Hapus Riwayat\'}"'
);

// Line 119
content = content.replace(
  /title="Menunggu Konfirmasi Admin"/g,
  'title="${getTranslation(\'borrow_wait_admin\') || \'Menunggu Konfirmasi Admin\'}"'
);

// Line 127
content = content.replace(
  /title="Request Pengembalian Buku"/g,
  'title="${getTranslation(\'borrow_req_return\') || \'Request Pengembalian Buku\'}"'
);

// Line 135
content = content.replace(
  /title="Buku Belum Diambil dari Perpus"/g,
  'title="${getTranslation(\'borrow_not_taken\') || \'Buku Belum Diambil dari Perpus\'}"'
);

// Line 180-181
content = content.replace(
  /let titleAlert = "Request Pengembalian\?";/,
  'let titleAlert = getTranslation("borrow_req_return_title") || "Request Pengembalian?";'
);
content = content.replace(
  /let textAlert = `Ajukan request pengembalian untuk buku "<strong>\$\{bookTitle\}<\/strong>"\?`;/,
  'let textAlert = (getTranslation("borrow_req_return_desc") || `Ajukan request pengembalian untuk buku "<strong>{book}</strong>"?`).replace("{book}", bookTitle);'
);

// Line 184
content = content.replace(
  /titleAlert = "Peringatan Denda!";/,
  'titleAlert = getTranslation("borrow_fine_warn") || "Peringatan Denda!";'
);

// Line 192
content = content.replace(
  /Seharga: Rp \$\{denda/g,
  '${getTranslation("borrow_price") || "Seharga: Rp "} ${denda'
);

// Line 197
content = content.replace(
  /textAlert = `Anda terlambat <strong>\$\{lateDays\} hari<\/strong>! Ajukan request pengembalian untuk buku "<strong>\$\{bookTitle\}<\/strong>"\?<br>\$\{badgeHtml\}Pastikan Anda membawa uang pas untuk membayar denda ke Admin saat mengembalikan fisik buku\.`;/,
  'textAlert = (getTranslation("borrow_fine_desc") || `Anda terlambat <strong>{days} hari</strong>! Ajukan request pengembalian untuk buku "<strong>{book}</strong>"?<br>{badge}Pastikan Anda membawa uang pas untuk membayar denda ke Admin saat mengembalikan fisik buku.`).replace("{days}", lateDays).replace("{book}", bookTitle).replace("{badge}", badgeHtml);'
);

// Lines 216-218
content = content.replace(
  /"Request Terkirim",\s*"Request dikirim! Harap pergi ke perpus untuk mengembalikan fisik buku agar admin dapat memprosesnya\.",/,
  'getTranslation("borrow_req_sent") || "Request Terkirim", getTranslation("borrow_req_sent_desc") || "Request dikirim! Harap pergi ke perpus untuk mengembalikan fisik buku agar admin dapat memprosesnya.",'
);

// Lines 224-228
content = content.replace(
  /"Gagal",\s*"Gagal memproses request pengembalian\. Silakan coba lagi\.",/,
  'getTranslation("borrow_fail") || "Gagal", getTranslation("borrow_fail_req") || "Gagal memproses request pengembalian. Silakan coba lagi.",'
);

// Lines 235-237
content = content.replace(
  /"Hapus Riwayat\?",\s*`Yakin ingin menghapus buku "\$\{bookTitle\}" dari daftar pinjaman\? Data ini tidak bisa dikembalikan\.`/,
  'getTranslation("history_del_confirm_title") || "Hapus Riwayat?", (getTranslation("borrow_del_confirm_desc") || `Yakin ingin menghapus buku "{book}" dari daftar pinjaman? Data ini tidak bisa dikembalikan.`).replace("{book}", bookTitle)'
);

// Lines 245-249
content = content.replace(
  /"Terhapus!",\s*`Riwayat pinjaman "\$\{bookTitle\}" berhasil dihapus dari daftar Anda\.`,/,
  'getTranslation("history_success_title") || "Terhapus!", (getTranslation("borrow_del_success") || `Riwayat pinjaman "{book}" berhasil dihapus dari daftar Anda.`).replace("{book}", bookTitle),'
);

// Lines 253-257
content = content.replace(
  /"Gagal",\s*"Gagal menghapus riwayat pinjaman\. Silakan coba lagi\.",/,
  'getTranslation("borrow_fail") || "Gagal", getTranslation("borrow_fail_del") || "Gagal menghapus riwayat pinjaman. Silakan coba lagi.",'
);

fs.writeFileSync(file, content, 'utf8');
