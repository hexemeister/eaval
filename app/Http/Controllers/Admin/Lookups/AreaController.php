<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin\Lookups;

use App\Http\Controllers\Admin\LookupController;
use App\Models\Area;

class AreaController extends LookupController
{
    /** @return class-string<Area> */
    protected function model(): string
    {
        return Area::class;
    }

    protected function label(): string
    {
        return 'Área do Conhecimento';
    }

    protected function labelPlural(): string
    {
        return 'Áreas do Conhecimento';
    }

    protected function bindingMode(): string
    {
        return 'pivot';
    }

    protected function pivotTable(): ?string
    {
        return 'area_publicacao';
    }

    protected function datasetWarning(): bool
    {
        return true;
    }

    protected function description(): string
    {
        return 'Classifica publicações por grande área. Usada nos filtros de busca e nas estatísticas por área.';
    }
}
