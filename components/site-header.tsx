'use client'

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';
import { BrandMark } from '@/components/brand-mark';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@/components/ui/navigation-menu';
import {
  MenuIcon,
  Cancel01Icon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { motion, AnimatePresence } from 'framer-motion';
import { TOOLS, TOOL_GROUPS, ACCENTS, accentTile, type Tool, type ToolGroup } from '@/lib/tools';

/**
 * Which groups stack in which desktop column. Balanced by row count (8 / 6 / 8)
 * so the panel is short and even; a group missing here (e.g. the catch-all for
 * a newly added tool) goes in the last column rather than being dropped.
 */
const DESKTOP_COLUMNS = [['image', 'pdf-edit'], ['pdf-organize'], ['pdf-convert', 'pdf-secure']];

function desktopColumns(): ToolGroup[][] {
  const placed = new Set(DESKTOP_COLUMNS.flat());
  const columns = DESKTOP_COLUMNS.map((ids) =>
    ids.map((id) => TOOL_GROUPS.find((group) => group.id === id)).filter((g): g is ToolGroup => !!g)
  );
  columns[columns.length - 1].push(...TOOL_GROUPS.filter((group) => !placed.has(group.id)));
  return columns;
}

const COLUMNS = desktopColumns();

function groupHeading(group: ToolGroup) {
  return group.category === 'PDF' ? `PDF · ${group.label}` : group.label;
}

function GroupHeading({ group, id, className }: { group: ToolGroup; id: string; className?: string }) {
  return (
    <h3
      id={id}
      className={`flex items-center gap-1.5 text-[10px] font-bold tracking-wider uppercase text-muted-foreground/70 font-manrope ${className ?? ''}`}
    >
      {/* The dot carries the category hue, so Image and PDF groups read apart at a glance. */}
      <span aria-hidden className={`size-1.5 rounded-full bg-current ${ACCENTS[group.category].icon}`} />
      {groupHeading(group)}
    </h3>
  );
}

function ToolMenuLink({ tool }: { tool: Tool }) {
  return (
    <NavigationMenuLink asChild>
      <Link
        href={tool.href}
        className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-muted/65 focus-visible:bg-muted/65 transition-colors text-xs font-semibold font-dm-sans group/link"
      >
        <HugeiconsIcon
          icon={tool.icon}
          className={ACCENTS[tool.category].icon}
          aria-hidden
        />
        {tool.shortLabel ?? tool.title}
      </Link>
    </NavigationMenuLink>
  );
}

function MobileToolLink({ tool, onNavigate }: { tool: Tool; onNavigate: () => void }) {
  return (
    <Link
      href={tool.href}
      onClick={onNavigate}
      className="flex min-h-11 items-center gap-2.5 rounded-xl p-2 hover:bg-muted/65 transition-colors text-xs font-semibold leading-tight font-dm-sans"
    >
      <div
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${accentTile(tool.category)}`}
      >
        <HugeiconsIcon icon={tool.icon} className="size-3.5" aria-hidden />
      </div>
      <span className="min-w-0">{tool.title}</span>
    </Link>
  );
}

export function SiteHeader() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  // A Link to the page you're already on is a no-op, so on the homepage the
  // logo would look broken. Scroll back to the top instead, and honour
  // reduced motion.
  const handleBrandClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    setIsMobileMenuOpen(false);
    if (pathname !== '/') return;
    // Leave modified clicks (new tab/window) to the browser.
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
    event.preventDefault();
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
      <div className="container relative flex h-16 items-center justify-between">
        {/* Brand Logo - visible everywhere */}
        <Link href="/" onClick={handleBrandClick} className="flex items-center space-x-2 group shrink-0 [@media(pointer:coarse)]:min-h-11">
          <BrandMark small className="h-8 w-8 text-primary transition-[scale] group-hover:scale-110" />
          <span className="font-bold text-lg font-manrope transition-colors group-hover:text-primary">
            Konbato
          </span>
        </Link>

        {/* Desktop Navigation Menu - hidden on mobile. Absolutely centered so
            the panel, centered under it, stays on screen at every md+ width. */}
        <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 items-center gap-6">
          <NavigationMenu viewportClassName="left-1/2 -translate-x-1/2">
            <NavigationMenuList className="gap-2">
              <NavigationMenuItem>
                <NavigationMenuTrigger className="font-dm-sans font-medium text-foreground/70 hover:text-foreground bg-transparent hover:bg-transparent focus:bg-transparent data-[state=open]:bg-transparent">
                  Tools
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <div className="w-[min(760px,calc(100vw-2rem))]">
                    <div className="grid grid-cols-3 gap-x-4 p-5">
                      {COLUMNS.map((column, index) => (
                        <div key={index} className="flex flex-col gap-5">
                          {column.map((group) => (
                            <section key={group.id} aria-labelledby={`menu-${group.id}`} className="flex flex-col gap-1.5">
                              <GroupHeading group={group} id={`menu-${group.id}`} className="px-2" />
                              <ul className="flex flex-col gap-0.5">
                                {group.tools.map((tool) => (
                                  <li key={tool.slug}>
                                    <ToolMenuLink tool={tool} />
                                  </li>
                                ))}
                              </ul>
                            </section>
                          ))}
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center justify-between gap-4 border-t border-border/40 bg-muted/40 px-5 py-3 text-xs font-dm-sans">
                      <span className="text-muted-foreground">
                        {TOOLS.length} tools, all running in your browser
                      </span>
                      <NavigationMenuLink asChild>
                        <Link href="/tools" className="rounded-md font-semibold text-primary hover:underline underline-offset-4">
                          Browse all tools &rarr;
                        </Link>
                      </NavigationMenuLink>
                    </div>
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        {/* Global Controls & Hamburger Toggle */}
        <div className="flex items-center gap-1.5 sm:gap-3">
          <ThemeToggle />
          <Button
            variant="outline"
            size="sm"
            className="hidden sm:inline-flex font-dm-sans font-medium border-border/60 hover:border-primary/30 hover:bg-primary/5 transition-[background-color,border-color]"
            asChild
          >
            <Link href="/tools">View All Tools</Link>
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="md:hidden hover:bg-primary/10 transition-colors [@media(pointer:coarse)]:size-11"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-expanded={isMobileMenuOpen}
            aria-controls="mobile-nav"
            aria-label="Toggle navigation menu"
          >
            <HugeiconsIcon
              icon={isMobileMenuOpen ? Cancel01Icon : MenuIcon}
              className="h-5 w-5"
              aria-hidden
            />
          </Button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            id="mobile-nav"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="border-b border-border/40 bg-background/95 backdrop-blur-xl md:hidden overflow-hidden shadow-lg"
          >
            <nav
              aria-label="Mobile navigation"
              className="container py-5 flex flex-col gap-5 max-h-[calc(100dvh-4rem)] overflow-y-auto overscroll-contain"
            >
              {TOOL_GROUPS.map((group) => (
                <section key={group.id} aria-labelledby={`mobile-${group.id}`} className="flex flex-col gap-1.5">
                  <GroupHeading group={group} id={`mobile-${group.id}`} className="px-2" />
                  {/* Two columns halve the drawer's height; titles wrap rather than truncate. */}
                  <div className="grid grid-cols-2 gap-1">
                    {group.tools.map((tool) => (
                      <MobileToolLink
                        key={tool.slug}
                        tool={tool}
                        onNavigate={() => setIsMobileMenuOpen(false)}
                      />
                    ))}
                  </div>
                </section>
              ))}

              <div className="pt-4 border-t border-border/40">
                <Button
                  className="w-full font-dm-sans font-medium"
                  asChild
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Link href="/tools">View All Tools</Link>
                </Button>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
