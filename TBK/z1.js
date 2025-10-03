String.prototype.reverse = function() {
    return this.split("").reverse().join("");
};
  
String.prototype.capitalize = function() {
    return this.charAt(0).toUpperCase() + this.slice(1);
};

String.prototype.truncate = function(length) {
    if (this.length <= length) return this.toString();
    return this.slice(0, length) + "...";
};

Array.prototype.myEvery = function(callback) {
    for (let i = 0; i < this.length; i++){
        if (!callback(this[i], i, this)) {
            return false; 
        }
    }
    return true;
};

Array.prototype.myFilter = function(callback) {
    const result = [];
    for (let i = 0; i < this.length; i++){
        if (callback(this[i], i, this)) {
            result.push(this[i]);
        }
    }
    return result;
};

Array.prototype.groupBy = function(key) {
    const result = {};
    for (let i = 0; i < this.length; i++){
        const element = this[i];
        const keyValue = element[key];
        if (!result[keyValue]) {
            result[keyValue] = [];
          }
          result[keyValue].push(element);
    }
    return result;
};

Array.prototype.unique = function(callback) {
    const result = [];
    for (let i = 0; i < this.length; i++){
        if (!result.includes(this[i])) {
            result.push(this[i]);
        }
    }
    return result;
};


class DateUtils{
    static isLeapYear(year){
        if (year%4==0 && !(year%100==0) && year%400==0){
            return true;
        }
        return false;
    }

    static getDaysBetween(date1, date2){
        const diffMs = Math.abs(date2-date1);
        return diffMs/ (1000*60*60*24);
    }

    static formatDate(date){
        const day = date.getDate()
        const month = date.getMonth()+1
        const year = date.getFullYear()
        return `${String(day).padStart(2, "0")}-${String(month).padStart(2, "0")}-${year}`
    }

    addDays(date, days){
        return new Date(date.getTime() + (days*(1000*60*60*24)))
    }
}


class Validator{
    static isValidISBN(isbn){
        return /^\d{13}$/.test(isbn);
    }

    static isValidEmail(email){
        const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}))$/;
        return re.test(String(email).trim());
    }

    static isValidYear(year){
        const currentYear = new Date().getFullYear();
        return year>=1000 && year <= currentYear;
    }

    static isValidPageCount(pages){
        return pages > 0;
    }
}

class Book {
    constructor(title, author, isbn, publicationYear, totalCopies, borrowedCopies, genre){
        this.title = title;
        this.author = author;
        this.isbn = isbn;
        this.publicationYear = publicationYear;
        this.totalCopies = totalCopies;
        this.borrowedCopies = borrowedCopies;
        this.genre = genre;
    }

    //Gettery
    get availableCopies(){
        return this.totalCopies - this.borrowedCopies;
    }

    get isAvailable(){
        return this.availableCopies > 0;
    }

    get info(){
        return `${this.title} by ${this.author} (${this.publicationYear}) - ISBN: ${this.isbn}, Genre: ${this.genre}, Available: ${this.availableCopies}/${this.totalCopies}`;
    }

    get age(){
        const currentYear = new Date().getFullYear();
        return currentYear - this.publicationYear;
    }


    //Settery
    set copies({total, borrowed}){
        if (total !== undefined) this.totalCopies = total;
        if (borrowed !== undefined) this.borrowedCopies = borrowed;
    }
    
    set details({title, author, genre}){
        if (title) this.title = title;
        if (author) this.author = author;
        if (genre) this.genre = genre;
    }

    //Metody
    borrow(){
        if (this.isAvailable){
            this.borrowedCopies += 1;
            return true;
        }
        return false;
    }

    return(){
        if (this.borrowedCopies > 0){
            this.borrowedCopies -= 1;
            return true;
        }
        return false;
    }

    getFormattedInfo(){
        return `Title: ${this.title}\nAuthor: ${this.author}\nISBN: ${this.isbn}\nPublication Year: ${this.publicationYear}\nGenre: ${this.genre}\nTotal Copies: ${this.totalCopies}\nBorrowed Copies: ${this.borrowedCopies}\nAvailable Copies: ${this.availableCopies}`;
    }


    //Statyczne metody
    static isValidBook(bookData){
        const {title, author, isbn, publicationYear, totalCopies, genre} = bookData;
        return title && author && Validator.isValidISBN(isbn) && Validator.isValidYear(publicationYear) && totalCopies > 0 && genre;
    }

    static compareBookByYear(book1, book2){
        return book1.publicationYear - book2.publicationYear;
    }
}

class User {
    constructor(name, email, registrationDate, borrowedBooks, borrowHistory){
        this.name = name;
        this.email = email;
        this.registrationDate = registrationDate;
        this.borrowedBooks = borrowedBooks || [];
        this.borrowHistory = borrowHistory || [];
    }

    //Gettery

