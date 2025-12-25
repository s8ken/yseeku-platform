'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Providers } from '../providers';
import {
  Home,
  Settings,
  Shield,
  FileText,
  AlertTriangle,
  Menu,
  Building2,
  ChevronDown,
  ChevronRight,
  Activity,
  Fingerprint,
  Waves,
  BarChart3,
  FlaskConical,
  Beaker,
  TestTube2,
  Sparkles,
  Users,
  KeyRound,
  ClipboardList,
  Server,
  Bell,
  Search,
  LogOut,
  Book
} from 'lucide-react';

type ModuleType = 'detect' | 'lab' | 'orchestrate';

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: string[];
  module: ModuleType;
}

interface ModuleSection {
  id: ModuleType;
  title: string;
  subtitle: string;
  badge: string;
  items: NavItem[];
}

const moduleSections: ModuleSection[] = [
  {
    id: 'detect',
    title: 'Detect',
    subtitle: 'Production Monitoring',
    badge: 'LIVE',
    items: [
      { title: 'Dashboard', href: '/dashboard', icon: Home, roles: ['admin', 'user', 'viewer'], module: 'detect' },
      { title: 'Agent Trust', href: '/dashboard/overview', icon: Shield, roles: ['admin', 'user', 'viewer'], module: 'detect' },
      { title: 'Risk Monitor', href: '/dashboard/risk', icon: Waves, roles: ['admin', 'user'], module: 'detect' },
      { title: 'Alerts', href: '/dashboard/alerts', icon: AlertTriangle, roles: ['admin', 'user'], module: 'detect' },
    ]
  },
  {
    id: 'lab',
    title: 'Lab',
    subtitle: 'Research Sandbox',
    badge: 'SANDBOX',
    items: [
      { title: 'Experiments', href: '/dashboard/lab/experiments', icon: FlaskConical, roles: ['admin', 'user'], module: 'lab' },
      { title: 'SYMBI Analysis', href: '/dashboard/lab/symbi', icon: Sparkles, roles: ['admin', 'user'], module: 'lab' },
      { title: 'Emergence Testing', href: '/dashboard/lab/emergence', icon: TestTube2, roles: ['admin', 'user'], module: 'lab' },
      { title: 'Bedau Index', href: '/dashboard/lab/bedau', icon: BarChart3, roles: ['admin', 'user'], module: 'lab' },
    ]
  },
  {
    id: 'orchestrate',
    title: 'Orchestrate',
    subtitle: 'Enterprise Admin',
    badge: 'ADMIN',
    items: [
      { title: 'Tenants', href: '/dashboard/tenants', icon: Building2, roles: ['admin'], module: 'orchestrate' },
      { title: 'Audit Trails', href: '/dashboard/audit', icon: FileText, roles: ['admin', 'user'], module: 'orchestrate' },
      { title: 'Trust Receipts', href: '/dashboard/receipts', icon: Fingerprint, roles: ['admin', 'user'], module: 'orchestrate' },
      { title: 'API Gateway', href: '/dashboard/api', icon: Server, roles: ['admin'], module: 'orchestrate' },
      { title: 'Documentation', href: '/dashboard/docs', icon: Book, roles: ['admin', 'user', 'viewer'], module: 'orchestrate' },
      { title: 'Settings', href: '/dashboard/settings', icon: Settings, roles: ['admin'], module: 'orchestrate' },
    ]
  }
];

