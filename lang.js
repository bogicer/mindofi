// ============================================================
//  MINDOFI — Localization (i18n)
//  All app texts in one file
// ============================================================

const LANGS = {
  en: {
    // === Common ===
    app_name: "MINDOFI",
    loading: "Loading...",
    error: "Error",
    success: "Success",
    cancel: "Cancel",
    save: "Save",
    close: "Close",
    yes: "Yes",
    no: "No",
    ok: "OK",

    // === Login page ===
    subtitle: "Secure Messenger",
    phone_placeholder: "50 123 45 67",
    btn_continue: "Continue",
    btn_confirm: "Confirm",
    btn_create_account: "Create account",
    link_register: "No account? Sign up",
    link_login: "Already have an account? Sign in",
    link_back: "← Back",
    avatar_label: "Photo",
    name_placeholder: "Your name",
    username_placeholder: "@username (optional)",
    otp_sent_to: "Code sent to +",
    err_fill_both: "Fill in both fields",
    err_fill_phone: "Enter your phone number",
    err_wrong_code: "Wrong code",
    err_enter_5_digits: "Enter 5 digits",
    err_enter_name: "Enter your name",
    err_no_server: "Cannot connect to server",
    err_sms_failed: "Failed to send SMS. Try again later",
    err_avatar_large: "Avatar must be under 2 MB",
    ok_login_done: "Login successful!",
    ok_account_created: "Account created!",
    ok_sms_sent: "SMS sent to +",
    test_code: "🧪 TEST CODE: ",

    // === Sidebar ===
    search: "Search...",
    tab_all: "All",
    tab_groups: "Groups",
    tab_channels: "Channels",
    status_online: "Online",
    status_offline: "Offline",

    // === Empty state ===
    empty_title: "MINDOFI",
    empty_text: "Select a chat on the left or create a new one",

    // === Chat list ===
    no_chats: "No chats yet. Tap + to start.",
    nothing_found: "Nothing found",
    no_messages_yet: "No messages",
    preview_voice: "🎤 Voice",
    preview_krujok: "📹 Video",
    preview_image: "📷 Photo",
    preview_file: "📎 File",

    // === Chat ===
    message_placeholder: "Message...",
    no_messages_start: "No messages. Start chatting!",

    // === Profile ===
    profile: "Profile",
    avatar_hint: "Tap to change photo",
    field_name: "Name",
    field_username: "Username",
    field_bio: "About",
    bio_placeholder: "A few words about yourself...",
    field_birthday: "Date of birth",
    btn_save: "Save",

    // === Password ===
    section_password: "Password",
    field_current_pwd: "Current password",
    current_pwd_placeholder: "Empty if no password",
    field_new_pwd: "New password",
    new_pwd_placeholder: "At least 6 characters",
    field_repeat_pwd: "Repeat new password",
    repeat_pwd_placeholder: "Repeat",
    btn_change_pwd: "Change password",

    // === Language ===
    section_language: "Language",

    // === Theme ===
    theme_dark: "Dark theme",
    theme_on: "On",
    theme_off: "Off",

    // === Logout ===
    btn_logout: "Log out",

    // === Voice recording ===
    recording: "Recording",
    rec_hint: "Release to send",

    // === Calls ===
    call_voice: "Voice call",
    call_video: "Video call",
    call_calling: "Calling...",
    call_connecting: "Connecting...",
    call_connected: "Connected",
    incoming_call: "Incoming call",
    btn_accept: "Accept",
    btn_decline: "Decline",
    call_no_answer: "No answer",
    call_declined: "Declined",
    call_ended: "Call ended",

    // === Toasts ===
    toast_select_chat: "Select a chat",
    toast_no_mic: "No microphone access",
    toast_too_short: "Too short",
    toast_cancelled: "Cancelled",
    toast_uploading: "Uploading...",
    toast_file_too_large: "File too large",
    toast_sent: "Sent ✅",
    toast_upload_error: "Upload failed",
    toast_send_error: "Failed to send",
    toast_profile_saved: "Profile saved ✅",
    toast_password_set: "Password set ✅",
    toast_avatar_too_large: "Avatar must be under 2 MB",
    toast_not_found: "Not found",
    toast_this_is_you: "This is you",
    toast_age_error: "Age must be at least 13",
    toast_date_error: "Invalid date",
    toast_no_camera: "No camera access",
    toast_wrong_pwd: "Passwords don't match",
    toast_pwd_short: "Password must be at least 6 characters",
    toast_loading: "Loading...",
    toast_copied: "Copied",
    toast_deleted: "Deleted",
    confirm_delete: "Delete this message?",

    // === Context menu ===
    ctx_reply: "Reply",
    ctx_copy: "Copy",
    ctx_delete: "Delete",

    // === Buttons / tooltips ===
    btn_attach: "Attach file",
    btn_voice: "Hold to record",
    btn_send: "Send",
    btn_new_chat: "New chat",
    btn_theme: "Theme",
    btn_back: "Back",
    btn_audio_call: "Audio call",
    btn_video_call: "Video call",
    btn_menu: "Menu"
  },

  uk: {
    app_name: "MINDOFI",
    loading: "Завантаження...",
    error: "Помилка",
    success: "Успіх",
    cancel: "Скасувати",
    save: "Зберегти",
    close: "Закрити",
    yes: "Так",
    no: "Ні",
    ok: "ОК",

    subtitle: "Захищений месенджер",
    phone_placeholder: "50 123 45 67",
    btn_continue: "Продовжити",
    btn_confirm: "Підтвердити",
    btn_create_account: "Створити акаунт",
    link_register: "Немає акаунта? Зареєструватися",
    link_login: "Вже є акаунт? Увійти",
    link_back: "← Назад",
    avatar_label: "Фото",
    name_placeholder: "Ваше ім'я",
    username_placeholder: "@username (необов'язково)",
    otp_sent_to: "Код відправлено на +",
    err_fill_both: "Заповніть обидва поля",
    err_fill_phone: "Введіть номер телефону",
    err_wrong_code: "Невірний код",
    err_enter_5_digits: "Введіть 5 цифр",
    err_enter_name: "Введіть ім'я",
    err_no_server: "Не вдається підключитися до сервера",
    err_sms_failed: "Не вдалося надіслати SMS. Спробуйте пізніше",
    err_avatar_large: "Аватар до 2 МБ",
    ok_login_done: "Вхід виконано!",
    ok_account_created: "Акаунт створено!",
    ok_sms_sent: "SMS надіслано на +",
    test_code: "🧪 ТЕСТОВИЙ КОД: ",

    search: "Пошук...",
    tab_all: "Усі",
    tab_groups: "Групи",
    tab_channels: "Канали",
    status_online: "Онлайн",
    status_offline: "Офлайн",

    empty_title: "MINDOFI",
    empty_text: "Виберіть чат зліва або створіть новий",

    no_chats: "Чатів поки немає. Натисніть + щоб почати.",
    nothing_found: "Нічого не знайдено",
    no_messages_yet: "Немає повідомлень",
    preview_voice: "🎤 Голосове",
    preview_krujok: "📹 Кружок",
    preview_image: "📷 Фото",
    preview_file: "📎 Файл",

    message_placeholder: "Повідомлення...",
    no_messages_start: "Немає повідомлень. Почніть спілкування!",

    profile: "Профіль",
    avatar_hint: "Натисніть, щоб змінити фото",
    field_name: "Ім'я",
    field_username: "Username",
    field_bio: "Про себе",
    bio_placeholder: "Трохи про себе...",
    field_birthday: "Дата народження",
    btn_save: "Зберегти",

    section_password: "Пароль",
    field_current_pwd: "Поточний пароль",
    current_pwd_placeholder: "Порожньо, якщо пароля немає",
    field_new_pwd: "Новий пароль",
    new_pwd_placeholder: "Мінімум 6 символів",
    field_repeat_pwd: "Повторіть новий пароль",
    repeat_pwd_placeholder: "Повтор",
    btn_change_pwd: "Змінити пароль",

    section_language: "Мова",
    theme_dark: "Темна тема",
    theme_on: "Увімк.",
    theme_off: "Вимк.",
    btn_logout: "Вийти",
    recording: "Запис",
    rec_hint: "Відпустіть, щоб надіслати",

    call_voice: "Голосовий виклик",
    call_video: "Відеовиклик",
    call_calling: "Виклик...",
    call_connecting: "З'єднання...",
    call_connected: "З'єднано",
    incoming_call: "Вхідний виклик",
    btn_accept: "Прийняти",
    btn_decline: "Відхилити",
    call_no_answer: "Немає відповіді",
    call_declined: "Відхилено",
    call_ended: "Виклик завершено",

    toast_select_chat: "Виберіть чат",
    toast_no_mic: "Немає доступу до мікрофону",
    toast_too_short: "Занадто коротко",
    toast_cancelled: "Скасовано",
    toast_uploading: "Завантаження...",
    toast_file_too_large: "Файл занадто великий",
    toast_sent: "Надіслано ✅",
    toast_upload_error: "Помилка завантаження",
    toast_send_error: "Не вдалося надіслати",
    toast_profile_saved: "Профіль збережено ✅",
    toast_password_set: "Пароль встановлено ✅",
    toast_avatar_too_large: "Аватар до 2 МБ",
    toast_not_found: "Не знайдено",
    toast_this_is_you: "Це ви",
    toast_age_error: "Вік не менше 13 років",
    toast_date_error: "Невірна дата",
    toast_no_camera: "Немає доступу до камери",
    toast_wrong_pwd: "Паролі не співпадають",
    toast_pwd_short: "Пароль мінімум 6 символів",
    toast_loading: "Завантаження...",
    toast_copied: "Скопійовано",
    toast_deleted: "Видалено",
    confirm_delete: "Видалити це повідомлення?",

    ctx_reply: "Відповісти",
    ctx_copy: "Копіювати",
    ctx_delete: "Видалити",

    btn_attach: "Прикріпити файл",
    btn_voice: "Утримуйте для запису",
    btn_send: "Надіслати",
    btn_new_chat: "Новий чат",
    btn_theme: "Тема",
    btn_back: "Назад",
    btn_audio_call: "Аудіодзвінок",
    btn_video_call: "Відеодзвінок",
    btn_menu: "Меню"
  },

  ru: {
    app_name: "MINDOFI",
    loading: "Загрузка...",
    error: "Ошибка",
    success: "Успех",
    cancel: "Отмена",
    save: "Сохранить",
    close: "Закрыть",
    yes: "Да",
    no: "Нет",
    ok: "ОК",

    subtitle: "Безопасный мессенджер",
    phone_placeholder: "50 123 45 67",
    btn_continue: "Продолжить",
    btn_confirm: "Подтвердить",
    btn_create_account: "Создать аккаунт",
    link_register: "Нет аккаунта? Зарегистрироваться",
    link_login: "Уже есть аккаунт? Войти",
    link_back: "← Назад",
    avatar_label: "Фото",
    name_placeholder: "Ваше имя",
    username_placeholder: "@username (необязательно)",
    otp_sent_to: "Код отправлен на +",
    err_fill_both: "Заполните оба поля",
    err_fill_phone: "Введите номер телефона",
    err_wrong_code: "Неверный код",
    err_enter_5_digits: "Введите 5 цифр",
    err_enter_name: "Введите имя",
    err_no_server: "Не удаётся подключиться к серверу",
    err_sms_failed: "Не удалось отправить SMS. Попробуйте позже",
    err_avatar_large: "Аватар до 2 МБ",
    ok_login_done: "Вход выполнен!",
    ok_account_created: "Аккаунт создан!",
    ok_sms_sent: "SMS отправлена на +",
    test_code: "🧪 ТЕСТОВЫЙ КОД: ",

    search: "Поиск...",
    tab_all: "Все",
    tab_groups: "Группы",
    tab_channels: "Каналы",
    status_online: "В сети",
    status_offline: "Не в сети",

    empty_title: "MINDOFI",
    empty_text: "Выберите чат слева или создайте новый",

    no_chats: "Чатов пока нет. Нажмите + чтобы начать.",
    nothing_found: "Ничего не найдено",
    no_messages_yet: "Нет сообщений",
    preview_voice: "🎤 Голосовое",
    preview_krujok: "📹 Кружок",
    preview_image: "📷 Фото",
    preview_file: "📎 Файл",

    message_placeholder: "Сообщение...",
    no_messages_start: "Нет сообщений. Начните общение!",

    profile: "Профиль",
    avatar_hint: "Нажмите, чтобы изменить фото",
    field_name: "Имя",
    field_username: "Username",
    field_bio: "О себе",
    bio_placeholder: "Немного о себе...",
    field_birthday: "Дата рождения",
    btn_save: "Сохранить",

    section_password: "Пароль",
    field_current_pwd: "Текущий пароль",
    current_pwd_placeholder: "Пусто, если пароля нет",
    field_new_pwd: "Новый пароль",
    new_pwd_placeholder: "Минимум 6 символов",
    field_repeat_pwd: "Повторите новый пароль",
    repeat_pwd_placeholder: "Повтор",
    btn_change_pwd: "Сменить пароль",

    section_language: "Язык",
    theme_dark: "Тёмная тема",
    theme_on: "Вкл.",
    theme_off: "Выкл.",
    btn_logout: "Выйти",
    recording: "Запись",
    rec_hint: "Отпустите, чтобы отправить",

    call_voice: "Голосовой вызов",
    call_video: "Видеозвонок",
    call_calling: "Вызов...",
    call_connecting: "Соединение...",
    call_connected: "Соединено",
    incoming_call: "Входящий звонок",
    btn_accept: "Принять",
    btn_decline: "Отклонить",
    call_no_answer: "Нет ответа",
    call_declined: "Отклонён",
    call_ended: "Звонок завершён",

    toast_select_chat: "Выберите чат",
    toast_no_mic: "Нет доступа к микрофону",
    toast_too_short: "Слишком коротко",
    toast_cancelled: "Отменено",
    toast_uploading: "Загрузка...",
    toast_file_too_large: "Файл слишком большой",
    toast_sent: "Отправлено ✅",
    toast_upload_error: "Ошибка загрузки",
    toast_send_error: "Не удалось отправить",
    toast_profile_saved: "Профиль сохранён ✅",
    toast_password_set: "Пароль установлен ✅",
    toast_avatar_too_large: "Аватар до 2 МБ",
    toast_not_found: "Не найдено",
    toast_this_is_you: "Это вы",
    toast_age_error: "Возраст менее 13 лет",
    toast_date_error: "Неверная дата",
    toast_no_camera: "Нет доступа к камере",
    toast_wrong_pwd: "Пароли не совпадают",
    toast_pwd_short: "Пароль минимум 6 символов",
    toast_loading: "Загрузка...",
    toast_copied: "Скопировано",
    toast_deleted: "Удалено",
    confirm_delete: "Удалить это сообщение?",

    ctx_reply: "Ответить",
    ctx_copy: "Копировать",
    ctx_delete: "Удалить",

    btn_attach: "Прикрепить файл",
    btn_voice: "Удерживайте для записи",
    btn_send: "Отправить",
    btn_new_chat: "Новый чат",
    btn_theme: "Тема",
    btn_back: "Назад",
    btn_audio_call: "Аудиозвонок",
    btn_video_call: "Видеозвонок",
    btn_menu: "Меню"
  },

  pl: {
    app_name: "MINDOFI",
    loading: "Ładowanie...",
    error: "Błąd",
    success: "Sukces",
    cancel: "Anuluj",
    save: "Zapisz",
    close: "Zamknij",
    yes: "Tak",
    no: "Nie",
    ok: "OK",

    subtitle: "Bezpieczny komunikator",
    phone_placeholder: "50 123 45 67",
    btn_continue: "Kontynuuj",
    btn_confirm: "Potwierdź",
    btn_create_account: "Utwórz konto",
    link_register: "Nie masz konta? Zarejestruj się",
    link_login: "Masz konto? Zaloguj się",
    link_back: "← Wstecz",
    avatar_label: "Zdjęcie",
    name_placeholder: "Twoje imię",
    username_placeholder: "@username (opcjonalnie)",
    otp_sent_to: "Kod wysłany na +",
    err_fill_both: "Wypełnij oba pola",
    err_fill_phone: "Wprowadź numer telefonu",
    err_wrong_code: "Nieprawidłowy kod",
    err_enter_5_digits: "Wprowadź 5 cyfr",
    err_enter_name: "Wprowadź imię",
    err_no_server: "Nie można połączyć się z serwerem",
    err_sms_failed: "Nie udało się wysłać SMS",
    err_avatar_large: "Avatar do 2 MB",
    ok_login_done: "Zalogowano!",
    ok_account_created: "Konto utworzone!",
    ok_sms_sent: "SMS wysłano na +",
    test_code: "🧪 KOD TESTOWY: ",

    search: "Szukaj...",
    tab_all: "Wszystkie",
    tab_groups: "Grupy",
    tab_channels: "Kanały",
    status_online: "Online",
    status_offline: "Offline",

    empty_title: "MINDOFI",
    empty_text: "Wybierz czat po lewej lub utwórz nowy",

    no_chats: "Brak czatów. Naciśnij + aby rozpocząć.",
    nothing_found: "Nic nie znaleziono",
    no_messages_yet: "Brak wiadomości",
    preview_voice: "🎤 Głosowa",
    preview_krujok: "📹 Wideo",
    preview_image: "📷 Zdjęcie",
    preview_file: "📎 Plik",

    message_placeholder: "Wiadomość...",
    no_messages_start: "Brak wiadomości. Zacznij rozmowę!",

    profile: "Profil",
    avatar_hint: "Naciśnij, aby zmienić zdjęcie",
    field_name: "Imię",
    field_username: "Username",
    field_bio: "O sobie",
    bio_placeholder: "Kilka słów o sobie...",
    field_birthday: "Data urodzenia",
    btn_save: "Zapisz",

    section_password: "Hasło",
    field_current_pwd: "Aktualne hasło",
    current_pwd_placeholder: "Puste, jeśli brak hasła",
    field_new_pwd: "Nowe hasło",
    new_pwd_placeholder: "Minimum 6 znaków",
    field_repeat_pwd: "Powtórz nowe hasło",
    repeat_pwd_placeholder: "Powtórz",
    btn_change_pwd: "Zmień hasło",

    section_language: "Język",
    theme_dark: "Ciemny motyw",
    theme_on: "Wł.",
    theme_off: "Wył.",
    btn_logout: "Wyloguj",
    recording: "Nagrywanie",
    rec_hint: "Puść, aby wysłać",

    call_voice: "Połączenie głosowe",
    call_video: "Połączenie wideo",
    call_calling: "Dzwonię...",
    call_connecting: "Łączenie...",
    call_connected: "Połączono",
    incoming_call: "Połączenie przychodzące",
    btn_accept: "Odbierz",
    btn_decline: "Odrzuć",
    call_no_answer: "Brak odpowiedzi",
    call_declined: "Odrzucono",
    call_ended: "Połączenie zakończone",

    toast_select_chat: "Wybierz czat",
    toast_no_mic: "Brak dostępu do mikrofonu",
    toast_too_short: "Za krótko",
    toast_cancelled: "Anulowano",
    toast_uploading: "Wysyłanie...",
    toast_file_too_large: "Plik za duży",
    toast_sent: "Wysłano ✅",
    toast_upload_error: "Błąd wysyłania",
    toast_send_error: "Nie udało się wysłać",
    toast_profile_saved: "Profil zapisany ✅",
    toast_password_set: "Hasło ustawione ✅",
    toast_avatar_too_large: "Avatar do 2 MB",
    toast_not_found: "Nie znaleziono",
    toast_this_is_you: "To Ty",
    toast_age_error: "Wiek min. 13 lat",
    toast_date_error: "Nieprawidłowa data",
    toast_no_camera: "Brak dostępu do kamery",
    toast_wrong_pwd: "Hasła nie pasują",
    toast_pwd_short: "Hasło min. 6 znaków",
    toast_loading: "Ładowanie...",
    toast_copied: "Skopiowano",
    toast_deleted: "Usunięto",
    confirm_delete: "Usunąć tę wiadomość?",

    ctx_reply: "Odpowiedz",
    ctx_copy: "Kopiuj",
    ctx_delete: "Usuń",

    btn_attach: "Załącz plik",
    btn_voice: "Przytrzymaj aby nagrać",
    btn_send: "Wyślij",
    btn_new_chat: "Nowy czat",
    btn_theme: "Motyw",
    btn_back: "Wstecz",
    btn_audio_call: "Połączenie audio",
    btn_video_call: "Połączenie wideo",
    btn_menu: "Menu"
  },

  de: {
    app_name: "MINDOFI",
    loading: "Wird geladen...",
    error: "Fehler",
    success: "Erfolg",
    cancel: "Abbrechen",
    save: "Speichern",
    close: "Schließen",
    yes: "Ja",
    no: "Nein",
    ok: "OK",

    subtitle: "Sicherer Messenger",
    phone_placeholder: "50 123 45 67",
    btn_continue: "Weiter",
    btn_confirm: "Bestätigen",
    btn_create_account: "Konto erstellen",
    link_register: "Kein Konto? Registrieren",
    link_login: "Bereits ein Konto? Anmelden",
    link_back: "← Zurück",
    avatar_label: "Foto",
    name_placeholder: "Ihr Name",
    username_placeholder: "@username (optional)",
    otp_sent_to: "Code gesendet an +",
    err_fill_both: "Füllen Sie beide Felder aus",
    err_fill_phone: "Telefonnummer eingeben",
    err_wrong_code: "Falscher Code",
    err_enter_5_digits: "Geben Sie 5 Ziffern ein",
    err_enter_name: "Namen eingeben",
    err_no_server: "Verbindung zum Server nicht möglich",
    err_sms_failed: "SMS konnte nicht gesendet werden",
    err_avatar_large: "Avatar bis 2 MB",
    ok_login_done: "Anmeldung erfolgreich!",
    ok_account_created: "Konto erstellt!",
    ok_sms_sent: "SMS gesendet an +",
    test_code: "🧪 TESTCODE: ",

    search: "Suchen...",
    tab_all: "Alle",
    tab_groups: "Gruppen",
    tab_channels: "Kanäle",
    status_online: "Online",
    status_offline: "Offline",

    empty_title: "MINDOFI",
    empty_text: "Wählen Sie links einen Chat oder erstellen Sie einen neuen",

    no_chats: "Noch keine Chats. Tippen Sie + zum Starten.",
    nothing_found: "Nichts gefunden",
    no_messages_yet: "Keine Nachrichten",
    preview_voice: "🎤 Sprachnachricht",
    preview_krujok: "📹 Video",
    preview_image: "📷 Foto",
    preview_file: "📎 Datei",

    message_placeholder: "Nachricht...",
    no_messages_start: "Keine Nachrichten. Beginnen Sie zu chatten!",

    profile: "Profil",
    avatar_hint: "Tippen zum Ändern des Fotos",
    field_name: "Name",
    field_username: "Username",
    field_bio: "Über mich",
    bio_placeholder: "Ein paar Worte über Sie...",
    field_birthday: "Geburtsdatum",
    btn_save: "Speichern",

    section_password: "Passwort",
    field_current_pwd: "Aktuelles Passwort",
    current_pwd_placeholder: "Leer, wenn kein Passwort",
    field_new_pwd: "Neues Passwort",
    new_pwd_placeholder: "Mindestens 6 Zeichen",
    field_repeat_pwd: "Neues Passwort wiederholen",
    repeat_pwd_placeholder: "Wiederholen",
    btn_change_pwd: "Passwort ändern",

    section_language: "Sprache",
    theme_dark: "Dunkles Design",
    theme_on: "Ein",
    theme_off: "Aus",
    btn_logout: "Abmelden",
    recording: "Aufnahme",
    rec_hint: "Loslassen zum Senden",

    call_voice: "Sprachanruf",
    call_video: "Videoanruf",
    call_calling: "Anrufen...",
    call_connecting: "Verbinden...",
    call_connected: "Verbunden",
    incoming_call: "Eingehender Anruf",
    btn_accept: "Annehmen",
    btn_decline: "Ablehnen",
    call_no_answer: "Keine Antwort",
    call_declined: "Abgelehnt",
    call_ended: "Anruf beendet",

    toast_select_chat: "Chat auswählen",
    toast_no_mic: "Kein Mikrofonzugriff",
    toast_too_short: "Zu kurz",
    toast_cancelled: "Abgebrochen",
    toast_uploading: "Wird hochgeladen...",
    toast_file_too_large: "Datei zu groß",
    toast_sent: "Gesendet ✅",
    toast_upload_error: "Upload fehlgeschlagen",
    toast_send_error: "Senden fehlgeschlagen",
    toast_profile_saved: "Profil gespeichert ✅",
    toast_password_set: "Passwort gesetzt ✅",
    toast_avatar_too_large: "Avatar bis 2 MB",
    toast_not_found: "Nicht gefunden",
    toast_this_is_you: "Das sind Sie",
    toast_age_error: "Mindestalter 13 Jahre",
    toast_date_error: "Ungültiges Datum",
    toast_no_camera: "Kein Kamerazugriff",
    toast_wrong_pwd: "Passwörter stimmen nicht überein",
    toast_pwd_short: "Passwort mindestens 6 Zeichen",
    toast_loading: "Wird geladen...",
    toast_copied: "Kopiert",
    toast_deleted: "Gelöscht",
    confirm_delete: "Diese Nachricht löschen?",

    ctx_reply: "Antworten",
    ctx_copy: "Kopieren",
    ctx_delete: "Löschen",

    btn_attach: "Datei anhängen",
    btn_voice: "Halten zum Aufnehmen",
    btn_send: "Senden",
    btn_new_chat: "Neuer Chat",
    btn_theme: "Design",
    btn_back: "Zurück",
    btn_audio_call: "Sprachanruf",
    btn_video_call: "Videoanruf",
    btn_menu: "Menü"
  }
};

