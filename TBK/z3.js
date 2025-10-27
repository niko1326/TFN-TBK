// ===== Utils =====
const sleep = (ms) => new Promise((res) => setTimeout(res, ms));
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Prosty shim na localStorage (dla Node)
const LocalStorageShim = (() => {
  const store = new Map();
  return {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
    clear: () => store.clear(),
    _store: store
  };
})();
const localStorageLike = (typeof localStorage !== "undefined") ? localStorage : LocalStorageShim;

// ===== MODELE =====
class Book {
  constructor({ title, author, isbn, copies = 1 }) {
    if (!title || !author || !isbn) throw new Error("Book requires title, author, isbn");
    this.title = title;
    this.author = author;
    this.isbn = String(isbn);
    this.copies = Number.isFinite(copies) ? copies : 1;
    this.available = this.copies; // liczba dostępnych egz.
  }
}

class User {
  constructor({ name, email }) {
    if (!name || !emailRegex.test(email)) throw new Error("Invalid user data");
    this.name = name;
    this.email = String(email).toLowerCase();
    this.active = true;
  }
}

class Loan {
  constructor({ userEmail, isbn, date = new Date().toISOString() }) {
    this.userEmail = userEmail.toLowerCase();
    this.isbn = String(isbn);
    this.date = date;
  }
}

// ============================================================
// CZĘŚĆ VII: Klasa AsyncDatabase
// ============================================================
class AsyncDatabase {
  /**
   * @param {object} [opts]
   * @param {number} [opts.delay=500] - bazowe opóźnienie w ms
   */
  constructor({ delay = 500 } = {}) {
    this.delay = delay;
    this.data = new Map(); // key -> any (serializowalne)
  }

  _netDelay() {
    // 10% szansa "wolnej sieci" => 2x delay
    const slow = Math.random() < 0.10;
    return slow ? this.delay * 2 : this.delay;
  }

  /** Zapis z opóźnieniem */
  async save(key, value) {
    await sleep(this._netDelay());
    this.data.set(String(key), value);
    return true;
  }

  /** Pobranie z opóźnieniem; null jeśli brak */
  async get(key) {
    await sleep(this._netDelay());
    return this.data.has(String(key)) ? this.data.get(String(key)) : null;
  }

  /** Usunięcie; true jeśli istniało */
  async delete(key) {
    await sleep(this._netDelay());
    return this.data.delete(String(key));
  }

  /** Wszystkie wartości jako tablica */
  async getAll() {
    await sleep(this._netDelay());
    return [...this.data.values()];
  }

  /** Czyści bazę, zwraca liczbę usuniętych elementów */
  async clear() {
    await sleep(this._netDelay());
    const n = this.data.size;
    this.data.clear();
    return n;
  }
}

// ============================================================
// CZĘŚĆ VIII: Klasa Library z metodami async
// ============================================================
class Library {
  constructor({ database = new AsyncDatabase() } = {}) {
    this.database = database;
  }

  // ---------- 8.1 KSIĄŻKI ----------
  async addBookAsync(bookData) {
    // prosta walidacja
    if (!bookData?.isbn || !bookData?.title) throw new Error("Book must have title and isbn");
    const book = new Book(bookData);
    await this.database.save(`book_${book.isbn}`, book);
    return book;
  }

  async getBookAsync(isbn) {
    const raw = await this.database.get(`book_${isbn}`);
    return raw ? Object.assign(new Book({ title: raw.title, author: raw.author, isbn: raw.isbn, copies: raw.copies }), raw) : null;
  }

  async removeBookAsync(isbn) {
    const key = `book_${isbn}`;
    const book = await this.database.get(key);
    if (!book) return false;
    // Nie usuwaj, jeśli egzemplarze wypożyczone
    if ((book.copies ?? 1) > (book.available ?? 0)) {
      throw new Error("Cannot remove: book is currently borrowed");
    }
    return this.database.delete(key);
  }

  // ---------- 8.2 UŻYTKOWNICY ----------
  async registerUserAsync(userData) {
    if (!userData?.email || !emailRegex.test(userData.email)) {
      throw new Error("Invalid email");
    }
    const user = new User(userData);
    await this.database.save(`user_${user.email}`, user);
    return user;
  }

  async getUserAsync(email) {
    const raw = await this.database.get(`user_${email.toLowerCase()}`);
    return raw ? Object.assign(new User({ name: raw.name, email: raw.email }), raw) : null;
  }

