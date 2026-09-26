import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';
import { extractPdfText } from './pdf-text';

export async function pdfToWordBlob(data: ArrayBuffer): Promise<Blob> {
  const { pages } = await extractPdfText(data);
  const sizes = pages.flatMap((p) => p.lines.map((l) => l.fontSize));
  const baseline = sizes.length
    ? sizes.slice().sort((a, b) => a - b)[Math.floor(sizes.length / 2)]
    : 12;

  const children: Paragraph[] = [];
  for (const page of pages) {
    for (const line of page.lines) {
      const text = line.text.trim();
      if (!text) continue;
      const heading =
        line.fontSize >= baseline * 1.5
          ? HeadingLevel.HEADING_1
          : line.fontSize >= baseline * 1.25
            ? HeadingLevel.HEADING_2
            : undefined;
      children.push(
        new Paragraph({
          heading,
          children: [new TextRun({ text })],
        })
      );
    }
  }

  const doc = new Document({ sections: [{ children }] });
  return Packer.toBlob(doc);
}
