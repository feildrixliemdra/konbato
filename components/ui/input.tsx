import * as React from "react"

import { cn } from "@/lib/utils"

/*
 * Local override, keep on re-add: the trailing `[@media(pointer:coarse)]
 * :min-h-11` is not shadcn's and will be lost if this file is regenerated.
 * A text field on a touch screen needs the 44px floor like any other control,
 * and every consumer of this primitive should get it without repeating it.
 */
function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "dark:bg-input/30 border-input focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:aria-invalid:border-destructive/50 disabled:bg-input/50 dark:disabled:bg-input/80 h-8 rounded-lg border bg-transparent px-2.5 py-1 text-base transition-colors file:h-6 file:text-sm file:font-medium focus-visible:ring-3 aria-invalid:ring-3 md:text-sm file:text-foreground placeholder:text-muted-foreground w-full min-w-0 outline-none file:inline-flex file:border-0 file:bg-transparent disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 [@media(pointer:coarse)]:min-h-11",
        className
      )}
      {...props}
    />
  )
}

export { Input }
