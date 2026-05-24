<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin\Lookups;

use App\Http\Controllers\Admin\LookupController;
use App\Models\Turma;

class TurmaController extends LookupController
{
    /** @return class-string<Turma> */
    protected function model(): string
    {
        return Turma::class;
    }

    protected function label(): string
    {
        return 'Turma';
    }

    protected function publicacaoFkColumn(): ?string
    {
        return 'turma_id';
    }

    protected function datasetWarning(): bool
    {
        return true;
    }

    protected function description(): string
    {
        return 'Agrupamentos internos de publicações. Usado para organização e filtragem interna.';
    }
}
