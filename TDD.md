# TDD — Mucik (Technical Design Document) — KISS MVP

Berdasarkan: `PRD.md`. Versi ini disederhanakan untuk MVP — hanya yang dibutuhkan, tanpa over-engineering.

---

## 1. Arsitektur Aplikasi

**React Native bare** (TypeScript), seluruh data lokal, tanpa backend. Struktur sederhana: **UI → Zustand store → service → SQLite/native**.

```
Screens + Navigation
        │
        ▼
Zustand stores (library, playlist, queue, player)
        │
        ▼
Service layer (conversion, queue, playback, youtube, storage)
        │
        ▼
SQLite (songs, playlists, playlist_songs) + native modules
        (react-native-track-player, yt-dlp, ffmpeg, react-native-fs)
```

**Prinsip:**
- UI tidak berisi business logic; store hanya memanggil service.
- SQLite = source of truth untuk data lagu & playlist.
- Queue konversi **in-memory** (Zustand) — tidak dipersist ke DB (trade-off disepakati: hilang jika app dibunuh; bisa ditambahkan belakangan tanpa ubah schema).

---

## 2. Struktur Proyek

```
src/
├── types/            # song.ts, playlist.ts, queue.ts, youtube.ts
├── db/
│   ├── database.ts   # init SQLite + CREATE TABLE IF NOT EXISTS
│   └── repositories/
│       ├── songRepository.ts
│       └── playlistRepository.ts
├── services/
│   ├── youtube/
│   │   ├── urlParser.ts     # deteksi video/playlist link
│   │   └── ytDlp.ts         # wrapper binary yt-dlp (mockable)
│   ├── conversion/
│   │   ├── conversionService.ts  # download → convert → metadata → save
│   │   └── ffmpeg.ts             # wrapper konversi MP3 (LAME)
│   ├── queue/
│   │   └── queueManager.ts       # antrian + retry + state machine
│   ├── playback/
│   │   └── playbackService.ts    # wrapper react-native-track-player
│   └── storage/
│       └── storageService.ts     # path file + helper fs
├── store/
│   ├── libraryStore.ts
│   ├── playlistStore.ts
│   ├── queueStore.ts             # queue konversi in-memory
│   └── playerStore.ts
├── navigation/       # RootNavigator, TabNavigator
├── screens/          # Library, Playlists, SearchConvert, Settings, Player
├── components/       # ConvertQueueItem, SongListItem, PlayerBar, dll
└── index.js
```

*Tidak ada folder `hooks/` (pakai Zustand langsung), tidak ada `migrations.ts` (schema init), tidak ada `queueRepository` (queue in-memory).*

---

## 3. Data Model (SQLite)

Init saat app start dengan `CREATE TABLE IF NOT EXISTS` (bukan sistem migrasi).

### `songs`
| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | INTEGER PK AUTOINCREMENT | |
| `youtube_id` | TEXT UNIQUE | |
| `title` | TEXT | editable user |
| `artist` | TEXT | editable user |
| `album` | TEXT | editable user |
| `artwork_path` | TEXT | |
| `file_path` | TEXT | |
| `duration_ms` | INTEGER | |
| `source_url` | TEXT | |
| `created_at` | INTEGER | |

### `playlists`
| Kolom | Tipe |
|---|---|
| `id` | INTEGER PK AUTOINCREMENT |
| `name` | TEXT NOT NULL |
| `created_at` | INTEGER |

### `playlist_songs`
| Kolom | Tipe |
|---|---|
| `id` | INTEGER PK AUTOINCREMENT |
| `playlist_id` | INTEGER FK → playlists |
| `song_id` | INTEGER FK → songs |
| `position` | INTEGER |

Index: UNIQUE(`youtube_id`) pada songs; UNIQUE(`playlist_id`,`song_id`) pada playlist_songs.

---

## 4. Alur Konversi YouTube → MP3

### 4.1 Parsing Link
`urlParser.parse(url)`:
- Video: regex `/(?:youtube\.com\/watch\?v=|youtu\.be\/)([A-Za-z0-9_-]{11})/`
- Playlist: regex `/[?&]list=([A-Za-z0-9_-]+)/`
- Output: `{ type: 'video' }` | `{ type: 'playlist', playlistId }`

### 4.2 Alur Queue
```
paste link → parse
   ├─ playlist → ytDlp.listPlaylist → konfirmasi jumlah lagu → enqueue per video
   └─ video → enqueue
enqueue → queueManager.processNext() berurutan:
   Step 1 ytDlp.downloadAudio → temp cache
   Step 2 ffmpeg.convertToMp3 (LAME) → external storage
   Step 3 ambil metadata (title, channel→artist, album, thumbnail, duration)
   Step 4 simpan artwork → external storage
   Step 5 insert songs (SQLite)
   Step 6 status → done; lanjut job berikutnya
```

