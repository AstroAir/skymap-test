'use client';

import Image from "next/image";
import { useTranslations } from 'next-intl';
import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/ui/language-switcher";
import { TooltipProvider } from "@/components/ui/tooltip";

export default function Home() {
  const t = useTranslations();
  return (
    <TooltipProvider>
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black relative">
        {/* Language Switcher */}
        <div className="absolute top-4 right-4">
          <LanguageSwitcher variant="outline" />
        </div>
        
        <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">
          <Image
            className="dark:invert"
            src="/next.svg"
            alt="Next.js logo"
            width={100}
            height={20}
            priority
          />
          <div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left">
            <h1 className="max-w-xs text-3xl font-semibold leading-10 tracking-tight text-black dark:text-zinc-50">
              {t('home.title')}
            </h1>
            <p className="max-w-md text-lg leading-8 text-zinc-600 dark:text-zinc-400">
              {t.rich('home.description', {
                templates: (chunks) => (
                  <a
                    href="https://vercel.com/templates?framework=next.js"
                    className="font-medium text-zinc-950 dark:text-zinc-50"
                  >
                    {chunks}
                  </a>
                ),
                learning: (chunks) => (
                  <a
                    href="https://nextjs.org/learn"
                    className="font-medium text-zinc-950 dark:text-zinc-50"
                  >
                    {chunks}
                  </a>
                ),
              })}
            </p>
          </div>
          <div className="flex flex-col gap-4 text-base font-medium sm:flex-row">
            <Button asChild className="h-12 w-full rounded-full md:w-[158px]">
              <a
                href="https://vercel.com/new?utm_source=create-next-app"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Image
                  className="dark:invert"
                  src="/vercel.svg"
                  alt="Vercel logomark"
                  width={16}
                  height={16}
                />
                {t('home.deployNow')}
              </a>
            </Button>
            <Button asChild variant="outline" className="h-12 w-full rounded-full md:w-[158px]">
              <a
                href="https://nextjs.org/docs"
                target="_blank"
                rel="noopener noreferrer"
              >
                {t('home.documentation')}
              </a>
            </Button>
          </div>
        </main>
      </div>
    </TooltipProvider>
  );
}
