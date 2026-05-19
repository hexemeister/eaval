<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin\Lookups;

use App\Http\Controllers\Admin\LookupController;
use App\Models\TipoInstituicao;

class TipoInstituicaoController extends LookupController
{
    /** @return class-string<TipoInstituicao> */
    protected function model(): string
    {
        return TipoInstituicao::class;
    }

    protected function label(): string
    {
        return 'Tipo de Instituição';
    }

    protected function labelPlural(): string
    {
        return 'Tipos de Instituição';
    }

    protected function publicacaoFkColumn(): ?string
    {
        return 'tipo_instituicao_id';
    }

    protected function datasetWarning(): bool
    {
        return true;
    }
}
