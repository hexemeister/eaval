<?php

namespace App\Services\ArticleSearch;

use Exception;
use Illuminate\Support\Facades\Log;

/**
 * Parser de queries de busca com suporte a operadores booleanos,
 * parênteses e wildcards.
 * 
 * Gramática:
 * expression := orExpr
 * orExpr     := andExpr (OR andExpr)*
 * andExpr    := notExpr (AND notExpr)*
 * notExpr    := NOT primary | primary
 * primary    := TERM | "PHRASE" | ( expression )
 */
class SearchQueryParser
{
    private array $tokens;
    private int $position;
    
    public function parse(string $query): QueryNode
    {
        if (empty(trim($query))) {
            throw new ParseException("Query vazia");
        }
        
        // Remover parênteses externos desnecessários (todos os níveis)
        $query = $this->removeOuterParentheses($query, true);
        
        $this->tokens = (new Tokenizer())->tokenize($query);
        $this->position = 0;
        
        // Log para debug
        Log::debug('Parser: Tokens generated', [
            'original_query' => $query,
            'token_count' => count($this->tokens),
            'tokens' => $this->tokens
        ]);
        
        $result = $this->parseOr();
        
        // Verificar se consumimos todos os tokens
        if ($this->position < count($this->tokens)) {
            $remaining = $this->tokens[$this->position];
            Log::error('Parser: Unconsumed tokens', [
                'position' => $this->position,
                'remaining_token' => $remaining,
                'all_tokens' => $this->tokens
            ]);
            
            throw new ParseException(
                "Caracteres inesperados na posição {$this->position}: '{$remaining['value']}' (tipo: {$remaining['type']})"
            );
        }
        
        // Simplificar AST para remover redundâncias
        $simplifier = new ASTSimplifier();
        $result = $simplifier->simplify($result);
        
        Log::debug('Parser: Parse completed', [
            'ast' => $result->toString()
        ]);
        
        return $result;
    }
    
    /**
     * Remove parênteses externos desnecessários de forma recursiva.
     * Exemplo: ((educação OR tecnologia)) → educação OR tecnologia
     * 
     * @param string $query Query original
     * @param bool $removeAll Se true, remove todos os níveis de parênteses externos
     */
    private function removeOuterParentheses(string $query, bool $removeAll = true): string
    {
        $query = trim($query);
        $removed = 0;
        
        do {
            $hadChange = false;
            
            if (strlen($query) > 2 && $query[0] === '(' && $query[strlen($query) - 1] === ')') {
                // Verificar se os parênteses são realmente externos (não há fechamento antes)
                $depth = 0;
                $isOuter = true;
                
                for ($i = 1; $i < strlen($query) - 1; $i++) {
                    if ($query[$i] === '(') {
                        $depth++;
                    } elseif ($query[$i] === ')') {
                        if ($depth === 0) {
                            // Parêntese de fechamento antes do esperado
                            $isOuter = false;
                            break;
                        }
                        $depth--;
                    }
                }
                
                if ($isOuter && $depth === 0) {
                    $query = substr($query, 1, -1);
                    $query = trim($query);
                    $removed++;
                    $hadChange = true;
                }
            }
        } while ($removeAll && $hadChange && strlen($query) > 2);
        
        if ($removed > 0) {
            Log::info('Parser: Removed outer parentheses', [
                'removed_count' => $removed,
                'result' => $query,
                'strategy' => $removeAll ? 'recursive' : 'single-level'
            ]);
        }
        
        return $query;
    }
    
    private function parseOr(): QueryNode
    {
        $left = $this->parseAnd();
        
        while ($this->match('OR')) {
            $this->consume('OR');
            $right = $this->parseAnd();
            $left = new OrNode($left, $right);
        }
        
        return $left;
    }
    
    private function parseAnd(): QueryNode
    {
        $left = $this->parseNot();
        
        // AND explícito
        while ($this->match('AND')) {
            $this->consume('AND');
            $right = $this->parseNot();
            $left = new AndNode($left, $right);
        }
        
        // AND implícito: próximo token é NOT, TERM, PHRASE ou LPAREN (mas não OR ou RPAREN)
        while (!$this->isAtEnd() && 
               !$this->match('OR') && 
               !$this->match('RPAREN') &&
               ($this->match('NOT') || $this->match('TERM') || $this->match('PHRASE') || $this->match('LPAREN'))) {
            $right = $this->parseNot();
            $left = new AndNode($left, $right);
        }
        
        return $left;
    }
    
    private function parseNot(): QueryNode
    {
        if ($this->match('NOT')) {
            $this->consume('NOT');
            return new NotNode($this->parsePrimary());
        }
        
        return $this->parsePrimary();
    }
    
    private function parsePrimary(): QueryNode
    {
        // Parênteses
        if ($this->match('LPAREN')) {
            $this->consume('LPAREN');
            $node = $this->parseOr();
            
            if (!$this->match('RPAREN')) {
                throw new ParseException(
                    "Esperado ')' na posição {$this->position}, encontrado: " . 
                    ($this->isAtEnd() ? 'fim da query' : $this->tokens[$this->position]['type'])
                );
            }
            $this->consume('RPAREN');
            
            return $node;
        }
        
        // Frase entre aspas
        if ($this->match('PHRASE')) {
            $token = $this->consume('PHRASE');
            return new TermNode($token['value'], true);
        }
        
        // Termo simples
        if ($this->match('TERM')) {
            $token = $this->consume('TERM');
            return new TermNode($token['value'], false);
        }
        
        // Erro mais descritivo
        $current = $this->isAtEnd() ? 'fim da query' : "'{$this->tokens[$this->position]['value']}' (tipo: {$this->tokens[$this->position]['type']})";
        throw new ParseException("Termo esperado na posição {$this->position}, encontrado: {$current}");
    }
    
    private function match(string $type): bool
    {
        if ($this->isAtEnd()) {
            return false;
        }
        return $this->tokens[$this->position]['type'] === $type;
    }
    
    private function consume(string $type): array
    {
        if (!$this->match($type)) {
            throw new ParseException("Esperado $type na posição {$this->position}");
        }
        
        return $this->tokens[$this->position++];
    }
    
    private function isAtEnd(): bool
    {
        return $this->position >= count($this->tokens);
    }
}

class ParseException extends Exception {}