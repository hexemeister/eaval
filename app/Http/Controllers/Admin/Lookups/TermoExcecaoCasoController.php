<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin\Lookups;

use App\Http\Controllers\Admin\LookupController;
use App\Models\TermoExcecaoCaso;

class TermoExcecaoCasoController extends LookupController
{
    protected function model(): string
    {
        return TermoExcecaoCaso::class;
    }

    protected function label(): string
    {
        return 'Termo de Exceção';
    }

    protected function labelPlural(): string
    {
        return 'Termos de Exceção';
    }

    protected function nameColumn(): string
    {
        return 'termo';
    }

    protected function fields(): array
    {
        return [
            ['name' => 'termo', 'label' => 'Termo', 'type' => 'text', 'required' => true],
        ];
    }
}
