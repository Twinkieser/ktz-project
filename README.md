# KTZ Locomotive Dispatcher

Система управления подвязками локомотивов КТЗ.

## Запуск локально

### 1. Установка зависимостей
```bash
npm install
```

### 2. Настройка окружения
Создайте файл `.env` на основе `.env.example`:
```bash
VITE_API_BASE_URL=http://localhost:3000
```

### 3. Запуск Backend + Frontend
```bash
npm run dev
```

Сервер будет запущен на [http://localhost:3000](http://localhost:3000).

## Структура API
- `GET /api/health` - Проверка состояния API
- `GET /api/locomotives` - Список локомотивов
- `GET /api/assignments` - Список подвязок
- `POST /api/import/assignments` - Массовый импорт из XLSX/CSV

## Решение проблем с Preview (302 Redirect)
Если в AI Studio Preview запросы возвращают 302, убедитесь что:
1. Backend запущен (`npm run dev`).
2. В браузере разрешены сторонние куки (Third-party cookies).
3. `VITE_API_BASE_URL` указывает на корректный адрес сервера.
