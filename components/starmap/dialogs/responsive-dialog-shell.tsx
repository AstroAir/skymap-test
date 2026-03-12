'use client';

import * as React from 'react';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import { cn } from '@/lib/utils';
import {
  STARMAP_DIALOG_DESKTOP_CONTENT_BASE_CLASS,
  STARMAP_DIALOG_MOBILE_CONTENT_CLASS_BY_TIER,
  STARMAP_DIALOG_MOBILE_MEDIA_QUERY,
  STARMAP_DIALOG_MOBILE_STICKY_FOOTER_CLASS,
  STARMAP_DIALOG_SCROLL_BODY_MOBILE_CLASS,
  type StarmapDialogTier,
} from './dialog-layout';

function useMobileDialogViewport() {
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return;
    }

    const query = window.matchMedia(STARMAP_DIALOG_MOBILE_MEDIA_QUERY);
    const update = () => setIsMobile(query.matches);
    update();

    if (typeof query.addEventListener === 'function') {
      query.addEventListener('change', update);
      return () => query.removeEventListener('change', update);
    }

    query.addListener(update);
    return () => query.removeListener(update);
  }, []);

  return isMobile;
}

interface ResponsiveDialogContextValue {
  isMobile: boolean;
  tier: StarmapDialogTier;
}

const ResponsiveDialogContext = React.createContext<ResponsiveDialogContextValue>({
  isMobile: false,
  tier: 'standard-form',
});

function useResponsiveDialogContext() {
  return React.useContext(ResponsiveDialogContext);
}

interface ResponsiveDialogProps {
  children: React.ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  modal?: boolean;
  tier?: StarmapDialogTier;
}

export function ResponsiveDialog({
  children,
  open,
  defaultOpen,
  onOpenChange,
  modal,
  tier = 'standard-form',
}: ResponsiveDialogProps) {
  const isMobileViewport = useMobileDialogViewport();
  const useMobileContainer = isMobileViewport && tier !== 'custom';
  const handleOpenChange = React.useCallback(
    (nextOpen: boolean) => {
      onOpenChange?.(nextOpen);
    },
    [onOpenChange]
  );
  const contextValue = React.useMemo(
    () => ({ isMobile: useMobileContainer, tier }),
    [tier, useMobileContainer]
  );

  if (useMobileContainer) {
    return (
      <ResponsiveDialogContext.Provider value={contextValue}>
        <Drawer open={open} defaultOpen={defaultOpen} onOpenChange={handleOpenChange} modal={modal}>
          {children}
        </Drawer>
      </ResponsiveDialogContext.Provider>
    );
  }

  return (
    <ResponsiveDialogContext.Provider value={contextValue}>
      <Dialog open={open} defaultOpen={defaultOpen} onOpenChange={handleOpenChange} modal={modal}>
        {children}
      </Dialog>
    </ResponsiveDialogContext.Provider>
  );
}

export function ResponsiveDialogTrigger(props: React.ComponentProps<typeof DialogTrigger>) {
  const { isMobile } = useResponsiveDialogContext();
  if (isMobile) {
    return <DrawerTrigger {...props} />;
  }
  return <DialogTrigger {...props} />;
}

interface ResponsiveDialogContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  showCloseButton?: boolean;
  desktopClassName?: string;
  mobileClassName?: string;
}

export function ResponsiveDialogContent({
  className,
  children,
  showCloseButton = true,
  desktopClassName,
  mobileClassName,
  ...props
}: ResponsiveDialogContentProps) {
  const { isMobile, tier } = useResponsiveDialogContext();
  if (isMobile) {
    const mobileTier =
      tier === 'custom' ? STARMAP_DIALOG_MOBILE_CONTENT_CLASS_BY_TIER['standard-form'] : STARMAP_DIALOG_MOBILE_CONTENT_CLASS_BY_TIER[tier];
    return (
      <DrawerContent
        className={cn(mobileTier, STARMAP_DIALOG_SCROLL_BODY_MOBILE_CLASS, className, mobileClassName)}
        {...props}
      >
        {children}
      </DrawerContent>
    );
  }
  return (
    <DialogContent
      showCloseButton={showCloseButton}
      className={cn(STARMAP_DIALOG_DESKTOP_CONTENT_BASE_CLASS, className, desktopClassName)}
      {...props}
    >
      {children}
    </DialogContent>
  );
}

export function ResponsiveDialogHeader(props: React.ComponentProps<'div'>) {
  const { isMobile } = useResponsiveDialogContext();
  if (isMobile) {
    return <DrawerHeader {...props} />;
  }
  return <DialogHeader {...props} />;
}

export function ResponsiveDialogTitle(props: React.ComponentProps<typeof DialogTitle>) {
  const { isMobile } = useResponsiveDialogContext();
  if (isMobile) {
    return <DrawerTitle {...props} />;
  }
  return <DialogTitle {...props} />;
}

export function ResponsiveDialogDescription(
  props: React.ComponentProps<typeof DialogDescription>
) {
  const { isMobile } = useResponsiveDialogContext();
  if (isMobile) {
    return <DrawerDescription {...props} />;
  }
  return <DialogDescription {...props} />;
}

interface ResponsiveDialogFooterProps extends React.ComponentProps<'div'> {
  stickyOnMobile?: boolean;
}

export function ResponsiveDialogFooter({
  className,
  stickyOnMobile = false,
  ...props
}: ResponsiveDialogFooterProps) {
  const { isMobile } = useResponsiveDialogContext();
  if (isMobile) {
    return (
      <DrawerFooter
        className={cn(stickyOnMobile && STARMAP_DIALOG_MOBILE_STICKY_FOOTER_CLASS, className)}
        {...props}
      />
    );
  }
  return <DialogFooter className={className} {...props} />;
}

export function ResponsiveDialogClose(props: React.ComponentProps<typeof DialogClose>) {
  const { isMobile } = useResponsiveDialogContext();
  if (isMobile) {
    return <DrawerClose {...props} />;
  }
  return <DialogClose {...props} />;
}
