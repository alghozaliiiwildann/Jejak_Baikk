# JejakBaik - Habit Tracker

Aplikasi pelacak kebiasaan mobile built dengan React Native, Expo, dan TypeScript.

## 📱 Fitur MVP

- Splash/Loading screen dengan identitas JejakBaik
- Halaman Home dengan progres harian dan daftar kebiasaan
- Halaman Tambah Kebiasaan
- Halaman Detail Kebiasaan
- Halaman Progress dengan grafik 7 hari terakhir
- Penyimpanan lokal dengan AsyncStorage
- Navigasi bottom tab (Home & Progress)

## 🚀 Cara Menjalankan

```bash
# Install dependensi
npm install

# Jalankan development server
npx expo start
```

- `npm run web` - Buka di browser
- `npm run android` - Jalankan di emulator Android
- `npm run ios` - Jalankan di emulator iOS (butuh macOS)

## 🌿 Aturan Branch

- `main` - Branch produksi, hanya merge dari `develop`
- `develop` - Branch development utama, fitur fitur di merge dari `feature/*`
- `feature/*` - Branch fitur, dibuat dari `develop`, lalu merge kembali ke `develop`
- Gunakan pesan commit yang deskriptif

## 📁 Struktur Folder per Peran

Setiap file hanya boleh memiliki **satu pemilik** (role). Jika file terdaftar di beberapa role, perbaharui sesuai aturan berikut:

**A** = Setup & Data: `app/_layout`, `services`, `hooks`, `context`, `utils`, `types`

**B** = Design System & Komponen: `theme` (token desain), `components` (SEMUA komponen reusable dari kontrak: PrimaryButton, SecondaryButton, CategoryChip, ProgressBar, CircularProgress, HabitCard, ProgressCard, HabitIconPicker, EmptyState, ErrorState, ConfirmDeleteDialog, WeeklyBarChart — semuanya dari Dev B)

**C** = Layar & Integrasi: `app/index`, `app/(tabs)`, `app/add`, `app/habit`, `app/error` (layar lengkap, Dev C)
  - `screens-ui/` hanyalah **kandidasi sementara** berisi komponen duplikat dari Dev C yang **dilarang menambah file baru** dan akan **dihapus** setelah konsolidasi ke `components/`
  - Setiap file layar di `app/` harus mengimpor komponen dari `components/` saja

```
A = Setup & Data
  - app/_layout.tsx
  - services/storageService.ts
  - hooks/useHabits.ts
  - hooks/useProgress.ts
  - context/HabitsContext.tsx
  - utils/date.ts
  - utils/progress.ts
  - types/habit.ts

B = Design System & Komponen
  - components/PrimaryButton.tsx
  - components/SecondaryButton.tsx
  - components/CategoryChip.tsx
  - components/ProgressBar.tsx
  - components/CircularProgress.tsx
  - components/HabitCard.tsx
  - components/ProgressCard.tsx
  - components/HabitIconPicker.tsx
  - components/EmptyState.tsx
  - components/ErrorState.tsx
  - components/ConfirmDeleteDialog.tsx
  - components/WeeklyBarChart.tsx

C = Layar & Integrasi
  - app/index.tsx (Splash)
  - app/(tabs)/_layout.tsx
  - app/(tabs)/index.tsx (Home)
  - app/(tabs)/progress.tsx
  - app/add.tsx
  - app/habit/[id].tsx
  - app/error.tsx
```

## 🎨 Token Desain

- **Primary**: `#16A34A` - tombol utama, progres
- **Secondary**: `#86EFAC` - aksen hijau muda
- **Text**: `#1F2937` - teks utama
- **Text Secondary**: `#6B7280` - teks bantuan
- **Background**: `#F3F4F6` - latar aplikasi
- **Card**: `#FFFFFF` - kartu dan panel
- **Border**: `#E5E7EB` - garis pembatas
- **Success**: `#15803D` - status selesai
- **Error**: `#EF4444` - pesan error
- **Soft Green**: `#DCFCE7` - latar ikon/kategori

## 📏 Radius & Padding

- Kartu: 14-18 px
- Tombol/Input: 10-12 px
- Padding layar: 16-20 px

## 📦 Dependencies utama

- `expo-router` - navigasi berbasis rute
- `@react-native-async-storage/async-storage` - penyimpanan lokal
- `expo-font` - font management
- `@expo-google-fonts/poppins` - font Poppins
- `lucide-react-native` - ikon
- `react-native-svg` - SVG support
- `react-native-safe-area-context` - safe area handling