    get canBorrow(){    
        return this.borrowedBooks.length < 5;
    }

    get borrowedCount(){
        return this.borrowedBooks.length;
    }

    get profile(){
        return {
            name: this.name,
            email: this.email,
            registrationDate: this.registrationDate,
            borrowedCount: this.borrowedCount,
            borrowHistory: this.borrowHistory
        }
    }

    //Settery
    set info({name, email}){
        if (name) this.name = name;
        if (email && Validator.isValidEmail(email)) this.email = email;
    }

    //Metody
    addBorrowedBook(isbn, bookTitle){
        if (this.canBorrow){
            this.borrowedBooks.push(isbn);
            this.borrowHistory.push({isbn, bookTitle, borrowDate: new Date()});
            return true;
        }
        return false;
    }

    removeBorrowedBook(isbn){
        const index = this.borrowedBooks.indexOf(isbn);
        if (index !== -1){
            this.borrowedBooks.splice(index, 1);
            return true;
        }
        return false;
    }

    getBorrowHistory(){
        return this.borrowHistory.map(
            entry => `${entry.bookTitle} (ISBN: ${entry.isbn}) borrowed on ${DateUtils.formatDate(entry.borrowDate)}`
        );
    }
}

User.prototype.getFormattedHistory = function(){
    return this.borrowHistory.map(
        entry => `${entry.bookTitle} (ISBN: ${entry.isbn}) borrowed on ${DateUtils.formatDate(entry.borrowDate)}`
    ).join("\n");
}

User.prototype.hasOverdueBooks = function(days){
    const currentDate = new Date();
    for (const entry of this.borrowHistory){
        const daysBorrowed = DateUtils.getDaysBetween(entry.borrowDate, currentDate);
        if (daysBorrowed > days){
            return true;
        }
    }
    return false;
}

class Library {
    constructor(name, books, users, loans, maxBooksPerUser){
        this.name = name;
        this.books = books || [];
        this.users = users || [];
        this.loans = loans || [];
        this.maxBooksPerUser = maxBooksPerUser || 5;
    }

    //Gettery
    get totalBooks() {
        return this.books.reduce((acc, {totalCopies}) => acc + totalCopies, 0)
    }

    get availableBooks(){
        return this.books.filter(book => book.isAvailable).length;
    }

    get statistics(){
        return {
            totalBooks: this.totalBooks,
            availableBooks: this.availableBooks,
            totalTitles: this.books.lenght,
            totalUsers: this.users.lenght,
            borrowedBooks: this.books.reduce((sum, book) => sum + book.borrowedCopies, 0)
        };
    }

    //Metody zarządzania książkami

    addBook({ title, author, isbn, publicationYear, totalCopies = 1, borrowedCopies = 0, genre }) {
        const newBook = new Book(title, author, isbn, publicationYear, totalCopies, borrowedCopies, genre);
        this.books.push(newBook);
        return newBook;
    }

    removeBook(isbn){
        const index = this.books.findIndex(book => book.isbn === isbn)
        if (index !== -1){
            this.books.splice(index, 1);
            return true
        }
        return false
    }

    findBookByISBN(isbn){
        const index = this.books.findIndex(book => book.isbn === isbn)
        if (index !== -1){
            return this.books[index];
        }
        return false
    }

    findBookByAuthor(author){
        return this.books.filter(book => book.author === author) || false
    }
    
    findBookByGenre(genre){
        return this.books.genre(book => book.genre === genre) || false
    }

    updateBook(isbn, updates){
        const index = this.books.findIndex(book => book.isbn === isbn)
        if (index !== -1){
            this.books[index] = {
                ...this.books[index],
                ...updates
            }
            return true
        }
        return false
    }

    //Metody zarządzania użytkownikami

    registerUser({ name, email, registrationDate = new Date(), borrowedBooks = [], borrowHistory = [] }) {
        if (!Validator.isValidEmail(email)) {
            throw new Error("Invalid email");
        }

        const newUser = new User(name, email, registrationDate, borrowedBooks, borrowHistory);
        this.users.push(newUser);
        return newUser;
    }

    removeUser(email){
        const index = this.users.findIndex(user => user.email === email)
        if (index !== -1){
            this.users.splice(index, 1);
            return true
        }
        return false
    }

    findUserByEmail(email){
        const index = this.users.findIndex(user => user.email === email)
        if (index !== -1){
            return this.users[index];
        }
        return false
    }

    updateUser(email, updates){
        const index = this.users.findIndex(user => user.email === email)
        if (index !== -1){
            this.users[index] = {
                ...this.users[index],
                ...updates
            }
            return true
        }
        return false
    }

    //Metody wypożyczeń

    borrowBook(userEmail, isbn){
        const user = this.findUserByEmail(userEmail);
        const book = this.findBookByISBN(isbn);

        if (user && book && user.canBorrow && book.isAvailable){
            book.borrow();
            user.addBorrowedBook(book.isbn, book.title);
            return true
        }
        return false
    }
    