  // ---------- 8.3 WYPOŻYCZENIA ----------
  async borrowBookAsync(userEmail, isbn) {
    const [book, user] = await Promise.all([
      this.getBookAsync(isbn),
      this.getUserAsync(userEmail)
    ]);

    if (!user) throw new Error("User not found");
    if (!book) throw new Error("Book not found");
    if (!user.active) throw new Error("User not active");
    if ((book.available ?? 0) <= 0) throw new Error("Book not available");

    book.available -= 1;
    const loan = new Loan({ userEmail: user.email, isbn: book.isbn });

    await Promise.all([
      this.database.save(`book_${book.isbn}`, book),
      this.database.save(`loan_${user.email}_${book.isbn}`, loan)
    ]);

    return loan;
  }

  async returnBookAsync(userEmail, isbn) {
    const [book, user, loan] = await Promise.all([
      this.getBookAsync(isbn),
      this.getUserAsync(userEmail),
      this.database.get(`loan_${userEmail.toLowerCase()}_${String(isbn)}`)
    ]);
    if (!user) throw new Error("User not found");
    if (!book) throw new Error("Book not found");
    if (!loan) throw new Error("Loan not found");

    book.available = (book.available ?? 0) + 1;
    await Promise.all([
      this.database.save(`book_${book.isbn}`, book),
      this.database.delete(`loan_${user.email}_${book.isbn}`)
    ]);
    return true;
  }

  // ============================================================
  // CZĘŚĆ IX: Promise.all
  // ============================================================
  async initializeLibraryAsync(booksData, usersData) {
    const addBooksPromises = booksData.map((b) => this.addBookAsync(b));
    const addUsersPromises = usersData.map((u) => this.registerUserAsync(u));

    const [books, users] = await Promise.all([
      Promise.all(addBooksPromises),
      Promise.all(addUsersPromises)
    ]);

    return { books, users, total: books.length + users.length };
  }

  async getMultipleBooksAsync(isbns) {
    const promises = isbns.map((isbn) => this.getBookAsync(isbn));
    const results = await Promise.all(promises);
    return results.filter(Boolean);
  }

  async batchBorrowBooksAsync(userEmail, isbns) {
    // Wypożyczaj równolegle – jeśli któreś się nie uda, zwróć wynik z informacją
    const results = await Promise.allSettled(
      isbns.map((isbn) => this.borrowBookAsync(userEmail, isbn))
    );

    return results.map((r, i) => {
      if (r.status === "fulfilled") return { isbn: isbns[i], ok: true, loan: r.value };
      return { isbn: isbns[i], ok: false, error: r.reason?.message || String(r.reason) };
    });
  }

  // ============================================================
  // CZĘŚĆ X: Promise.race
  // ============================================================
  createTimeout(ms, errorMessage = "Operation timed out") {
    return new Promise((_, reject) => {
      setTimeout(() => reject(new Error(errorMessage)), ms);
    });
  }

  async searchWithTimeout(searchFunction, timeoutMs = 3000) {
    // searchFunction: () => Promise<any>
    return Promise.race([searchFunction(), this.createTimeout(timeoutMs)]);
  }

  async getFastestResult(operations) {
    // operations: array of Promise lub array funkcji zwracających Promise
    const promises = operations.map((op) => (typeof op === "function" ? op() : op));
    // Zwróć wynik pierwszej zakończonej operacji (resolve lub reject)
    return Promise.race(promises);
  }

  // ============================================================
  // CZĘŚĆ XI: Promise.any
  // ============================================================
  async findBookAnywhere(isbn) {
    const tryLocalStorage = async () => {
      await sleep(50);
      const raw = localStorageLike.getItem(`book_${isbn}`);
      if (!raw) throw new Error("not in localStorage");
      const b = JSON.parse(raw);
      return { book: b, source: "localStorage" };
    };

    const tryDatabase = async () => {
      const b = await this.getBookAsync(isbn);
      if (!b) throw new Error("not in database");
      return { book: b, source: "database" };
    };

    const tryExternalAPI = async () => {
      // Symulacja "zewnętrznego API" – losowy czas + 20% brak książki
      const t = 200 + Math.random() * 600;
      await sleep(t);
      if (Math.random() < 0.20) throw new Error("not in externalAPI");
      // Zwracamy minimalne dane książki
      const book = new Book({
        title: `External: ${isbn}`,
        author: "External Provider",
        isbn,
        copies: 1
      });
      return { book, source: "externalAPI" };
    };

    try {
      const result = await Promise.any([tryLocalStorage(), tryDatabase(), tryExternalAPI()]);
      return result; // {book, source}
    } catch (e) {
      // AggregateError => brak sukcesów
      return null;
    }
  }

