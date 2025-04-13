const books = {
    book1: `Глава 1. Тайник\nТьма окутала старый дом, стоявший на краю деревни. Никто не заходил сюда годами, но слухи о тайнике, спрятанном где-то в стенах, не давали покоя. Лиза осторожно толкнула дверь, и скрип петель разорвал тишину. Её фонарик осветил пыльные половицы, но что-то подсказывало, что она здесь не одна...\n\nГлава 2. Следы в пыли\nУтром Лиза вернулась с тетрадью, найденной в подвале. Страницы были исписаны странными символами, словно кто-то пытался зашифровать секрет. Она не знала, что каждый шаг приближал её к разгадке — и к опасности...\n\nГлава 1. Тайник\nТьма окутала старый дом, стоявший на краю деревни. Никто не заходил сюда годами, но слухи о тайнике, спрятанном где-то в стенах, не давали покоя. Лиза осторожно толкнула дверь, и скрип петель разорвал тишину. Её фонарик осветил пыльные половицы, но что-то подсказывало, что она здесь не одна...\n\nГлава 2. Следы в пыли\nУтром Лиза вернулась с тетрадью, найденной в подвале. Страницы были исписаны странными символами, словно кто-то пытался зашифровать секрет. Она не знала, что каждый шаг приближал её к разгадке — и к опасности...\n\nГлава 1. Тайник\nТьма окутала старый дом, стоявший на краю деревни. Никто не заходил сюда годами, но слухи о тайнике, спрятанном где-то в стенах, не давали покоя. Лиза осторожно толкнула дверь, и скрип петель разорвал тишину. Её фонарик осветил пыльные половицы, но что-то подсказывало, что она здесь не одна...\n\nГлава 2. Следы в пыли\nУтром Лиза вернулась с тетрадью, найденной в подвале. Страницы были исписаны странными символами, словно кто-то пытался зашифровать секрет. Она не знала, что каждый шаг приближал её к разгадке — и к опасности...`,
    book2: `Это книга "Дорога к Тайнику ч.1". Скоро будет текст!`
};
let currentBook = 'book1';
let chunkSize = 500;
let currentPosition = 0;
let bookmarks = [];
const WebApp = window.Telegram.WebApp;
WebApp.ready();
WebApp.expand();
function syncTheme() {
    const telegramTheme = WebApp.themeParams.bg_color?.toLowerCase() === '#212121' ? 'dark' : 'light';
    setTheme(telegramTheme);
    document.getElementById('themeSelect').value = telegramTheme;
}
function loadSettings() {
    const saved = localStorage.getItem(`mkfiction_${WebApp.initDataUnsafe.user?.id || 'guest'}`);
    if (saved) {
        const settings = JSON.parse(saved);
        currentBook = settings.book || 'book1';
        currentPosition = settings.position || 0;
        bookmarks = settings.bookmarks || [];
        document.getElementById('bookSelect').value = currentBook;
    }
    syncTheme();
    updateContent();
    updateBookmarks();
}
function saveSettings() {
    localStorage.setItem(`mkfiction_${WebApp.initDataUnsafe.user?.id || 'guest'}`, JSON.stringify({
        book: currentBook,
        position: currentPosition,
        bookmarks: bookmarks,
        theme: document.getElementById('themeSelect').value
    }));
}
function getTextChunk(text, position) {
    if (!text || position >= text.length) {
        console.log(`Текст пуст или позиция ${position} за пределами: len=${text.length}`);
        return '';
    }
    const end = Math.min(position + chunkSize, text.length);
    let chunk = text.slice(position, end);
    if (end < text.length) {
        while (chunk.length > 0 && !/\s/.test(chunk[chunk.length - 1])) {
            chunk = chunk.slice(0, -1);
        }
    }
    console.log(`Кусок: pos=${position}, end=${end}, len=${chunk.length}`);
    return chunk;
}
function updateContent() {
    const text = books[currentBook];
    const chunk = getTextChunk(text, currentPosition);
    document.getElementById('bookContent').textContent = chunk;
    saveSettings();
}
document.getElementById('bookSelect').addEventListener('change', function() {
    currentBook = this.value;
    currentPosition = 0;
    updateContent();
});
document.getElementById('themeSelect').addEventListener('change', function() {
    setTheme(this.value);
    saveSettings();
});
function setTheme(theme) {
    document.body.className = theme;
}
function prevPage() {
    currentPosition = Math.max(0, currentPosition - chunkSize);
    updateContent();
}
function nextPage() {
    const text = books[currentBook];
    if (currentPosition + chunkSize < text.length) {
        currentPosition += chunkSize;
        updateContent();
    } else {
        WebApp.showAlert('Книга закончилась... или это лишь начало теней?');
    }
}
function addBookmark() {
    const name = prompt('Назови закладку:', `Закладка ${currentPosition}`);
    if (name) {
        bookmarks.push({ book: currentBook, position: currentPosition, name });
        updateBookmarks();
        saveSettings();
        WebApp.showAlert(`Закладка "${name}" сохранена на позиции ${currentPosition}!`);
    }
}
function showBookmarks() {
    updateBookmarks();
}
function updateBookmarks() {
    const list = document.getElementById('bookmarksList');
    list.innerHTML = '';
    bookmarks.forEach((bm, index) => {
        if (bm.book === currentBook) {
            const div = document.createElement('div');
            div.className = 'bookmark';
            div.textContent = `📖 ${bm.name} (поз. ${bm.position})`;
            div.onclick = () => {
                currentPosition = bm.position;
                updateContent();
            };
            list.appendChild(div);
        }
    });
}
const urlParams = new URLSearchParams(window.location.search);
const bookFromUrl = urlParams.get('book');
if (bookFromUrl && books[bookFromUrl]) {
    currentBook = bookFromUrl;
    document.getElementById('bookSelect').value = currentBook;
}
loadSettings();