const mockUser = {
  id: '1',
  name: 'John Admin',
  email: 'admin@sonate.io',
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
  const [expandedModules, setExpandedModules] = useState<ModuleType[]>(['detect', 'lab', 'orchestrate']);
  const pathname = usePathname();

  const toggleModule = (moduleId: ModuleType) => {
    setExpandedModules(prev => 
      prev.includes(moduleId) 
        ? prev.filter(id => id !== moduleId)
        : [...prev, moduleId]
    );
  };

  const getModuleColorClass = (module: ModuleType) => {
    switch (module) {
      case 'detect': return 'nav-item-detect';
      case 'lab': return 'nav-item-lab';
      case 'orchestrate': return 'nav-item-orchestrate';
    }
  };

  const getBadgeClass = (module: ModuleType) => {
    switch (module) {
      case 'detect': return 'badge-detect';
      case 'lab': return 'badge-lab';
      case 'orchestrate': return 'badge-orchestrate';
    }
  };

  const getHeaderClass = (module: ModuleType) => {
    switch (module) {
      case 'detect': return 'module-header-detect';
      case 'lab': return 'module-header-lab';
      case 'orchestrate': return 'module-header-orchestrate';
    }
  };

  const SidebarContent = () => (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center border-b px-4">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-blue-600">
            <Shield className="h-5 w-5 text-white" />
          </div>
          <div>
            <span className="font-bold text-lg tracking-tight">SONATE</span>
            <p className="text-[10px] text-muted-foreground -mt-1">AI Trust Platform</p>
          </div>
        </Link>
      </div>
      
      <div className="flex-1 overflow-y-auto py-4">
        <nav className="px-3 space-y-1" role="navigation" aria-label="Main navigation">
          {moduleSections.map((section) => {
            const isExpanded = expandedModules.includes(section.id);
            const filteredItems = section.items.filter(item => item.roles.includes(mockUser.role));
            
            if (filteredItems.length === 0) return null;
            
            return (
              <div key={section.id} className="module-section">
                <button
                  onClick={() => toggleModule(section.id)}
                  className={cn("module-header w-full", getHeaderClass(section.id))}
                  aria-expanded={isExpanded}
                >
                  <ChevronRight className={cn("h-3 w-3 transition-transform", isExpanded && "rotate-90")} />
                  <span className="flex-1 text-left">{section.title}</span>
                  <span className={cn("module-badge", getBadgeClass(section.id))}>
                    {section.badge}
                  </span>
                </button>
                
                {isExpanded && (
                  <div className="mt-1 ml-3 space-y-0.5">
                    {filteredItems.map((item) => {
                      const Icon = item.icon;
                      const isActive = pathname === item.href || 
                        (item.href !== '/dashboard' && pathname.startsWith(item.href));
                      
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={cn(
                            "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-all",
                            "text-muted-foreground hover:text-foreground",
                            getModuleColorClass(item.module),
                            isActive && "active"
                          )}
                          onClick={() => setSidebarOpen(false)}
                          aria-current={isActive ? "page" : undefined}
                        >
                          <Icon className="h-4 w-4" />
                          <span>{item.title}</span>
                          {item.module === 'detect' && item.href === '/dashboard' && (
                            <span className="live-indicator ml-auto">Live</span>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </div>
      
      <div className="border-t p-4">
        <div className="flex items-center gap-3 px-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src="/avatar.jpg" alt={mockUser.name} />
            <AvatarFallback className="bg-primary/10 text-primary text-xs">
              {mockUser.name.split(' ').map(n => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{mockUser.name}</p>
            <p className="text-xs text-muted-foreground truncate">{mockUser.role}</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <Providers>
      <div className="grid min-h-screen w-full md:grid-cols-[260px_1fr] lg:grid-cols-[280px_1fr]">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 focus:z-50 focus:bg-primary focus:text-primary-foreground focus:px-4 focus:py-2 focus:ring-2 focus:ring-ring"
        >
          Skip to main content
        </a>

        <div className="hidden border-r bg-card md:block">
          <SidebarContent />
        </div>

        <div className="flex flex-col">
          <header className="flex h-16 items-center gap-4 border-b bg-card px-4 lg:px-6" role="banner">
            <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="shrink-0 md:hidden" aria-label="Open navigation menu">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[280px] p-0" aria-label="Navigation menu">
                <SidebarContent />
              </SheetContent>
            </Sheet>

            <div className="flex-1 flex items-center gap-4">
              <div className="relative max-w-md flex-1 hidden sm:block">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="search"
                  placeholder="Search agents, receipts, experiments..."
                  className="w-full rounded-lg border bg-background px-10 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Building2 className="h-4 w-4" />
                  <span className="hidden sm:inline">
                    {tenants.find(t => t.id === mockUser.tenantId)?.name}
                  </span>
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {tenants.map((tenant) => (
                  <DropdownMenuItem key={tenant.id} className="cursor-pointer">
                    <Building2 className="mr-2 h-4 w-4" />
                    {tenant.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground flex items-center justify-center">
                3
              </span>
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="/avatar.jpg" alt={mockUser.name} />
                    <AvatarFallback className="bg-primary/10 text-primary text-xs">
                      {mockUser.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium">{mockUser.name}</p>
                  <p className="text-xs text-muted-foreground">{mockUser.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="cursor-pointer">
                  <KeyRound className="mr-2 h-4 w-4" />
                  API Keys
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer">
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="cursor-pointer text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </header>

          <main id="main-content" className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 bg-muted/30" role="main">
            {children}
          </main>

          <div aria-live="polite" aria-atomic="true" className="sr-only" id="announcements"></div>
        </div>
      </div>
    </Providers>
  );
}
