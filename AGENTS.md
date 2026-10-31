This is an Expo/React Native mobile application. Prioritize mobile-first patterns, performance, and cross-platform compatibility.

## Expo has changed — do not trust your training data

Expo ships breaking changes every SDK release. APIs you remember are likely renamed, moved, or removed. Before writing any code that touches an Expo, EAS, or React Native API:

1. Read the major version of the `expo` package in `package.json`.
2. Fetch the matching versioned docs: `https://docs.expo.dev/versions/v<major>.0.0/`
3. For anything else, fetch https://docs.expo.dev/llms.txt — an index of all Expo docs with corrections to common LLM misconceptions. Follow its links to the specific page you need; never answer from memory.

## Commands

Use `bunx` instead of `npx` if the project uses bun (`bun.lock` present).

```bash
npx expo install <package>  # ALWAYS use instead of npm/yarn/pnpm/bun add — resolves SDK-compatible versions
npx expo start              # start the dev server
npx expo lint               # lint
npx tsc --noEmit            # typecheck
npx expo-doctor             # diagnose dependency and config issues
npx expo install --fix      # fix incompatible package versions
```

Run lint and typecheck before declaring any task done.

## Project Rules

### Kontrak Tipe
- Gunakan hanya tipe dari `types/habit.ts` (HabitCategory, Habit, DayProgress).
- Jangan gunakan `any` atau `@ts-ignore` dalam kode.
- Semua tipe harus valid TypeScript tanpa suppress.

### Kontrak Hook
- Gunakan hanya hook yang didefinisikan dalam kontrak: `useHabits()`, `useProgress()`.
- Jangan buat hook baru di luar kontrak yang sudah ditetapkan.

### Kontrak Komponen
- **SEMUA** komponen di bawah ini wajib diimpor dari `components/` (Dev B):
  `PrimaryButton`, `SecondaryButton`, `CategoryChip`, `ProgressBar`, `CircularProgress`, `HabitCard`, `ProgressCard`, `HabitIconPicker`, `EmptyState`, `ErrorState`, `ConfirmDeleteDialog`, `WeeklyBarChart`
- `components/` adalah **satu-satunya sumber** komponen reusable; `screens-ui/` hanyalah kandidasi sementara dari Dev C yang **dilarang menambah file baru** dan akan **dihapus** setelah konsolidasi.
- Setiap elemen hanya boleh memiliki **satu atribut** `style`.

### Pembagian Folder per Peran

- **A** = Setup & Data: `app/_layout`, `services`, `hooks`, `context`, `utils`, `types`

- **B** = Design System & Komponen: `theme` (token desain), `components` (SEMUA komponen reusable dari kontrak, lihat daftar di atas — Dev B)

- **C** = Layar & Integrasi: `app/index`, `app/(tabs)`, `app/add`, `app/habit`, `app/error` (layar lengkap, Dev C)
  - `screens-ui/` Semua layar memakai komponen dari `components/` dan token dari `theme/`. Folder `screens-ui/` sudah dihapus.
### Aturan tsc
- `tsc --noEmit` harus lolos tanpa error (0 error).
- Larangan utuh terhadap `any` dan `@ts-ignore`.
- Hanya izinkan tipe yang eksplisit dari kontrak.

Kemudian lanjut ke...

## Navigation & Routing

- Use **Expo Router** for all navigation. Routes live in `app/` — every file there is a screen, `_layout.tsx` files define navigators. Keep non-route code (components, hooks, utils) outside `app/`.
- Import `Link`, `router`, and `useLocalSearchParams` from `expo-router`.
- Docs: https://docs.expo.dev/router/introduction.md

## Building with EAS

Use EAS to build, sign, and submit the app in the cloud (`eas build`, `eas submit`) and to ship over-the-air updates (`eas update`) — no local Xcode or Android Studio required. Run EAS CLI as `bunx eas-cli <command>` in Bun projects, or `npx eas-cli@latest <command>` otherwise; substitute that for bare `eas` in docs examples.
Docs: https://docs.expo.dev/eas/index.md

## Rules

- If `ios/` and `android/` directories do not exist, they are generated (Continuous Native Generation). Never create or edit them by hand — configure native behavior in `app.json` and config plugins.
- Expo Go only includes its bundled native modules. After adding a library with native code, the app needs a development build: `npx expo run:ios|android` locally, or `eas build --profile development`.
- Prefer recommended Expo modules over third-party libraries, and check your available skills before adding dependencies. Docs: https://docs.expo.dev/versions/latest/index.md
