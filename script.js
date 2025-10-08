let bookmarks = JSON.parse(localStorage.getItem('bookmarks')) || [];

// Список книг
const books = {
    book1: { title: "Тайник", file: "books/book1.txt" },
    book2: { title: "Дорога к Тайнику. Часть 1", file: "books/book2.txt" },
    book3: { title: "Дорога к Тайнику. Часть 2", file: "books/book3.txt" },
    book4: { title: "Ключи к Тайнику", file: "books/book4.txt" },
    book5: { title: "Тайник. Тыкулкас", file: "books/book5.txt" },
    book6: { title: "Городской детектив. Часть 1. Тени прошлого", file: "books/book6.txt" },
    book7: { title: "Городской детектив. Часть 2. Штопая сердца", file: "books/book7.txt" },
    book8: { title: "Городской детектив. Часть 3. Смерть в отпечатках", file: "books/book8.txt" },
    book9: { title: "Сломанный лёд", file: "books/book9.txt" },
    book10: { title: "Сломанный лёд 2", file: "books/book10.txt" },
    book11: { title: "Сломанный лёд 3", file: "books/book11.txt" },
    book12: { title: "Сломанный лёд 4", file: "books/book12.txt" },
    book13: { title: "Потерянные во времени", file: "books/book13.txt" },
    book14: { title: "За дверью завтрашнего дня. Часть 1. Анамнез", file: "books/book14.txt" },
    book15: { title: "За дверью завтрашнего дня. Часть 2. Диагноз", file: "books/book15.txt" },
    book16: { title: "Мурцовка. Том 1", file: "books/book16.txt" },
    book17: { title: "Зимний Эндшпиль", file: "books/book17.txt" },
    book18: { title: "Созданная демоном. Книга первая. Васюганские болота", file: "books/book18.txt" },
    book19: { title: "Простота вечности. Пробуждение", file: "books/book19.txt" },
    book20: { title: "Ведьмина Кюля", file: "books/book20.txt" }
};

// URL для кнопки (Tribute для платежей)
const PAID_CHANNEL_URL = 'https://t.me/tribute/app?startapp=sehD';

function startReading() {
    const bookId = document.getElementById('bookSelectWelcome').value;
    if (bookId) {
        document.getElementById('welcomePage').style.display = 'none';
        document.getElementById('readerPage').style.display = 'block';
        document.getElementById('bookSelect').value = bookId;
        loadBook(bookId);
    }
}

async function loadBook(bookId) {
    const bookContent = document.getElementById('bookContent');
    bookContent.innerHTML = '<p>Загрузка книги...</p>'; // Используем innerHTML для кнопки
    try {
        const response = await fetch(books[bookId].file);
        if (!response.ok) throw new Error(`Файл ${books[bookId].file} не найден`);
        const text = await response.text();
        bookContent.innerHTML = `<pre style="white-space: pre-wrap;">${text}</pre>`; // Текст как pre для форматирования
        // Добавляем кнопку в конце отрывка
        const button = document.createElement('button');
        button.innerHTML = '<i class="fas fa-crown"></i> Подписаться на полный текст';
        button.className = 'paid-button';
        button.onclick = openPaidChannel;
        bookContent.appendChild(button);
        updateChapterSelect(bookId, text);
        initProgressBar(); // Инициализация прогресса
        fadeInContent(); // Анимация появления текста
    } catch (error) {
        bookContent.innerHTML = `<p>Ошибка загрузки книги: ${error.message}. Проверьте наличие файла ${books[bookId].file}.</p>`;
        console.error(error);
    }
}

function openPaidChannel() {
    if (window.Telegram && Telegram.WebApp) {
        Telegram.WebApp.openTelegramLink(PAID_CHANNEL_URL);
    } else {
        // Fallback для не-TG браузера
        window.open(PAID_CHANNEL_URL, '_blank');
    }
}

function updateChapterSelect(bookId, text) {
    const chapterSelect = document.getElementById('chapterSelect');
    chapterSelect.innerHTML = '<option value="">-- Выбери главу --</option>';
    const chapters = text.split('\n\n');
    chapters.forEach((chapter, index) => {
        if (chapter.startsWith('Глава ')) {
            const option = document.createElement('option');
            option.value = index;
            option.textContent = chapter.split('\n')[0];
            chapterSelect.appendChild(option);
        }
    });
}

