// Імпортуємо необхідні модулі Firebase з безкоштовного CDN
import { initializeApp } from "https://gstatic.com";
import { getAnalytics } from "https://gstatic.com";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut } from "https://gstatic.com";
import { getDatabase, ref, onValue } from "https://gstatic.com";

// Ваші реальні конфігураційні дані від Google Firebase
const firebaseConfig = {
    apiKey: "AIzaSyCz313sTrdM_jDKmXY9jWQT4X2RKuB04P4",
    authDomain: "://firebaseapp.com",
    databaseURL: "https://firebasedatabase.app",
    projectId: "mindofi",
    storageBucket: "mindofi.firebasestorage.app",
    messagingSenderId: "1090246608018",
    appId: "1:1090246608018:web:861ebc1f284d6edf28124b",
    measurementId: "G-6CMMF2MSTP"
};

// Ініціалізація сервісів
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getDatabase(app);

// Елементи інтерфейсу з вашої верстки
const loginScreen = document.getElementById('login-screen');
const appScreen = document.getElementById('app-screen');
const emailInput = document.getElementById('email-input');
const passwordInput = document.getElementById('password-input');

// ========================================================
// 1. АВТОМАТИЧНА ПЕРЕВІРКА СТАНУ АВТОРИЗАЦІЇ
// ========================================================
onAuthStateChanged(auth, (user) => {
    if (user) {
        console.log("Авторизовано під користувачем:", user.email);
        // Перемикаємо відображення: відкриваємо месенджер, ховаємо вхід
        loginScreen.style.display = 'none';
        appScreen.style.display = 'block';

        // Запуск прослуховування бази даних (повідомлень) після входу
        initDatabaseListener();
    } else {
        console.log("Користувач не авторизований.");
        // Показуємо екран логіну, ховаємо інтерфейс чатів
        loginScreen.style.display = 'block';
        appScreen.style.display = 'none';
    }
});

// ========================================================
// 2. ЛОГІКА КНОПКИ ВХОДУ (LOGIN)
// ========================================================
document.getElementById('login-btn').addEventListener('click', async () => {
    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!email || !password) {
        alert("Будь ласка, заповніть усі поля для входу!");
        return;
    }

    try {
        await signInWithEmailAndPassword(auth, email, password);
        console.log("Вхід виконано успішно!");
    } catch (error) {
        console.error("Помилка входу:", error.code);
        alert("Помилка авторизації: " + error.message);
    }
});

// ========================================================
// 3. ЛОГІКА КНОПКИ РЕЄСТРАЦІЇ (REGISTER)
// ========================================================
document.getElementById('register-btn').addEventListener('click', async () => {
    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!email || !password) {
        alert("Будь ласка, заповніть усі поля для реєстрації!");
        return;
    }

    try {
        await createUserWithEmailAndPassword(auth, email, password);
        alert("Акаунт для месенджера Mindofi успішно створено!");
    } catch (error) {
        console.error("Помилка реєстрації:", error.code);
        alert("Не вдалося створити акаунт: " + error.message);
    }
});

// ========================================================
// 4. ЛОГІКА КНОПКИ ВИХОДУ З СИСТЕМИ (LOGOUT)
// ========================================================
document.getElementById('logout-btn').addEventListener('click', () => {
    signOut(auth).then(() => {
        console.log("Користувач вийшов з акаунта.");
    }).catch((error) => {
        alert("Помилка при виході: " + error.message);
    });
});

// ========================================================
// 5. ТЕСТОВЕ ЗЧИТУВАННЯ З ВАШОЇ REALTIME DATABASE
// ========================================================
function initDatabaseListener() {
    // Посилання на тест-гілку статусів у вашій базі
    const appStatusRef = ref(db, 'system/status');
    
    onValue(appStatusRef, (snapshot) => {
        const data = snapshot.val();
        console.log("Дані з Realtime Database:", data);
    });
}
