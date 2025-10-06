<?php

namespace App\Services\ArticleSearch;

use Illuminate\Database\Eloquent\Builder;

/**
 * Nó OR.
 */
class OrNode extends QueryNode
{
    public function __construct(
        private QueryNode $left,
        private QueryNode $right
    ) {}
    
    public function applyTo(Builder $query, bool $isFirst = true): void
    {
        // OR: pelo menos uma condição deve ser verdadeira
        // Precisamos criar subqueries separadas
        $query->where(function ($q) {
            $q->where(function ($subQ) {
                $this->left->applyTo($subQ, true);
            })->orWhere(function ($subQ) {
                $this->right->applyTo($subQ, true);
            });
        });
    }
    
    public function toString(): string
    {
        return "({$this->left->toString()} OR {$this->right->toString()})";
    }
}