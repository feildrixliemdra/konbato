'use client'

import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
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
  Image01Icon,
  ArrowShrink01Icon,
  ColorsIcon,
  Layers01Icon,
  SplitIcon,
  RotateClockwiseIcon,
  ImageCropIcon,
  Shield01Icon,
  ArrangeIcon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { motion, AnimatePresence } from 'framer-motion';

export function SiteHeader() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        {/* Brand Logo - visible everywhere */}
        <Link href="/" className="flex items-center space-x-2 group shrink-0">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary transition-all group-hover:bg-primary group-hover:text-primary-foreground group-hover:scale-110">
            <HugeiconsIcon icon={CommandIcon} className="h-5 w-5" />
          </div>
          <span className="font-bold text-lg font-manrope transition-colors group-hover:text-primary animate-in fade-in duration-200">
            Konbato
          </span>
        </Link>

        {/* Desktop Navigation Menu - hidden on mobile */}
        <div className="hidden md:flex items-center gap-6">
          <NavigationMenu>
            <NavigationMenuList className="gap-2">
              {/* Tools Hover Dropdown Menu */}
              <NavigationMenuItem>
                <NavigationMenuTrigger className="font-dm-sans font-medium text-foreground/70 hover:text-foreground bg-transparent hover:bg-transparent focus:bg-transparent data-[state=open]:bg-transparent">
                  Tools
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <div className="grid gap-6 p-6 w-[520px] md:grid-cols-2">
                    {/* Image Tools */}
                    <div className="flex flex-col gap-3">
                      <h4 className="text-[10px] font-bold tracking-wider text-muted-foreground/60 uppercase font-manrope">
                        Image Tools
                      </h4>
                      <div className="flex flex-col gap-1">
                        <NavigationMenuLink asChild>
                          <Link
                            href="/tools/image-convert"
                            className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/65 transition-all text-xs font-semibold font-dm-sans group/link"
                          >
                            <HugeiconsIcon icon={Image01Icon} className="text-blue-500 group-hover/link:scale-105" />
                            Image Converter
                          </Link>
                        </NavigationMenuLink>
                        <NavigationMenuLink asChild>
                          <Link
                            href="/tools/image-compress"
                            className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/65 transition-all text-xs font-semibold font-dm-sans group/link"
                          >
                            <HugeiconsIcon icon={ArrowShrink01Icon} className="text-emerald-500 group-hover/link:scale-105" />
                            Image Compress
                          </Link>
                        </NavigationMenuLink>
                        <NavigationMenuLink asChild>
                          <Link
                            href="/tools/image-resize-crop"
                            className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/65 transition-all text-xs font-semibold font-dm-sans group/link"
                          >
                            <HugeiconsIcon icon={ImageCropIcon} className="text-cyan-500 group-hover/link:scale-105" />
                            Resize & Crop
                          </Link>
                        </NavigationMenuLink>
                        <NavigationMenuLink asChild>
                          <Link
                            href="/tools/image-metadata-remove"
                            className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/65 transition-all text-xs font-semibold font-dm-sans group/link"
                          >
                            <HugeiconsIcon icon={Shield01Icon} className="text-teal-500 group-hover/link:scale-105" />
                            Remove Metadata
                          </Link>
                        </NavigationMenuLink>
                        <NavigationMenuLink asChild>
                          <Link
                            href="/tools/image-remove-bg"
                            className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/65 transition-all text-xs font-semibold font-dm-sans group/link"
                          >
                            <HugeiconsIcon icon={ColorsIcon} className="text-indigo-500 group-hover/link:scale-105" />
                            Remove BG
                          </Link>
                        </NavigationMenuLink>
                      </div>
                    </div>

                    {/* PDF Tools */}
                    <div className="flex flex-col gap-3">
                      <h4 className="text-[10px] font-bold tracking-wider text-muted-foreground/60 uppercase font-manrope">
                        PDF Tools
                      </h4>
                      <div className="flex flex-col gap-1">
                        <NavigationMenuLink asChild>
                          <Link
                            href="/tools/pdf-merge"
                            className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/65 transition-all text-xs font-semibold font-dm-sans group/link"
                          >
                            <HugeiconsIcon icon={Layers01Icon} className="text-red-500 group-hover/link:scale-105" />
                            Merge PDF
                          </Link>
                        </NavigationMenuLink>
                        <NavigationMenuLink asChild>
                          <Link
                            href="/tools/pdf-split"
                            className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/65 transition-all text-xs font-semibold font-dm-sans group/link"
                          >
                            <HugeiconsIcon icon={SplitIcon} className="text-orange-500 group-hover/link:scale-105" />
                            Split PDF
                          </Link>
                        </NavigationMenuLink>
                        <NavigationMenuLink asChild>
                          <Link
                            href="/tools/pdf-compress"
                            className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/65 transition-all text-xs font-semibold font-dm-sans group/link"
                          >
                            <HugeiconsIcon icon={ArrowShrink01Icon} className="text-amber-500 group-hover/link:scale-105" />
                            Compress PDF
                          </Link>
                        </NavigationMenuLink>
                        <NavigationMenuLink asChild>
                          <Link
                            href="/tools/pdf-rotate"
                            className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/65 transition-all text-xs font-semibold font-dm-sans group/link"
                          >
                            <HugeiconsIcon icon={RotateClockwiseIcon} className="text-rose-500 group-hover/link:scale-105" />
                            Rotate PDF
                          </Link>
                        </NavigationMenuLink>
                        <NavigationMenuLink asChild>
                          <Link
                            href="/tools/pdf-reorder"
                            className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/65 transition-all text-xs font-semibold font-dm-sans group/link"
                          >
                            <HugeiconsIcon icon={ArrangeIcon} className="text-red-500 group-hover/link:scale-105" />
                            Reorder PDF
                          </Link>
                        </NavigationMenuLink>
                        <NavigationMenuLink asChild>
                          <Link
                            href="/tools/pdf-metadata-remove"
                            className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/65 transition-all text-xs font-semibold font-dm-sans group/link"
                          >
                            <HugeiconsIcon icon={Shield01Icon} className="text-slate-500 group-hover/link:scale-105" />
                            Remove Metadata
                          </Link>
                        </NavigationMenuLink>
                      </div>
                    </div>
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>

              {/* Image Converter Direct Link */}
              <NavigationMenuItem>
                <NavigationMenuLink asChild>
                  <Link
                    href="/tools/image-convert"
                    className="font-dm-sans font-medium text-foreground/70 hover:text-foreground px-3 py-1.5 text-sm transition-colors hover:bg-muted/50 rounded-lg block"
                  >
                    Image Converter
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>

              {/* Merge PDF Direct Link */}
              <NavigationMenuItem>
                <NavigationMenuLink asChild>
                  <Link
                    href="/tools/pdf-merge"
                    className="font-dm-sans font-medium text-foreground/70 hover:text-foreground px-3 py-1.5 text-sm transition-colors hover:bg-muted/50 rounded-lg block"
                  >
                    Merge PDF
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        {/* Global Controls & Hamburger Toggle */}
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            className="hidden sm:inline-flex font-dm-sans font-medium border-border/60 hover:border-primary/30 hover:bg-primary/5 transition-all animate-in fade-in duration-200"
            asChild
          >
            <Link href="/tools">View All Tools</Link>
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="md:hidden hover:bg-primary/10 transition-colors"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? (
              <HugeiconsIcon icon={Cancel01Icon} className="h-5 w-5" />
            ) : (
              <HugeiconsIcon icon={MenuIcon} className="h-5 w-5" />
            )}
            <span className="sr-only">Toggle Menu</span>
          </Button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="border-b border-border/40 bg-background/95 backdrop-blur-xl md:hidden overflow-hidden shadow-lg"
          >
            <div className="container py-6 flex flex-col gap-6 max-h-[calc(100vh-4rem)] overflow-y-auto">
              {/* Image Tools */}
              <div className="flex flex-col gap-2">
                <h4 className="text-[10px] font-bold tracking-wider text-muted-foreground/60 uppercase font-manrope px-2">
                  Image Tools
                </h4>
                <div className="grid grid-cols-1 gap-1">
                  <Link
                    href="/tools/image-convert"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-muted/65 transition-all text-xs font-semibold font-dm-sans"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500">
                      <HugeiconsIcon icon={Image01Icon} className="size-4" />
                    </div>
                    Image Converter
                  </Link>
                  <Link
                    href="/tools/image-compress"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-muted/65 transition-all text-xs font-semibold font-dm-sans"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500">
                      <HugeiconsIcon icon={ArrowShrink01Icon} className="size-4" />
                    </div>
                    Image Compress
                  </Link>
                  <Link
                    href="/tools/image-resize-crop"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-muted/65 transition-all text-xs font-semibold font-dm-sans"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-500">
                      <HugeiconsIcon icon={ImageCropIcon} className="size-4" />
                    </div>
                    Image Resize & Crop
                  </Link>
                  <Link
                    href="/tools/image-metadata-remove"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-muted/65 transition-all text-xs font-semibold font-dm-sans"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-teal-500/10 text-teal-500">
                      <HugeiconsIcon icon={Shield01Icon} className="size-4" />
                    </div>
                    Image Metadata Remover
                  </Link>
                  <Link
                    href="/tools/image-remove-bg"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-muted/65 transition-all text-xs font-semibold font-dm-sans"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-500">
                      <HugeiconsIcon icon={ColorsIcon} className="size-4" />
                    </div>
                    Remove Background
                  </Link>
                </div>
              </div>

              {/* PDF Tools */}
              <div className="flex flex-col gap-2">
                <h4 className="text-[10px] font-bold tracking-wider text-muted-foreground/60 uppercase font-manrope px-2">
                  PDF Tools
                </h4>
                <div className="grid grid-cols-1 gap-1">
                  <Link
                    href="/tools/pdf-merge"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-muted/65 transition-all text-xs font-semibold font-dm-sans"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-500/10 text-red-500">
                      <HugeiconsIcon icon={Layers01Icon} className="size-4" />
                    </div>
                    Merge PDF
                  </Link>
                  <Link
                    href="/tools/pdf-split"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-muted/65 transition-all text-xs font-semibold font-dm-sans"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-orange-500/10 text-orange-500">
                      <HugeiconsIcon icon={SplitIcon} className="size-4" />
                    </div>
                    Split PDF
                  </Link>
                  <Link
                    href="/tools/pdf-compress"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-muted/65 transition-all text-xs font-semibold font-dm-sans"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500">
                      <HugeiconsIcon icon={ArrowShrink01Icon} className="size-4" />
                    </div>
                    Compress PDF
                  </Link>
                  <Link
                    href="/tools/pdf-rotate"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-muted/65 transition-all text-xs font-semibold font-dm-sans"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-rose-500/10 text-rose-500">
                      <HugeiconsIcon icon={RotateClockwiseIcon} className="size-4" />
                    </div>
                    Rotate PDF
                  </Link>
                  <Link
                    href="/tools/pdf-reorder"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-muted/65 transition-all text-xs font-semibold font-dm-sans"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-500/10 text-red-500">
                      <HugeiconsIcon icon={ArrangeIcon} className="size-4" />
                    </div>
                    PDF Page Reorder
                  </Link>
                  <Link
                    href="/tools/pdf-metadata-remove"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-muted/65 transition-all text-xs font-semibold font-dm-sans"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-500/10 text-slate-500">
                      <HugeiconsIcon icon={Shield01Icon} className="size-4" />
                    </div>
                    PDF Metadata Remover
                  </Link>
                </div>
              </div>
              {/* View All Tools Button */}
              <div className="pt-4 border-t border-border/40">
                <Button
                  className="w-full font-dm-sans font-medium"
                  asChild
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Link href="/tools">View All Tools</Link>
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
