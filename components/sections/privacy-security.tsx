import { SectionHeader } from '@/components/section-header';
import { DEMO_FILE } from '@/lib/demo-file';
import { cn } from '@/lib/utils';

/*
 * The privacy section.
 *
 * This used to be a full-bleed dark band that stayed dark in both themes, on
 * the theory that "inside the tab" is a dark room. Once the diagram of that
 * room was gone, a polarity flip in the middle of a light page had nothing
 * left to justify it, and a dark band with one bright accent is among the
 * commonest generated-page moves. The section now sits on the canvas with a
 * quiet tint, full bleed, so it still reads as a change of pace without a
 * change of world.
 *
 * It also no longer carries a dashboard. An earlier version drew the claim
 * as a card with a status badge, nested boxes, a struck-through boundary and a
 * row of three stat tiles, beside a trio of icon-and-title claims. None of
 * that was evidence; it was the shape every generated privacy section takes.
 *
 * The evidence is the network log, so that is what is drawn: one ledger of
 * what crosses the network while a job runs. The honest complication, that
 * app code, engine binaries and the background-removal model are fetched
 * like any website asset, sits in the same table as the file that never is.
 * A claim that survives its own exception is worth more than one that hides
 * it, and a reader can confirm every row with the network panel in their
 * own browser.
 */

interface LedgerRow {
  resource: string;
  network: string;
  /** The rows the section exists to show. Everything else is context. */
  emphasis?: boolean;
}

const ledger: LedgerRow[] = [
  { resource: 'App code', network: 'Fetched once, then cached' },
  { resource: 'Engines (mupdf, image decoders)', network: 'Fetched once, then cached' },
  { resource: 'Background-removal model', network: 'Fetched on first use, then cached' },
  { resource: `Your file (${DEMO_FILE.source.name})`, network: 'Never sent', emphasis: true },
  { resource: `Your result (${DEMO_FILE.result.name})`, network: 'Never sent', emphasis: true },
];

export function PrivacySecurity() {
  return (
    <section className="bg-muted/40">
      <div className="container py-16 md:py-24">
        <SectionHeader
          title="There is no upload step"
          lede="Most converters send your file to a server, work on it there, and send it back. Konbato has no server to send it to."
        />

        <div className="grid gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-16">
          <div className="flex flex-col gap-5 text-base leading-relaxed text-muted-foreground font-dm-sans">
            <p>
              Everything between an upload and a download is a place a file
              can be read, kept, or lost. Konbato removes that stretch instead
              of promising to guard it. There is no endpoint in this codebase
              that accepts a file, so there is nothing to intercept and
              nothing left behind in a storage bucket.
            </p>
            <p>
              The file is read into this tab, rewritten by engines that run in
              the tab, and handed back from the tab. Close it and the file is
              gone from memory. Nothing ever sat in a queue behind someone
              else&rsquo;s upload, because the only machine doing the work is
              yours.
            </p>
            <p className="text-foreground">
              You do not have to take this on trust. Open the network panel in
              your browser, run any tool, and watch for the file. It never
              appears.
            </p>
          </div>

          <table className="w-full border-collapse self-start text-sm">
            <caption className="sr-only">
              What crosses the network while a job runs
            </caption>
            <thead>
              <tr className="border-b border-border text-xs text-muted-foreground">
                <th scope="col" className="pb-3 pr-4 text-start font-semibold">
                  While a job runs
                </th>
                <th scope="col" className="pb-3 text-start font-semibold">
                  On the network
                </th>
              </tr>
            </thead>
            <tbody>
              {ledger.map((row) => (
                <tr
                  key={row.resource}
                  className={cn(
                    'border-b border-border',
                    row.emphasis ? 'text-foreground' : 'text-muted-foreground'
                  )}
                >
                  <th
                    scope="row"
                    className={cn(
                      'py-4 pr-4 text-start font-dm-sans',
                      row.emphasis ? 'font-semibold' : 'font-normal'
                    )}
                  >
                    {row.resource}
                  </th>
                  <td
                    className={cn(
                      'py-4 font-dm-sans',
                      row.emphasis && 'font-semibold text-success'
                    )}
                  >
                    {row.network}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
