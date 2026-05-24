<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin\Lookups;

use App\Http\Controllers\Admin\LookupController;
use App\Models\TipoPublicacao;

class TipoPublicacaoController extends LookupController
{
    /** @return class-string<TipoPublicacao> */
    protected function model(): string
    {
        return TipoPublicacao::class;
    }

    protected function label(): string
    {
        return 'Tipo de Publicação';
    }

    protected function labelPlural(): string
    {
        return 'Tipos de Publicação';
    }

    protected function publicacaoFkColumn(): ?string
    {
        return 'tipo_publicacao_id';
    }

    protected function datasetWarning(): bool
    {
        return true;
    }

    protected function description(): string
    {
        return 'Categoria geral da publicação. Usada nos filtros e estatísticas.';
    }
}
