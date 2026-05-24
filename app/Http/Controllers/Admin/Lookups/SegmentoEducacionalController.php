<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin\Lookups;

use App\Http\Controllers\Admin\LookupController;
use App\Models\SegmentoEducacional;

/**
 * CRUD de Segmentos Educacionais.
 *
 * Vinculado a publicações via FK direta: publicacao.segmento_educacional_id.
 * Faz parte do dataset acadêmico distribuído — exibe banner de aviso.
 */
class SegmentoEducacionalController extends LookupController
{
    /** @return class-string<SegmentoEducacional> */
    protected function model(): string
    {
        return SegmentoEducacional::class;
    }

    protected function label(): string
    {
        return 'Segmento Educacional';
    }

    protected function labelPlural(): string
    {
        return 'Segmentos Educacionais';
    }

    protected function publicacaoFkColumn(): ?string
    {
        return 'segmento_educacional_id';
    }

    protected function datasetWarning(): bool
    {
        return true;
    }

    protected function description(): string
    {
        return 'Nível de ensino ao qual a publicação se aplica (ex: Educação Básica, Superior).';
    }
}
