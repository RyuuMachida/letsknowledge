const fs = require('fs');

let file = 'c:/INFOKOM/PPLG/semester-2/april/web perpus/javascript/admin-panel.js';
let content = fs.readFileSync(file, 'utf8');

const replacements = [
    ['Admin Dashboard', '${getTranslation("admin_title") || "Admin Dashboard"}'],
    ['Klik grafik untuk analisis mendalam per bulan/tahun.', '${getTranslation("admin_subtitle_graphs") || "Klik grafik untuk analisis mendalam per bulan/tahun."}'],
    ['TOTAL BUKU', '${getTranslation("admin_total_books") || "TOTAL BUKU"}'],
    ['TOTAL MAHASISWA', '${getTranslation("admin_total_users") || "TOTAL MAHASISWA"}'],
    ['LOG AKTIVITAS', '${getTranslation("admin_total_activity") || "LOG AKTIVITAS"}'],
    ['Tren Penambahan Buku', '${getTranslation("admin_trend_books") || "Tren Penambahan Buku"}'],
    ['Pertumbuhan User', '${getTranslation("admin_trend_users") || "Pertumbuhan User"}'],
    ['Intensitas Aktivitas', '${getTranslation("admin_trend_activity") || "Intensitas Aktivitas"}'],
    ['Trafik Peminjaman Buku', '${getTranslation("admin_traffic_borrow") || "Trafik Peminjaman Buku"}'],
    ['Log Peminjaman Buku', '${getTranslation("admin_log_borrow") || "Log Peminjaman Buku"}'],
    ['Judul Buku', '${getTranslation("admin_th_title") || "Judul Buku"}'],
    ['Pemohon', '${getTranslation("admin_th_applicant") || "Pemohon"}'],
    ['Waktu', '${getTranslation("admin_th_time") || "Waktu"}'],
    ['Status', '${getTranslation("admin_th_status") || "Status"}'],
    ['Koleksi Buku', '${getTranslation("admin_collection_title") || "Koleksi Buku"}'],
    ['Kelola data, stok, dan hapus buku', '${getTranslation("admin_collection_subtitle") || "Kelola data, stok, dan hapus buku"}'],
    ['Kelola Ulasan', '${getTranslation("admin_manage_reviews") || "Kelola Ulasan"}'],
    ['Tambah Buku', '${getTranslation("admin_add_book") || "Tambah Buku"}'],
    ['Info Buku', '${getTranslation("admin_th_book_info") || "Info Buku"}'],
    ['Kategori', '${getTranslation("admin_th_category") || "Kategori"}'],
    ['Stok', '${getTranslation("admin_th_stock") || "Stok"}'],
    ['Aksi', '${getTranslation("admin_th_action") || "Aksi"}'],
    ['Memuat koleksi buku...', '${getTranslation("admin_loading_books") || "Memuat koleksi buku..."}'],
    ['Data Mahasiswa & Admin', '${getTranslation("admin_user_title") || "Data Mahasiswa & Admin"}'],
    ['Kelola data dan berikan pangkat khusus', '${getTranslation("admin_user_subtitle") || "Kelola data dan berikan pangkat khusus"}'],
    ['Atur Pangkat Mahasiswa', '${getTranslation("admin_set_role_title") || "Atur Pangkat Mahasiswa"}'],
    ['Berikan wewenang pada user untuk mengelola perpustakaan.', '${getTranslation("admin_set_role_subtitle") || "Berikan wewenang pada user untuk mengelola perpustakaan."}'],
    ['Atur Pangkat', '${getTranslation("admin_set_role") || "Atur Pangkat"}'],
    ['Nama Lengkap', '${getTranslation("admin_th_fullname") || "Nama Lengkap"}'],
    ['Email', '${getTranslation("admin_th_email") || "Email"}'],
    ['Pangkat', '${getTranslation("admin_th_role") || "Pangkat"}'],
    ['Memuat data mahasiswa...', '${getTranslation("admin_loading_users") || "Memuat data mahasiswa..."}'],
    ['Pilih Mahasiswa', '${getTranslation("admin_select_user") || "Pilih Mahasiswa"}'],
    ['Pilih Pangkat', '${getTranslation("admin_select_role") || "Pilih Pangkat"}'],
    ['Simpan Pangkat', '${getTranslation("admin_save_role") || "Simpan Pangkat"}'],
    ['Request Buku', '${getTranslation("admin_card_req_title") || "Request Buku"}'],
    ['Cek permintaan mahasiswa', '${getTranslation("admin_card_req_desc") || "Cek permintaan mahasiswa"}'],
    ['Manage Buku', '${getTranslation("admin_card_manage_title") || "Manage Buku"}'],
    ['Edit / Hapus koleksi', '${getTranslation("admin_card_manage_desc") || "Edit / Hapus koleksi"}'],
    ['User Control', '${getTranslation("admin_card_user_title") || "User Control"}'],
    ['Kelola data mahasiswa', '${getTranslation("admin_card_user_desc") || "Kelola data mahasiswa"}'],
    ['Update Koleksi Buku', '${getTranslation("admin_edit_book_title") || "Update Koleksi Buku"}'],
    ['Edit detail di sebelah kiri dan pantau perubahan kartu di sebelah kanan.', '${getTranslation("admin_edit_book_subtitle") || "Edit detail di sebelah kiri dan pantau perubahan kartu di sebelah kanan."}'],
    ['Limit 100 karakter tercapai!', '${getTranslation("upload_warn_title_limit") || "Limit 100 karakter tercapai!"}'],
    ['Penulis</label>', '${getTranslation("upload_form_author") || "Penulis"}</label>'],
    ['Limit 50 karakter tercapai!', '${getTranslation("upload_warn_author_limit") || "Limit 50 karakter tercapai!"}'],
    ['Stok</label>', '${getTranslation("upload_form_stock") || "Stok"}</label>'],
    ['Tahun</label>', '${getTranslation("upload_form_year") || "Tahun"}</label>'],
    ['Penerbit</label>', '${getTranslation("upload_form_publisher") || "Penerbit"}</label>'],
    ['Genre</label>', '${getTranslation("upload_form_genre") || "Genre"}</label>'],
    ['URL / Path Cover', '${getTranslation("upload_form_cover") || "URL / Path Cover"}'],
    ['Sinopsis Singkat', '${getTranslation("upload_form_synopsis") || "Sinopsis Singkat"}'],
    ['Isi Cerita / Bab 1', '${getTranslation("upload_form_content") || "Isi Cerita / Bab 1"}'],
    ['Simpan Perubahan', '${getTranslation("admin_btn_save_changes") || "Simpan Perubahan"}'],
    ['Live Preview Card', '${getTranslation("upload_preview_title") || "Live Preview Card"}'],
    ['Tersedia', '${getTranslation("borrow_status_available") || "Tersedia"}'],
    ['Detail Buku', '${getTranslation("book_detail_btn") || "Detail Buku"}'],
    ['EDIT KOMENTAR', '${getTranslation("admin_edit_comment") || "EDIT KOMENTAR"}'],
    ['Telah melebihi limit (Maks 100 Karakter)!', '${getTranslation("admin_warn_limit") || "Telah melebihi limit (Maks 100 Karakter)!"}']
];

