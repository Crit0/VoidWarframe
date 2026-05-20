# Voide Warframe

Full-stack веб-платформа сообщества Warframe: трекер мирового состояния,
каталог модов, AI-ассистент, хранилище файлов.

## Стек

| Слой | Технология |
|------|-----------|
| Фреймворк | Next.js 15 (App Router) |
| Язык | TypeScript |
| UI | React 19 + Tailwind CSS |
| База данных | PostgreSQL |
| ORM | Prisma 6 |
| Внешние API | api.warframestat.us (серверный кэш) |
| AI | Anthropic / OpenAI (через абстракцию) |
| Хостинг | Railway (Docker) |

## Структура проекта

```
.
├── prisma/
│   ├── schema.prisma        # схема БД (User, FileUpload, AiConversation, ApiCache…)
│   └── seed.ts              # демо-данные
├── src/
│   ├── app/
│   │   ├── layout.tsx       # корневой layout (Sidebar + BottomNav)
│   │   ├── page.tsx         # главная (worldstate)
│   │   ├── tracker/         # трекер событий (live)
│   │   ├── inventory/       # каталог модов
│   │   ├── wiki/            # заглушка «в разработке»
│   │   ├── builder/         # заглушка «в разработке»
│   │   ├── ai/              # AI-ассистент
│   │   ├── files/           # загрузка файлов
│   │   └── api/             # route handlers (backend)
│   │       ├── health/      # healthcheck для Railway
│   │       ├── worldstate/  # прокси Warframe API
│   │       ├── mods/ arcanes/ items/
│   │       ├── ai/          # AI-чат
│   │       ├── upload/      # загрузка файлов
│   │       └── files/[id]/  # отдача / удаление файла
│   ├── components/          # переиспользуемый UI
│   ├── lib/                 # prisma, env, cache, warframe, ai, uploads
│   └── types/               # TypeScript-типы
├── Dockerfile               # multi-stage сборка для Railway
├── docker-compose.yml       # локальный Postgres + app
├── railway.json             # конфигурация Railway
└── .env.example             # шаблон переменных окружения
```

## Локальный запуск

### 1. Зависимости

```bash
npm install
```

### 2. База данных

Поднять PostgreSQL через Docker:

```bash
docker compose up -d db
```

### 3. Переменные окружения

```bash
cp .env.example .env
```

Для локального Docker-Postgres `DATABASE_URL` уже подходит из коробки.

### 4. Миграции и генерация клиента

```bash
npm run db:migrate:dev    # создаёт таблицы
npm run db:seed           # (опционально) демо-пользователь
```

### 5. Запуск

```bash
npm run dev
```

Сайт: <http://localhost:3000>

## Деплой на Railway

1. **Создать проект** → <https://railway.app> → *New Project* → *Deploy from GitHub repo* → выбрать `crit0/voidwarframe`.
2. **Добавить PostgreSQL** → в проекте *New* → *Database* → *PostgreSQL*.
3. **Переменные окружения** сервиса приложения:
   - `DATABASE_URL` → `${{ Postgres.DATABASE_URL }}` (ссылка на БД-сервис)
   - остальные по необходимости (`AI_PROVIDER`, `AI_API_KEY`, …)
   - `PORT` Railway задаёт автоматически.
4. Railway обнаружит `Dockerfile` и `railway.json`, соберёт образ, применит миграции (`prisma migrate deploy`) и запустит сервер.
5. **Домен** → *Settings* → *Networking* → *Generate Domain*.
6. **Volume для файлов** → *New* → *Volume* → mount path `/app/uploads` (чтобы загруженные файлы переживали редеплой).

**Автодеплой:** Railway сам пересобирает и деплоит при каждом push в `main`.
`.github/workflows/ci.yml` дополнительно прогоняет lint + build на каждый push.

## Переменные окружения

См. `.env.example`. Ключевые:

| Переменная | Назначение |
|-----------|-----------|
| `DATABASE_URL` | Строка подключения PostgreSQL |
| `WARFRAME_API_BASE` | Базовый URL внешнего Warframe API |
| `WARFRAME_CACHE_TTL` | TTL серверного кэша worldstate (сек) |
| `AI_PROVIDER` | `anthropic` / `openai` / `none` |
| `AI_API_KEY` | Ключ AI-провайдера |
| `AI_MODEL` | Идентификатор модели |
| `UPLOAD_DIR` | Папка для загруженных файлов |
| `UPLOAD_MAX_BYTES` | Лимит размера файла |

## API routes

| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/api/health` | Healthcheck (статус БД) |
| GET | `/api/worldstate?lang=ru` | Worldstate (кэш) |
| GET | `/api/mods?lang=ru` | Каталог модов |
| GET | `/api/arcanes?lang=ru` | Каталог мистификаторов |
| GET | `/api/items?lang=ru` | Справочник предметов |
| GET/POST | `/api/ai` | Статус / запрос к AI |
| GET/POST | `/api/upload` | Список / загрузка файлов |
| GET/DELETE | `/api/files/:id` | Отдача / удаление файла |

Все ответы в формате `{ ok: boolean, data?, error? }`.

## Масштабирование

- **Backend** — route handlers независимы и stateless; легко выносятся в отдельные сервисы.
- **Кэш** — `ApiCache` в БД; при росте нагрузки заменяется на Redis без изменения вызывающего кода (`src/lib/cache.ts`).
- **Файлы** — `src/lib/uploads.ts` инкапсулирует хранилище; переключение на S3/R2 — точечное.
- **AI** — `src/lib/ai.ts` абстрагирует провайдера.
- **БД** — Prisma-миграции версионируют схему; новые модели (Wiki, Builder) добавляются без даунтайма.

## Лицензия

Неофициальный фан-проект. Warframe® — торговая марка Digital Extremes Ltd.
