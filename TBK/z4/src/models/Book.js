export default class Book {
  constructor({ title, author, isbn, publicationYear, totalCopies = 1, borrowedCopies = 0, genre }) {
    this.title = title;
    this.author = author;
    this.isbn = isbn;
    this.publicationYear = publicationYear;
    this.totalCopies = totalCopies;
    this.borrowedCopies = borrowedCopies;
    this.genre = genre;
  }

  get availableCopies() {
    return this.totalCopies - this.borrowedCopies;
  }

  get isAvailable() {
    return this.availableCopies > 0;
  }

  borrow() {
    if (!this.isAvailable) return false;
    this.borrowedCopies += 1;
    return true;
  }

  return() {
    if (this.borrowedCopies <= 0) return false;
    this.borrowedCopies -= 1;
    return true;
  }

  static isValidISBN(isbn) {
    return /^\d{13}$/.test(String(isbn));
  }

  static isValidYear(year) {
    const currentYear = new Date().getFullYear();
    return Number.isInteger(year) && year >= 1000 && year <= currentYear;
  }

  static isValidBook(data) {
    const { title, author, isbn, publicationYear, totalCopies, genre } = data || {};
    return (
      !!title &&
      !!author &&
      !!genre &&
      Book.isValidISBN(isbn) &&
      Book.isValidYear(publicationYear) &&
      Number(totalCopies) > 0
    );
  }
}
