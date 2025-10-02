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
    
}




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