let parts = content.split('adminMain.innerHTML = `');
if (parts.length > 1) {
    let dashboardHtml = parts[1].split('`;')[0];

    replacements.forEach(([target, replaceWith]) => {
        let regex = new RegExp(`>\\s*${target}\\s*<`, 'g');
        if (target.includes('</label>')) {
            dashboardHtml = dashboardHtml.replace(target, replaceWith);
        } else {
            dashboardHtml = dashboardHtml.replace(regex, `>${replaceWith}<`);
        }

        if (target === 'Limit 100 karakter tercapai!' || target === 'Limit 50 karakter tercapai!' || target === 'Telah melebihi limit (Maks 100 Karakter)!') {
            dashboardHtml = dashboardHtml.replace(target, replaceWith);
        }
    });

    dashboardHtml = dashboardHtml.replace(/>Admin Dashboard</g, `>\${getTranslation("admin_title") || "Admin Dashboard"}<`);
    dashboardHtml = dashboardHtml.replace(/>Klik grafik untuk analisis mendalam per bulan\/tahun\.</g, `>\${getTranslation("admin_subtitle_graphs") || "Klik grafik untuk analisis mendalam per bulan/tahun."}<`);
    dashboardHtml = dashboardHtml.replace(/>TOTAL BUKU</g, `>\${getTranslation("admin_total_books") || "TOTAL BUKU"}<`);
    dashboardHtml = dashboardHtml.replace(/>TOTAL MAHASISWA</g, `>\${getTranslation("admin_total_users") || "TOTAL MAHASISWA"}<`);
    dashboardHtml = dashboardHtml.replace(/>LOG AKTIVITAS</g, `>\${getTranslation("admin_total_activity") || "LOG AKTIVITAS"}<`);
    dashboardHtml = dashboardHtml.replace(/>Batal</g, `>\${getTranslation("btn_cancel") || "Batal"}<`);
    dashboardHtml = dashboardHtml.replace(/>Simpan Pangkat</g, `>\${getTranslation("admin_save_role") || "Simpan Pangkat"}<`);
    dashboardHtml = dashboardHtml.replace(/>Atur Pangkat</g, `>\${getTranslation("admin_set_role") || "Atur Pangkat"}<`);
    dashboardHtml = dashboardHtml.replace(/>Judul Buku</g, `>\${getTranslation("admin_th_title") || "Judul Buku"}<`);

    content = parts[0] + 'adminMain.innerHTML = `' + dashboardHtml + '`;' + parts[1].substring(parts[1].indexOf('`;') + 2);
}

