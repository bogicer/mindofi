import { initializeApp } from "https://gstatic.com";
import { getAnalytics } from "https://gstatic.com";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut } from "https://gstatic.com";
import { getDatabase, ref, onValue } from "https://gstatic.com";

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

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getDatabase(app);

const emailInput = document.getElementById('email-input');
const passwordInput = document.getElementById('password-input');

// ========================================================
// 1. АВТОМАТИЧЕСКАЯ ПРОВЕРКА КЭША И АВТО-РЕДИРЕКТ
// ========================================================
onAuthStateChanged(auth, (user) => {
    const currentPath = window.location.pathname;
    
    // Проверяем, находится ли пользователь на странице входа
    const isLoginPage = currentPath.endsWith('index.html') || currentPath === '/' || currentPath.endsWith('index');

    if (user) {
        console.log("Сессия активна:", user.email);
        // Если авторизован и зашел на index.html -> перенаправляем в мессенджер
        if (isLoginPage) {
            window.location.href = "general.html";
        } else {
            // Если уже находится внутри мессенджера (general.html), запускаем базу данных
            initDatabaseListener();
        }
    } else {
        console.log("Авторизация в кэше отсутствует.");
        // Если сессии нет, а юзер сидит на закрытой странице general.html -> выкидываем на вход
        if (!isLoginPage) {
            window.location.href = "index.html";
        }
    }
});

// ========================================================
// 2. КНОПКИ
// ========================================================
if (document.getElementById('login-btn')) {
    document.getElementById('login-btn').addEventListener('click', async () => {
        const email = emailInput.value.trim();
        const password = passwordInput.value;
        if (!email || !password) return alert("Заполните поля!");
        try {
            await signInWithEmailAndPassword(auth, email, password);
            // Редирект сработает автоматически из функции onAuthStateChanged выше
        } catch (error) {
            alert("Ошибка входа: " + error.message);
        }
    });
}

if (document.getElementById('register-btn')) {
    document.getElementById('register-btn').addEventListener('click', async () => {
        const email = emailInput.value.trim();
        const password = passwordInput.value;
        if (!email || !password) return alert("Заполните поля!");
        try {
            await createUserWithEmailAndPassword(auth, email, password);
            alert("Аккаунт успешно создан! Сейчас вас перенаправит.");
        } catch (error) {
            alert("Ошибка регистрации: " + error.message);
        }
    });
}

if (document.getElementById('logout-btn')) {
    document.getElementById('logout-btn').addEventListener('click', () => {
        signOut(auth).then(() => {
            console.log("Вышли из системы. Перенаправление на вход...");
        });
    });
}

function initDatabaseListener() {
    const appStatusRef = ref(db, 'system/status');
    onValue(appStatusRef, (snapshot) => {
        console.log("Связь с Realtime DB установлена.");
    });
}
