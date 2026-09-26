import { extractPdfText } from './pdf-text';

function headingLevel(fontSize: number, baseline: number): number {
  if (fontSize >= baseline * 1.5) return 1;
  if (fontSize >= baseline * 1.25) return 2;
  if (fontSize >= baseline * 1.1) return 3;
  return 0;
}

export async function pdfToMarkdown(data: ArrayBuffer): Promise<string> {
  const { pages } = await extractPdfText(data);
  const sizes = pages.flatMap((p) => p.lines.map((l) => l.fontSize));
  const baseline = sizes.length
    ? sizes.slice().sort((a, b) => a - b)[Math.floor(sizes.length / 2)]
    : 12;

  const chunks: string[] = [];
  for (const page of pages) {
    if (page.index > 0) chunks.push('\n\n---\n'); // page break
    for (const line of page.lines) {
      const text = line.text.trim();
      if (!text) continue;
      const level = headingLevel(line.fontSize, baseline);
      chunks.push(level ? `${'#'.repeat(level)} ${text}` : text);
    }
    chunks.push('');
  }
  return chunks.join('\n').trim();
}
