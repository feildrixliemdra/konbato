'use client';

import type { ReactNode } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import { Tick01Icon } from '@hugeicons/core-free-icons';

interface SuccessCardProps {
  title: string;
  description: string;
  children?: ReactNode;
  actions: ReactNode;
}

export function SuccessCard({
  title,
  description,
  children,
  actions,
}: SuccessCardProps) {
  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6">
      <div className="flex flex-col items-center gap-6 rounded-2xl border border-border/60 bg-background/50 p-8 shadow-xl backdrop-blur-sm">
        <div className="inline-flex size-14 items-center justify-center rounded-2xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-500">
          <HugeiconsIcon icon={Tick01Icon} className="size-7" aria-hidden />
        </div>

        <div className="flex flex-col gap-2 text-center">
          <h2 className="text-2xl font-bold font-manrope">{title}</h2>
          <p className="text-sm text-muted-foreground font-dm-sans">{description}</p>
        </div>

        {children}

        <div className="mt-2 flex w-full flex-col gap-3 sm:flex-row">{actions}</div>
      </div>
    </div>
  );
}
