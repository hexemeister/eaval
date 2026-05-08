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
    
    public function applyTo(Builder $query, bool $isFirst = true, array $options = []): void
    {
        // OR: pelo menos uma condição deve ser verdadeira
        // Precisamos criar subqueries separadas
        $query->where(function ($q) use ($options) {
            $q->where(function ($subQ) use ($options) {
                $this->left->applyTo($subQ, true, $options);
            })->orWhere(function ($subQ) use ($options) {
                $this->right->applyTo($subQ, true, $options);
            });
        });
    }
    
    public function toString(): string
    {
        return "({$this->left->toString()} OR {$this->right->toString()})";
    }
}