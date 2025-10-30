'use client';
import { useState } from 'react';

export default function BookForm({ onAddBook }) {
  // 👉 jeden stan na wiele pól
  const [form, setForm] = useState({
    title: '',
    author: '',
    isbn: '',
    genre: '',
    total: ''
  });

  // uniwersalny handler dla wszystkich inputów
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const trimmedIsbn = form.isbn.trim();
    const trimmedTitle = form.title.trim();
    const trimmedAuthor = form.author.trim();
    const trimmedGenre = form.genre.trim();
    const trimmedTotal = form.total.trim();

    if (!trimmedTitle || !trimmedIsbn || !trimmedAuthor || !trimmedGenre || !trimmedTotal) {
        alert("All fields are necessary!")
        return;
    }

    if (!/^\d{13}$/.test(trimmedIsbn)) {
        alert("ISBN has to be 13 digits long!");
        return;
    }

    if (trimmedTotal <=0) {
        alert("Total has to be greater than 0!");
        return;
    }
    
    onAddBook({
      id: Date.now().toString(),
      title: trimmedTitle,
      author: trimmedAuthor, // 👈 teraz przekazujemy też autora
      isbn: trimmedIsbn,
      genre: trimmedGenre,
      available: trimmedTotal,
      total: trimmedTotal
    });

    // reset pól
    setForm({ title: '', author: '' , isbn: '', genre: '', total: ''});
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 bg-white p-4 rounded shadow max-w-md">
      <div>
        <label className="block mb-1">Title</label>
        <input
          name="title"
          value={form.title}
          onChange={handleChange}
          className="border p-2 rounded w-full"
          placeholder="ex. Pan Tadeusz"
        />
      </div>

      <div>
        <label className="block mb-1">Author</label>
        <input
          name="author"
          value={form.author}
          onChange={handleChange}
          className="border p-2 rounded w-full"
          placeholder="ex. Adam Mickiewicz"
        />
      </div>

      <div>
        <label className="block mb-1">ISBN</label>
        <input
          name="isbn"
          value={form.isbn}
          onChange={handleChange}
          className="border p-2 rounded w-full"
          placeholder="ex. 1234567123456"
        />
      </div>

      <div>
        <label className="block mb-1">Genre</label>
        <input
          name="genre"
          value={form.genre}
          onChange={handleChange}
          className="border p-2 rounded w-full"
          placeholder="ex. Fantasy"
        />
      </div>

      <div>
        <label className="block mb-1">Total</label>
        <input
          name="total"
          value={form.total}
          onChange={handleChange}
          className="border p-2 rounded w-full"
          placeholder="ex. 3"
        />
      </div>

      <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">
        Add
      </button>
    </form>
  );
}
