<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin\Lookups;

use App\Http\Controllers\Admin\LookupController;
use App\Models\QualisCape;

class QualisCapeController extends LookupController
{
    /** @return class-string<QualisCape> */
    protected function model(): string
    {
        return QualisCape::class;
    }

    protected function label(): string
    {
        return 'Qualis CAPES';
    }

    protected function labelPlural(): string
    {
        return 'Qualis CAPES';
    }

    protected function nameColumn(): string
    {
        return 'classificacao';
    }

    protected function publicacaoFkColumn(): ?string
    {
        return 'qualis_capes_id';
    }

    protected function fields(): array
    {
        return [
            ['name' => 'classificacao', 'label' => 'Classificação', 'type' => 'text', 'required' => true],
        ];
    }
}
