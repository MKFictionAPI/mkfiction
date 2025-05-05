const books = {
    1: null,
    2: null,
    3: null,
    4: null,
    5: null,
    6: null,
    7: null,
    8: null,
    9: null,
    10: null,
    11: null,
    12: null,
    13: null,
    14: null,
    15: null,
    16: null,
    17: null,
    18: null,
    19: null,
    20: null
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
            const bookSelect = document.getElementById('bookSelectWelcome');
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
    exitFullscreen();
    showWelcome();
    closeMenu();
}

function startReading() {
    const select = document.getElementById('bookSelectWelcome');
    if (select && select.value) {
        currentBook = select.value;
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
            const response = await fetch(`https://91.197.98.28:5000/get_book?book_id=${currentBook}`);
            const data = await response.json();
            if (data.error) throw new Error(data.error);
            books[currentBook] = data.content;
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
    const bookList = [
        { id: '1', title: 'Тайник' },
        { id: '2', title: 'Дорога к Тайнику. Часть 1' },
        { id: '3', title: 'Дорога к Тайнику. Часть 2' },
        { id: '4', title: 'Ключи к Тайнику' },
        { id: '5', title: 'Тайник. Тыкулкас' },
        { id: '6', title: 'Городской детектив. Часть 1. Тени прошлого' },
        { id: '7', title: 'Городской детектив. Часть 2. Штопая сердца' },
        { id: '8', title: 'Городской детектив. Часть 3. Смерть в отпечатках' },
        { id: '9', title: 'Сломанный лёд' },
        { id: '10', title: 'Сломанный лёд 2' },
        { id: '11', title: 'Сломанный лёд 3' },
        { id: '12', title: 'Сломанный лёд 4' },
        { id: '13', title: 'Потерянные во времени' },
        { id: '14', title: 'За дверью завтрашнего дня. Часть 1. Анамнез' },
        { id: '15', title: 'За дверью завтрашнего дня. Часть 2. Диагноз' },
        { id: '16', title: 'Мурцовка. Том 1' },
        { id: '17', title: 'Зимний Эндшпиль' },
        { id: '18', title: 'Созданная демоном. Книга первая. Васюганские болота' },
        { id: '19', title: 'Простота вечности. Пробуждение' },
        { id: '20', title: 'Ведьмина Кюля' }
    ];

    bookList.forEach(book => {
        const coverItem = document.createElement('div');
        coverItem.className = 'cover-item';
        coverItem.dataset.bookId = book.id;
        const img = document.createElement('img');
        img.src = `covers/book${book.id}.jpg`;
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

const bookSelect = document.getElementById('bookSelectWelcome');
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
        if (!navMenu.classList.contains('active')) {
            closeBookmarksMenu();
            closeChaptersMenu();
        }
        console.log('Menu state:', navMenu.classList.contains('active') ? 'open' : 'closed');
    } else {
        console.error('navMenu not found');
    }
}

function closeMenu() {
    const navMenu = document.getElementById('navMenu');
    if (navMenu && navMenu.classList.contains('active')) {
        navMenu.classList.remove('active');
        closeBookmarksMenu();
        closeChaptersMenu();
        console.log('Menu closed');
    }
}

function toggleChaptersMenu() {
    const chaptersMenu = document.getElementById('chaptersMenu');
    console.log('Chapters toggle clicked');
    if (chaptersMenu) {
        chaptersMenu.classList.toggle('active');
        if (chaptersMenu.classList.contains('active')) {
            closeBookmarksMenu();
        }
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

function toggleBookmarksMenu() {
    const bookmarksMenu = document.getElementById('bookmarksMenu');
    console.log('Bookmarks toggle clicked');
    if (bookmarksMenu) {
        bookmarksMenu.classList.toggle('active');
        if (bookmarksMenu.classList.contains('active')) {
            updateBookmarks();
            closeChaptersMenu();
        }
        console.log('Bookmarks menu state:', bookmarksMenu.classList.contains('active') ? 'open' : 'closed');
    } else {
        console.error('bookmarksMenu not found');
    }
}

function closeBookmarksMenu() {
    const bookmarksMenu = document.getElementById('bookmarksMenu');
    if (bookmarksMenu && bookmarksMenu.classList.contains('active')) {
        bookmarksMenu.classList.remove('active');
        console.log('Bookmarks menu closed');
    }
}

function toggleFullscreen() {
    const content = document.getElementById('bookContent');
    const fullscreenBtn = document.querySelector('#navMenu button[onclick="toggleFullscreen()"]');
    const readerPage = document.getElementById('readerPage');
    const header = document.querySelector('#readerPage h1');
    const chaptersControls = document.querySelector('.chapters-controls');
    if (!content || !fullscreenBtn || !readerPage || !header || !chaptersControls) {
        console.error('Fullscreen elements not found');
        return;
    }
    if (content.classList.contains('fullscreen')) {
        content.classList.remove('fullscreen');
        fullscreenBtn.textContent = 'На весь экран';
        readerPage.classList.remove('fullscreen-mode');
        header.style.display = 'block';
        chaptersControls.style.display = 'block';
        console.log('Exited fullscreen');
    } else {
        content.classList.add('fullscreen');
        fullscreenBtn.textContent = 'Выйти из полноэкранного';
        readerPage.classList.add('fullscreen-mode');
        header.style.display = 'none';
        chaptersControls.style.display = 'none';
        closeMenu();
        console.log('Entered fullscreen');
    }
    saveSettings();
}

function exitFullscreen() {
    const content = document.getElementById('bookContent');
    const fullscreenBtn = document.querySelector('#navMenu button[onclick="toggleFullscreen()"]');
    const readerPage = document.getElementById('readerPage');
    const header = document.querySelector('#readerPage h1');
    const chaptersControls = document.querySelector('.chapters-controls');
    if (content && content.classList.contains('fullscreen')) {
        content.classList.remove('fullscreen');
        if (fullscreenBtn) fullscreenBtn.textContent = 'На весь экран';
        if (readerPage) readerPage.classList.remove('fullscreen-mode');
        if (header) header.style.display = 'block';
        if (chaptersControls) chaptersControls.style.display = 'block';
        console.log('Forced exit fullscreen');
        saveSettings();
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
    if (!currentBook) {
        WebApp.showAlert('Выбери книгу, чтобы добавить закладку!');
        return;
    }
    const content = document.getElementById('bookContent');
    if (!content) return;
    const scrollPos = content.scrollTop;
    const name = prompt('Назови закладку:', '');
    if (name === null) return;
    const bookmarkName = name.trim() || `Закладка ${bookmarks.length + 1}`;
    bookmarks.push({ book: currentBook, scrollPos, name: bookmarkName });
    updateBookmarks();
    saveSettings();
    WebApp.showAlert(`Закладка "${bookmarkName}" сохранена!`);
    closeMenu();
}

function deleteBookmark(index) {
    const bookmarkName = bookmarks[index].name;
    bookmarks.splice(index, 1);
    updateBookmarks();
    saveSettings();
    WebApp.showAlert(`Закладка "${bookmarkName}" удалена!`);
}

function updateBookmarks() {
    const list = document.getElementById('bookmarksMenu');
    if (!list) return;
    list.innerHTML = '';
    if (bookmarks.length === 0) {
        const empty = document.createElement('div');
        empty.textContent = 'Нет закладок';
        empty.style.padding = '8px';
        empty.style.color = 'inherit';
        empty.style.opacity = '0.7';
        list.appendChild(empty);
        return;
    }
    bookmarks.forEach((bm, index) => {
        if (bm.book === currentBook) {
            const div = document.createElement('div');
            div.className = 'bookmark';
            const text = document.createElement('span');
            text.textContent = `📖 ${bm.name}`;
            text.title = bm.name;
            text.onclick = () => {
                const content = document.getElementById('bookContent');
                if (content) {
                    content.scrollTop = bm.scrollPos;
                    saveSettings();
                    closeBookmarksMenu();
                    closeMenu();
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

// Загружаем книгу из URL, если есть book_id
const urlParams = new URLSearchParams(window.location.search);
const bookFromUrl = urlParams.get('book_id');
if (bookFromUrl && books[bookFromUrl] !== undefined) {
    currentBook = bookFromUrl;
    const bookSelect = document.getElementById('bookSelectWelcome');
    if (bookSelect) bookSelect.value = currentBook;
    showReader();
} else {
    showWelcome();
}

loadSettings();
