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