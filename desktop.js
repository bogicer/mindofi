// Импортируем модули Firebase
import { initializeApp } from "https://gstatic.com";
import { getAnalytics } from "https://gstatic.com";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut } from "https://gstatic.com";
import { getDatabase, ref, onValue } from "https://gstatic.com";

// Ваши рабочие ключи
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

// Инициализация
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getDatabase(app);

// Безопасно находим элементы (если их нет на текущей странице, код больше не упадет)
const emailInput = document.getElementById('email-input');
const passwordInput = document.getElementById('password-input');
const loginBtn = document.getElementById('login-btn');
const registerBtn = document.getElementById('register-btn');
const logoutBtn = document.getElementById('logout-btn');

// ========================================================
// 1. БЕЗОПАСНЫЙ АВТО-РЕДИРЕКТ (ПРОВЕРКА КЭША)
// ========================================================
onAuthStateChanged(auth, (user) => {
    const currentPath = window.location.pathname;
    const isLoginPage = currentPath.endsWith('index.html') || currentPath === '/' || currentPath.endsWith('index');

    if (user) {
        console.log("Пользователь авторизован:", user.email);
        // Если залогинен и сидит на входе -> перекидываем в мессенджер
        if (isLoginPage) {
            window.location.href = "general.html";
        } else {
            initDatabaseListener();
        }
    } else {
        console.log("Авторизация отсутствует.");
        // If не залогинен и пытается открыть мессенджер -> выкидываем на вход
        if (!isLoginPage) {
            window.location.href = "index.html";
        }
    }
});

// ========================================================
// 2. ЛОГІКА КНОПКИ ВХОДУ (Защищенная)
// ========================================================
if (loginBtn) {
    loginBtn.addEventListener('click', async () => {
        const email = emailInput.value.trim();
        const password = passwordInput.value;
        if (!email || !password) return alert("Заполните поля!");
        try {
            await signInWithEmailAndPassword(auth, email, password);
        } catch (error) {
            alert("Ошибка входа: " + error.message);
        }
    });
}

// ========================================================
// 3. ЛОГІКА КНОПКИ РЕЕСТРАЦИИ (Защищенная)
// ========================================================
if (registerBtn) {
    registerBtn.addEventListener('click', async () => {
        const email = emailInput.value.trim();
        const password = passwordInput.value;
        if (!email || !password) return alert("Заполните поля!");
        try {
            await createUserWithEmailAndPassword(auth, email, password);
            alert("Аккаунт успешно создан!");
        } catch (error) {
            alert("Ошибка регистрации: " + error.message);
        }
    });
}

// ========================================================
// 4. ЛОГІКА КНОПКИ ВЫХОДА (Защищенная)
// ========================================================
if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        signOut(auth).then(() => {
            console.log("Вышли из системы.");
        });
    });
}

function initDatabaseListener() {
    const appStatusRef = ref(db, 'system/status');
    onValue(appStatusRef, (snapshot) => {
        console.log("Связь с Realtime DB ок.");
    });
}
