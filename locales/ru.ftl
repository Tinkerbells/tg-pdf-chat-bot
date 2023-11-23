start = Привет {$first_name}, это бот для общения с pdf документами
        Чтобы начать использовать этого бота, просто отправьте файл

        • Напишите /help для вывода всех доступных команд
        • Напишите /about для вывода информации о боте

        ⚠️ Бот все еще в разработке
        Пожалуйста выберите стандартный язык:

back = ⬅️  Назад

help = 🤖 <b>Помощь по PDF Telegram Bot</b>

        Добро пожаловать в PDF Telegram Bot! Вот доступные команды:

        <b>/start</b> - Начать использование бота и получить введение.

        <b>/settings</b> - Получить доступ и изменить настройки бота.

        <b>/subscribe</b> - Подписаться для получения дополнительных опций.

        <b>/files</b> - Получить доступ и управлять документами в боте.

        <b>/about</b> - Получить информацию о боте.

        <b>/leave</b> - Выйти из чата.

        <b>/help</b> - Показать это сообщение справки.


about = 
        Ваш универсальный Telegram-бот для удобного общения с PDF.

        <b>Бесплатный тариф:</b>
        • Загрузка 5 файлов в месяц (до 20 страниц каждый).
        • Общение в реальном времени с PDF-файлами.

        Для расширенного использования активируйте премиум-функции, используя /subscribe

        <b>Премиум-функции:</b>
        • Голосовое общение
        • Краткое изожение текста
        • Расширенное хранилище файлов: 25 файлов в месяц (максимум 50 страниц)
        • Более высокое качество и быстрые ответы
        • Приоритетная поддержка

        <b>Жизненный цикл файла:</b> 30 дней. Файлы уничтожаются безопасно для конфиденциальности.

        Для поддержки свяжитесь с нами по адресу support@email.com

        Улучшите свое взаимодействие с PDF в Telegram с помощью нашего чат-бота!


advice = Улучшите свой опыт! При взаимодействии с PDF-файлами в нашем боте укажите ключевые слова из текста. 📚 Это повышает точность и делает взаимодействие более гладким. Ваш вклад важен для получения лучших результатов! 💡


# Payment description
payment_description = Подписка для продвинутого использования.
                      • 25 документов в месяц 
                      • 50 страниц для каждого документа
                      • Возможность общаться голосом
                      • Возможность сжимать документ, получая краткое изожение
                      • Повышенное качество ответов
                      • Приоритетная поддержка

# Payment titles
ONE_MONTH = 1 месяц подписки
THREE_MONTH = 3 месяца подписки 🌟 (15% скидка)
ONE_YEAR = 12 месяцов подписки 🌟 (25% скидка)

# Настройки управления подпиской
subscription_manage = 🔄 Управление подпиской

subscription_remaining = Ваша подписка завершится через <b>{$remaining}</b> дней.

subscription_success = Вы успешно подписались на

subscription_warning = Вы не подписаны!
                         Используйте /subscribe, чтобы увидеть все доступные варианты.

subscription_voice_warning = Вы не подписаны на использование этой функции!
                         Используйте /subscribe, чтобы использовать голосовую связь

subscription_files_limit_warning = На данный момент вы достигли максимального количества файлов в месяц!

subscription_free_files_limit_warning = На данный момент вы достигли максимального количества файлов в месяц!
                                     Подпишитесь с помощью /subscribe, чтобы увеличить лимит файлов.

subscription_pages_limit_warning = Вы достигли максимального количества страниц в одном файле


subscription_free_pages_limit_warning = Вы достигли максимального количества страниц в файле, разрешенного для бесплатного пользования!
                                     Подпишитесь с помощью /subscribe, чтобы увеличить лимит количества страниц для одного файл.


#ФАЙЛЫ
files_not_found = У вас еще нет документов
files_already_exist = Файл уже существует!
files_pdf_only_warninig = Файл должен быть в формате PDF!
files_saved = Файл сохранен <b>{$fileName}</b>
files_file_option = Документ - <b>{$file}</b>
files_next = ▶ Вперед 
files_prev = ◀ Назад 

#ЧАТ
chat_enter = 💬 Вход в чат с файлом <b>{$fileName}</b>:
chat_voice_large_warning = Извините, ваше голосовое сообщение слишком велико для обработки.
chat_command_warning = Ваш вопрос не должен начинаться с <b>"/"</b>!
                         Пожалуйста, попробуйте еще раз

chat_message_type_warning = ⚠️ Пожалуйста, используйте текстовые сообщения для оптимального общения. 
                            Голосовые сообщения доступны при подписке /subscribe.
                            Избегайте отправки изображений или файлов.

chat_leave = ❌ Выйти из чата
chat_loader = 💡 Обработка запроса...
prepare_doc = ⏱️ Подготовка документа...
chat_assistant = 🤖 <b>Ответ помощника:</b>

#МЕНЮ
files_menu_text = { $count ->
                      [one] У вас есть <b>{$count}</b> PDF-документ
                      *[other] У вас есть <b>{$count}</b> PDF-документов
}

interact_menu_text = Выберите, что вы хотите сделать:

settings_menu_text = Меню настроек:

providers_menu_text = Вы можете подписаться, используя следующие методы:
subscription_menu_text = Выберите тип подписки, которую вы хотите:

language_menu_text = 🌐 Стандартный язык

language_default = Стандартный язык - Русский 🇷🇺 

summarize_button = ✂️ Сжать документ

chat_button = 💬 Общаться 

save_button = 💾 Сохранить 

advice_button = Скрыть данное сообщение

leave_mesasge = Вы вышли из чата

error_message = Упс! Кажется, что-то пошло не так.

tooold_message = Извините за неудобства! Ваше последнее действие в приложении не может быть обработано из-за его устаревшего статуса. Пожалуйста, обновите и повторите попытку. Спасибо за понимание.

refain_message = ⚠️ Пожалуйста, избегайте выполнения повторяющихся действий или спама. 
