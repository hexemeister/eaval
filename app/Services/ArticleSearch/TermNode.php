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
        $term = $this->term;
        $isPhrase = $this->isPhrase;
        $pattern = $this->convertWildcards($term);
        $fields = $options['fields'] ?? ['titulo', 'resumo', 'autores', 'palavras_chave'];

        $condition = function ($q) use ($term, $isPhrase, $pattern, $fields) {
            $first = true;

            foreach ($fields as $field) {
                $method = $first ? 'where' : 'orWhere';

                if ($field === 'autores') {
                    $relationMethod = $first ? 'whereHas' : 'orWhereHas';
                    $q->$relationMethod('autores', function ($sq) use ($term, $isPhrase, $pattern) {
                        if ($isPhrase) {
                            $this->applyWordBoundaryLike($sq, 'nome', $term);
                        } else {
                            $sq->where('nome', 'LIKE', $pattern);
                        }
                    });
                } elseif ($field === 'palavras_chave') {
                    $relationMethod = $first ? 'whereHas' : 'orWhereHas';
                    $q->$relationMethod('palavrasChave', function ($sq) use ($term, $isPhrase, $pattern) {
                        if ($isPhrase) {
                            $this->applyWordBoundaryLike($sq, 'texto', $term);
                        } else {
                            $sq->where('texto', 'LIKE', $pattern);
                        }
                    });
                } else {
                    if ($isPhrase) {
                        $this->applyWordBoundaryLike($q, $field, $term, $first);
                    } else {
                        $q->$method($field, 'LIKE', $pattern);
                    }
                }
                $first = false;
            }

            // Fallback se nenhum campo selecionado
            if ($first) {
                if ($isPhrase) {
                    $this->applyWordBoundaryLike($q, 'titulo', $term);
                } else {
                    $q->where('titulo', 'LIKE', $pattern);
                }
            }
        };

        $query->where($condition);
    }

    /**
     * Aplica LIKE com simulação de limites de palavra.
     * Garante que "arte" não encontre "Duarte", "parte", "artefato", etc.
     */
    private function applyWordBoundaryLike($query, string $column, string $term, bool $isFirst = true): void
    {
        $method = $isFirst ? 'where' : 'orWhere';

        $query->$method(function($q) use ($column, $term) {
            $q->where($column, 'LIKE', "{$term} %")        // início da frase
              ->orWhere($column, 'LIKE', "% {$term}")      // fim da frase
              ->orWhere($column, 'LIKE', "% {$term} %")   // meio da frase
              ->orWhere($column, '=', $term)               // título exato (único termo)
              ->orWhere($column, 'LIKE', "{$term},%")
              ->orWhere($column, 'LIKE', "% {$term},%")
              ->orWhere($column, 'LIKE', "{$term}.%")
              ->orWhere($column, 'LIKE', "% {$term}.%");
        });
    }

    private function convertWildcards(string $term): string
    {
        if ($this->isPhrase) {
            return "% {$term} %";
        }

        $term = str_replace(['*', '?'], ['%', '_'], $term);

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