content = content.replace(/"Rentang Waktu"/g, 'getTranslation("admin_time_range") || "Rentang Waktu"');
content = content.replace(/"Per Bulan"/g, 'getTranslation("admin_per_month") || "Per Bulan"');
content = content.replace(/"Per Tahun"/g, 'getTranslation("admin_per_year") || "Per Tahun"');

content = content.replace(/"Detail Koleksi Buku"/g, 'getTranslation("admin_chart_books") || "Detail Koleksi Buku"');
content = content.replace(/"Detail Pertumbuhan Mahasiswa"/g, 'getTranslation("admin_chart_users") || "Detail Pertumbuhan Mahasiswa"');
content = content.replace(/"Detail Log Aktivitas"/g, 'getTranslation("admin_chart_activity") || "Detail Log Aktivitas"');
content = content.replace(/"Detail Trafik Peminjaman"/g, 'getTranslation("admin_chart_traffic") || "Detail Trafik Peminjaman"');

content = content.replace(/"Pantau daftar mahasiswa, cek pangkat, dan kelola akses akun\."/g, 'getTranslation("admin_user_control_desc") || "Pantau daftar mahasiswa, cek pangkat, dan kelola akses akun."');
content = content.replace(/>Kembali ke Statistik</g, '>${getTranslation("admin_back_stats") || "Kembali ke Statistik"}<');
content = content.replace(/>Tutup kontrol mahasiswa</g, '>${getTranslation("admin_close_control") || "Tutup kontrol mahasiswa"}<');

content = content.replace(/"Kelola inventaris perpustakaan dan kelola ulasan\."/g, 'getTranslation("admin_manage_book_desc") || "Kelola inventaris perpustakaan dan kelola ulasan."');
content = content.replace(/>Tutup menu koleksi buku</g, '>${getTranslation("admin_close_collection") || "Tutup menu koleksi buku"}<');

content = content.replace(/"Tinjau semua permintaan yang sedang diajukan dan dipinjam\."/g, 'getTranslation("admin_request_desc") || "Tinjau semua permintaan yang sedang diajukan dan dipinjam."');
content = content.replace(/>Tutup request list</g, '>${getTranslation("admin_close_request") || "Tutup request list"}<');

content = content.replace(/"Hapus Akun\?"/g, 'getTranslation("admin_del_acc_title") || "Hapus Akun?"');
content = content.replace(/"Apakah kamu yakin ingin menghapus akun user ini\? Data tidak bisa dikembalikan\."/g, 'getTranslation("admin_del_acc_desc") || "Apakah kamu yakin ingin menghapus akun user ini? Data tidak bisa dikembalikan."');
content = content.replace(/"Batal"/g, 'getTranslation("btn_cancel") || "Batal"');
content = content.replace(/"Ya, Hapus"/g, 'getTranslation("btn_yes_delete") || "Ya, Hapus"');

content = content.replace(/"Menghapus Akun\.\.\."/g, 'getTranslation("admin_deleting_acc") || "Menghapus Akun..."');
content = content.replace(/"Berhasil"/g, 'getTranslation("admin_success") || "Berhasil"');
content = content.replace(/"Akun user berhasil dihapus dari database\."/g, 'getTranslation("admin_del_acc_success") || "Akun user berhasil dihapus dari database."');

