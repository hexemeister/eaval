<?php

namespace App\Services\ArticleSearch;

use Illuminate\Database\Eloquent\Builder;

/**
 * Nó AND.
 */
class AndNode extends QueryNode
{
    public function __construct(
        private QueryNode $left,
        private QueryNode $right
    ) {}
    
    public function applyTo(Builder $query, bool $isFirst = true): void
    {
        // AND: ambas condições devem ser verdadeiras
        // Aplicamos left e right sequencialmente no mesmo nível
        $this->left->applyTo($query, $isFirst);
        $this->right->applyTo($query, false);
    }
    
    public function toString(): string
    {
        return "({$this->left->toString()} AND {$this->right->toString()})";
    }
}