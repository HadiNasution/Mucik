# PRD — Mucik (Music Player for Android)

## 1. Overview

**Mucik** adalah aplikasi Android music player yang memungkinkan pengguna mengkonversi video YouTube menjadi MP3, menyimpannya di device, memutar musik di background (termasuk saat layar terkunci), serta mengorganisir lagu ke dalam playlist.

- **Platform:** Android (min SDK 33 / Android 13+)
- **Stack:** React Native (bare RN / react-native CLI), TypeScript
- **Versi:** v1

## 2. Goals & Non-Goals
/po
### Goals
- Konversi video YouTube → MP3 langsung di device (on-device).
- Pemutaran musik berjalan di background saat app tertutup / layar terkunci.
- Pengorganisasian lagu: grouping otomatis (artis/album) + playlist manual.
- Autoplay dari list aktif dengan mode shuffle & repeat.

### Non-Goals (v1)
- Import lagu lokal dari storage device.
- Konversi berjalan di background (headless) — ditunda ke versi berikutnya.
- Streaming online / download progresif.
- Support iOS.

## 3. User Persona & Use Cases

- **Persona:** Pengguna yang ingin mendownload & mendengarkan musik dari YouTube secara offline di Android.
- **Use cases utama:**
  1. Paste link YouTube (video tunggal atau playlist) → konversi ke MP3 → lagu tersimpan di library.
  2. Memutar lagu dari list mana pun; lagu berikutnya otomatis berjalan; bisa di-shuffle.
  3. Mengelompokkan lagu otomatis per artis/album dan membuat playlist manual.
  4. Edit metadata lagu (judul, artis, album, cover).
  5. Musik tetap berjalan saat layar terkunci dengan kontrol di lock screen.

## 4. Keputusan Teknis (hasil QnA)

| Area | Keputusan |
|---|---|
| Konversi | On-device (yt-dlp + ffmpeg, encoder LAME) |
| Format output | MP3 |
| Metadata | Otomatis dari YouTube, bisa diedit user (disimpan di app, bukan ID3 tag) |
| Database lokal | SQLite |
| Lokasi file | App-specific external storage (`Android/data/<package>/...`) |
| Playback | `react-native-track-player` (background service, lock screen, media notification) |
| Playlist | Grouping otomatis (artis/album) + playlist manual |
| Alur konversi | Queue multi-lagu, foreground, status per item |
| Kegagalan konversi | Retry otomatis 2x → status failed + alasan + retry manual |
| Link playlist YouTube | Auto-expand ke queue (dengan konfirmasi jumlah lagu) |
| Bahasa UI | English |
| Minimum Android | 13 (API 33) |
| Nama aplikasi | Mucik |

## 5. Fitur Utama (v1)

### 5.1 Konversi YouTube → MP3
- Input link video atau playlist YouTube di layar Search & Convert.
- Deteksi tipe link: video tunggal atau playlist.
- Link playlist di-expand ke daftar video; tampilkan konfirmasi jumlah lagu sebelum masuk queue.
- Antrian konversi multi-lagu berjalan berurutan (foreground), masing-masing item punya status: queued / converting / done / failed.
- Progres per item ditampilkan (download → convert → done).
- Metadata diambil otomatis dari YouTube (judul, artis, album, cover).
- Kegagalan: retry otomatis 2x, lalu status `failed` dengan alasan singkat dan tombol retry manual.
- Video tidak valid (privat, region-blocked, age-restricted, network error) ditangani dan dilaporkan.

### 5.2 Library & Playlist
- **Library / All Songs:** daftar semua lagu hasil konversi.
- **Grouping otomatis:** tampilan per Artis dan per Album (dari metadata).
- **Playlist manual:** user membuat playlist, menambahkan/menghapus lagu, mengubah urutan.
- Edit metadata lagu (judul, artis, album, cover) dari layar Settings/detail lagu.
- Hapus lagu dari library.

### 5.3 Pemutaran (Playback)
- Play / pause / stop.
- **Autoplay:** saat satu lagu selesai, lagu berikutnya dari list aktif otomatis diputar.
- **Shuffle:** toggle global di player untuk mengacak urutan queue.
- **Repeat:** mode off / one / all.
- **Background playback:** musik tetap berjalan saat app di background / layar terkunci.
- Media notification + kontrol di lock screen (play/pause/skip).
- Full-screen player: cover, judul/artis, kontrol, daftar queue.

### 5.4 Storage
- File MP3 disimpan di app-specific external storage (bisa diakses via file manager, hilang saat uninstall).
- Metadata & playlist disimpan di SQLite.
- Tidak ada upload ke server; semua data lokal di device.

## 6. Layar / Navigasi

- 4 tab utama:
  1. **Library** — All Songs (list utama)
  2. **Playlists** — Playlist manual + grouping Artis/Album
  3. **Search & Convert** — Input link + antrian konversi
  4. **Settings** — Edit metadata, hapus lagu, preferensi
- **Full-screen Player** — muncul dari mana saja saat lagu diputar.

## 7. Non-Functional Requirements

- **Performance:** queue konversi tidak memblokir UI utama; progres ditampilkan secara smooth.
- **Reliability:** kegagalan jaringan tidak kehilangan queue; status tersimpan di SQLite sehingga bertahan saat app ditutup.
- **Storage awareness:** konversi berhenti dengan pesan yang jelas jika storage device penuh.
- **Battery:** playback background tidak menghalangi; tanpa background conversion di v1 untuk menghemat daya.
- **Security:** tidak ada hardcoded credential; seluruh operasi lokal.

## 8. Teknologi yang Disarankan

- React Native (bare), TypeScript
- `react-native-track-player` — background playback
- `react-native-yt-dlp` (atau binary yt-dlp) — download audio YouTube
- ffmpeg-kit build dengan encoder MP3 (LAME) — konversi
- SQLite (`react-native-sqlite-storage` / nitro-sqlite) — metadata & playlist
- Navigation: `react-navigation`

## 9. Open Questions / Backlog (v2+)

- Import & scan lagu lokal.
- Konversi background (headless) + wake lock.
- Export/share lagu.
- Streaming online.
- Support iOS.
- i18n (multi-language).

## 10. Success Metrics (v1)

- 100% lagu hasil konversi dapat diputar, termasuk saat layar terkunci.
- Queue konversi berjalan stabil (tidak crash) dengan banyak item.
- Metadata & playlist persisten setelah app ditutup & dibuka ulang.
