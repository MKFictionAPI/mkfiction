const books = {
    book1: null,
    book2: null,
    book3: null,
    book4: null,
    book5: null,
    book6: null,
    book7: null,
    book8: null,
    book9: null,
    book10: null,
    book11: null,
    book12: null,
    book13: null,
    book14: null,
    book15: null,
    book16: null,
    book17: null,
    book18: null,
    book19: null,
    book20: null
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
async function updateContent() {
    const content = document.getElementById('bookContent');
    if (!currentBook) {
        content.textContent = '';
        return;
    }
    if (books[currentBook] === null) {
        try {
            const response = await fetch(`books/${currentBook}.txt`);
            if (!response.ok) throw new Error('Текст не найден');
            books[currentBook] = await response.text();
        } catch (error) {
            content.textContent = 'Ошибка загрузки текста...';
            return;
        }
    }
    const text = books[currentBook];
    const chunk = getTextChunk(text, currentPosition);
    content.textContent = chunk;
    content.classList.add('visible');
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
    const content = document.getElementById('bookContent');
    content.classList.add('slide-right');
    setTimeout(() => {
        currentPosition = Math.max(0, currentPosition - chunkSize);
        updateContent();
        content.classList.remove('slide-right');
        content.classList.add('visible');
    }, 500);
}
function nextPage() {
    const content = document.getElementById('bookContent');
    content.classList.add('slide-left');
    setTimeout(() => {
        const text = books[currentBook];
        if (currentPosition + chunkSize < text.length) {
            currentPosition += chunkSize;
            updateContent();
            content.classList.remove('slide-left');
            content.classList.add('visible');
        } else {
            WebApp.showAlert('Книга закончилась... или это лишь начало теней?');
            content.classList.remove('slide-left');
            content.classList.add('visible');
        }
    }, 500);
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
