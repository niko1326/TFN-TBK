import fs from 'node:fs/promises';
import path from 'node:path';

export default class DataManager {
  constructor(dataFolder = './data') {
    this.dataFolder = dataFolder;
  }

  async saveLibrary(library) {
    try {
      await fs.mkdir(this.dataFolder, { recursive: true });
      const booksPath = path.join(this.dataFolder, 'books.json');
      const usersPath = path.join(this.dataFolder, 'users.json');
      const loansPath = path.join(this.dataFolder, 'loans.json');

      const { books = [], users = [], loans = [] } = library?.toJSON?.() || library || {};

      await Promise.all([
        fs.writeFile(booksPath, JSON.stringify(books, null, 2), 'utf-8'),
        fs.writeFile(usersPath, JSON.stringify(users, null, 2), 'utf-8'),
        fs.writeFile(loansPath, JSON.stringify(loans, null, 2), 'utf-8'),
      ]);

      return { booksCount: books.length, usersCount: users.length, loansCount: loans.length };
    } catch (err) {
      console.error('saveLibrary error:', err.message);
      throw err;
    }
  }

  async loadLibrary() {
    const booksPath = path.join(this.dataFolder, 'books.json');
    const usersPath = path.join(this.dataFolder, 'users.json');
    const loansPath = path.join(this.dataFolder, 'loans.json');

    const safeRead = async (p) => {
      try {
        const buf = await fs.readFile(p, 'utf-8');
        return JSON.parse(buf);
      } catch (e) {
        return [];
      }
    };

    const [books, users, loans] = await Promise.all([
      safeRead(booksPath),
      safeRead(usersPath),
      safeRead(loansPath),
    ]);

    return { books, users, loans };
  }

  async clearAllData() {
    try {
      const files = ['books.json', 'users.json', 'loans.json'];
      let removed = 0;
      await fs.mkdir(this.dataFolder, { recursive: true });
      await Promise.all(
        files.map(async (f) => {
          const p = path.join(this.dataFolder, f);
          try {
            await fs.unlink(p);
            removed += 1;
          } catch (e) {
            if (e.code !== 'ENOENT') throw e;
          }
        })
      );
      return removed;
    } catch (err) {
      console.error('clearAllData error:', err.message);
      throw err;
    }
  }
}
