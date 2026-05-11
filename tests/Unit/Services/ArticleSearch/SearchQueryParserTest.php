<?php

/**
 * Testes do sistema de busca avançada usando Pest (formato describe).
 * 
 * Salve este arquivo em: tests/Unit/ArticleSearchTest.php
 */

use App\Services\ArticleSearch\ParseException;
use App\Services\ArticleSearch\SearchQueryParser;

describe('SearchQueryParser', function () {
    
    beforeEach(function () {
        $this->parser = new SearchQueryParser();
    });
    
    describe('Basic parsing', function () {
        
        it('parses simple term', function () {
            $ast = $this->parser->parse('avaliação');
            expect($ast->toString())->toBe('avaliação');
        });
        
        it('parses phrase', function () {
            $ast = $this->parser->parse('"educação básica"');
            expect($ast->toString())->toBe('"educação básica"');
        });
        
        it('parses wildcards', function () {
            $ast = $this->parser->parse('avalia*');
            expect($ast->toString())->toBe('avalia*');
            
            $ast = $this->parser->parse('educa??o');
            expect($ast->toString())->toBe('educa??o');
        });
    });
    
    describe('Boolean operators', function () {
        
        it('parses AND operator', function () {
            $ast = $this->parser->parse('avaliação AND educação');
            expect($ast->toString())->toBe('(avaliação AND educação)');
        });
        
        it('parses OR operator', function () {
            $ast = $this->parser->parse('ENEM OR SAEB');
            expect($ast->toString())->toBe('(ENEM OR SAEB)');
        });
        
        it('parses NOT operator', function () {
            $ast = $this->parser->parse('NOT universidade');
            expect($ast->toString())->toBe('NOT universidade');
        });
        
        it('parses implicit AND', function () {
            $ast = $this->parser->parse('avaliação educação');
            expect($ast->toString())->toBe('(avaliação AND educação)');
        });
        
        it('respects operator precedence (NOT > AND > OR)', function () {
            $ast = $this->parser->parse('a OR b AND NOT c');
            expect($ast->toString())->toBe('(a OR (b AND NOT c))');
        });
    });
    
    describe('Parentheses', function () {
        
        it('parses simple parentheses', function () {
            $ast = $this->parser->parse('(avaliação OR teste) AND educação');
            expect($ast->toString())->toBe('((avaliação OR teste) AND educação)');
        });
        
        it('parses nested parentheses', function () {
            $ast = $this->parser->parse('((a OR b) AND (c OR d))');
            expect($ast->toString())->toBe('((a OR b) AND (c OR d))');
        });
    });
    
    describe('Complex queries', function () {
        
        it('parses complex query with multiple operators', function () {
            $ast = $this->parser->parse('(ENEM OR SAEB) AND Brasil NOT universidade');
            expect($ast->toString())->toBe('(((ENEM OR SAEB) AND Brasil) AND NOT universidade)');
        });
        
        it('handles NOT after parentheses (implicit AND)', function () {
            $ast = $this->parser->parse('(educação OR tecnologia) NOT (jogo OR "silveira")');
            expect($ast->toString())->toBe('((educação OR tecnologia) AND NOT (jogo OR "silveira"))');
        });
        
        it('handles multiple implicit ANDs with NOT', function () {
            $ast = $this->parser->parse('term1 term2 NOT term3');
            expect($ast->toString())->toBe('((term1 AND term2) AND NOT term3)');
        });
        
        it('handles real world queries', function () {
            $queries = [
                'avaliação AND (ENEM OR SAEB) NOT professor',
                '"ensino médio" OR "educação básica"',
                'Brasil* AND educa??o',
                '(a OR b) AND (c OR d) NOT (e OR f)',
                'NOT (a OR b) AND c',
            ];
            
            foreach ($queries as $query) {
                $ast = $this->parser->parse($query);
                expect($ast)->not->toBeNull();
            }
        });
    });
    
    describe('Error handling', function () {
        
        it('throws on unclosed parentheses', function () {
            $this->parser->parse('(avaliação AND');
        })->throws(ParseException::class);
        
        it('throws on unclosed quotes', function () {
            $this->parser->parse('"educação básica');
        })->throws(ParseException::class);
        
        it('throws on empty query', function () {
            $this->parser->parse('');
        })->throws(ParseException::class);
    });
    
    describe('Tokenization', function () {
        
        it('tokenizes complex query correctly', function () {
            $query = '(educação OR tecnologia) NOT (jogo OR "silveira")';
            
            $tokenizer = new \App\Services\ArticleSearch\Tokenizer();
            $tokens = $tokenizer->tokenize($query);
            
            $expectedTypes = [
                'LPAREN', 'TERM', 'OR', 'TERM', 'RPAREN',
                'NOT',
                'LPAREN', 'TERM', 'OR', 'PHRASE', 'RPAREN'
            ];
            
            $actualTypes = array_map(fn($t) => $t['type'], $tokens);
            
            expect($actualTypes)->toBe($expectedTypes);
        });
    });
});