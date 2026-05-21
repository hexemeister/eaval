import { PublicacaoForm } from '@/components/PublicacaoForm';
import { type SelectOption } from '@/components/CreatableSelect';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';

interface CreateProps {
    tiposPublicacao: SelectOption[];
    formasApresentacao: SelectOption[];
    locaisPublicacao: SelectOption[];
    qualisCapes: SelectOption[];
    tiposInstituicao: SelectOption[];
    turmas: SelectOption[];
    eixosTematicos: SelectOption[];
    segmentosEducacionais: SelectOption[];
    areas: SelectOption[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: dashboard().url },
    { title: 'Publicações', href: '/admin/publicacoes' },
    { title: 'Nova publicação', href: '/admin/publicacoes/create' },
];

export default function Create(props: CreateProps) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Nova publicação" />

            <div className="flex flex-col gap-6">
                <h1 className="text-2xl font-bold">Nova publicação</h1>

                <PublicacaoForm
                    {...props}
                    submitRoute="/admin/publicacoes"
                    submitMethod="post"
                    cancelHref="/admin/publicacoes"
                />
            </div>
        </AppLayout>
    );
}
