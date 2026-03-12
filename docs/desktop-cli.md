# Desktop CLI

SkyMap exposes a desktop-only CLI through the Tauri CLI plugin.

## Examples

- `SkyMap.exe --focus`
- `SkyMap.exe --settings`
- `SkyMap.exe open object M31`
- `SkyMap.exe open route search`
- `SkyMap.exe import targets D:/astro/targets.csv`
- `SkyMap.exe import session-plan D:/astro/tonight.json`
- `SkyMap.exe solve image D:/astro/m31.fits --solver astap --ra-hint 10.684 --dec-hint 41.269 --fov-hint 2.5`

## Notes

- The CLI is desktop-only.
- When SkyMap is already running, later invocations are forwarded into the existing window.
- `solve image` opens the plate-solving workflow with the provided file and optional hints.
