const fs = require('fs');
const path = require('path');

async function main() {
  const mupdf = await import('mupdf');
  const outDir = path.join(__dirname, 'files');
  fs.mkdirSync(outDir, { recursive: true });

  const write = (doc, fileName) => {
    const buffer = doc.saveToBuffer('compress,compress-images,garbage=2');
    const bytes = buffer.asUint8Array();
    fs.writeFileSync(path.join(outDir, fileName), Buffer.from(bytes));
  };

  // Two identical blank pages: enough for the tools that only need a real page
  // count, and their assertions depend on it staying this shape.
  const doc = new mupdf.PDFDocument();

  for (let pageIndex = 0; pageIndex < 2; pageIndex++) {
    const resources = doc.newDictionary();
    const page = doc.addPage([0, 0, 300, 300], 0, resources, '');
    doc.insertPage(pageIndex, page);
  }

  write(doc, 'test-document.pdf');

  // Three visually distinct pages, so a reordered thumbnail grid in the PDF
  // organizer reads at a glance instead of showing three identical blanks.
  const organizer = new mupdf.PDFDocument();
  const organizerPages = [
    { box: [0, 0, 300, 300], block: '20 20 260 260' },
    { box: [0, 0, 300, 420], block: '20 20 260 380' },
    { box: [0, 0, 300, 300], block: '95 95 110 110' },
  ];

  organizerPages.forEach(({ box, block }, index) => {
    const resources = organizer.newDictionary();
    const contents = `0.15 0.35 0.85 rg ${block} re f\n`;
    const page = organizer.addPage(box, 0, resources, contents);
    organizer.insertPage(index, page);
  });

  write(organizer, 'pdf-organizer.pdf');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
