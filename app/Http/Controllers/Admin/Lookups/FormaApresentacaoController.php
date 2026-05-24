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

    protected function publicacaoFkColumn(): ?string
    {
        return 'forma_apresentacao_id';
    }

    protected function datasetWarning(): bool
    {
        return true;
    }

    protected function description(): string
    {
        return 'Como a publicação foi apresentada (artigo, livro, capítulo, etc.).';
    }
}
