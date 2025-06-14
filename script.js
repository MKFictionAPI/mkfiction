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
         bookContent.textContent = 'Загрузка книги...';
         try {
             const response = await fetch(books[bookId].file);
             if (!response.ok) throw new Error(`Файл ${books[bookId].file} не найден`);
             const text = await response.text();
             bookContent.textContent = text || 'Книга пуста';
             updateChapterSelect(bookId, text);
         } catch (error) {
             bookContent.textContent = `Ошибка загрузки книги: ${error.message}. Проверьте наличие файла ${books[bookId].file}.`;
             console.error(error);
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
             li.textContent = `Книга: ${bookTitle}, Позиция: ${bookmark.scrollPosition}`;
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
     document.querySelectorAll('.cover').forEach(cover => {
         cover.addEventListener('click', () => {
             const bookId = cover.getAttribute('data-book-id');
             document.getElementById('bookSelectWelcome').value = bookId;
             startReading();
         });
     });

     // Инициализация
     document.getElementById('bookSelectWelcome').value = '';
