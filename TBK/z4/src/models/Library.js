import { EventEmitter } from 'node:events';
import Book from './Book.js';
import User from './User.js';

const LOAN_DAYS = 14;

function addDays(date, days) {
  return new Date(new Date(date).getTime() + days * 24 * 60 * 60 * 1000);
}

export default class Library {
  constructor(name) {
    this.name = name;
    this.books = [];
    this.users = [];
    this.loans = [];

    this.eventEmitter = new EventEmitter();
    this.eventHistory = [];
  }

  on(eventName, handler) {
    this.eventEmitter.on(eventName, (payload) => {
      const evt = { type: eventName, payload, time: new Date() };
      this.eventHistory.push(evt);
      if (this.eventHistory.length > 50) this.eventHistory.shift();
      handler(payload);
    });
  }

  getEventHistory(limit = 10) {
    return this.eventHistory.slice(-limit);
  }

  getEventStats() {
    const counts = {};
    for (const { type } of this.eventHistory) counts[type] = (counts[type] || 0) + 1;
    const total = this.eventHistory.length;
    const firstEventTime = total ? this.eventHistory[0].time : null;
    const lastEventTime = total ? this.eventHistory[total - 1].time : null;
    const lastEvent = total ? this.eventHistory[total - 1] : null;
    return { eventCounts: counts, totalEvents: total, lastEvent, firstEventTime, lastEventTime };
  }

  get totalBooks() {
    return this.books.reduce((acc, b) => acc + b.totalCopies, 0);
  }

  get availableBooks() {
    return this.books.reduce((acc, b) => acc + b.availableCopies, 0);
  }

  addBook(bookData) {
    if (!Book.isValidBook(bookData)) throw new Error('Invalid book data');
    const book = new Book(bookData);
    this.books.push(book);
    this.eventEmitter.emit('book:added', { book, timestamp: new Date() });
    return book;
  }

  findBookByISBN(isbn) {
    return this.books.find((b) => b.isbn === isbn) || null;
  }

  registerUser(userData) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(userData.email))) {
      throw new Error('Invalid email');
    }
    const user = new User(userData);
    this.users.push(user);
    this.eventEmitter.emit('user:registered', { user, timestamp: new Date() });
    return user;
  }

  findUserByEmail(email) {
    return this.users.find((u) => u.email === email) || null;
  }

  borrowBook(userEmail, isbn) {
    const user = this.findUserByEmail(userEmail);
    const book = this.findBookByISBN(isbn);
    if (!user || !book) return false;
    if (!user.canBorrow || !book.isAvailable) return false;

    book.borrow();
    user.addBorrowedBook(book.isbn, book.title);
    const borrowDate = new Date();
    const dueDate = addDays(borrowDate, LOAN_DAYS);
    this.loans.push({ userEmail, isbn, borrowDate, dueDate });

    this.eventEmitter.emit('loan:created', {
      userEmail,
      isbn,
      bookTitle: book.title,
      timestamp: new Date(),
    });
    return true;
  }

  returnBook(userEmail, isbn) {
    const user = this.findUserByEmail(userEmail);
    const book = this.findBookByISBN(isbn);
    if (!user || !book) return false;
    const idx = this.loans.findIndex((l) => l.userEmail === userEmail && l.isbn === isbn);
    if (idx === -1) return false;

    book.return();
    user.removeBorrowedBook(isbn);
    this.loans.splice(idx, 1);

    this.eventEmitter.emit('loan:returned', {
      userEmail,
      isbn,
      bookTitle: book.title,
      timestamp: new Date(),
    });
    return true;
  }

  async initializeFromData(booksData = [], usersData = []) {
    const bookResults = await Promise.all(
      booksData.map((bd) =>
        Promise.resolve()
          .then(() => this.addBook(bd))
          .then(() => ({ ok: true }))
          .catch(() => ({ ok: false }))
      )
    );

    const userResults = await Promise.all(
      usersData.map((ud) =>
        Promise.resolve()
          .then(() => this.registerUser(ud))
          .then(() => ({ ok: true }))
          .catch(() => ({ ok: false }))
      )
    );

    const addedBooks = bookResults.filter((r) => r.ok).length;
    const failedBooks = bookResults.length - addedBooks;
    const addedUsers = userResults.filter((r) => r.ok).length;
    const failedUsers = userResults.length - addedUsers;

    return { addedBooks, addedUsers, failedBooks, failedUsers };
  }

  async saveWithTimeout(dataManager, timeoutMs = 5000) {
    const { withTimeout } = await import('../services/utils.js');
    const op = dataManager.saveLibrary(this);
    return withTimeout(op, timeoutMs, 'saveLibrary');
  }

  async findBookFromMultipleSources(isbn) {
    const searchLocal = async () => {
      const book = this.findBookByISBN(isbn);
      if (book) return { book, source: 'local' };
      throw new Error('Not in local');
    };

    const searchCache = async () => {
      await new Promise((res) => setTimeout(res, 100));
      if (Math.random() > 0.2) {
        return { book: { title: 'Cache Title', author: 'Cache Author', isbn }, source: 'cache' };
      }
      throw new Error('Not in cache');
    };

    const searchAPI = async () => {
      await new Promise((res) => setTimeout(res, 500));
      if (Math.random() > 0.5) {
        return { book: { title: 'API Title', author: 'API Author', isbn }, source: 'api' };
      }
      throw new Error('API failed');
    };

    try {
      return await Promise.any([searchLocal(), searchCache(), searchAPI()]);
    } catch {
      return null;
    }
  }

  toJSON() {
    return {
      name: this.name,
      books: this.books,
      users: this.users,
      loans: this.loans,
    };
  }
}
