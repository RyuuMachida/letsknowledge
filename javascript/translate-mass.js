const fs = require('fs');
const path = require('path');

const dir = 'c:/INFOKOM/PPLG/semester-2/april/web perpus';
const files = ['index.html', 'favorit.html', 'riwayat.html', 'peminjaman.html', 'paneladmin.html', 'upload.html', 'home.html', 'perpus.html'];

const replacements = [
  // Modals & Navs
  { regex: /<h2([^>]*)>\s*Selamat Datang\s*<\/h2>/gi, rep: '<h2$1 data-i18n="auth_welcome">Selamat Datang</h2>' },
  { regex: /<p([^>]*)>\s*Silakan masuk ke akun Anda\s*<\/p>/gi, rep: '<p$1 data-i18n="auth_login_subtitle">Silakan masuk ke akun Anda</p>' },
  { regex: /<h2([^>]*)>\s*Daftar Akun\s*<\/h2>/gi, rep: '<h2$1 data-i18n="auth_reg_title">Daftar Akun</h2>' },
  { regex: /<p([^>]*)>\s*Bergabung dengan letsknowledge\.\s*<\/p>/gi, rep: '<p$1 data-i18n="auth_reg_subtitle">Bergabung dengan letsknowledge.</p>' },
  { regex: /<h2([^>]*)>\s*Pengaturan\s*<\/h2>/gi, rep: '<h2$1 data-i18n="settings_title">Pengaturan</h2>' },
  { regex: /<p([^>]*)>\s*Tema &amp; Tampilan Demo\s*<\/p>/gi, rep: '<p$1 data-i18n="settings_subtitle">Tema & Tampilan Demo</p>' },
  
  { regex: /<span([^>]*)>\s*Mode Gelap\s*<\/span>/gi, rep: '<span$1 data-i18n="dark_mode">Mode Gelap</span>' },
  { regex: /<span([^>]*)>\s*Bahasa\s*<\/span>/gi, rep: '<span$1 data-i18n="language">Bahasa</span>' },
  { regex: /<span([^>]*)>\s*Hak Akses\s*<\/span>/gi, rep: '<span$1 data-i18n="access_rights">Hak Akses</span>' },
  { regex: /<span([^>]*)>\s*Kuota Pinjam\s*<\/span>/gi, rep: '<span$1 data-i18n="borrow_quota">Kuota Pinjam</span>' },
  { regex: /<span([^>]*)>\s*Memuat\.\.\.\s*<\/span>/gi, rep: '<span$1 data-i18n="loading">Memuat...</span>' },
  { regex: /<span([^>]*)>\s*memuat email\.\.\.\s*<\/span>/gi, rep: '<span$1 data-i18n="loading_email">memuat email...</span>' },
  { regex: /<span([^>]*)>\s*Masuk\s*<\/span>/gi, rep: '<span$1 data-i18n="login_btn">Masuk</span>' },

  // Custom texts
  { regex: /<span([^>]*)>\s*Belum pernah kesini\?\s*<\/span>/gi, rep: '<span$1 data-i18n="auth_new_here">Belum pernah kesini?</span>' },
  { regex: /<span([^>]*)>\s*Sudah pernah kesini\?\s*<\/span>/gi, rep: '<span$1 data-i18n="auth_already_here">Sudah pernah kesini?</span>' },

  // Buttons
  { regex: /<button\s*id="loginSubmitBtn"[^>]*>\s*Masuk\s*<\/button>/gi, rep: '<button type="submit" class="btn-primary w-full" id="loginSubmitBtn" style="margin-top: 10px; padding: 12px; font-size: 1rem" data-i18n="login_btn">Masuk</button>' },
  { regex: /<button\s*id="regSubmitBtn"[^>]*>\s*Daftar Akun\s*<\/button>/gi, rep: '<button type="submit" class="btn-primary w-full" id="regSubmitBtn" style="margin-top: 10px; padding: 12px; font-size: 1rem" data-i18n="auth_reg_btn">Daftar Akun</button>' },
  { regex: /<button\s*id="closeSettingsBtn"[^>]*>\s*Tutup\s*<\/button>/gi, rep: '<button id="closeSettingsBtn" class="btn-primary w-full" style="margin-top: 20px; padding: 10px" data-i18n="close_btn">Tutup</button>' }
];

files.forEach(file => {
  let p = path.join(dir, file);
  if (fs.existsSync(p)) {
    let content = fs.readFileSync(p, 'utf8');
    let original = content;
    
    replacements.forEach(r => {
      content = content.replace(r.regex, (match, p1) => {
        if(match.includes('data-i18n')) return match; 
        
        let result = r.rep;
        if(p1 !== undefined) {
            result = result.replace('$1', p1);
        }
        return result;
      });
    });

    if(content !== original) {
      fs.writeFileSync(p, content, 'utf8');
      console.log(`Updated ${file}`);
    }
  }
});
