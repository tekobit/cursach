# Конвертер валют
## Что умеет:
- Переводит деньги между 173 валютами
- Запоминает курсы на 1 час (кэширование)
- Подсказывает названия валют в выпадающем списке
## Как запустить:
1. Установите библиотеки
`pip install -r requirements.txt`
2. Создайте в папке проекта файл `.env` и вставьте туда:
```
SECRET_KEY=ключ_от_Django
URL=https://openexchangerates.org/api/latest.json
APP_ID=ключ_с_openexchangerates.org
```
3. Запустите сервер:
`python manage.py runserver`
