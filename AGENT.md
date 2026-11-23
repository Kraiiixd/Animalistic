# Animash (web streaming anime, Express + EJS)

- Lokasi app: folder `Animash/` (bukan root panel). Entry: `Animash/index.js`.
- MAIN_FILE startup variable = `Animash/index.js`.
- `.env` ada di `Animash/`. index.js memuat dotenv dengan path `__dirname` (sudah diperbaiki).
- Dependency diinstall di `Animash/` (`cd Animash && npm install`). Startup command tidak menjalankan npm install di folder itu, jadi jalankan manual setelah reinstall atau tambah package.
- Port: PORT dari env panel (10145). Database PostgreSQL via DATABASE_URL.
- Git repo: Kraiiixd/Animalistic branch main.
- Sudah berjalan normal (Mei log "Animash running at http://localhost:10145", HTTP 200).
