'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Providers } from '../providers';
import {
  Home,
  Settings,
  Shield,
  FileText,
  AlertTriangle,
  Users,
  Menu,
  Building2,
  ChevronDown
} from 'lucide-react';

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: string[];
}

const navItems: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: Home,
    roles: ['admin', 'user', 'viewer']
  },
  {
    title: 'Multi-Tenant',
    href: '/dashboard/tenants',
    icon: Building2,
    roles: ['admin']
  },
  {
    title: 'Risk Management',
    href: '/dashboard/risk',
    icon: Shield,
    roles: ['admin', 'user']
  },
  {
    title: 'Audit Trails',
    href: '/dashboard/audit',
    icon: FileText,
    roles: ['admin', 'user']
  },
  {
    title: 'Alerts',
    href: '/dashboard/alerts',
    icon: AlertTriangle,
    roles: ['admin', 'user']
  },
  {
    title: 'Tenant Settings',
    href: '/dashboard/settings',
    icon: Settings,
    roles: ['admin']
  }
];

// Mock user data - in real app this would come from auth context
const mockUser = {
  id: '1',
  name: 'John Admin',
  email: 'admin@yseeku.com',
  role: 'admin',
  tenantId: 'default'
};

const tenants = [
  { id: 'default', name: 'Default Tenant' },
  { id: 'corp1', name: 'Corporation One' },
  { id: 'startup1', name: 'Startup Inc' }
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  const filteredNavItems = navItems.filter(item =>
    item.roles.includes(mockUser.role)
  );

  const SidebarContent = () => (
    <div className="flex h-full flex-col">
      <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
        <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
          <Shield className="h-6 w-6" />
          <span className="">SONATE</span>
        </Link>
      </div>
      <div className="flex-1">
        <nav className="grid items-start px-2 text-sm font-medium lg:px-4" role="navigation" aria-label="Main navigation">
          {filteredNavItems.map((item) => {
            const Icon = item.icon;
            const isCurrent = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  isCurrent && "bg-muted text-primary"
                )}
                onClick={() => setSidebarOpen(false)}
                aria-current={isCurrent ? "page" : undefined}
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
    <Providers>
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      {/* Skip Link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 focus:z-50 focus:bg-primary focus:text-primary-foreground focus:px-4 focus:py-2 focus:ring-2 focus:ring-ring"
      >
        Skip to main content
      </a>

      {/* Desktop Sidebar */}
      <div className="hidden border-r bg-muted/40 md:block">
        <SidebarContent />
      </div>

      {/* Main Content */}
      <div className="flex flex-col">
        {/* Header */}
        <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6" role="banner">
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="shrink-0 md:hidden" aria-label="Open navigation menu">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex flex-col" aria-label="Navigation menu">
              <SidebarContent />
            </SheetContent>
          </Sheet>

          {/* Tenant Selector */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="ml-auto" aria-label="Select tenant">
                <Building2 className="mr-2 h-4 w-4" />
                {tenants.find(t => t.id === 'default')?.name}
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {tenants.map((tenant) => (
                <DropdownMenuItem key={tenant.id}>
                  {tenant.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="icon" className="rounded-full" aria-label="Open user menu">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="/avatar.jpg" alt={mockUser.name} />
                  <AvatarFallback>{mockUser.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <span className="sr-only">Toggle user menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>{mockUser.name}</DropdownMenuItem>
              <DropdownMenuItem>{mockUser.email}</DropdownMenuItem>
              <DropdownMenuItem>Logout</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        {/* Page Content */}
        <main id="main-content" className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6" role="main">
          {children}
        </main>

        {/* Live Region for Announcements */}
        <div aria-live="polite" aria-atomic="true" className="sr-only" id="announcements"></div>
      </div>
    </div>
    </Providers>
  );
}
