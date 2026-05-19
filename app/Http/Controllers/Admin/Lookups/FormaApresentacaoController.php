<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin\Lookups;

use App\Http\Controllers\Admin\LookupController;
use App\Models\FormaApresentacao;

class FormaApresentacaoController extends LookupController
{
    /** @return class-string<FormaApresentacao> */
    protected function model(): string
    {
        return FormaApresentacao::class;
    }

    protected function label(): string
    {
        return 'Forma de Apresentação';
    }

    protected function labelPlural(): string
    {
        return 'Formas de Apresentação';
    }

    protected function bindingMode(): string
    {
        return 'string_match';
    }

    protected function datasetWarning(): bool
    {
        return true;
    }
}