  async verifyUserInMultipleSystems(email) {
    const simulateCheck = (name) => async () => {
      // 30% szans na błąd systemu
      await sleep(100 + Math.random() * 500);
      if (Math.random() < 0.30) {
        throw new Error(`${name}: system error`);
      }
      // Uznajmy, że jeśli user istnieje w DB => true, wpp false (ale false traktujemy jako REJECT
      // by Promise.any zwróciło sukces tylko gdy faktycznie znaleziono)
      const user = await this.getUserAsync(email);
      if (user) return true;
      throw new Error(`${name}: user not found`);
    };

    try {
      // Sukces, jeśli choć jeden system potwierdzi (resolve true).
      const result = await Promise.any([
        simulateCheck("SystemA")(),
        simulateCheck("SystemB")(),
        simulateCheck("SystemC")()
      ]);
      return !!result;
    } catch (e) {
      // Wszystkie odrzucone => brak potwierdzenia
      return false;
    }
  }
}

// ============================================================
// PRZYKŁAD UŻYCIA / DEMO
// (uruchom i obserwuj konsolę; sekcje są niezależne, można komentować)
// ============================================================
(async () => {
  const lib = new Library({ database: new AsyncDatabase({ delay: 200 }) });

  // Inicjalizacja (Promise.all)
  const init = await lib.initializeLibraryAsync(
    [
      { title: "Clean Code", author: "Robert C. Martin", isbn: "9780132350884", copies: 2 },
      { title: "You Don't Know JS", author: "Kyle Simpson", isbn: "9781491904244", copies: 1 },
      { title: "JavaScript: The Good Parts", author: "Douglas Crockford", isbn: "9780596517748", copies: 1 }
    ],
    [
      { name: "Ala", email: "ala@example.com" },
      { name: "Ola", email: "ola@example.com" }
    ]
  );
  console.log("Initialize:", init);

  // Pobrania równoległe
  const someBooks = await lib.getMultipleBooksAsync(["9780132350884", "9781491904244", "0000000000"]);
  console.log("getMultipleBooksAsync:", someBooks.map(b => b.title));

  // Wypożyczenia równoległe (Promise.allSettled)
  const batchBorrow = await lib.batchBorrowBooksAsync("ala@example.com", [
    "9780132350884",
    "9781491904244",
    "9780596517748"
  ]);
  console.log("batchBorrowBooksAsync:", batchBorrow);

  // Zwrócenie jednej książki
  await lib.returnBookAsync("ala@example.com", "9781491904244");
  console.log("Returned YDKJS");

  // Promise.race: wyszukiwanie z timeoutem
  const slowSearch = async () => {
    await sleep(1000);
    return "search-result";
  };
  const withTimeout = await lib.searchWithTimeout(slowSearch, 1500);
  console.log("searchWithTimeout:", withTimeout);

  // getFastestResult
  const fastest = await lib.getFastestResult([
    async () => { await sleep(800); return "A"; },
    async () => { await sleep(300); return "B"; },
    async () => { await sleep(600); return "C"; }
  ]);
  console.log("getFastestResult:", fastest); // "B"

  // Promise.any: findBookAnywhere
  // Zapiszmy jedną książkę do localStorage (aby przetestować źródło)
  localStorageLike.setItem("book_9780596517748", JSON.stringify({
    title: "JS: The Good Parts (LS)",
    author: "Douglas Crockford",
    isbn: "9780596517748",
    copies: 1,
    available: 1
  }));
  const found = await lib.findBookAnywhere("9780596517748");
  console.log("findBookAnywhere:", found);

  // verifyUserInMultipleSystems
  const verified1 = await lib.verifyUserInMultipleSystems("ala@example.com");
  const verified2 = await lib.verifyUserInMultipleSystems("nie_ma@example.com");
  console.log("verifyUserInMultipleSystems (ala):", verified1);
  console.log("verifyUserInMultipleSystems (nie_ma):", verified2);

  // Próba usunięcia książki wypożyczonej
  try {
    await lib.removeBookAsync("9780132350884");
  } catch (e) {
    console.log("removeBookAsync blocked:", e.message);
  }

  // Czyszczenie DB
  const removedCount = await lib.database.clear();
  console.log("DB cleared, removed:", removedCount);
})();
