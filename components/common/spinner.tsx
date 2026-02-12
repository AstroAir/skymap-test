"use client";

import { useTranslations } from 'next-intl';
import { Loader2Icon } from "lucide-react"

import { cn } from "@/lib/utils"

interface SpinnerProps extends React.ComponentProps<"svg"> {
  /** Accessible label for screen readers. Defaults to "Loading" */
  label?: string;
}

function Spinner({ className, label, ...props }: SpinnerProps) {
  const t = useTranslations('common');
  const resolvedLabel = label ?? t('loading');

  return (
    <Loader2Icon
      role="status"
      aria-label={resolvedLabel}
      className={cn("size-4 animate-spin", className)}
      {...props}
    />
  )
}

export { Spinner }
