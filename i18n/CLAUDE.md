# internationalization Module

[Root](../CLAUDE.md) > **i18n**

> **Last Updated:** 2026-02-01
> **Module Type:** JSON

---

## Breadcrumb

`[Root](../CLAUDE.md) > **i18n**`

---

## Module Responsibility

The `i18n` module contains translations for all user-facing text in the application. It uses `next-intl` for internationalization and supports English and Chinese languages.

---

## Structure

```
i18n/
├── messages/
│   ├── en.json    # English translations
│   └── zh.json    # Chinese translations
├── config.ts      # i18n configuration
├── request.ts     # Next.js i18n request configuration
└── index.ts       # Module exports
```

---

## Translation Keys

Translations are organized by namespace:

| Namespace | Purpose |
|-----------|---------|
| `common` | Common UI text (buttons, labels, etc.) |
| `splash` | Splash screen messages |
| `about` | About dialog content |
| `home` | Home page content |
| `starmap` | Star map interface |
| `coordinates` | Coordinate display |
| `settings` | Settings panels |
| `equipment` | Equipment management |
| `targets` | Target list |
| `observation` | Observation logging |
| `overlays` | Overlay components |
| `search` | Search interface |
| `dialogs` | Dialogs and modals |
| `errors` | Error messages |

---

## Usage in Components

```typescript
import { useTranslations } from 'next-intl';

function MyComponent() {
  const t = useTranslations('starmap');

  return (
    <div>
      <h1>{t('title')}</h1>
      <p>{t('searchObjects')}</p>
    </div>
  );
}
```

---

## Adding New Translations

1. Add keys to both `en.json` and `zh.json`:

```json
// en.json
{
  "myFeature": {
    "title": "My Feature",
    "description": "Description here"
  }
}
```

```json
// zh.json
{
  "myFeature": {
    "title": "我的功能",
    "description": "描述在这里"
  }
}
```

2. Use in components:

```typescript
const t = useTranslations('myFeature');
<h1>{t('title')}</h1>
```

---

## Locale Persistence

User locale preference is stored in `skymap-locale` and managed by `lib/i18n/locale-store.ts`.

---

## Related Files

- [`messages/en.json`](./messages/en.json) - English translations
- [`messages/zh.json`](./messages/zh.json) - Chinese translations
- [`config.ts`](./config.ts) - i18n configuration
- [Root CLAUDE.md](../CLAUDE.md) - Project documentation