### 4.3 Retry & Gagal
- Gagal → retry otomatis **2x** (tanpa backoff rumit).
- Habis batas → status `failed` + alasan singkat + tombol retry manual (reset attempts).
- Cek free space sebelum konversi → gagal "Insufficient storage" jika tidak cukup.

---

## 5. Playback Service (react-native-track-player)

- `RegisterPlaybackService` + capacities Play/Pause/SkipToNext/SkipToPrevious/Stop + media notification (lock screen).
- Autoplay: `TrackPlayer.add(queue)` — track berikutnya jalan otomatis.
- Shuffle: acak urutan queue via `setQueue`.
- Repeat: `setRepeatMode(Off | Track | Queue)`.
- Handler: `remotePlay/Pause/Next/Previous/Stop/Seek` + sync `playback-state` → `playerStore`.
- `playerStore.play(songIds[], startIndex)` — bangun queue dari list aktif.

---

## 6. Metadata

- **Ekstraksi otomatis** saat konversi (di dalam `conversionService`): `title`, `channel` (→ artist), `album`, `thumbnail` (download → artwork_path), `duration` dari output JSON yt-dlp.
- **Edit user**: langsung update tabel `songs` via `songRepository.update()` (tanpa service terpisah).
- Metadata disimpan di SQLite, **bukan** ditulis ke ID3 tag.

---

## 7. Storage

- MP3: `getExternalFilesDir('music')` — app-specific external storage.
- Artwork: `getExternalFilesDir('artwork')`.
- Temp download: `getCacheDir()` — dihapus setelah konversi.
- `storageService`: `getSongsDir/getArtworkDir/getCacheDir`, `generateFileName`, `fileExists`, `moveFile`, `deleteFile`, `getFreeSpace`.

---

## 8. State Management (Zustand)

| Store | Isi |
|---|---|
| `libraryStore` | `songs[]`, grouping by artist/album, CRUD |
| `playlistStore` | `playlists[]`, `playlistSongs`, buat/hapus/add/remove/reorder |
| `queueStore` | `jobs[]` (in-memory), `addJobs`, `updateJobStatus`, progress |
| `playerStore` | `currentTrack`, `isPlaying`, `queue`, `shuffleOn`, `repeatMode` |

`queueStore` mendengarkan progress dari `queueManager` via callback sederhana.

---

## 9. Navigasi

- `RootNavigator`: Stack → `TabNavigator` + `PlayerScreen` (modal full-screen).
- `TabNavigator`: 4 tab — Library, Playlists, Search & Convert, Settings.
- `PlayerBar` (mini player) di atas tab bar → tap buka full-screen Player.

---

## 10. Error Handling

- Error dikategorikan 5 tipe user-facing:
  `INVALID_URL`, `NETWORK_ERROR`, `VIDEO_UNAVAILABLE` (privat/region/age-restricted), `INSUFFICIENT_STORAGE`, `CONVERSION_FAILED`.
- Hanya `conversionService` yang memakai pola `Result<T>`; service lain pakai try/catch sederhana.
- Error tampil sebagai status `failed` pada item queue.
- Tanpa `console.log` di production.

---

## 11. Testing Strategy

**Fokus pada logic core saja (bukan semua lapisan):**

| Modul | Kasus |
|---|---|
| `urlParser` | video link, youtu.be, playlist, invalid |
| `queueManager` | state machine + retry 2x + retry manual |
| `conversionService` | alur penuh dengan `ytDlp` & `ffmpeg` dimock + SQLite in-memory |

- Jest + ts-jest; native module (track-player, yt-dlp, ffmpeg) dimock.
- Yang diuji manual di device: background playback + lock screen, konversi nyata, persistensi library.

*Tidak ada unit test untuk store/UI/repository/storage/metadata — layer tersebut tipis dan mengikuti service yang sudah teruji.*

---

## 12. Non-Functional (ringkas)

| NFR | Desain |
|---|---|
| Performance | Konversi jalan sebagai proses native (yt-dlp/ffmpeg) — JS hanya orkestrasi; progress via callback |
| Reliability | Metadata & playlist di SQLite persisten; queue in-memory (toleransi hilang saat app dibunuh) |
| Storage | Cek free space sebelum konversi |
| Battery | Tanpa background conversion di v1 |
| Security | Semua lokal, tanpa credential |

---

## 13. Daftar Implementasi (Urutan Kerja)

1. Inisialisasi bare RN + TypeScript + linting.
2. `database.ts` (init + schema) + 2 repository.
3. `urlParser.ts` + test.
4. `storageService.ts`.
5. `ytDlp.ts` + `ffmpeg.ts` (wrapper mockable).
6. `conversionService.ts` + `queueManager.ts` + test.
7. `playbackService.ts` + `playerStore`.
8. Store lain + komponen + screens + navigasi.
9. E2E manual di device.
