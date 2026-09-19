import JSZip from 'jszip';
import { triggerDownload } from './format';

export interface DownloadItem {
  name: string;
  url: string;
}

/**
 * Downloads a single file directly, or bundles several into a zip.
 * Used by every multi-file tool result view.
 */
export async function downloadResults(
  items: DownloadItem[],
  zipName: string
): Promise<void> {
  if (items.length === 0) return;

  if (items.length === 1) {
    triggerDownload(items[0].url, items[0].name);
    return;
  }

  const zip = new JSZip();
  for (const item of items) {
    const response = await fetch(item.url);
    zip.file(item.name, await response.blob());
  }

  const zipBlob = await zip.generateAsync({ type: 'blob' });
  const zipUrl = URL.createObjectURL(zipBlob);
  triggerDownload(zipUrl, zipName);

  // Revoking on the same tick can abort an in-flight download (notably Safari),
  // so the URL is released once the save has certainly started.
  window.setTimeout(() => URL.revokeObjectURL(zipUrl), 60_000);
}
