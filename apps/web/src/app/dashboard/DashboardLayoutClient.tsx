'use client';

import { useState, useEffect, useMemo, useRef, type KeyboardEvent } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
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
  FlaskConical,
  Beaker,
  Sparkles,
  ClipboardList,
  Server,
  Bell,
  Search,
  LogOut,
  Book,
  ExternalLink,
  HelpCircle,
  ShieldCheck,
  Bot,
  Play,
  Brain,
  MoreHorizontal,
  
  MessageSquare,
  Compass,
  GraduationCap,
  Eye,
  Terminal
} from 'lucide-react';
import { useTutorialStore } from '@/store/useTutorialStore';
import { dashboardTutorialSteps } from '@/components/tutorial/steps';
import { TutorialTour } from '@/components/tutorial/TutorialTour';
import { ThemeToggle } from '@/components/theme-toggle';
import { ConnectionStatus } from '@/components/connection-status';
import { DemoModeBanner } from '@/components/demo-mode-banner';
import { DemoInitializer } from '@/components/demo-initializer';
import { OnboardingModal } from '@/components/onboarding/OnboardingModal';
import { useDemo } from '@/hooks/use-demo';
import { AppRole, getCurrentUserFromToken } from '@/lib/current-user';

type ModuleType = 'detect' | 'lab' | 'orchestrate';

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: string[];
  module: ModuleType;
}

interface DashboardUser {
  id: string;
  name: string;
  email: string;
  role: AppRole;
  tenantId: string;
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
      { title: 'Tactical Command', href: '/dashboard/tactical-command', icon: Compass, roles: ['admin', 'user', 'viewer'], module: 'detect' },
      { title: 'Live Monitor', href: '/dashboard/monitoring/live', icon: Activity, roles: ['admin', 'user'], module: 'detect' },
      { title: 'Trust Session', href: '/dashboard/chat', icon: Sparkles, roles: ['admin', 'user'], module: 'detect' },
      { title: 'Agents', href: '/dashboard/agents', icon: Bot, roles: ['admin', 'user'], module: 'detect' },
      { title: 'Interactions', href: '/dashboard/interactions', icon: MessageSquare, roles: ['admin', 'user'], module: 'detect' },
      { title: 'Trust Receipts', href: '/dashboard/receipts', icon: Fingerprint, roles: ['admin', 'user'], module: 'detect' },
      { title: 'Verify Receipt', href: '/dashboard/verify', icon: ShieldCheck, roles: ['admin', 'user', 'viewer'], module: 'detect' },
      { title: 'Risk & Compliance', href: '/dashboard/risk', icon: Waves, roles: ['admin', 'user'], module: 'detect' },
      { title: 'Overseer', href: '/dashboard/overseer', icon: Eye, roles: ['admin', 'user', 'viewer'], module: 'detect' },
      { title: 'Alerts', href: '/dashboard/alerts', icon: AlertTriangle, roles: ['admin', 'user'], module: 'detect' },
      { title: 'Trust Analytics', href: '/dashboard/trust', icon: Shield, roles: ['admin', 'user'], module: 'detect' },
      { title: 'System Monitor', href: '/dashboard/monitoring', icon: Server, roles: ['admin'], module: 'detect' },
      { title: 'Emergence Monitor', href: '/dashboard/monitoring/emergence', icon: Waves, roles: ['admin', 'user'], module: 'detect' },
    ]
  },
  {
    id: 'lab',
    title: 'Lab',
    subtitle: 'Research Sandbox',
    badge: 'SANDBOX',
    items: [
      { title: 'Resonance Lab', href: '/dashboard/lab/resonance', icon: Waves, roles: ['admin', 'user'], module: 'lab' },
      { title: 'Experiments', href: '/dashboard/lab/experiments', icon: FlaskConical, roles: ['admin', 'user'], module: 'lab' },
      { title: 'Model Compare', href: '/dashboard/compare', icon: Beaker, roles: ['admin', 'user'], module: 'lab' },
      { title: 'Safety Scanner', href: '/dashboard/safety', icon: Shield, roles: ['admin', 'user'], module: 'lab' },
      { title: 'Fleet Emergence', href: '/dashboard/lab/bedau', icon: Brain, roles: ['admin', 'user'], module: 'lab' },
    ]
  },
  {
    id: 'orchestrate',
    title: 'Orchestrate',
    subtitle: 'Enterprise Admin',
    badge: 'ADMIN',
    items: [
      { title: 'System Brain', href: '/dashboard/brain', icon: Brain, roles: ['admin'], module: 'orchestrate' },
      { title: 'Compliance Reports', href: '/dashboard/reports', icon: ClipboardList, roles: ['admin'], module: 'orchestrate' },
      { title: 'Audit Trails', href: '/dashboard/audit', icon: FileText, roles: ['admin', 'user'], module: 'orchestrate' },
      { title: 'Learn', href: '/dashboard/learn', icon: GraduationCap, roles: ['admin', 'user', 'viewer'], module: 'orchestrate' },
      { title: 'Docs', href: '/dashboard/docs', icon: Book, roles: ['admin', 'user', 'viewer'], module: 'orchestrate' },
      { title: 'SONATE Constitution', href: '/dashboard/learn/foundations/what-is-sonate', icon: Shield, roles: ['admin', 'user', 'viewer'], module: 'orchestrate' },
      { title: 'Protocol Access', href: '/dashboard/api', icon: Terminal, roles: ['admin', 'user'], module: 'orchestrate' },
      { title: 'Dev Tools', href: '/dashboard/tools', icon: Settings, roles: ['admin', 'user'], module: 'orchestrate' },
      { title: 'Tenants', href: '/dashboard/tenants', icon: Building2, roles: ['admin'], module: 'orchestrate' },
      { title: 'Settings', href: '/dashboard/settings', icon: Settings, roles: ['admin'], module: 'orchestrate' },
    ]
  }
];

