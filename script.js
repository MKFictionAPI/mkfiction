// Заглушки для книг (замени на реальные тексты позже)
     const bookContents = {
         book1: "Тайник\nГлава 1\nТемная ночь окутала лес...\n\nГлава 2\nУтро принесло новые загадки...",
         book2: "Дорога к Тайнику. Часть 1\nГлава 1\nПутешествие началось...\n\nГлава 2\nОпасности поджидали...",
         book3: "Дорога к Тайнику. Часть 2\nГлава 1\nПродолжение пути...\n",
         book4: "Ключи к Тайнику\nГлава 1\nПоиск ключей...\n",
         book5: "Тайник. Тыкулкас\nГлава 1\nТаинственный артефакт...\n",
         book6: "Городской детектив. Часть 1\nГлава 1\nТени в городе...\n",
         book7: "Городской детектив. Часть 2\nГлава 1\nСердца...\n",
         book8: "Городской детектив. Часть 3\nГлава 1\nОтпечатки...\n",
         book9: "Сломанный лёд\nГлава 1\nХолод...\n",
         book10: "Сломанный лёд 2\nГлава 1\nПродолжение...\n",
         book11: "Сломанный лёд 3\nГлава 1\nНовые события...\n",
         book12: "Сломанный лёд 4\nГлава 1\nФинал...\n",
         book13: "Потерянные во времени\nГлава 1\nВремя...\n",
         book14: "За дверью завтрашнего дня. Часть 1\nГлава 1\nАнамнез...\n",
         book15: "За дверью завтрашнего дня. Часть 2\nГлава 1\nДиагноз...\n",
         book16: "Мурцовка. Том 1\nГлава 1\nСело...\n",
         book17: "Зимний Эндшпиль\nГлава 1\nЗима...\n",
         book18: "Созданная демоном\nГлава 1\nБолота...\n",
         book19: "Простота вечности\nГлава 1\nПробуждение...\n",
         book20: "Ведьмина Кюля\nГлава 1\nМагия...\n\nГлава 2\nСекреты...\n"
     };

     let bookmarks = JSON.parse(localStorage.getItem('bookmarks')) || [];

     function startReading() {
         const bookId = document.getElementById('bookSelectWelcome').value;
         if (bookId) {
             document.getElementById('welcomePage').style.display = 'none';
             document.getElementById('readerPage').style.display = 'contents';
             document.getElementById('bookSelect').value = bookId;
             loadBook(bookId);
         }
     }

     function loadBook(bookId) {
         const bookContent = document.getElementById('bookContent');
         bookContent.textContent = bookContents[bookId] || '';
         updateChapterSelect(bookId);
     }

     function updateChapterSelect(bookId) {
         const chapterSelect = document.getElementById('chapterSelect');
         chapterSelect.innerHTML = '<option value="">-- Выбери главу --</option>';
         const chapters = bookContents[bookId].split('\n\n');
         chapters.forEach((chapter, index) => {
             if (chapter.startsWith('Глава ')) {
                 const option = document.createElement('option');
                 option.value = index;
                 option.textContent = chapter.split('\n')[0];
                 chapterSelect.appendChild(option);
             });
         });
     }

     document.getElementById('bookSelect').addEventListener('change', () => {
         const bookId = document.getElementById('bookSelect').value;
         loadBook(bookId(bookId);
     });

     document.getElementById('chapterSelect').addEventListener('change', () => {
         const index = chapterSelect.getElementById('chapterSelect').value;
         if (index) {
             const chapters = document.getElementById('bookContent').textContent.split('\n\n');
             const position = chapters[index].offsetTop;
             document.getElementById('bookContent').scrollTop(position);
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
             const bookTitle = document.querySelector(`#bookSelect option[value="${bookmark.bookId}"]`).textContent;
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
         document.getElementById('welcomePage').style.display = 'contents';
     }
     // Инициализация
     document.getElementById('bookSelectWelcome').value = '';
