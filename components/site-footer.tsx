import Link from 'next/link';
import {
  CommandIcon,
  GithubIcon,
  Image01Icon,
  Pdf01Icon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';

const footerLinks = {
  imageTools: [
    { name: 'Image Compress', href: '/tools/image-compress' },
    { name: 'Image Converter', href: '/tools/image-convert' },
    { name: 'Image Resize & Crop', href: '/tools/image-resize-crop' },
    { name: 'Image Metadata Remover', href: '/tools/image-metadata-remove' },
    { name: 'Remove Background', href: '/tools/image-remove-bg' },
  ],
  pdfTools: [
    { name: 'Merge PDF', href: '/tools/pdf-merge' },
    { name: 'Split PDF', href: '/tools/pdf-split' },
    { name: 'Compress PDF', href: '/tools/pdf-compress' },
    { name: 'Rotate PDF', href: '/tools/pdf-rotate' },
    { name: 'PDF Metadata Remover', href: '/tools/pdf-metadata-remove' },
    { name: 'PDF Page Reorder', href: '/tools/pdf-reorder' },
    { name: 'PDF to Image', href: '/tools/pdf-to-image' },
    { name: 'Image to PDF', href: '/tools/image-to-pdf' },
  ],
};

const githubUrl = 'https://github.com/feildrixliemdra/konbato';

export function SiteFooter() {
  return (
    <footer className="relative border-t bg-muted/20">
      <div className="container py-16 md:py-20">
        <div className="grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <Link href="/" className="mb-4 inline-flex items-center space-x-2 group">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary transition-all group-hover:bg-primary group-hover:text-primary-foreground group-hover:scale-110">
                <HugeiconsIcon icon={CommandIcon} className="h-6 w-6" />
              </div>
              <span className="text-xl font-bold font-manrope">Konbato</span>
            </Link>
            <p className="mb-6 max-w-sm text-sm leading-relaxed text-muted-foreground font-dm-sans">
              Convert and edit files securely in your browser. 100% client-side
              processing with no uploads required.
            </p>
            <a
              href={githubUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-lg border border-border/60 bg-background/60 px-3 py-2 text-sm font-semibold text-muted-foreground transition-all font-dm-sans hover:border-primary/30 hover:bg-primary/10 hover:text-primary"
            >
              <HugeiconsIcon icon={GithubIcon} className="h-4 w-4" />
              GitHub
            </a>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:col-span-8">
            <div>
              <h3 className="mb-4 inline-flex items-center gap-2 text-sm font-semibold font-manrope">
                <HugeiconsIcon icon={Image01Icon} className="h-4 w-4 text-blue-500" />
                Image Tools
              </h3>
              <ul className="grid gap-3 sm:grid-cols-2">
                {footerLinks.imageTools.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors font-dm-sans hover:text-foreground"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="mb-4 inline-flex items-center gap-2 text-sm font-semibold font-manrope">
                <HugeiconsIcon icon={Pdf01Icon} className="h-4 w-4 text-rose-500" />
                PDF Tools
              </h3>
              <ul className="grid gap-3 sm:grid-cols-2">
                {footerLinks.pdfTools.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors font-dm-sans hover:text-foreground"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-12 border-t border-border/60 pt-8">
          <p className="text-sm text-muted-foreground font-dm-sans">
            &copy; {new Date().getFullYear()} Konbato. Built for local file conversion.
          </p>
        </div>
      </div>
    </footer>
  );
}
