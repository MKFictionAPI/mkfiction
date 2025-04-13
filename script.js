const books = {
    book1: `Глава 1. Тайник\nТьма окутала старый дом, стоявший на краю деревни. Никто не заходил сюда годами, но слухи о тайнике, спрятанном где-то в стенах, не давали покоя. Лиза осторожно толкнула дверь, и скрип петель разорвал тишину. Её фонарик осветил пыльные половицы, но что-то подсказывало, что она здесь не одна...\n\nГлава 2. Следы в пыли\nУтром Лиза вернулась с тетрадью, найденной в подвале. Страницы были исписаны странными символами, словно кто-то пытался зашифровать секрет. Она не знала, что каждый шаг приближал её к разгадке — и к опасности...`,
    book2: `Глава 1. Дорога к Тайнику\nЛиза шагала по пыльной тропе, ведущей к заброшенной деревне. Ветер шептал о тайнах, а тени деревьев казались живыми. Она знала, что где-то впереди скрывается ответ, но каждый шаг был испытанием...\n\nГлава 2. Первый след\nНа обочине Лиза нашла старую карту, потрёпанную временем. Странные метки указывали на холм за деревней. Сердце билось быстрее — это был её шанс раскрыть тайну...`,
    book3: `Скоро будет текст для "Дорога к Тайнику. Часть 2"...`,
    book4: `Скоро будет текст для "Ключи к Тайнику"...`,
    book5: `Скоро будет текст для "Тайник. Тыкулкас"...`,
    book6: `Скоро будет текст для "Городской детектив. Часть 1. Тени прошлого"...`,
    book7: `Скоро будет текст для "Городской детектив. Часть 2. Штопая сердца"...`,
    book8: `Скоро будет текст для "Городской детектив. Часть 3. Смерть в отпечатках"...`,
    book9: `Скоро будет текст для "Сломанный лёд"...`,
    book10: `Скоро будет текст для "Сломанный лёд 2"...`,
    book11: `Скоро будет текст для "Сломанный лёд 3"...`,
    book12: `Скоро будет текст для "Сломанный лёд 4"...`,
    book13: `Скоро будет текст для "Потерянные во времени"...`,
    book14: `Скоро будет текст для "За дверью завтрашнего дня. Часть 1. Анамнез"...`,
    book15: `Скоро будет текст для "За дверью завтрашнего дня. Часть 2. Диагноз"...`,
    book16: `Скоро будет текст для "Мурцовка. Том 1"...`,
    book17: `Скоро будет текст для "Зимний Эндшпиль"...`,
    book18: `Скоро будет текст для "Созданная демоном. Книга первая. Васюганские болота"...`,
    book19: `Скоро будет текст для "Простота вечности. Пробуждение"...`,
    book20: `Скоро будет текст для "Ведьмина Кюля"...`
};
let currentBook = '';
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
        currentBook = settings.book || '';
        currentPosition = settings.position || 0;
        bookmarks = settings.bookmarks || [];
        if (currentBook) {
            document.getElementById('bookSelect').value = currentBook;
            showReader();
        } else {
            showWelcome();
        }
    } else {
        showWelcome();
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
        theme: document.getElementById('themeSelect')?.value || 'light'
    }));
}
function showWelcome() {
    document.getElementById('welcomePage').style.display = 'block';
    document.getElementById('readerPage').style.display = 'none';
    currentBook = '';
    updateContent();
}
function showReader() {
    document.getElementById('welcomePage').style.display = 'none';
    document.getElementById('readerPage').style.display = 'block';
    updateContent();
}
function startReading() {
    const select = document.getElementById('bookSelectWelcome');
    if (select.value) {
        currentBook = select.value;
        currentPosition = 0;
        document.getElementById('bookSelect').value = currentBook;
        showReader();
        saveSettings();
    } else {
        WebApp.showAlert('Выбери книгу, чтобы начать!');
    }
}
function backToWelcome() {
    showWelcome();
    saveSettings();
}
function getTextChunk(text, position) {
    if (!text || position >= text.length) {
        return '';
    }
    const end = Math.min(position + chunkSize, text.length);
    let chunk = text.slice(position, end);
    if (end < text.length) {
        while (chunk.length > 0 && !/\s/.test(chunk[chunk.length - 1])) {
            chunk = chunk.slice(0, -1);
        }
    }
    return chunk;
}
function updateContent() {
    const content = document.getElementById('bookContent');
    if (!currentBook) {
        content.textContent = '';
        return;
    }
    const text = books[currentBook];
    const chunk = getTextChunk(text, currentPosition);
    content.textContent = chunk;
    saveSettings();
}
document.getElementById('bookSelect')?.addEventListener('change', function() {
    currentBook = this.value;
    currentPosition = 0;
    updateContent();
});
document.getElementById('themeSelect')?.addEventListener('change', function() {
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
    if (!currentBook) return;
    const name = prompt('Назови закладку:', `Закладка ${currentPosition}`);
    if (name) {
        bookmarks.push({ book: currentBook, position: currentPosition, name });
        updateBookmarks();
        saveSettings();
        WebApp.showAlert(`Закладка "${name}" сохранена на позиции ${currentPosition}!`);
    }
}
function deleteBookmark(index) {
    bookmarks.splice(index, 1);
    updateBookmarks();
    saveSettings();
    WebApp.showAlert('Закладка удалена!');
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
            const text = document.createElement('span');
            text.textContent = `📖 ${bm.name} (поз. ${bm.position})`;
            text.onclick = () => {
                currentPosition = bm.position;
                updateContent();
            };
            const deleteBtn = document.createElement('span');
            deleteBtn.textContent = '🗑️';
            deleteBtn.style.cursor = 'pointer';
            deleteBtn.onclick = () => deleteBookmark(index);
            div.appendChild(text);
            div.appendChild(deleteBtn);
            list.appendChild(div);
        }
    });
}
const urlParams = new URLSearchParams(window.location.search);
const bookFromUrl = urlParams.get('book');
if (bookFromUrl && books[bookFromUrl]) {
    currentBook = bookFromUrl;
    document.getElementById('bookSelect').value = currentBook;
    showReader();
} else {
    showWelcome();
}
loadSettings();
