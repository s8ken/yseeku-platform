'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Home, Box, Shield, GitBranch, TestTube2, Menu, Fingerprint, Sparkles } from 'lucide-react';

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  {
    title: 'Home',
    href: '/demo',
    icon: Home,
  },
  {
    title: 'SYMBI Framework',
    href: '/demo/symbi',
    icon: Box,
  },
  {
    title: 'Trust Protocol',
    href: '/demo/trust',
    icon: Shield,
  },
  {
    title: 'Orchestration Dashboard',
    href: '/demo/orchestration',
    icon: GitBranch,
  },
  {
    title: 'Experiment Lab',
    href: '/demo/lab',
    icon: TestTube2,
  },
  {
    title: '/proof Widget',
    href: '/proof',
    icon: Fingerprint,
  },
];

export default function DemoLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  const SidebarContent = () => (
    <div className="flex h-full flex-col">
      <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
        <Link href="/demo" className="flex items-center gap-2 font-semibold">
          <Shield className="h-6 w-6" />
          <span>SONATE Demo</span>
        </Link>
      </div>
      <div className="flex-1">
        <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isCurrent = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                  isCurrent && "bg-muted text-primary"
                )}
                onClick={() => setSidebarOpen(false)}
              >
                <Icon className="h-4 w-4" />
                {item.title}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      <div className="hidden border-r bg-muted/40 md:block">
        <SidebarContent />
      </div>
      <div className="flex flex-col">
        {/* Demo Mode Indicator Banner */}
        <div className="bg-gradient-to-r from-cyan-600 via-purple-600 to-cyan-600 text-white px-4 py-2">
          <div className="flex items-center justify-between max-w-screen-2xl mx-auto">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-white/20 rounded-full px-3 py-1">
                <Sparkles className="h-4 w-4" />
                <span className="text-sm font-semibold">DEMO PREVIEW</span>
              </div>
              <span className="text-sm hidden sm:inline">Exploring SONATE framework capabilities</span>
            </div>
            <Link href="/dashboard?demo=true">
              <Button variant="ghost" size="sm" className="text-white hover:bg-white/20 h-7 px-3">
                Enter Full Demo Dashboard →
              </Button>
            </Link>
          </div>
        </div>

        <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="shrink-0 md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            {/* @ts-ignore */}
            <SheetContent side="left" className="flex flex-col">
              <SidebarContent />
            </SheetContent>
          </Sheet>
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
