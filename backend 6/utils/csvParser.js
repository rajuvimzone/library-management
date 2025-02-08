const { parse } = require('csv-parse');
const fs = require('fs');

const parseCSV = (filePath) => {
  return new Promise((resolve, reject) => {
    const books = [];

    // Verify file exists
    if (!fs.existsSync(filePath)) {
      return reject(new Error(`File not found: ${filePath}`));
    }

    fs.createReadStream(filePath)
      .pipe(
        parse({
          columns: true,
          skip_empty_lines: true,
          trim: true,
          cast: true
        })
      )
      .on('data', (row) => {
        try {
          // Convert row data to match Book model schema
          const book = {
            title: row.title?.trim(),
            author: row.author?.trim(),
            ISBN: row.ISBN || row.isbn,
            category: row.category?.trim(),
            description: row.description?.trim() || '',
            publisher: row.publisher?.trim() || '',
            publishedYear: row.publishedYear || row.published_year,
            available: parseInt(row.available || row.copies || 1),
            totalCopies: parseInt(row.totalCopies || row.total_copies || row.available || row.copies || 1),
            location: row.location?.trim() || '',
            coverImage: row.coverImage || row.cover_image || '',
          };

          // Validate required fields
          if (!book.title || !book.author || !book.ISBN || !book.category) {
            console.warn('Skipping invalid row:', row);
            return;
          }

          books.push(book);
        } catch (error) {
          console.error('Error processing CSV row:', error, row);
        }
      })
      .on('end', () => {
        console.log(`Successfully parsed ${books.length} books from CSV`);
        resolve(books);
      })
      .on('error', (error) => {
        console.error('CSV parsing error:', error);
        reject(error);
      });
  });
};

module.exports = { parseCSV };