// ============================================================
//  CURRENT LANGUAGE
// ============================================================
let CURRENT_LANG = localStorage.getItem('mindofi_lang') || 'en';

function t(key) {
  const dict = LANGS[CURRENT_LANG] || LANGS.en;
  return dict[key] !== undefined ? dict[key] : (LANGS.en[key] || key);
}

function setLang(code) {
  if (!LANGS[code]) code = 'en';
  CURRENT_LANG = code;
  localStorage.setItem('mindofi_lang', code);
  applyTranslations();
  document.querySelectorAll('[data-lang]').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.lang === code);
  });
}

function getLang() {
  return CURRENT_LANG;
}

// ============================================================
//  APPLY TRANSLATIONS
// ============================================================
function applyTranslations() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    el.textContent = t(key);
  });

  document.querySelectorAll('[data-i18n-ph]').forEach(el => {
    const key = el.dataset.i18nPh;
    el.placeholder = t(key);
  });

  document.querySelectorAll('[data-i18n-title]').forEach(el => {
    const key = el.dataset.i18nTitle;
    el.title = t(key);
  });

  document.documentElement.lang = CURRENT_LANG;
}

// Auto-apply on load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', applyTranslations);
} else {
  applyTranslations();
}

// Auto-bind [data-lang] buttons
document.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-lang]');
  if (btn && btn.dataset.lang) {
    setLang(btn.dataset.lang);
  }
});
