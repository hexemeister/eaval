import { PublicacaoForm, type PublicacaoFormData } from '@/components/PublicacaoForm';
import { type SelectOption } from '@/components/CreatableSelect';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';

interface EditProps {
    publicacao: { id: number };
    initialData: Partial<PublicacaoFormData>;
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

export default function Edit({ publicacao, initialData, ...lookups }: EditProps) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: dashboard().url },
        { title: 'Publicações', href: '/admin/publicacoes' },
        { title: `Editar #${publicacao.id}`, href: `/admin/publicacoes/${publicacao.id}/edit` },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Editar publicação #${publicacao.id}`} />

            <div className="flex flex-col gap-6">
                <h1 className="text-2xl font-bold">Editar publicação #{publicacao.id}</h1>

                <PublicacaoForm
                    {...lookups}
                    initialData={initialData}
                    submitRoute={`/admin/publicacoes/${publicacao.id}`}
                    submitMethod="put"
                    cancelHref="/admin/publicacoes"
                />
            </div>
        </AppLayout>
    );
}
