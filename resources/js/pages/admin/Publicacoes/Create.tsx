import { PublicacaoForm, type EstadoOption, type LocalPublicacaoOption } from '@/components/PublicacaoForm';
import { PageHelp } from '@/components/page-help';
import { type SelectOption } from '@/components/CreatableSelect';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';

interface CreateProps {
    tiposPublicacao: SelectOption[];
    formasApresentacao: SelectOption[];
    locaisPublicacao: LocalPublicacaoOption[];
    estados: EstadoOption[];
    qualisCapes: SelectOption[];
    tiposInstituicao: SelectOption[];
    turmas: SelectOption[];
    eixosTematicos: SelectOption[];
    segmentosEducacionais: SelectOption[];
    areas: SelectOption[];
    defaults: {
        tipo_publicacao_id: number | null;
        forma_apresentacao_id: number | null;
        area_ids: number[];
    };
    pageDescription?: string;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: dashboard().url },
    { title: 'Publicações', href: '/admin/publicacoes' },
    { title: 'Nova publicação', href: '/admin/publicacoes/create' },
];

export default function Create({ defaults, pageDescription = '', ...props }: CreateProps) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Nova publicação" />

            <div className="flex flex-col gap-6">
                <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-bold">Nova publicação</h1>
                    <PageHelp text={pageDescription} />
                </div>

                <PublicacaoForm
                    {...props}
                    initialData={defaults}
                    submitRoute="/admin/publicacoes"
                    submitMethod="post"
                    cancelHref="/admin/publicacoes"
                />
            </div>
        </AppLayout>
    );
}
