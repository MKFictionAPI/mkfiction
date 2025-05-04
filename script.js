let currentBook = null;
let books = {};

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
            const response = await fetch(`http://91.197.98.28:5000/get_book?book_id=${currentBook}`);
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
    content.textContent = books[currentBook];
    chapterSelect.innerHTML = '<option value="" disabled selected>-- Выбери главу --</option>';
}

function getQueryParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}

document.addEventListener('DOMContentLoaded', () => {
    currentBook = getQueryParam('book_id');
    if (currentBook) {
        books[currentBook] = null;
        updateContent();
    }
});
