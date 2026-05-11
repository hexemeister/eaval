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
                    // Título ou Resumo
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
     * Tenta encontrar a palavra isolada ou cercada por pontuação/espaço.
     */
    private function applyWordBoundaryLike($query, string $column, string $term, bool $isFirst = true): void
    {
        $method = $isFirst ? 'where' : 'orWhere';

        $query->$method(function($q) use ($column, $term) {
            $q->where($column, 'LIKE', "{$term} %")         // Início da frase
              ->orWhere($column, 'LIKE', "% {$term}")      // Fim da frase
              ->orWhere($column, 'LIKE', "% {$term} %")    // Meio da frase
              ->orWhere($column, '=', $term);              // Termo exato (única palavra)

            // Adicionar correspondências comuns com pontuação se necessário
            $q->orWhere($column, 'LIKE', "{$term},%")
              ->orWhere($column, 'LIKE', "% {$term},%")
              ->orWhere($column, 'LIKE', "{$term}.%")
              ->orWhere($column, 'LIKE', "% {$term}.%");
        });
    }
    
    private function convertWildcards(string $term): string
    {
        // Se for frase, busca com limites de palavra para evitar correspondências parciais
        // Ex: "arte" não deve pegar "Duarte"
        if ($this->isPhrase) {
            // Em SQLite e MySQL, podemos simular limites de palavra com espaços se o banco for simples
            // Ou usar REGEXP, mas LIKE é mais portátil entre drivers se usado com cautela.
            // Para resolver o problema do usuário (Duarte vs arte), vamos tentar correspondência de palavra inteira
            // OBS: Isso pode ser complexo apenas com LIKE.
            return "% {$term} %";
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