document.getElementById('bookSelect').addEventListener('change', () => {
    const bookId = document.getElementById('bookSelect').value;
    loadBook(bookId);
});

document.getElementById('chapterSelect').addEventListener('change', () => {
    const chapterSelect = document.getElementById('chapterSelect');
    const index = chapterSelect.value;
    if (index) {
        const chapters = document.getElementById('bookContent').textContent.split('\n\n');
        const chapterElement = document.createElement('div');
        chapterElement.textContent = chapters[index];
        document.getElementById('bookContent').scrollIntoView({ behavior: 'smooth' });
    }
});

document.getElementById('themeSelect').addEventListener('change', () => {
    const theme = document.getElementById('themeSelect').value;
    if (theme === 'dark') {
        document.body.classList.add('dark');
    } else {
        document.body.classList.remove('dark');
    }
});

function addBookmark() {
    const bookId = document.getElementById('bookSelect').value;
    const scrollPosition = document.getElementById('bookContent').scrollTop;
    bookmarks.push({ bookId, scrollPosition });
    localStorage.setItem('bookmarks', JSON.stringify(bookmarks));
    alert('Закладка добавлена!');
}

function showBookmarks() {
    const bookmarksList = document.getElementById('bookmarksList');
    bookmarksList.innerHTML = '';
    bookmarks.forEach((bookmark, index) => {
        const bookTitle = books[bookmark.bookId].title;
        const li = document.createElement('li');
        li.innerHTML = `<i class="fas fa-bookmark"></i> ${bookTitle}`;
        li.style.cursor = 'pointer';
        li.onclick = () => {
            document.getElementById('bookSelect').value = bookmark.bookId;
            loadBook(bookmark.bookId);
            document.getElementById('bookContent').scrollTop = bookmark.scrollPosition;
        };
        bookmarksList.appendChild(li);
    });
}

function backToWelcome() {
    document.getElementById('readerPage').style.display = 'none';
    document.getElementById('welcomePage').style.display = 'block';
}

// Обработчик кликов по обложкам
document.querySelectorAll('.cover').forEach((cover, index) => {
    cover.style.setProperty('--n', index);
    cover.addEventListener('click', () => {
        const bookId = cover.getAttribute('data-book-id');
        document.getElementById('bookSelectWelcome').value = bookId;
        startReading();
    });
});

// Инициализация TG Web App
if (window.Telegram && Telegram.WebApp) {
    Telegram.WebApp.ready();
    Telegram.WebApp.expand(); // Расширяем на весь экран
}

// Обработчик слайдера шрифта (с сохранением)
const fontSlider = document.getElementById('fontSize');
const fontValue = document.getElementById('fontSizeValue');
const savedFontSize = localStorage.getItem('fontSize') || 16;
fontSlider.value = savedFontSize;
fontValue.textContent = savedFontSize;
document.getElementById('bookContent').style.fontSize = savedFontSize + 'px';

fontSlider.addEventListener('input', (e) => {
    const fontSize = e.target.value + 'px';
    document.getElementById('bookContent').style.fontSize = fontSize;
    fontValue.textContent = e.target.value;
    localStorage.setItem('fontSize', e.target.value);
});

// Прогресс чтения
function initProgressBar() {
    const bookContent = document.getElementById('bookContent');
    const progressFill = document.querySelector('.progress-fill');
    bookContent.addEventListener('scroll', () => {
        const scrollTop = bookContent.scrollTop;
        const scrollHeight = bookContent.scrollHeight - bookContent.clientHeight;
        const progress = (scrollTop / scrollHeight) * 100;
        progressFill.style.width = progress + '%';
    });
}

// Анимация появления контента
function fadeInContent() {
    const bookContent = document.getElementById('bookContent');
    bookContent.style.opacity = '0';
    bookContent.style.transition = 'opacity 0.5s ease';
    setTimeout(() => {
        bookContent.style.opacity = '1';
    }, 100);
}

// Инициализация
document.getElementById('bookSelectWelcome').value = '';