    returnBook(userEmail, isbn){
        const user = this.findUserByEmail(userEmail);
        const book = this.findBookByISBN(isbn);

        if (user && book){
            book.return();
            user.removeBorrowedBook(book.isbn, book.title);
            return true
        }
        return false
    }

    getUserLoans(userEmail){
        const user = this.findUserByEmail(userEmail);
        return user.getBorrowHistory();
    }

    getOverdueLoans(days){
        let overdueLoans = [];
        for (const user in this.users){
            for (const entry in user.borrowHistory){
                const daysBorrowed = DateUtils.getDaysBetween(entry.borrowDate, new Date());

                if (daysBorrowed > days && !returnDate){
                    overdueLoans.push({
                        userEmail: user.email,
                        userName: user.name,
                        isbn: entry.isbn,
                        bookTitle: entry.bookTitle,
                        bookAuthor: entry.bookAuthor,
                        borrowDate: entry.borrowDate,
                        daysOverdue: daysBorrowed - days
                    })
                }
            }
        }
        return overdueLoans;
    }

    //Metody raportowania

    getPopularBooks(limit){
        return [...this.books].sort((a, b) => b.borrowedCopies - a.borrowedCopies).slice(0, limit);
    }

    getActiveUsers(limit){
        return [...this.users].sort((a, b) => b.borrowedCount - a.borrowedCount).slice(0, limit);
    }

    generateReport(){
        return `
            Library name: ${this.name}\n
            Number of users: ${this.users.length}\n
            Books (total): ${this.books.length}\n
            Available books (total): ${this.availableBooks}\n
            Most loaned books (Top 3): ${this.getPopularBooks(3).map(b => `${b.title} (${b.borrowedCopies} borrows)`).join("\n")}\n
            Most active users (Top 3): ${this.getActiveUsers(3).map(u => `${u.name} (${u.borrowedCount} borrows)`).join("\n")}\n
            Loans (total): ${this.loans.length}\n
            Amount of overdue books (assuming 14 days): ${this.getOverdueLoans(14).length}\n
            Overdue entries: ${this.getOverdueLoans(14).map(entry => `${entry.userName} - "${entry.bookTitle}" by ${entry.bookAuthor} - ${entry.daysOverdue} days`).join("\n")}\n
        `;
    }
}

//Funkcje Pomocnicze

// swapElements([el1, el2]){

// }


// do klasy Library:

// get totalBooks(){
//         return this.totalCopies;
//     }

//     get availableBooks(){
//         return this.totalCopies - this.borrowedCopies;
//     }

//     get statistics(){
//         return {
//             title: this.title,
//             author: this.author,
//             isbn: this.isbn,
//             publicationYear: this.publicationYear,
//             totalCopies: this.totalCopies,
//             borrowedCopies: this.borrowedCopies,
//             genre: this.genre
//         }
//     }




// Inicjalizacja biblioteki
const library = new Library("Biblioteka Miejska");



// Dodawanie książek
library.addBook({
    title: "Władca Pierścieni",
    author: "J.R.R. Tolkien",
    isbn: "9788324589456",
    publicationYear: 1954,
    totalCopies: 3,
    genre: "Fantasy"
});

library.addBook(createBook({
    title: "1984",
    author: "George Orwell",
    isbn: "9788328708815",
    publicationYear: 1949,
    totalCopies: 2,
    genre: "Dystopia"
}));

// Rejestracja użytkowników
library.registerUser({
    name: "Jan Kowalski",
    email: "jan.kowalski@example.com"
});

library.registerUser(createUser({
    name: "Anna Nowak",
    email: "anna.nowak@example.com"
}));

// Wypożyczenia
library.borrowBook("jan.kowalski@example.com", "9788324589456");
library.borrowBook("anna.nowak@example.com", "9788328708815");

// Wyszukiwanie
const tolkienBooks = library.findBooksByAuthor("Tolkien");
const fantasyBooks = library.findBooksByGenre("Fantasy");

// Statystyki
console.log(library.statistics);
console.log(library.generateReport());

// Zwrot książki
library.returnBook("jan.kowalski@example.com", "9788324589456");

// Testy prototypów
const title = "władca pierścieni";
console.log(title.capitalize()); // "Władca pierścieni"
console.log(title.reverse());

const numbers = [1, 2, 3, 4, 5];
console.log(numbers.myEvery(n => n > 0)); // true
console.log(numbers.myFilter(n => n % 2 === 0)); // [2, 4]

// Testy funkcji pomocniczych
const [book1, book2] = swapElements([tolkienBook, orwellBook]);
const allBooks = mergeArrays(fantasyBooks, dystopiaBooks);
const extended = extendObject(book1, {genre: "Epic Fantasy"});