# Voide Warframe

Фан-сайт по игре **Warframe** с живыми данными от [api.warframestat.us](https://docs.warframestat.us/). Полностью статический — собран на чистом HTML, CSS и ES-модулях, без сборщика.

> A community fan site for **Warframe**, powered by [api.warframestat.us](https://docs.warframestat.us/). Pure static — HTML, CSS, ES modules. No build step.

---

## Быстрый старт / Quick start

Файлы загружаются через `fetch()` (i18n JSON), поэтому открывать `index.html` напрямую (через `file://`) не получится — нужен любой локальный HTTP-сервер.

```bash
# Python (есть в любой Linux/macOS)
python3 -m http.server 8000

# Node
npx serve .

# или PHP
php -S localhost:8000
```

Открыть `http://localhost:8000`.

---

## Деплой / Deploy

Это статика — любой хостинг подойдёт.

- **ClaudeFrame Free** — загрузить содержимое папки целиком (с `index.html` в корне).
- **GitHub Pages** — в репо → `Settings` → `Pages` → `Source: main / root`.
- **Netlify Drop** — перетащить папку в [app.netlify.com/drop](https://app.netlify.com/drop).
- **Cloudflare Pages / Vercel** — подключить репо, build command оставить пустым, output `/`.

---

## Структура

```
.
├── index.html               # Главная страница
├── README.md
├── assets/
│   ├── css/
│   │   ├── tokens.css       # CSS-переменные: цвета, шрифты, glow
│   │   ├── reset.css        # Минимальный reset
│   │   ├── layout.css       # Сайдбар + grid + адаптив
│   │   ├── components.css   # Карточки, кнопки, скелетоны
│   │   ├── animations.css   # @keyframes и reveal-on-scroll
│   │   ├── tracker.css      # Стили трекера (чипы, циклы, торговцы)
│   │   └── main.css         # @import всего выше
│   ├── js/
│   │   ├── config.js        # API URL, TTL кэша, языки, настройки трекера
│   │   ├── i18n.js          # Переводы (data-i18n атрибуты)
│   │   ├── api.js           # fetch + sessionStorage кэш worldstate
│   │   ├── sidebar.js       # Гамбургер, навигация, тосты «Скоро»
│   │   ├── animations.js    # Hero canvas + IntersectionObserver
│   │   ├── main.js          # Точка входа главной
│   │   ├── tracker.js       # Точка входа трекера
│   │   ├── sections/        # Секции главной (news, alerts)
│   │   └── tracker/         # Модули трекера
│   │       ├── settings.js  # Настройки + localStorage + UI
│   │       ├── format.js    # Локальное время + единый тикер
│   │       ├── recommend.js # Оценочная длительность + ценность дропа
│   │       └── sections/    # cycles, activities, fissures, live, nightwave, traders, recommended
│   ├── i18n/
│   │   ├── ru.json          # Русские строки (по умолчанию)
│   │   └── en.json          # Английские строки
│   └── img/
│       ├── favicon.svg
│       └── logo.svg
└── pages/
    └── tracker.html         # Трекер событий и торговцев
```

---

## Как добавить страницу

1. Скопировать `index.html` в `pages/wiki.html`.
2. Поменять пути ассетов на относительные (`../assets/...`).
3. Заменить содержимое `<main>` на новую страницу.
4. В `index.html` (и других страницах) убрать `data-placeholder` с соответствующего пункта меню — клик начнёт работать.

## Как добавить ключ перевода

Добавить ключ одновременно в `assets/i18n/ru.json` и `assets/i18n/en.json`, в HTML использовать:

```html
<h2 data-i18n="my.key">fallback text</h2>
<button data-i18n-attr="aria-label:my.key">…</button>
```

Поддерживается интерполяция `t("greet", { name: "Tenno" })` → строка `"Привет, {name}"`.

## Как добавить язык

1. Создать `assets/i18n/<code>.json` (скопировать `en.json`, перевести).
2. В `assets/js/config.js` добавить код в `SUPPORTED_LANGS`.
3. В `index.html` (шапка) добавить кнопку:
   ```html
   <button type="button" data-lang="uk" aria-pressed="false">UK</button>
   ```

---

## API

Сайт использует **WarframeStatus API** — открытый, без авторизации, с CORS.

Один запрос на главной:

```
GET https://api.warframestat.us/pc?language=ru
```

Возвращает разом: `news`, `alerts`, `events`, циклы Cetus / Earth / Vallis / Cambion / Duviri / Zariman, sortie, Nightwave, Baro и т.д. Ответы кэшируются в `sessionStorage` на 60 секунд. При сетевой ошибке отображается устаревший кэш с пометкой, иначе — карточка с кнопкой «Повторить».

Документация: <https://docs.warframestat.us/>.

---

## Что в планах

- [x] Главная — hero, новости, активные события, переключение языков
- [x] **Трекер** — циклы планет, Sortie/Archon/Arbitration/Archimedea/Steel Path, разломы (обычные + SP), алерты/вторжения/события, особые события (TennoCon/годовщина), Nightwave-задания, торговцы (Баро, Варзия, Дарво, Nightwave). Настройки времени, фильтры, рекомендации, локальный часовой пояс
- [ ] **Вики** — Warframes, оружие, моды, фракции
- [ ] **Билдер** — ручной + ИИ, инвентарь модов/мистификаторов
- [ ] **Звёздная карта** — миссии, квесты, Рейлджек, Дуивири, Стальной путь

---

## Дисклеймер

Это неофициальный фан-сайт. **Warframe®** — торговая марка Digital Extremes Ltd. Проект не связан с Digital Extremes.
