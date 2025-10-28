import Library from './src/models/Library.js';
import DataManager from './src/services/DataManager.js';

async function main() {
  console.log('=== Test Systemu Biblioteki z Node.js ===\n');
  
  // Test 1: Zdarzenia
  const library = new Library('Biblioteka Główna');
  library.on('book:added', (data) => {
    console.log(`✓ Zdarzenie: Dodano "${data.book.title}"`);
  });
  
  // Test 2: Promise.all
  const sampleBooks = [
    {title: 'Wiedźmin', author: 'Sapkowski', isbn: '1234567890123', 
     publicationYear: 1990, totalCopies: 3, genre: 'Fantasy'},
    {title: '1984', author: 'Orwell', isbn: '1234567890124', 
     publicationYear: 1949, totalCopies: 5, genre: 'Dystopia'},
  ];
  
  const sampleUsers = [
    {name: 'Jan Kowalski', email: 'jan@email.com'},
    {name: 'Anna Nowak', email: 'anna@email.com'},
  ];
  
  const initResult = await library.initializeFromData(sampleBooks, sampleUsers);
  console.log('Inicjalizacja:', initResult);
  
  // Test 3: Wypożyczenia i historia zdarzeń
  library.borrowBook('jan@email.com', '1234567890123');
  const history = library.getEventHistory(5);
  console.log('Ostatnie zdarzenia:', history.map(e => e.type));
  
  // Test 4: Persystencja
  const dataManager = new DataManager();
  await dataManager.saveLibrary(library);
  const loadedData = await dataManager.loadLibrary();
  console.log('Wczytano:', loadedData.books.length, 'książek');
  
  // Test 5: Timeout
  await library.saveWithTimeout(dataManager, 10000);
  console.log('✓ Zapis zakończony w czasie');
  
  // Test 6: Promise.any
  const searchResult = await library.findBookFromMultipleSources('1234567890123');
  console.log('Znaleziono w:', searchResult?.source);
}

main().catch(console.error);