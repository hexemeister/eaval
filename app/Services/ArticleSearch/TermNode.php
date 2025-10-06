<?php

namespace App\Services\ArticleSearch;

use Illuminate\Database\Eloquent\Builder;

/**
 * Nó de termo de busca.
 */
class TermNode extends QueryNode
{
    public function __construct(
        private string $term,
        private bool $isPhrase
    ) {}
    
    public function applyTo(Builder $query, bool $isFirst = true): void
    {
        $pattern = $this->convertWildcards($this->term);
        
        $condition = function ($q) use ($pattern) {
            $q->where('titulo', 'LIKE', $pattern)
              ->orWhere('resumo', 'LIKE', $pattern)
              ->orWhereHas('autores', function ($q) use ($pattern) {
                  $q->where('nome', 'LIKE', $pattern);
              })
              ->orWhereHas('palavrasChave', function ($q) use ($pattern) {
                  $q->where('texto', 'LIKE', $pattern);
              });
        };
        
        $query->where($condition);
    }
    
    private function convertWildcards(string $term): string
    {
        // Se for frase, busca exata
        if ($this->isPhrase) {
            return "%{$term}%";
        }
        
        // Converter wildcards: * -> %, ? -> _
        $term = str_replace(['*', '?'], ['%', '_'], $term);
        
        // Se não tem wildcards, adicionar % em torno
        if (strpos($term, '%') === false && strpos($term, '_') === false) {
            return "%{$term}%";
        }
        
        return $term;
    }
    
    public function toString(): string
    {
        return $this->isPhrase ? "\"{$this->term}\"" : $this->term;
    }
    
    public function getTerm(): string
    {
        return $this->term;
    }
}