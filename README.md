# GenerationWeb Landing

Готовый лендинг на Next.js для GenerationWeb.

## Что внутри

- русский продающий лендинг
- SEO metadata
- тёмный SaaS-дизайн
- блоки услуг, кейсов, форматов работы и контактов
- встроены ваши логотипы и скриншоты проектов

## Быстрый запуск на VPS

```bash
unzip generationweb-landing.zip
cd generationweb-landing
npm install
npm run build
npm run start
```

По умолчанию сайт стартует на `3000` порту.

## Запуск в dev-режиме

```bash
npm install
npm run dev
```

## Что желательно поменять перед запуском

Откройте файл:

```bash
components/site.tsx
```

И замените:

- `https://t.me/yourtelegram` на ваш Telegram
- `hello@generationweb.dev` на вашу почту
- при желании цены, сроки и тексты офферов

## Структура проекта

- `app/page.tsx` — главная страница
- `components/site.tsx` — весь контент лендинга
- `public/logo` — логотипы
- `public/projects` — скриншоты проектов

## Деплой через PM2

После сборки:

```bash
npm install -g pm2
pm2 start npm --name generationweb -- start
pm2 save
```

## Nginx reverse proxy

Пример конфига:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```
