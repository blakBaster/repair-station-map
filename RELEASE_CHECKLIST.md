# Public release checklist

Status: release hardening started 2026-10-06.

## Required before public launch
- [x] GitHub rollback branch created.
- [x] Supabase data snapshot created.
- [x] Public device actions require possession of the device secret.
- [x] Public writes routed through Edge Function.
- [x] Server-side IP-hash anti-spam added.
- [x] Station confirmation reputation farming limited (12h per station/device).
- [x] Photo upload permission validates device ownership.
- [x] Photo bucket is private and upload size is limited.
- [x] Privacy page added.
- [x] Usage rules page added.
- [x] Missing foreign-key indexes added.
- [ ] Manual iPhone Safari smoke test.
- [ ] Manual Android Chrome smoke test.
- [ ] Manual desktop Chrome/Edge smoke test.
- [ ] Real Passkey recovery test after clearing browser site data.
- [ ] Confirm GitHub Pages deployment of the final PWA version.

## Core smoke test
1. Open map and markers.
2. Open tools-only and pump-only station cards.
3. Add/remove favorite.
4. Verify recent list ordering and limit.
5. Submit a report.
6. Upload a station photo.
7. Suggest a new station with and without photo.
8. Moderate each item as admin.
9. Confirm station working; immediate repeat must be rate-limited.
10. Open profile/history/achievements.
11. Register Passkey and recover profile after clearing site data.
12. Check offline/PWA reload.
