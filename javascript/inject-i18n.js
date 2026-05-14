const fs = require('fs');
const path = require('path');

const dir = 'c:/INFOKOM/PPLG/semester-2/april/web perpus';

const htmlReplacements = {
  'riwayat.html': [
    { regex: /<h1>Aktivitas Anda\.<\/h1>/g, rep: '<h1 data-i18n="history_title">Aktivitas Anda.</h1>' },
    { regex: /<p>Pantau jejak penjelajahan ilmu Anda di letsknowledge\.<\/p>/g, rep: '<p data-i18n="history_subtitle">Pantau jejak penjelajahan ilmu Anda di letsknowledge.</p>' }
  ],
  'peminjaman.html': [
    { regex: /<h1>Status Peminjaman\.<\/h1>/g, rep: '<h1 data-i18n="borrow_title">Status Peminjaman.</h1>' },
    { regex: /Pantau buku yang sedang Anda pinjam dan perhatikan tenggat waktunya\./g, rep: '<span data-i18n="borrow_subtitle">Pantau buku yang sedang Anda pinjam dan perhatikan tenggat waktunya.</span>' }
  ],
  'favorit.html': [
    { regex: /<h2>Buku Favorit<\/h2>/g, rep: '<h2 data-i18n="fav_title">Buku Favorit</h2>' },
    { regex: /Koleksi buku-buku yang sudah Anda simpan\./g, rep: '<span data-i18n="fav_subtitle">Koleksi buku-buku yang sudah Anda simpan.</span>' }
  ],
  'upload.html': [
    { regex: /Tambah Koleksi Buku/g, rep: '<span data-i18n="upload_title">Tambah Koleksi Buku</span>' },
    { regex: /Lengkapi detail di sebelah kiri dan pantau tampilan kartu di sebelah/g, rep: '<span data-i18n="upload_subtitle">Lengkapi detail di sebelah kiri dan pantau tampilan kartu di sebelah</span>' },
    { regex: /<label class="input-label">Judul Buku<\/label>/g, rep: '<label class="input-label" data-i18n="upload_form_title">Judul Buku</label>' },
    { regex: /<label class="input-label">Penulis<\/label>/g, rep: '<label class="input-label" data-i18n="upload_form_author">Penulis</label>' },
    { regex: /<label class="input-label">Tahun Terbit<\/label>/g, rep: '<label class="input-label" data-i18n="upload_form_year">Tahun Terbit</label>' },
    { regex: /<label class="input-label">Penerbit<\/label>/g, rep: '<label class="input-label" data-i18n="upload_form_publisher">Penerbit</label>' },
    { regex: /<label class="input-label">Genre<\/label>/g, rep: '<label class="input-label" data-i18n="upload_form_genre">Genre</label>' },
    { regex: /<label class="input-label">Ikon Sampul \/ Path Internal<\/label>/g, rep: '<label class="input-label" data-i18n="upload_form_cover">Ikon Sampul / Path Internal</label>' },
    { regex: /<label class="input-label">Sinopsis Singkat<\/label>/g, rep: '<label class="input-label" data-i18n="upload_form_synopsis">Sinopsis Singkat</label>' },
    { regex: /<label class="input-label">Isi Cerita \/ Bab 1<\/label>/g, rep: '<label class="input-label" data-i18n="upload_form_content">Isi Cerita / Bab 1</label>' },
    { regex: /Upload Buku ke Database/g, rep: '<span data-i18n="upload_btn_submit">Upload Buku ke Database</span>' }
  ]
};

Object.keys(htmlReplacements).forEach(file => {
  let p = path.join(dir, file);
  if (fs.existsSync(p)) {
    let content = fs.readFileSync(p, 'utf8');
    htmlReplacements[file].forEach(r => {
      content = content.replace(r.regex, r.rep);
    });
    fs.writeFileSync(p, content, 'utf8');
  }
});
