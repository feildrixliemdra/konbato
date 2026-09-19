'use client'

import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@/components/ui/navigation-menu';
import {
  CommandIcon,
  MenuIcon,
  Cancel01Icon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { motion, AnimatePresence } from 'framer-motion';
import { IMAGE_TOOLS, PDF_TOOLS, ACCENTS, accentTile, type Tool } from '@/lib/tools';

function ToolMenuLink({ tool }: { tool: Tool }) {
  return (
    <NavigationMenuLink asChild>
      <Link
        href={tool.href}
        className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/65 transition-all text-xs font-semibold font-dm-sans group/link"
      >
        <HugeiconsIcon
          icon={tool.icon}
          className={ACCENTS[tool.accent].icon}
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
      className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-muted/65 transition-all text-xs font-semibold font-dm-sans"
    >
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${accentTile(tool.accent)}`}
      >
        <HugeiconsIcon icon={tool.icon} className="size-4" aria-hidden />
      </div>
      {tool.title}
    </Link>
  );
}

export function SiteHeader() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        {/* Brand Logo - visible everywhere */}
        <Link href="/" className="flex items-center space-x-2 group shrink-0">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary transition-all group-hover:bg-primary group-hover:text-primary-foreground group-hover:scale-110">
            <HugeiconsIcon icon={CommandIcon} className="h-5 w-5" aria-hidden />
          </div>
          <span className="font-bold text-lg font-manrope transition-colors group-hover:text-primary">
            Konbato
          </span>
        </Link>

        {/* Desktop Navigation Menu - hidden on mobile */}
        <div className="hidden md:flex items-center gap-6">
          <NavigationMenu>
            <NavigationMenuList className="gap-2">
              <NavigationMenuItem>
                <NavigationMenuTrigger className="font-dm-sans font-medium text-foreground/70 hover:text-foreground bg-transparent hover:bg-transparent focus:bg-transparent data-[state=open]:bg-transparent">
                  Tools
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <div className="grid gap-6 p-6 w-[560px] md:grid-cols-2">
                    <div className="flex flex-col gap-3">
                      <h4 className="text-[10px] font-bold tracking-wider text-muted-foreground/60 uppercase font-manrope">
                        Image Tools
                      </h4>
                      <div className="flex flex-col gap-1">
                        {IMAGE_TOOLS.map((tool) => (
                          <ToolMenuLink key={tool.slug} tool={tool} />
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-col gap-3">
                      <h4 className="text-[10px] font-bold tracking-wider text-muted-foreground/60 uppercase font-manrope">
                        PDF Tools
                      </h4>
                      <div className="flex flex-col gap-1">
                        {PDF_TOOLS.map((tool) => (
                          <ToolMenuLink key={tool.slug} tool={tool} />
                        ))}
                      </div>
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
            className="hidden sm:inline-flex font-dm-sans font-medium border-border/60 hover:border-primary/30 hover:bg-primary/5 transition-all"
            asChild
          >
            <Link href="/tools">View All Tools</Link>
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="md:hidden hover:bg-primary/10 transition-colors"
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
              className="container py-6 flex flex-col gap-6 max-h-[calc(100vh-4rem)] overflow-y-auto"
            >
              <div className="flex flex-col gap-2">
                <h4 className="text-[10px] font-bold tracking-wider text-muted-foreground/60 uppercase font-manrope px-2">
                  Image Tools
                </h4>
                <div className="grid grid-cols-1 gap-1">
                  {IMAGE_TOOLS.map((tool) => (
                    <MobileToolLink
                      key={tool.slug}
                      tool={tool}
                      onNavigate={() => setIsMobileMenuOpen(false)}
                    />
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <h4 className="text-[10px] font-bold tracking-wider text-muted-foreground/60 uppercase font-manrope px-2">
                  PDF Tools
                </h4>
                <div className="grid grid-cols-1 gap-1">
                  {PDF_TOOLS.map((tool) => (
                    <MobileToolLink
                      key={tool.slug}
                      tool={tool}
                      onNavigate={() => setIsMobileMenuOpen(false)}
                    />
                  ))}
                </div>
              </div>

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
