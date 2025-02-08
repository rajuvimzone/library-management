const bwipjs = require('bwip-js');
const fs = require('fs');
const path = require('path');

const sampleBooks = [
  {
    title: "To Kill a Mockingbird",
    barcode: "001"
  },
  {
    title: "1984",
    barcode: "002"
  },
  {
    title: "The Great Gatsby",
    barcode: "003"
  },
  {
    title: "Harry Potter and the Philosopher's Stone",
    barcode: "004"
  },
  {
    title: "The Hobbit",
    barcode: "005"
  },
  {
    title: "Pride and Prejudice",
    barcode: "006"
  },
  {
    title: "The Catcher in the Rye",
    barcode: "007"
  },
  {
    title: "The Da Vinci Code",
    barcode: "008"
  }
];

// Create barcodes directory if it doesn't exist
const barcodesDir = path.join(__dirname, '..', '..', 'public', 'barcodes');
if (!fs.existsSync(barcodesDir)) {
  fs.mkdirSync(barcodesDir, { recursive: true });
}

// Generate barcodes for each book
async function generateBarcodes() {
  console.log('Generating barcodes...');
  
  for (const book of sampleBooks) {
    try {
      const png = await bwipjs.toBuffer({
        bcid: 'code128',       // Barcode type
        text: book.barcode,    // Text to encode (simpler numeric format)
        scale: 3,              // 3x scaling factor
        height: 10,            // Bar height, in millimeters
        includetext: true,     // Show human-readable text
        textxalign: 'center',  // Center the text
        textyoffset: 2,        // Move text down by 2mm
        guardwhitespace: true, // Add white space guard
        padding: 10           // Add padding around barcode
      });

      const filePath = path.join(barcodesDir, `${book.barcode}.png`);
      fs.writeFileSync(filePath, png);
      console.log(`Generated barcode for ${book.title} - ${book.barcode}`);
    } catch (error) {
      console.error(`Error generating barcode for ${book.title}:`, error);
    }
  }
  
  console.log('\nBarcodes have been generated in the public/barcodes directory');
  console.log('You can now print these barcodes and attach them to the books');
}

generateBarcodes();
