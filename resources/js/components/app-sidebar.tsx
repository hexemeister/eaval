import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { dashboard } from '@/routes';
import { type NavItem } from '@/types';
import { Link } from '@inertiajs/react';
import { BookOpen, Building2, ExternalLink, Folder, GraduationCap, Layers, LayoutGrid, Map, Presentation, Search, Tag, Users } from 'lucide-react';
import AppLogo from './app-logo';
import { publicacoes } from '@/routes/admin';

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
    href: '/admin/search-logs',
    icon: Search,
  },
  {
    title: 'Áreas do Conhecimento',
    href: '/admin/cadastros/areas',
    icon: Tag,
  },
  {
    title: 'Eixos Temáticos',
    href: '/admin/cadastros/eixos-tematicos',
    icon: Layers,
  },
  {
    title: 'Segmentos Educacionais',
    href: '/admin/cadastros/segmentos-educacionais',
    icon: GraduationCap,
  },
  {
    title: 'Turmas',
    href: '/admin/cadastros/turmas',
    icon: Users,
  },
  {
    title: 'Tipos de Instituição',
    href: '/admin/cadastros/tipos-instituicao',
    icon: Building2,
  },
  {
    title: 'Formas de Apresentação',
    href: '/admin/cadastros/formas-apresentacao',
    icon: Presentation,
  },
  {
    title: 'Geografia',
    href: '/admin/cadastros/geografia',
    icon: Map,
  },
];

const footerNavItems: NavItem[] = [
  {
    title: 'Área pública',
    href: '/',
    icon: ExternalLink,
  },
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
