'use client';
import { useState } from 'react';
import BookForm from '../components/BookForm';


export default function Home() {
  // Stan książek
  const [books, setBooks] = useState([]);
  // Struktura: {id, title, author, isbn, genre, available, total}
  // Stan użytkowników
  const [users, setUsers] = useState([]);
  // Struktura: {id, title, author, isbn, genre, available, total}
  // Stan wypożyczeń
  const [loans, setLoans] = useState([]);
  // Struktura: {id, bookId, userId, bookTitle, userName, loanDate}

  const handleAddBook = (book) => {
    setBooks(prev => [...prev, book]);
  };


  return (
    <main className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Biblioteka</h1>

      <div className="rounded border p-4 bg-white">
        <BookForm onAddBook={handleAddBook} />
      </div>

      <pre className="mt-4 text-sm opacity-70">
        {/* Podgląd stanu dla testów */}
        {JSON.stringify({ books, users, loans }, null, 2)}
      </pre>
    </main>
  );
}
