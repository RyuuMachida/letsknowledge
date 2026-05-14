const fs = require('fs');

let file = 'c:/INFOKOM/PPLG/semester-2/april/web perpus/javascript/upload.js';
let content = fs.readFileSync(file, 'utf8');

// Genres
content = content.replace(
  /placeholder: "Pilih Genre"/g, 
  'placeholder: getTranslation("upload_genre_ph") || "Pilih Genre"'
);
content = content.replace(
  /label: "Filsafat"/g, 
  'label: getTranslation("genre_philosophy") || "Filsafat"'
);
content = content.replace(
  /label: "Politik"/g, 
  'label: getTranslation("genre_politics") || "Politik"'
);
content = content.replace(
  /label: "Sastra"/g, 
  'label: getTranslation("genre_literature") || "Sastra"'
);
content = content.replace(
  /label: "Sosial"/g, 
  'label: getTranslation("genre_social") || "Sosial"'
);
content = content.replace(
  /label: "Fiksi"/g, 
  'label: getTranslation("genre_fiction") || "Fiksi"'
);
content = content.replace(
  /label: "Biografi"/g, 
  'label: getTranslation("genre_biography") || "Biografi"'
);
content = content.replace(
  /label: "Teknologi"/g, 
  'label: getTranslation("genre_technology") || "Teknologi"'
);

// Covers
content = content.replace(
  /placeholder: "Pilih Jenis Cover"/g, 
  'placeholder: getTranslation("upload_cover_ph") || "Pilih Jenis Cover"'
);
content = content.replace(
  /label: "Buku Standar \(SVG\)"/g, 
  'label: getTranslation("cover_opt_std") || "Buku Standar (SVG)"'
);
content = content.replace(
  /label: "Teknologi \/ Kode \(SVG\)"/g, 
  'label: getTranslation("cover_opt_tech") || "Teknologi / Kode (SVG)"'
);
content = content.replace(
  /label: "Tokoh \/ Biografi \(SVG\)"/g, 
  'label: getTranslation("cover_opt_people") || "Tokoh / Biografi (SVG)"'
);
content = content.replace(
  /label: "Dunia \/ Sejarah \(SVG\)"/g, 
  'label: getTranslation("cover_opt_globe") || "Dunia / Sejarah (SVG)"'
);
content = content.replace(
  /label: "Ketik Path Gambar Internal\.\.\."/g, 
  'label: getTranslation("cover_opt_custom") || "Ketik Path Gambar Internal..."'
);

// Preview defaults
content = content.replace(
  /\|\| "Judul Buku"/g, 
  '|| (getTranslation("upload_preview_default_title") || "Judul Buku")'
);
content = content.replace(
  /textContent = "Judul Buku"/g, 
  'textContent = getTranslation("upload_preview_default_title") || "Judul Buku"'
);

content = content.replace(
  /\|\| "Nama Penulis"/g, 
  '|| (getTranslation("upload_preview_default_author") || "Nama Penulis")'
);
content = content.replace(
  /textContent = "Nama Penulis"/g, 
  'textContent = getTranslation("upload_preview_default_author") || "Nama Penulis"'
);

// Hints and messages
content = content.replace(
  /coverHint.innerHTML =\s*"Isi dengan lokasi gambar lokal\. <strong>Klik kiri 2x<\/strong> pada input untuk kembali ke pilihan SVG\.";/, 
  'coverHint.innerHTML = getTranslation("upload_cover_hint_custom") || "Isi dengan lokasi gambar lokal. <strong>Klik kiri 2x</strong> pada input untuk kembali ke pilihan SVG.";'
);
content = content.replace(
  /triggerSpan\.textContent = "Buku Standar \(SVG\)";/g, 
  'triggerSpan.textContent = getTranslation("cover_opt_std") || "Buku Standar (SVG)";'
);
content = content.replace(
  /coverTriggerText\.textContent = "Buku Standar \(SVG\)";/g, 
  'coverTriggerText.textContent = getTranslation("cover_opt_std") || "Buku Standar (SVG)";'
);

content = content.replace(
  /coverHint\.textContent =\s*"Pilih jenis cover SVG atau pilih 'Ketik Path Internal' untuk gambar lokal\.";/g, 
  'coverHint.textContent = getTranslation("upload_cover_hint") || "Pilih jenis cover SVG atau pilih \'Ketik Path Internal\' untuk gambar lokal.";'
);
content = content.replace(
  /coverHint\.innerHTML =\s*"Pilih jenis cover SVG atau pilih 'Ketik Path Internal' untuk gambar lokal\.";/g, 
  'coverHint.innerHTML = getTranslation("upload_cover_hint") || "Pilih jenis cover SVG atau pilih \'Ketik Path Internal\' untuk gambar lokal.";'
);

content = content.replace(
  /submitBtn\.textContent = "Mengupload\.\.\.";/, 
  'submitBtn.textContent = getTranslation("uploading_btn") || "Mengupload...";'
);
content = content.replace(
  /uploadMessage\.textContent = "Buku berhasil diupload ke database!";/, 
  'uploadMessage.textContent = getTranslation("upload_success") || "Buku berhasil diupload ke database!";'
);
content = content.replace(
  /uploadMessage\.textContent =\s*"Gagal mengupload buku\. Pastikan koneksi stabil\.";/, 
  'uploadMessage.textContent = getTranslation("upload_error") || "Gagal mengupload buku. Pastikan koneksi stabil.";'
);
content = content.replace(
  /submitBtn\.textContent = "Upload Buku ke Database";/, 
  'submitBtn.textContent = getTranslation("upload_btn_submit") || "Upload Buku ke Database";'
);

fs.writeFileSync(file, content, 'utf8');
