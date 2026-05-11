import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { dashboard } from '@/routes';
import { type NavItem } from '@/types';
import { Link } from '@inertiajs/react';
import { BookOpen, Folder, LayoutGrid, Search } from 'lucide-react';
import AppLogo from './app-logo';
import { publicacoes, searchLogs } from '@/routes/admin';

const mainNavItems: NavItem[] = [
  {
    title: 'Painel',
    href: dashboard(),
    icon: LayoutGrid,
  },
  {
    title: 'Publicações',
    href: publicacoes(),
    icon: BookOpen,
  },
  {
    title: 'Logs de Busca',
    href: searchLogs(),
    icon: Search,
  },
];

const footerNavItems: NavItem[] = [
  {
    title: 'Repositório',
    href: 'https://github.com/hexemeister/eaval',
    icon: Folder,
  },
];

export function AppSidebar() {
  return (
    <Sidebar collapsible="icon" variant="inset">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href={dashboard()} prefetch>
                <AppLogo />
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <NavMain items={mainNavItems} />
      </SidebarContent>

      <SidebarFooter>
        <NavFooter items={footerNavItems} className="mt-auto" />
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
