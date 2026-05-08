<?php

namespace App\Services\ArticleSearch;

use Illuminate\Database\Eloquent\Builder;

/**
 * Nó abstrato da árvore sintática.
 */
abstract class QueryNode
{
    /**
     * Converte o nó em cláusulas Eloquent.
     */
    abstract public function applyTo(Builder $query, bool $isFirst = true, array $options = []): void;
    
    /**
     * Retorna representação em string para debug.
     */
    abstract public function toString(): string;
}