content = content.replace(/"Pangkat Gagal Disimpan"/g, 'getTranslation("admin_role_fail") || "Pangkat Gagal Disimpan"');
content = content.replace(/"Pangkat Berhasil Disimpan"/g, 'getTranslation("admin_role_success_title") || "Pangkat Berhasil Disimpan"');
content = content.replace(/"Pangkat user telah diperbarui\."/g, 'getTranslation("admin_role_success_desc") || "Pangkat user telah diperbarui."');
content = content.replace(/"Memproses\.\.\."/g, 'getTranslation("admin_processing") || "Memproses..."');

content = content.replace(/"Hapus Buku\?"/g, 'getTranslation("admin_del_book_title") || "Hapus Buku?"');
content = content.replace(/"Apakah kamu yakin ingin menghapus buku ini\? Semua ulasan juga akan hilang\."/g, 'getTranslation("admin_del_book_desc") || "Apakah kamu yakin ingin menghapus buku ini? Semua ulasan juga akan hilang."');
content = content.replace(/"Menghapus Buku\.\.\."/g, 'getTranslation("admin_deleting_book") || "Menghapus Buku..."');
content = content.replace(/"Buku berhasil dihapus\."/g, 'getTranslation("admin_del_book_success") || "Buku berhasil dihapus."');

content = content.replace(/"Ulasan Berhasil Dihapus"/g, 'getTranslation("admin_del_review_success_title") || "Ulasan Berhasil Dihapus"');
content = content.replace(/"Komentar tersebut telah dihapus\."/g, 'getTranslation("admin_del_review_success_desc") || "Komentar tersebut telah dihapus."');

content = content.replace(/"Ulasan Gagal Dihapus"/g, 'getTranslation("admin_del_review_fail") || "Ulasan Gagal Dihapus"');

content = content.replace(/"Komentar berhasil diperbarui\."/g, 'getTranslation("admin_edit_review_success") || "Komentar berhasil diperbarui."');

content = content.replace(/"Buku Gagal Diupdate"/g, 'getTranslation("admin_update_book_fail") || "Buku Gagal Diupdate"');
content = content.replace(/"Buku Berhasil Diupdate"/g, 'getTranslation("admin_update_book_success_title") || "Buku Berhasil Diupdate"');
content = content.replace(/"Data buku telah diperbarui di database\."/g, 'getTranslation("admin_update_book_success_desc") || "Data buku telah diperbarui di database."');

content = content.replace(/"Terjadi kesalahan saat memproses permintaan\."/g, 'getTranslation("admin_err_process_req") || "Terjadi kesalahan saat memproses permintaan."');

content = content.replace(/"Peringatan"/g, 'getTranslation("admin_warning") || "Peringatan"');
content = content.replace(/"Stok tidak mencukupi untuk meminjamkan buku ini\."/g, 'getTranslation("admin_stock_empty") || "Stok tidak mencukupi untuk meminjamkan buku ini."');
content = content.replace(/"Buku telah disetujui\."/g, 'getTranslation("admin_req_approved") || "Buku telah disetujui."');
content = content.replace(/"Buku telah ditolak\."/g, 'getTranslation("admin_req_rejected") || "Buku telah ditolak."');
content = content.replace(/"Buku telah dikembalikan\."/g, 'getTranslation("admin_req_returned") || "Buku telah dikembalikan."');

content = content.replace(/>Menunggu Persetujuan</g, '>${getTranslation("borrow_status_pending") || "Menunggu Persetujuan"}<');
content = content.replace(/>Sedang Dipinjam</g, '>${getTranslation("borrow_status_borrowed") || "Sedang Dipinjam"}<');
content = content.replace(/>Setujui</g, '>${getTranslation("admin_btn_approve") || "Setujui"}<');
content = content.replace(/>Tolak</g, '>${getTranslation("admin_btn_reject") || "Tolak"}<');
content = content.replace(/>Kembalikan</g, '>${getTranslation("admin_btn_return") || "Kembalikan"}<');
content = content.replace(/>Ulasan</g, '>${getTranslation("admin_btn_review") || "Ulasan"}<');

fs.writeFileSync(file, content, 'utf8');
