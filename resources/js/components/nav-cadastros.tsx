import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
} from '@/components/ui/sidebar';
import { Link, usePage } from '@inertiajs/react';
import { ChevronRight, Database } from 'lucide-react';

const cadastroItems = [
    { title: 'Áreas do Conhecimento', href: '/admin/cadastros/areas' },
    { title: 'Eixos Temáticos', href: '/admin/cadastros/eixos-tematicos' },
    { title: 'Formas de Apresentação', href: '/admin/cadastros/formas-apresentacao' },
    { title: 'Geografia', href: '/admin/cadastros/geografia' },
    { title: 'Qualis CAPES', href: '/admin/cadastros/qualis-capes' },
    { title: 'Segmentos Educacionais', href: '/admin/cadastros/segmentos-educacionais' },
    { title: 'Tipos de Instituição', href: '/admin/cadastros/tipos-instituicao' },
    { title: 'Tipos de Publicação', href: '/admin/cadastros/tipos-publicacao' },
    { title: 'Turmas', href: '/admin/cadastros/turmas' },
];

export function NavCadastros() {
    const { url } = usePage();
    const isActive = url.startsWith('/admin/cadastros');

    return (
        <SidebarGroup className="px-2 py-0">
            <SidebarGroupLabel>Cadastros</SidebarGroupLabel>
            <SidebarMenu>
                <Collapsible defaultOpen={isActive} className="group/collapsible">
                    <SidebarMenuItem>
                        <CollapsibleTrigger asChild>
                            <SidebarMenuButton tooltip="Cadastros" isActive={isActive}>
                                <Database />
                                <span>Cadastros</span>
                                <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                            </SidebarMenuButton>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                            <SidebarMenuSub>
                                {cadastroItems.map((item) => (
                                    <SidebarMenuSubItem key={item.href}>
                                        <SidebarMenuSubButton asChild isActive={url.startsWith(item.href)}>
                                            <Link href={item.href} prefetch>
                                                {item.title}
                                            </Link>
                                        </SidebarMenuSubButton>
                                    </SidebarMenuSubItem>
                                ))}
                            </SidebarMenuSub>
                        </CollapsibleContent>
                    </SidebarMenuItem>
                </Collapsible>
            </SidebarMenu>
        </SidebarGroup>
    );
}
