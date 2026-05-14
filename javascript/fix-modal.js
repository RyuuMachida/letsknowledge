const fs = require('fs');

function fixAuthModal() {
  const homePath = 'c:/INFOKOM/PPLG/semester-2/april/web perpus/home.html';
  const peminjamanPath = 'c:/INFOKOM/PPLG/semester-2/april/web perpus/peminjaman.html';
  const riwayatPath = 'c:/INFOKOM/PPLG/semester-2/april/web perpus/riwayat.html';

  const homeContent = fs.readFileSync(homePath, 'utf8');
  
  // Extract authModal from home.html
  // It starts with <div id="authModal" class="modal-overlay"> and ends before <nav id="floatingNav"
  const authModalRegex = /<div id="authModal"[\s\S]*?(?=<nav id="floatingNav")/g;
  const match = authModalRegex.exec(homeContent);
  
  if (!match) {
    console.error("Could not find authModal in home.html");
    return;
  }
  
  let authModalFull = match[0].trim() + '\n\n  ';
  
  // Need to make sure it has the hidden class initially
  authModalFull = authModalFull.replace('<div id="authModal" class="modal-overlay">', '<div id="authModal" class="modal-overlay hidden">');

  [peminjamanPath, riwayatPath].forEach(targetPath => {
    let targetContent = fs.readFileSync(targetPath, 'utf8');
    const targetRegex = /<div id="authModal"[\s\S]*?(?=<nav id="floatingNav")/g;
    
    if (targetRegex.test(targetContent)) {
      targetContent = targetContent.replace(targetRegex, authModalFull);
      fs.writeFileSync(targetPath, targetContent, 'utf8');
      console.log(`Fixed ${targetPath}`);
    } else {
      console.log(`Could not find authModal in ${targetPath}`);
    }
  });
}

fixAuthModal();
