'use client';

import { useState, useCallback, useRef } from 'react';
import { useTranslations } from 'next-intl';
import {
  Globe,
  Palette,
  Gauge,
  Bell,
  Search,
  Accessibility,
  Keyboard,
  Smartphone,
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { GeneralSettings } from './general-settings';
import { AppearanceSettings } from './appearance-settings';
import { PerformanceSettings } from './performance-settings';
import { NotificationSettings } from './notification-settings';
import { SearchBehaviorSettings } from './search-settings';
import { AccessibilitySettings } from './accessibility-settings';
import { KeyboardSettings } from './keyboard-settings';
import { MobileSettings } from './mobile-settings';

const PREF_SECTIONS = [
  { id: 'general', icon: Globe, labelKey: 'settingsNew.tabs.general' },
  { id: 'appearance', icon: Palette, labelKey: 'settingsNew.appearance.title' },
  { id: 'performance', icon: Gauge, labelKey: 'settingsNew.performance.title' },
  { id: 'notifications', icon: Bell, labelKey: 'settingsNew.notifications.title' },
  { id: 'search', icon: Search, labelKey: 'settingsNew.search.title' },
  { id: 'accessibility', icon: Accessibility, labelKey: 'settingsNew.accessibility.title' },
  { id: 'keyboard', icon: Keyboard, labelKey: 'settingsNew.keyboard.title' },
  { id: 'mobile', icon: Smartphone, labelKey: 'settingsNew.mobile.title' },
] as const;

export function PreferencesTabContent() {
  const t = useTranslations();
  const [activeSection, setActiveSection] = useState<string>('general');
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const scrollToSection = useCallback((sectionId: string) => {
    setActiveSection(sectionId);
    const el = sectionRefs.current[sectionId];
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  const setSectionRef = useCallback((id: string) => (el: HTMLDivElement | null) => {
    sectionRefs.current[id] = el;
  }, []);

  return (
    <div className="flex flex-col h-full">
      {/* Section quick-nav */}
      <div className="shrink-0 border-b px-2 py-1.5 overflow-x-auto">
        <div className="flex gap-1 min-w-max">
          {PREF_SECTIONS.map((section) => {
            const Icon = section.icon;
            return (
              <button
                key={section.id}
                onClick={() => scrollToSection(section.id)}
                className={cn(
                  "inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium transition-colors whitespace-nowrap",
                  activeSection === section.id
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                <Icon className="h-3 w-3" />
                {t(section.labelKey)}
              </button>
            );
          })}
        </div>
      </div>

      {/* Scrollable content */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          <div ref={setSectionRef('general')}>
            <GeneralSettings />
          </div>
          <Separator />
          <div ref={setSectionRef('appearance')}>
            <AppearanceSettings />
          </div>
          <Separator />
          <div ref={setSectionRef('performance')}>
            <PerformanceSettings />
          </div>
          <Separator />
          <div ref={setSectionRef('notifications')}>
            <NotificationSettings />
          </div>
          <Separator />
          <div ref={setSectionRef('search')}>
            <SearchBehaviorSettings />
          </div>
          <Separator />
          <div ref={setSectionRef('accessibility')}>
            <AccessibilitySettings />
          </div>
          <Separator />
          <div ref={setSectionRef('keyboard')}>
            <KeyboardSettings />
          </div>
          <Separator />
          <div ref={setSectionRef('mobile')}>
            <MobileSettings />
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
