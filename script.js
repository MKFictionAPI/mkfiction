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
let bookmarks = [];
const WebApp = window.Telegram.WebApp;
WebApp.ready();
WebApp.expand();

function syncTheme() {
    const telegramTheme = WebApp.themeParams.bg_color?.toLowerCase() === '#212121' ? 'dark' : 'light';
    setTheme(telegramTheme);
    document.getElementById('themeSelect')?.value = telegramTheme;
}

function loadSettings() {
    const saved = localStorage.getItem(`mkfiction_${WebApp.initDataUnsafe.user?.id || 'guest'}`);
    if (saved) {
        const settings = JSON.parse(saved);
        currentBook = settings.book || '';
        bookmarks = settings.bookmarks || [];
        if (currentBook && books[currentBook] !== undefined) {
            document.getElementById('bookSelect').value = currentBook;
            showReader();
            updateContent().then(() => {
                const scrollPos = settings.scrollPos || 0;
                document.getElementById('bookContent').scrollTop = scrollPos;
            });
        } else {
            showWelcome();
        }
    } else {
        showWelcome();
    }
    syncTheme();
}

function saveSettings() {
    const content = document.getElementById('bookContent');
    const scrollPos = content.scrollTop;
    localStorage.setItem(`mkfiction_${WebApp.initDataUnsafe.user?.id || 'guest'}`, JSON.stringify({
        book: currentBook,
        scrollPos: scrollPos,
        bookmarks: bookmarks,
        theme: document.getElementById('themeSelect')?.value || 'light'
    }));
}

function showWelcome() {
    document.getElementById('welcomePage').style.display = 'block';
    document.getElementById('readerPage').style.display = 'none';
    currentBook = '';
    document.getElementById('bookContent').textContent = '';
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

async function updateContent() {
    const content = document.getElementById('bookContent');
    const chapterSelect = document.getElementById('chapterSelect');
    if (!currentBook) {
        content.textContent = '';
        chapterSelect.innerHTML = '<option value="">-- Выбери главу --</option>';
        return;
    }
    if (books[currentBook] === null) {
        try {
            const response = await fetch(`books/${currentBook}.txt`);
            if (!response.ok) throw new Error('Текст не найден');
            books[currentBook] = await response.text();
        } catch (error) {
            content.textContent = 'Ошибка загрузки текста...';
            chapterSelect.innerHTML = '<option value="">-- Выбери главу --</option>';
            return;
        }
    }
    content.textContent = books[currentBook];
    updateChapters();
    content.addEventListener('scroll', saveSettings);
}

function updateChapters() {
    const chapterSelect = document.getElementById('chapterSelect');
    chapterSelect.innerHTML = '<option value="">-- Выбери главу --</option>';
    const text = books[currentBook];
    if (!text) return;
    const chapterRegex = /^Глава \d+\.\s*[^\n]+/gm;
    let match;
    let index = 0;
    while ((match = chapterRegex.exec(text)) !== null) {
        const option = document.createElement('option');
        option.value = match.index;
        option.textContent = match[0].replace(/^Глава \d+\.\s*/, 'Глава ' + (++index) + ': ');
        chapterSelect.appendChild(option);
    }
    chapterSelect.addEventListener('change', () => {
        if (chapterSelect.value) {
            document.getElementById('bookContent').scrollTop = parseInt(chapterSelect.value);
            saveSettings();
        }
    });
}

document.getElementById('bookSelect')?.addEventListener('change', function() {
    currentBook = this.value;
    showReader();
});

document.getElementById('themeSelect')?.addEventListener('change', function() {
    setTheme(this.value);
    saveSettings();
});

function setTheme(theme) {
    document.body.className = theme;
}

function addBookmark() {
    if (!currentBook) return;
    const content = document.getElementById('bookContent');
    const scrollPos = content.scrollTop;
    const name = prompt('Назови закладку:', `Закладка ${scrollPos}`);
    if (name) {
        bookmarks.push({ book: currentBook, scrollPos, name });
        updateBookmarks();
        saveSettings();
        WebApp.showAlert(`Закладка "${name}" сохранена!`);
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
            text.textContent = `📖 ${bm.name}`;
            text.onclick = () => {
                document.getElementById('bookContent').scrollTop = bm.scrollPos;
                saveSettings();
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
if (bookFromUrl && books[bookFromUrl] !== undefined) {
    currentBook = bookFromUrl;
    document.getElementById('bookSelect').value = currentBook;
    showReader();
} else {
    showWelcome();
}
loadSettings();
