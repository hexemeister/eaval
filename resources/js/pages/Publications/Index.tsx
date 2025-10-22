// resources/js/pages/Publications/Index.tsx

import { Head } from '@inertiajs/react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { dashboard } from '@/routes';




interface Publication {
    id: number;
    title: string;
    authors: string;
    year: string;
}

interface PublicationsProps {
    publications: Publication[];
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard().url,
    },
];

export default function PublicationsIndex({ publications }: PublicationsProps) {
    return (
        <>
                <AppLayout breadcrumbs={breadcrumbs}>

            <Head title="Publicações Científicas" />

            <div className="container mx-auto py-6">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold">Publicações Científicas</h1>
                    <Button>Incluir Publicação Científica</Button>
                </div>

                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>ID</TableHead>
                            <TableHead>Título</TableHead>
                            <TableHead>Autores</TableHead>
                            <TableHead>Ano</TableHead>
                            <TableHead>Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {publications.map((pub) => (
                            <TableRow key={pub.id}>
                                <TableCell>{pub.id}</TableCell>
                                <TableCell>{pub.title}</TableCell>
                                <TableCell>{pub.authors}</TableCell>
                                <TableCell>{pub.year}</TableCell>
                                <TableCell>
                                    <Button variant="ghost" size="sm">Abrir</Button>
                                    <Button variant="ghost" size="sm">Editar</Button>
                                    <Button variant="ghost" size="sm">Excluir</Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
            </AppLayout>
        </>
    );
}