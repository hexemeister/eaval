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
    
    public function applyTo(Builder $query, bool $isFirst = true, array $options = []): void
    {
        $pattern = $this->convertWildcards($this->term);
        $fields = $options['fields'] ?? ['titulo', 'resumo', 'autores', 'palavras_chave'];
        
        $condition = function ($q) use ($pattern, $fields) {
            $first = true;

            if (in_array('titulo', $fields)) {
                $q->where('titulo', 'LIKE', $pattern);
                $first = false;
            }

            if (in_array('resumo', $fields)) {
                $method = $first ? 'where' : 'orWhere';
                $q->$method('resumo', 'LIKE', $pattern);
                $first = false;
            }

            if (in_array('autores', $fields)) {
                $method = $first ? 'whereHas' : 'orWhereHas';
                $q->$method('autores', function ($sq) use ($pattern) {
                    $sq->where('nome', 'LIKE', $pattern);
                });
                $first = false;
            }

            if (in_array('palavras_chave', $fields)) {
                $method = $first ? 'whereHas' : 'orWhereHas';
                $q->$method('palavrasChave', function ($sq) use ($pattern) {
                    $sq->where('texto', 'LIKE', $pattern);
                });
                $first = false;
            }

            // Fallback se nenhum campo selecionado
            if ($first) {
                $q->where('titulo', 'LIKE', $pattern);
            }
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