// Demo user for showcase mode
const demoUser: DashboardUser = {
  id: 'demo-user',
  name: 'Demo User',
  email: 'demo@sonate.io',
  role: 'admin',
  tenantId: 'demo-tenant'
};

// Default user for production mode (will be replaced by real auth)
const defaultUser: DashboardUser = {
  id: '1',
  name: 'Platform User',
  email: 'user@sonate.io',
  role: 'viewer',
  tenantId: 'default'
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedModules, setExpandedModules] = useState<ModuleType[]>(['detect', 'lab', 'orchestrate']);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [activeSearchIndex, setActiveSearchIndex] = useState(-1);
  const [liveUser, setLiveUser] = useState<DashboardUser>(defaultUser);
  const searchRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  const startTutorial = useTutorialStore(state => state.startTutorial);
  const { isDemo, toggleDemo, enableDemo } = useDemo();

  // All flattened nav items for search
  const allNavItems = useMemo(() => moduleSections.flatMap(s => s.items), []);

  // Close search on click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
        setActiveSearchIndex(-1);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    const tokenUser = getCurrentUserFromToken();
    if (!tokenUser) {
      setLiveUser(defaultUser);
      return;
    }

    setLiveUser({
      id: tokenUser.id || defaultUser.id,
      name: tokenUser.username || tokenUser.email || defaultUser.name,
      email: tokenUser.email || defaultUser.email,
      role: tokenUser.role,
      tenantId: tokenUser.tenant || defaultUser.tenantId,
    });
  }, [pathname]);

  // Fetch alerts for notifications
  const { data: alertsData } = useQuery({
    queryKey: ['alerts-notifications'],
    queryFn: () => api.getAlerts().catch(() => ({ success: false, data: { alerts: [], summary: { critical: 0, error: 0, warning: 0, total: 0 } }, tenant: '' })),
    staleTime: 60_000,
    refetchInterval: 60_000,
  });
  const notifications = alertsData?.data?.alerts ?? [];

  // Determine user based on mode
  const currentUser = isDemo ? demoUser : liveUser;
  const roleNavItems = useMemo(
    () => allNavItems.filter((item) => item.roles.includes(currentUser.role)),
    [allNavItems, currentUser.role],
  );
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return roleNavItems.filter(item => item.title.toLowerCase().includes(q));
  }, [searchQuery, roleNavItems]);

  useEffect(() => {
    if (currentUser.role === 'admin') {
      setExpandedModules(['detect', 'lab', 'orchestrate']);
      return;
    }
    if (currentUser.role === 'user') {
      setExpandedModules(['detect', 'lab']);
      return;
    }
    setExpandedModules(['detect']);
  }, [currentUser.role]);

  useEffect(() => {
    if (searchResults.length === 0) {
      setActiveSearchIndex(-1);
      return;
    }

    if (activeSearchIndex >= searchResults.length) {
      setActiveSearchIndex(0);
    }
  }, [activeSearchIndex, searchResults]);

  // Initialize demo mode on first load if URL has ?demo=true
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('demo') === 'true') {
        enableDemo();
      }
    }
  }, [enableDemo]);

  const toggleModule = (moduleId: ModuleType) => {
    setExpandedModules(prev =>
      prev.includes(moduleId)
        ? prev.filter(id => id !== moduleId)
        : [...prev, moduleId]
    );
  };

  const getModuleColorClass = (module: ModuleType): string => {
    switch (module) {
      case 'detect': return 'nav-item-detect';
      case 'lab': return 'nav-item-lab';
      case 'orchestrate': return 'nav-item-orchestrate';
      default: return 'nav-item-detect';
    }
  };

  const getBadgeClass = (module: ModuleType): string => {
    switch (module) {
      case 'detect': return 'badge-detect';
      case 'lab': return 'badge-lab';
      case 'orchestrate': return 'badge-orchestrate';
      default: return 'badge-detect';
    }
  };

  const getHeaderClass = (module: ModuleType): string => {
    switch (module) {
      case 'detect': return 'module-header-detect';
      case 'lab': return 'module-header-lab';
      case 'orchestrate': return 'module-header-orchestrate';
      default: return 'module-header-detect';
    }
  };

  const roleStartRoute = (() => {
    if (currentUser.role === 'admin') {
      return { href: '/dashboard/overseer', label: 'System Brain', icon: Brain };
    }
    if (currentUser.role === 'user') {
      return { href: '/dashboard/chat', label: 'Start Session', icon: Sparkles };
    }
    return { href: '/dashboard/verify', label: 'Verify Receipt', icon: ShieldCheck };
  })();

  const toggleOrganizationMode = (): void => {
    toggleDemo();
  };

  const openSearchResult = (href: string): void => {
    router.push(href);
    setSearchQuery('');
    setSearchOpen(false);
    setActiveSearchIndex(-1);
  };

  const handleSearchKeyDown = (event: KeyboardEvent<HTMLInputElement>): void => {
    if (!searchOpen || searchResults.length === 0) {
      if (event.key === 'Escape') {
        setSearchOpen(false);
        setActiveSearchIndex(-1);
      }
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveSearchIndex((prev) => (prev + 1) % searchResults.length);
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveSearchIndex((prev) => (prev <= 0 ? searchResults.length - 1 : prev - 1));
      return;
    }

    if (event.key === 'Enter') {
      event.preventDefault();
      const selectedIndex = activeSearchIndex >= 0 ? activeSearchIndex : 0;
      openSearchResult(searchResults[selectedIndex].href);
      return;
    }

    if (event.key === 'Escape') {
      setSearchOpen(false);
      setActiveSearchIndex(-1);
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
            const filteredItems = section.items.filter(item => item.roles.includes(currentUser.role));

            if (filteredItems.length === 0) return null;

            return (
              <div key={section.id} className="module-section">
                <button
                  type="button"
                  onClick={() => toggleModule(section.id)}
                  className={cn(
                    "module-header w-full min-h-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    getHeaderClass(section.id),
                  )}
                  aria-expanded={isExpanded}
                  aria-controls={`module-${section.id}`}
                >
                  <ChevronRight className={cn("h-3 w-3 transition-transform", isExpanded && "rotate-90")} />
                  <span className="flex-1 text-left">{section.title}</span>
                  <span className={cn("module-badge", getBadgeClass(section.id))}>
                    {section.badge}
                  </span>
                </button>

                {isExpanded && (
                  <div id={`module-${section.id}`} className="mt-1 ml-3 space-y-0.5">
                    {filteredItems.map((item) => {
                      const Icon = item.icon;
                      const isActive = pathname === item.href ||
                        (item.href !== '/dashboard' && pathname.startsWith(item.href));

                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          id={`nav-${item.title.toLowerCase().replace(/\s+/g, '-')}`}
                          className={cn(
                            "flex min-h-11 items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-all",
                            "text-muted-foreground hover:text-foreground",
                            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
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

      <div className="border-t p-4 space-y-2">
        <Button
          variant="outline"
          className="w-full justify-start gap-3 border-emerald-500/20 hover:bg-emerald-50 text-emerald-700"
          size="sm"
          onClick={() => startTutorial(dashboardTutorialSteps)}
        >
          <HelpCircle className="h-4 w-4" />
          <span>Platform Tutorial</span>
        </Button>

        <div className="flex items-center gap-3 px-2 pt-2">
          <Avatar className="h-8 w-8">
            <AvatarImage
              src={currentUser.name ? `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.name)}&background=0D8ABC&color=fff` : undefined}
              alt={currentUser.name}
            />
            <AvatarFallback className="bg-primary/10 text-primary text-xs">
              {currentUser.name.split(' ').map(n => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{currentUser.name}</p>
            <p className="text-xs text-muted-foreground truncate">{currentUser.role}</p>
          </div>
        </div>
      </div>
    </div>
  );

  const RoleStartIcon = roleStartRoute.icon;

  return (
    <Providers>
      <TutorialTour />
      <OnboardingModal />
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
          <header className="flex h-16 items-center gap-2 sm:gap-4 border-b bg-card px-3 sm:px-4 lg:px-6" role="banner">
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
              <div ref={searchRef} className="relative max-w-md flex-1 hidden sm:block">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="search"
                  placeholder="Search pages..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setSearchOpen(true);
                    setActiveSearchIndex(0);
                  }}
                  onFocus={() => {
                    setSearchOpen(true);
                    if (searchResults.length > 0 && activeSearchIndex < 0) {
                      setActiveSearchIndex(0);
                    }
                  }}
                  onKeyDown={handleSearchKeyDown}
                  role="combobox"
                  aria-label="Search dashboard pages"
                  aria-autocomplete="list"
                  aria-controls="dashboard-search-results"
                  aria-expanded={searchOpen && searchResults.length > 0}
                  aria-activedescendant={activeSearchIndex >= 0 ? `dashboard-search-option-${activeSearchIndex}` : undefined}
                  className="w-full rounded-lg border bg-background px-10 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
                {searchOpen && searchResults.length > 0 && (
                  <div
                    id="dashboard-search-results"
                    role="listbox"
                    className="absolute top-full left-0 right-0 mt-1 rounded-lg border bg-card shadow-lg z-50 max-h-64 overflow-y-auto"
                  >
                    {searchResults.map((item, index) => {
                      const Icon = item.icon;
                      return (
                        <button
                          type="button"
                          id={`dashboard-search-option-${index}`}
                          role="option"
                          aria-selected={activeSearchIndex === index}
                          key={item.href}
                          className={cn(
                            "flex items-center gap-3 w-full px-4 py-2.5 text-sm text-left",
                            "hover:bg-muted",
                            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                            activeSearchIndex === index && "bg-muted"
                          )}
                          onMouseEnter={() => setActiveSearchIndex(index)}
                          onClick={() => openSearchResult(item.href)}
                        >
                          <Icon className="h-4 w-4 text-muted-foreground" />
                          <span>{item.title}</span>
                          <span className="ml-auto text-xs text-muted-foreground capitalize">{item.module}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
                {searchOpen && searchQuery.trim() && searchResults.length === 0 && (
                  <div role="status" aria-live="polite" className="absolute top-full left-0 right-0 mt-1 rounded-lg border bg-card shadow-lg z-50 p-4 text-sm text-muted-foreground text-center">
                    No pages found
                  </div>
                )}
              </div>
            </div>

            <Link href={roleStartRoute.href}>
              <Button variant="outline" size="sm" className="gap-2" aria-label={roleStartRoute.label}>
                <RoleStartIcon className="h-4 w-4" />
                <span className="hidden sm:inline">{roleStartRoute.label}</span>
              </Button>
            </Link>

            <Link href="/dashboard/tactical-command">
              <Button variant="outline" size="sm" className="hidden sm:inline-flex gap-2" aria-label="Open Tactical Command">
                <Compass className="h-4 w-4" />
                <span className="hidden sm:inline">Tactical Command</span>
              </Button>
            </Link>

            {/* Demo Mode Toggle */}
            <Button
              variant={isDemo ? "default" : "outline"}
              size="sm"
              className={cn(
                "hidden sm:inline-flex gap-2",
                isDemo && "bg-amber-500 hover:bg-amber-600 text-white"
              )}
              aria-label={isDemo ? 'Switch to live mode' : 'Switch to demo mode'}
              onClick={toggleDemo}
            >
              <Play className="h-4 w-4" />
              <span className="hidden sm:inline">{isDemo ? 'Demo Mode' : 'Live Mode'}</span>
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="hidden sm:inline-flex gap-2" aria-label="Switch organization">
                  <Building2 className="h-4 w-4" />
                  <span className="hidden sm:inline">
                    {isDemo ? 'Demo Organization' : 'Live Organization'}
                  </span>
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 dark:bg-slate-900">
                <DropdownMenuItem
                  className={cn("cursor-pointer", isDemo && "bg-muted")}
                  onClick={() => !isDemo && toggleOrganizationMode()}
                >
                  <Building2 className="mr-2 h-4 w-4" />
                  Demo Organization
                  {isDemo && <span className="ml-auto text-xs text-muted-foreground">Active</span>}
                </DropdownMenuItem>
                <DropdownMenuItem
                  className={cn("cursor-pointer", !isDemo && "bg-muted")}
                  onClick={() => isDemo && toggleOrganizationMode()}
                >
                  <Building2 className="mr-2 h-4 w-4" />
                  Live Organization
                  {!isDemo && <span className="ml-auto text-xs text-muted-foreground">Active</span>}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <a
              href="https://yseeku.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Open yseeku.com in a new tab"
              className="hidden sm:block"
            >
              <Button variant="outline" size="sm" className="gap-2">
                <ExternalLink className="h-4 w-4" />
                <span className="hidden sm:inline">yseeku.com</span>
              </Button>
            </a>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="sm:hidden" aria-label="Open quick actions">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 sm:hidden dark:bg-slate-900">
                <Link href="/dashboard/tactical-command">
                  <DropdownMenuItem className="cursor-pointer">
                    <Compass className="mr-2 h-4 w-4" />
                    Tactical Command
                  </DropdownMenuItem>
                </Link>
                <DropdownMenuItem className="cursor-pointer" onClick={toggleDemo}>
                  <Play className="mr-2 h-4 w-4" />
                  {isDemo ? 'Switch to Live Mode' : 'Switch to Demo Mode'}
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer" onClick={toggleOrganizationMode}>
                  <Building2 className="mr-2 h-4 w-4" />
                  {isDemo ? 'Use Live Organization' : 'Use Demo Organization'}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <a href="https://yseeku.com" target="_blank" rel="noopener noreferrer">
                  <DropdownMenuItem className="cursor-pointer">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Visit yseeku.com
                  </DropdownMenuItem>
                </a>
              </DropdownMenuContent>
            </DropdownMenu>

            <div className="hidden md:block">
              <ConnectionStatus />
            </div>
            <ThemeToggle />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative" aria-label="Open notifications">
                  <Bell className="h-5 w-5" />
                  {notifications.length > 0 && (
                    <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground flex items-center justify-center">
                      {Math.min(notifications.length, 9)}
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80 dark:bg-slate-900">
                <div className="px-4 py-2 font-bold border-b">Notifications</div>
                <div className="max-h-[300px] overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-sm text-muted-foreground">
                      <Bell className="h-8 w-8 mx-auto mb-2 opacity-30" />
                      No new notifications
                    </div>
                  ) : (
                    notifications.slice(0, 5).map((alert: any, i: number) => (
                      <div key={alert.id ?? i} className="p-4 border-b last:border-0 hover:bg-muted/50 cursor-pointer">
                        <p className={cn("text-sm font-medium", alert.severity === 'critical' && 'text-red-500', alert.severity === 'warning' && 'text-amber-600')}>
                          {alert.title ?? alert.message ?? 'Alert'}
                        </p>
                        {alert.description && <p className="text-xs text-muted-foreground mt-0.5">{alert.description}</p>}
                        {alert.createdAt && <p className="text-[10px] text-muted-foreground mt-1">{new Date(alert.createdAt).toLocaleString()}</p>}
                      </div>
                    ))
                  )}
                </div>
                <DropdownMenuSeparator />
                <Link href="/dashboard/alerts">
                  <DropdownMenuItem className="justify-center text-sm text-primary cursor-pointer">
                    View all alerts
                  </DropdownMenuItem>
                </Link>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full" aria-label="Open account menu">
                  <Avatar className="h-8 w-8">
                    <AvatarImage
                      src={currentUser.name ? `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.name)}&background=0D8ABC&color=fff` : undefined}
                      alt={currentUser.name}
                    />
                    <AvatarFallback className="bg-primary/10 text-primary text-xs">
                      {currentUser.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 dark:bg-slate-900">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium">{currentUser.name}</p>
                  <p className="text-xs text-muted-foreground">{currentUser.email}</p>
                </div>
                <DropdownMenuSeparator />
                <Link href="/dashboard/api">
                  <DropdownMenuItem className="cursor-pointer">
                    <Terminal className="mr-2 h-4 w-4" />
                    Developer Hub
                  </DropdownMenuItem>
                </Link>
                <Link href="/dashboard/settings">
                  <DropdownMenuItem className="cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </DropdownMenuItem>
                </Link>
                <DropdownMenuSeparator />
                <Link href="/login">
                  <DropdownMenuItem className="cursor-pointer text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign out
                  </DropdownMenuItem>
                </Link>
              </DropdownMenuContent>
            </DropdownMenu>
          </header>

          {/* Demo Mode Banner */}
          <DemoModeBanner />
          <DemoInitializer />

          <main id="main-content" className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 bg-muted/30 page-transition" role="main">
            {children}
          </main>

          <div aria-live="polite" aria-atomic="true" className="sr-only" id="announcements"></div>
        </div>
      </div>
    </Providers>
  );
}
