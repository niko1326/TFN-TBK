export default class User {
  constructor({ name, email, registrationDate = new Date(), borrowedBooks = [], borrowHistory = [] }) {
    this.name = name;
    this.email = email;
    this.registrationDate = new Date(registrationDate);
    this.borrowedBooks = borrowedBooks;
    this.borrowHistory = borrowHistory;
  }

  get canBorrow() {
    return this.borrowedBooks.length < 5;
  }

  addBorrowedBook(isbn, bookTitle) {
    if (!this.canBorrow) return false;
    this.borrowedBooks.push(isbn);
    this.borrowHistory.push({ isbn, bookTitle, borrowDate: new Date() });
    return true;
  }

  removeBorrowedBook(isbn) {
    const idx = this.borrowedBooks.indexOf(isbn);
    if (idx === -1) return false;
    this.borrowedBooks.splice(idx, 1);
    return true;
  }
}
