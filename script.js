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
    if (themeSelect) {
        themeSelect.value = telegramTheme;
        console.log('Synced theme to:', telegramTheme);
    } else {
        console.error('themeSelect not found');
    }
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
        const fontSelect = document.getElementById('fontSelect');
        if (fontSelect && settings.font) fontSelect.value = settings.font;
        const content = document.getElementById('bookContent');
        if (content && settings.fontSize) {
            content.style.fontSize = `${settings.fontSize}px`;
            const fontSizeDisplay = document.getElementById('fontSizeDisplay');
            if (fontSizeDisplay) fontSizeDisplay.textContent = `${settings.fontSize}px`;
        }
        const themeSelect = document.getElementById('themeSelect');
        if (themeSelect && settings.theme) {
            themeSelect.value = settings.theme;
            setTheme(settings.theme);
            console.log('Loaded theme from settings:', settings.theme);
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
    const theme = document.getElementById('themeSelect')?.value || 'light';
    localStorage.setItem(`mkfiction_${WebApp.initDataUnsafe.user?.id || 'guest'}`, JSON.stringify({
        book: currentBook,
        scrollPos: scrollPos,
        bookmarks: bookmarks,
        theme: theme,
        font: font,
        fontSize: fontSize
    }));
    console.log('Saved settings with theme:', theme);
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
        loadCovers();
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
    closeMenu();
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
        chapterSelect.innerHTML = '<option value="" disabled selected>-- Выбери главу --</option>';
        return;
    }
    if (books[currentBook] === null) {
        try {
            const response = await fetch(`books/${currentBook}.txt`);
            if (!response.ok) throw new Error('Текст не найден');
            books[currentBook] = await response.text();
        } catch (error) {
            content.textContent = 'Ошибка загрузки текста...';
            chapterSelect.innerHTML = '<option value="" disabled selected>-- Выбери главу --</option>';
            console.error('Error loading book:', error);
            return;
        }
    }
    content.innerHTML = '';
    const lines = books[currentBook].split('\n');
    let currentParagraph = null;
    let lineIndex = 0;

    lines.forEach((line, index) => {
        line = line.trim();
        if (line.startsWith('# Глава')) {
            if (currentParagraph && currentParagraph.textContent.trim()) {
                content.appendChild(currentParagraph);
            }
            const heading = document.createElement('h2');
            heading.textContent = line.replace(/^#\s*/, '');
            heading.id = `line-${index}`;
            content.appendChild(heading);
            currentParagraph = null;
            lineIndex = index;
        } else if (line === '') {
            if (currentParagraph && currentParagraph.textContent.trim()) {
                content.appendChild(currentParagraph);
            }
            currentParagraph = null;
        } else {
            if (!currentParagraph) {
                currentParagraph = document.createElement('p');
                currentParagraph.id = `line-${index}`;
                lineIndex = index;
            }
            currentParagraph.textContent += (currentParagraph.textContent ? ' ' : '') + line;
        }
    });

    if (currentParagraph && currentParagraph.textContent.trim()) {
        content.appendChild(currentParagraph);
    }

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
    chapterSelect.innerHTML = '<option value="" disabled selected>-- Выбери главу --</option>';
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
        let charCount = 0;
        let lineIndex = 0;
        for (let i = 0; i < lines.length; i++) {
            if (charCount >= match.index) {
                lineIndex = i;
                break;
            }
            charCount += lines[i].length + 1;
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
            const elements = content.querySelectorAll('[id^="line-"]');
            elements.forEach(el => {
                el.style.fontWeight = 'normal';
                el.style.background = 'none';
            });
            if (target && content) {
                target.style.fontWeight = 'bold';
                target.style.background = 'rgba(0, 0, 0, 0.05)';
                const contentHeight = content.clientHeight;
                const targetTop = target.offsetTop - contentHeight / 2 + target.offsetHeight / 2;
                setTimeout(() => {
                    content.scrollTo({ top: targetTop, behavior: 'smooth' });
                    console.log('Scrolled to:', target.textContent, 'at offset:', targetTop);
                }, 100);
            } else {
                console.warn('Target line not found:', `line-${lineNum}`);
                const fontSize = parseFloat(getComputedStyle(content).fontSize);
                const lineHeight = parseFloat(getComputedStyle(content).lineHeight) || fontSize * 1.5;
                const targetTop = lineNum * lineHeight - content.clientHeight / 2;
                setTimeout(() => {
                    content.scrollTo({ top: targetTop, behavior: 'smooth' });
                }, 100);
            }
            saveSettings();
            closeChaptersMenu();
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
    closeMenu();
}

function contactWriter() {
    window.open('https://t.me/mkbestwritermk', '_blank');
    closeMenu();
}

function loadCovers() {
    const coverContainer = document.getElementById('coverContainer');
    const bookSelect = document.getElementById('bookSelectWelcome');
    if (!coverContainer || !bookSelect) return;

    coverContainer.innerHTML = '';
    const books = [
        { id: 'book1', title: 'Тайник' },
        { id: 'book2', title: 'Дорога к Тайнику. Часть 1' },
        { id: 'book3', title: 'Дорога к Тайнику. Часть 2' },
        { id: 'book4', title: 'Ключи к Тайнику' },
        { id: 'book5', title: 'Тайник. Тыкулкас' },
        { id: 'book6', title: 'Городской детектив. Часть 1. Тени прошлого' },
        { id: 'book7', title: 'Городской детектив. Часть 2. Штопая сердца' },
        { id: 'book8', title: 'Городской детектив. Часть 3. Смерть в отпечатках' },
        { id: 'book9', title: 'Сломанный лёд' },
        { id: 'book10', title: 'Сломанный лёд 2' },
        { id: 'book11', title: 'Сломанный лёд 3' },
        { id: 'book12', title: 'Сломанный лёд 4' },
        { id: 'book13', title: 'Потерянные во времени' },
        { id: 'book14', title: 'За дверью завтрашнего дня. Часть 1. Анамнез' },
        { id: 'book15', title: 'За дверью завтрашнего дня. Часть 2. Диагноз' },
        { id: 'book16', title: 'Мурцовка. Том 1' },
        { id: 'book17', title: 'Зимний Эндшпиль' },
        { id: 'book18', title: 'Созданная демоном. Книга первая. Васюганские болота' },
        { id: 'book19', title: 'Простота вечности. Пробуждение' },
        { id: 'book20', title: 'Ведьмина Кюля' }
    ];

    books.forEach(book => {
        const coverItem = document.createElement('div');
        coverItem.className = 'cover-item';
        coverItem.dataset.bookId = book.id;
        const img = document.createElement('img');
        img.src = `covers/${book.id}.jpg`;
        img.alt = book.title;
        img.title = book.title;
        coverItem.appendChild(img);
        coverContainer.appendChild(coverItem);

        coverItem.addEventListener('click', () => {
            bookSelect.value = book.id;
            document.querySelectorAll('.cover-item').forEach(item => item.classList.remove('selected'));
            coverItem.classList.add('selected');
            startReading();
        });
    });

    bookSelect.addEventListener('change', () => {
        const selectedBook = bookSelect.value;
        document.querySelectorAll('.cover-item').forEach(item => {
            item.classList.toggle('selected', item.dataset.bookId === selectedBook);
        });
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
        closeMenu();
    });
}

const fontSelect = document.getElementById('fontSelect');
if (fontSelect) {
    fontSelect.addEventListener('change', function() {
        const content = document.getElementById('bookContent');
        if (content) {
            content.style.fontFamily = this.value;
            saveSettings();
            closeMenu();
        }
    });
}

function toggleMenu() {
    const navMenu = document.getElementById('navMenu');
    console.log('Menu toggle clicked');
    if (navMenu) {
        navMenu.classList.toggle('active');
        console.log('Menu state:', navMenu.classList.contains('active') ? 'open' : 'closed');
    } else {
        console.error('navMenu not found');
    }
}

function closeMenu() {
    const navMenu = document.getElementById('navMenu');
    if (navMenu && navMenu.classList.contains('active')) {
        navMenu.classList.remove('active');
        console.log('Menu closed');
    }
}

function toggleChaptersMenu() {
    const chaptersMenu = document.getElementById('chaptersMenu');
    console.log('Chapters toggle clicked');
    if (chaptersMenu) {
        chaptersMenu.classList.toggle('active');
        console.log('Chapters menu state:', chaptersMenu.classList.contains('active') ? 'open' : 'closed');
    } else {
        console.error('chaptersMenu not found');
    }
}

function closeChaptersMenu() {
    const chaptersMenu = document.getElementById('chaptersMenu');
    if (chaptersMenu && chaptersMenu.classList.contains('active')) {
        chaptersMenu.classList.remove('active');
        console.log('Chapters menu closed');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const menuToggle = document.getElementById('menuToggle');
    if (menuToggle) {
        menuToggle.addEventListener('click', toggleMenu);
        console.log('Menu toggle initialized');
    } else {
        console.error('menuToggle not found');
    }
    const chaptersToggle = document.getElementById('chaptersToggle');
    if (chaptersToggle) {
        chaptersToggle.addEventListener('click', toggleChaptersMenu);
        console.log('Chapters toggle initialized');
    } else {
        console.error('chaptersToggle not found');
    }
    const fontSizeButtons = document.querySelectorAll('.font-size-controls button');
    fontSizeButtons.forEach(button => {
        button.addEventListener('click', () => {
            const delta = button.textContent === '+' ? 2 : -2;
            changeFontSize(delta);
        });
    });
    loadCovers();
});

function setTheme(theme) {
    document.body.className = theme;
    console.log('Theme set to:', theme);
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
        closeMenu();
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
    closeMenu();
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
