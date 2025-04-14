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
    const themeSelect = document.getElementById('themeSelect');
    if (themeSelect) themeSelect.value = telegramTheme;
}

function loadSettings() {
    const saved = localStorage.getItem(`mkfiction_${WebApp.initDataUnsafe.user?.id || 'guest'}`);
    if (saved) {
        const settings = JSON.parse(saved);
        currentBook = settings.book || '';
        bookmarks = settings.bookmarks || [];
        if (currentBook && books[currentBook] !== undefined) {
            const bookSelect = document.getElementById('bookSelect');
            if (bookSelect) bookSelect.value = currentBook;
            showReader();
            updateContent().then(() => {
                const scrollPos = settings.scrollPos || 0;
                const content = document.getElementById('bookContent');
                if (content) content.scrollTop = scrollPos;
            });
        } else {
            showWelcome();
        }
        // Загружаем шрифт и размер
        const fontSelect = document.getElementById('fontSelect');
        if (fontSelect && settings.font) fontSelect.value = settings.font;
        const content = document.getElementById('bookContent');
        if (content && settings.fontSize) {
            content.style.fontSize = `${settings.fontSize}px`;
            const fontSizeDisplay = document.getElementById('fontSizeDisplay');
            if (fontSizeDisplay) fontSizeDisplay.textContent = `${settings.fontSize}px`;
        }
    } else {
        showWelcome();
    }
    syncTheme();
}

function saveSettings() {
    const content = document.getElementById('bookContent');
    const scrollPos = content ? content.scrollTop : 0;
    const font = document.getElementById('fontSelect')?.value || 'Georgia';
    const fontSize = parseInt(content?.style.fontSize || '16');
    localStorage.setItem(`mkfiction_${WebApp.initDataUnsafe.user?.id || 'guest'}`, JSON.stringify({
        book: currentBook,
        scrollPos: scrollPos,
        bookmarks: bookmarks,
        theme: document.getElementById('themeSelect')?.value || 'light',
        font: font,
        fontSize: fontSize
    }));
}

function showWelcome() {
    const welcomePage = document.getElementById('welcomePage');
    const readerPage = document.getElementById('readerPage');
    if (welcomePage && readerPage) {
        welcomePage.style.display = 'block';
        readerPage.style.display = 'none';
        currentBook = '';
        const content = document.getElementById('bookContent');
        if (content) content.textContent = '';
        const bookSelect = document.getElementById('bookSelectWelcome');
        if (bookSelect) bookSelect.value = '';
        localStorage.removeItem(`mkfiction_${WebApp.initDataUnsafe.user?.id || 'guest'}`);
    } else {
        console.error('Welcome or reader page not found');
    }
}

function showReader() {
    const welcomePage = document.getElementById('welcomePage');
    const readerPage = document.getElementById('readerPage');
    if (welcomePage && readerPage) {
        welcomePage.style.display = 'none';
        readerPage.style.display = 'block';
        updateContent();
    } else {
        console.error('Welcome or reader page not found');
    }
}

function backToWelcome() {
    showWelcome();
}

function startReading() {
    const select = document.getElementById('bookSelectWelcome');
    if (select && select.value) {
        currentBook = select.value;
        const bookSelect = document.getElementById('bookSelect');
        if (bookSelect) bookSelect.value = currentBook;
        showReader();
        saveSettings();
    } else {
        WebApp.showAlert('Выбери книгу, чтобы начать!');
        console.error('Book not selected or select element missing');
    }
}

async function updateContent() {
    const content = document.getElementById('bookContent');
    const chapterSelect = document.getElementById('chapterSelect');
    if (!content || !chapterSelect) {
        console.error('Content or chapter select not found');
        return;
    }
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
            console.error('Error loading book:', error);
            return;
        }
    }
    // Очищаем содержимое
    content.innerHTML = '';
    // Разбиваем текст на строки
    const lines = books[currentBook].split('\n');
    lines.forEach((line, index) => {
        const span = document.createElement('span');
        span.textContent = line;
        span.id = `line-${index}`;
        span.style.display = 'block';
        content.appendChild(span);
        // Добавляем перенос строки
        const br = document.createElement('br');
        content.appendChild(br);
    });
    updateChapters();
    content.addEventListener('scroll', saveSettings, { once: true });
}

