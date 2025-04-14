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
    } else {
        showWelcome();
    }
    syncTheme();
}

function saveSettings() {
    const content = document.getElementById('bookContent');
    const scrollPos = content ? content.scrollTop : 0;
    localStorage.setItem(`mkfiction_${WebApp.initDataUnsafe.user?.id || 'guest'}`, JSON.stringify({
        book: currentBook,
        scrollPos: scrollPos,
        bookmarks: bookmarks,
        theme: document.getElementById('themeSelect')?.value || 'light'
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
    content.textContent = books[currentBook];
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
    // Разбиваем текст на строки для точного позиционирования
    const lines = text.split('\n');
    const chapterRegex = /^#\s*Глава\s*\d+\.\s*[^\n]+/gm;
    let match;
    let index = 0;
    let lineIndex = 0;
    const chapterPositions = [];
    while ((match = chapterRegex.exec(text)) !== null) {
        console.log('Found chapter:', match[0], 'at index:', match.index);
        // Находим номер строки для этой главы
        let charCount = 0;
        for (let i = 0; i < lines.length; i++) {
            if (charCount + lines[i].length >= match.index) {
                lineIndex = i;
                break;
            }
            charCount += lines[i].length + 1; // +1 для \n
        }
        const option = document.createElement('option');
        option.value = lineIndex; // Сохраняем номер строки
        option.textContent = match[0].replace(/^#\s*Глава\s*\d+\.\s*/, 'Глава ' + (++index) + ': ');
        chapterSelect.appendChild(option);
        chapterPositions.push({ line: lineIndex, title: match[0] });
    }
    if (index === 0) {
        console.warn('No chapters found in text');
    }
    chapterSelect.addEventListener('change', () => {
        if (chapterSelect.value) {
            const lineNum = parseInt(chapterSelect.value);
            console.log('Scrolling to line:', lineNum);
            // Создаём временный элемент для точной прокрутки
            const tempId = `chapter-${lineNum}`;
            let target = document.getElementById(tempId);
            if (!target) {
                const lines = content.textContent.split('\n');
                if (lineNum < lines.length) {
                    const textNode = document.createTextNode(lines[lineNum]);
                    target = document.createElement('span');
                    target.id = tempId;
                    content.insertBefore(target, content.firstChild);
                    content.innerHTML = content.textContent.replace(lines[lineNum], `<span id="${tempId}">${lines[lineNum]}</span>`);
                }
            }
            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            } else {
                console.warn('Target chapter not found in DOM');
                content.scrollTo({ top: lineNum * 20, behavior: 'smooth' }); // Запасной вариант
            }
            saveSettings();
        }
    });
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
