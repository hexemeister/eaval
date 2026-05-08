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
    
    public function applyTo(Builder $query, bool $isFirst = true, array $options = []): void
    {
        // AND: ambas condições devem ser verdadeiras
        // Aplicamos left e right sequencialmente no mesmo nível
        $this->left->applyTo($query, $isFirst, $options);
        $this->right->applyTo($query, false, $options);
    }
    
    public function toString(): string
    {
        return "({$this->left->toString()} AND {$this->right->toString()})";
    }
}