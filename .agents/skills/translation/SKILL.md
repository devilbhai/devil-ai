---
name: translation
description: General translation. Multi-language support, context preservation, terminology management.
---

# Translation

## When to Apply
Use this skill when implementing internationalization (i18n), translating UI text, or managing multi-language content.

## Core Concepts
- **i18n frameworks**: react-intl, i18next, next-intl
- **Message formatting**: ICU MessageFormat for plurals, dates, numbers
- **Locale management**: Language detection, switching, fallbacks
- **Translation keys**: Hierarchical key naming conventions
- **Context preservation**: Maintain meaning across languages

## Implementation
```json
// en.json
{
  "app.title": "Devil AI",
  "messages.count": "{count, plural, =0 {No messages} one {# message} other {# messages}}",
  "settings.language": "Language"
}

// i18next setup
import i18n from "i18next"
import { initReactI18next } from "react-i18next"

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: enMessages },
    es: { translation: esMessages },
  },
  lng: "en",
  fallbackLng: "en",
  interpolation: { escapeValue: false },
})
```

```tsx
// Component usage
import { useTranslation } from "react-i18next"

function App() {
  const { t } = useTranslation()
  return <h1>{t("app.title")}</h1>
}
```

## Best Practices
- Use descriptive key names (`settings.language`, not `s1.lang`)
- Always provide fallback translations for all keys
- Use ICU MessageFormat for plurals and complex expressions
- Never concatenate translated strings — use interpolation
- Store translations in JSON/YAML files, not inline
- Test with long strings and RTL languages for layout issues
