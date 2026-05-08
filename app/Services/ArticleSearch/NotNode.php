<?php

namespace App\Services\ArticleSearch;

use Illuminate\Database\Eloquent\Builder;

/**
 * Nó NOT.
 */
class NotNode extends QueryNode
{
    public function __construct(
        private QueryNode $child
    ) {}
    
    public function applyTo(Builder $query, bool $isFirst = true, array $options = []): void
    {
        // NOT: negar a condição
        $query->whereNot(function ($q) use ($options) {
            $this->child->applyTo($q, true, $options);
        });
    }
    
    public function toString(): string
    {
        return "NOT {$this->child->toString()}";
    }
}