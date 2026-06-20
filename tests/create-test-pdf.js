const fs = require('fs');
const path = require('path');

async function main() {
  const mupdf = await import('mupdf');
  const outDir = path.join(__dirname, 'files');
  fs.mkdirSync(outDir, { recursive: true });

  const doc = new mupdf.PDFDocument();

  for (let pageIndex = 0; pageIndex < 2; pageIndex++) {
    const resources = doc.newDictionary();
    const page = doc.addPage([0, 0, 300, 300], 0, resources, '');
    doc.insertPage(pageIndex, page);
  }

  const buffer = doc.saveToBuffer('compress,compress-images,garbage=2');
  const bytes = buffer.asUint8Array();
  fs.writeFileSync(path.join(outDir, 'test-document.pdf'), Buffer.from(bytes));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
