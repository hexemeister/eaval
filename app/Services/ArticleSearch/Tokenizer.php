<?php

namespace App\Services\ArticleSearch;

use Illuminate\Support\Facades\Log;

/**
 * Tokenizador para queries de busca.
 * 
 * Tokens reconhecidos:
 * - TERM: palavra simples (pode conter * e ?)
 * - PHRASE: "texto entre aspas"
 * - AND, OR, NOT: operadores booleanos
 * - LPAREN, RPAREN: parênteses
 */
class Tokenizer
{
    private string $input;
    private int $position;
    private int $length;
    
    public function tokenize(string $input): array
    {
        $this->input = trim($input);
        $this->length = strlen($this->input);
        $this->position = 0;
        
        $tokens = [];
        
        Log::debug('Tokenizer: Starting tokenization', [
            'input' => $this->input,
            'length' => $this->length
        ]);
        
        while ($this->position < $this->length) {
            $this->skipWhitespace();
            
            if ($this->position >= $this->length) {
                break;
            }
            
            $token = $this->nextToken();
            if ($token !== null) {
                $tokens[] = $token;
                Log::debug('Tokenizer: Token created', [
                    'position' => $this->position - strlen($token['value']),
                    'token' => $token
                ]);
            }
        }
        
        // Verificar balanceamento de parênteses
        $openCount = count(array_filter($tokens, fn($t) => $t['type'] === 'LPAREN'));
        $closeCount = count(array_filter($tokens, fn($t) => $t['type'] === 'RPAREN'));
        
        if ($openCount !== $closeCount) {
            Log::error('Tokenizer: Unbalanced parentheses', [
                'open_count' => $openCount,
                'close_count' => $closeCount,
                'tokens' => $tokens
            ]);
        }
        
        // Verificar aspas balanceadas
        $phraseCount = count(array_filter($tokens, fn($t) => $t['type'] === 'PHRASE'));
        $rawQuoteCount = substr_count($this->input, '"');
        
        if ($rawQuoteCount % 2 !== 0) {
            Log::warning('Tokenizer: Unbalanced quotes detected', [
                'quote_count' => $rawQuoteCount,
                'phrase_tokens' => $phraseCount,
                'input' => $this->input
            ]);
        }
        
        Log::debug('Tokenizer: Completed', [
            'token_count' => count($tokens),
            'tokens' => $tokens
        ]);
        
        return $tokens;
    }
    
    private function nextToken(): ?array
    {
        $char = $this->current();
        
        // Parênteses
        if ($char === '(') {
            $this->position++;
            return ['type' => 'LPAREN', 'value' => '('];
        }
        
        if ($char === ')') {
            $this->position++;
            return ['type' => 'RPAREN', 'value' => ')'];
        }
        
        // Frase entre aspas
        if ($char === '"') {
            return $this->readPhrase();
        }
        
        // Termo ou operador
        return $this->readWord();
    }
    
    private function readPhrase(): array
    {
        $start = $this->position;
        $this->position++; // pular aspas inicial
        
        $phrase = '';
        while ($this->position < $this->length && $this->current() !== '"') {
            if ($this->current() === '\\' && $this->peek() === '"') {
                $this->position++; // escapar aspas
                $phrase .= '"';
            } else {
                $phrase .= $this->current();
            }
            $this->position++;
        }
        
        if ($this->position >= $this->length) {
            Log::warning('Tokenizer: Unclosed quote', [
                'start_position' => $start,
                'phrase_so_far' => $phrase
            ]);
            throw new ParseException("Aspas não fechadas na posição $start");
        }
        
        $this->position++; // pular aspas final
        
        return ['type' => 'PHRASE', 'value' => $phrase];
    }
    
    private function readWord(): array
    {
        $word = '';
        $startPos = $this->position;
        
        while ($this->position < $this->length && 
               !$this->isWhitespace($this->current()) &&
               $this->current() !== '(' &&
               $this->current() !== ')' &&
               $this->current() !== '"') {
            $word .= $this->current();
            $this->position++;
        }
        
        // Verificar se é operador
        $upperWord = strtoupper($word);
        if (in_array($upperWord, ['AND', 'OR', 'NOT'])) {
            return ['type' => $upperWord, 'value' => $upperWord];
        }
        
        // Verificar wildcards
        $hasWildcard = strpos($word, '*') !== false || strpos($word, '?') !== false;
        if ($hasWildcard) {
            Log::debug('Tokenizer: Wildcard term detected', [
                'position' => $startPos,
                'term' => $word
            ]);
        }
        
        return ['type' => 'TERM', 'value' => $word];
    }
    
    private function skipWhitespace(): void
    {
        while ($this->position < $this->length && 
               $this->isWhitespace($this->current())) {
            $this->position++;
        }
    }
    
    private function isWhitespace(string $char): bool
    {
        return in_array($char, [' ', "\t", "\n", "\r"]);
    }
    
    private function current(): string
    {
        if ($this->position >= $this->length) {
            return '';
        }
        return $this->input[$this->position];
    }
    
    private function peek(): string
    {
        if ($this->position + 1 >= $this->length) {
            return '';
        }
        return $this->input[$this->position + 1];
    }
}