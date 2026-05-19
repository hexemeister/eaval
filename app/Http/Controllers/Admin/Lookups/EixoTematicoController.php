<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin\Lookups;

use App\Http\Controllers\Admin\LookupController;
use App\Models\EixoTematico;

class EixoTematicoController extends LookupController
{
    /** @return class-string<EixoTematico> */
    protected function model(): string
    {
        return EixoTematico::class;
    }

    protected function label(): string
    {
        return 'Eixo Temático';
    }

    protected function labelPlural(): string
    {
        return 'Eixos Temáticos';
    }

    protected function publicacaoFkColumn(): ?string
    {
        return 'eixo_tematico_id';
    }

    protected function datasetWarning(): bool
    {
        return true;
    }
}