function updateChapters() {
    const chapterSelect = document.getElementById('chapterSelect');
    const content = document.getElementById('bookContent');
    if (!chapterSelect || !content) {
        console.error('Chapter select or content not found');
        return;
    }
    chapterSelect.innerHTML = '<option value="">-- Выбери главу --</option>';
    const text = books[currentBook];
    if (!text) {
        console.error('No text for current book');
        return;
    }
    const chapterRegex = /^#\s*Глава\s*\d+\.\s*[^\n]+/gm;
    const lines = text.split('\n');
    let match;
    let index = 0;
    while ((match = chapterRegex.exec(text)) !== null) {
        // Находим номер строки
        let charCount = 0;
        let lineIndex = 0;
        for (let i = 0; i < lines.length; i++) {
            if (charCount >= match.index) {
                lineIndex = i;
                break;
            }
            charCount += lines[i].length + 1; // +1 для \n
        }
        console.log('Found chapter:', match[0], 'at line:', lineIndex);
        const option = document.createElement('option');
        option.value = lineIndex;
        option.textContent = match[0].replace(/^#\s*Глава\s*\d+\.\s*/, 'Глава ' + (++index) + ': ');
        chapterSelect.appendChild(option);
    }
    if (index === 0) {
        console.warn('No chapters found in text');
    }
    chapterSelect.addEventListener('change', () => {
        if (chapterSelect.value) {
            const lineNum = parseInt(chapterSelect.value);
            console.log('Attempting to scroll to line:', lineNum);
            const target = document.getElementById(`line-${lineNum}`);
            // Очищаем предыдущие выделения
            const spans = content.querySelectorAll('span[id^="line-"]');
            spans.forEach(span => {
                span.style.fontWeight = 'normal';
                span.style.background = 'none';
            });
            if (target) {
                target.style.fontWeight = 'bold';
                target.style.background = 'rgba(0, 0, 0, 0.05)';
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                console.log('Scrolled to:', target.textContent);
            } else {
                console.warn('Target line not found:', `line-${lineNum}`);
                content.scrollTo({ top: lineNum * 20, behavior: 'smooth' });
            }
            saveSettings();
        }
    });
}

function changeFontSize(delta) {
    const content = document.getElementById('bookContent');
    const fontSizeDisplay = document.getElementById('fontSizeDisplay');
    if (!content || !fontSizeDisplay) return;
    let currentSize = parseInt(content.style.fontSize || '16');
    currentSize = Math.max(12, Math.min(24, currentSize + delta));
    content.style.fontSize = `${currentSize}px`;
    fontSizeDisplay.textContent = `${currentSize}px`;
    saveSettings();
}

const bookSelect = document.getElementById('bookSelect');
if (bookSelect) {
    bookSelect.addEventListener('change', function() {
        if (this.value) {
            currentBook = this.value;
            showReader();
            saveSettings();
        }
    });
}

const themeSelect = document.getElementById('themeSelect');
if (themeSelect) {
    themeSelect.addEventListener('change', function() {
        setTheme(this.value);
        saveSettings();
    });
}

const fontSelect = document.getElementById('fontSelect');
if (fontSelect) {
    fontSelect.addEventListener('change', function() {
        const content = document.getElementById('bookContent');
        if (content) {
            content.style.fontFamily = this.value;
            saveSettings();
        }
    });
}

const menuToggle = document.getElementById('menuToggle');
const navMenu = document.getElementById('navMenu');
if (menuToggle && navMenu) {
    menuToggle.addEventListener('click', () => {
        navMenu.classList.toggle('active');
    });
}

function setTheme(theme) {
    document.body.className = theme;
}

function addBookmark() {
    if (!currentBook) return;
    const content = document.getElementById('bookContent');
    if (!content) return;
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
    if (!list) return;
    list.innerHTML = '';
    bookmarks.forEach((bm, index) => {
        if (bm.book === currentBook) {
            const div = document.createElement('div');
            div.className = 'bookmark';
            const text = document.createElement('span');
            text.textContent = `📖 ${bm.name}`;
            text.onclick = () => {
                const content = document.getElementById('bookContent');
                if (content) {
                    content.scrollTop = bm.scrollPos;
                    saveSettings();
                }
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
    const bookSelect = document.getElementById('bookSelect');
    if (bookSelect) bookSelect.value = currentBook;
    showReader();
} else {
    showWelcome();
}

loadSettings();
