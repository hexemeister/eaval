<?php

/**
 * Testes de casos extremos para o sistema de busca.
 * Testa validações, recuperação de erros e otimizações.
 * 
 * Salve em: tests/Unit/ExtremeSearchCasesTest.php
 */

use App\Services\ArticleSearch\ParseException;
use App\Services\ArticleSearch\SearchQueryParser;
use App\Services\ArticleSearch\ASTSimplifier;

describe('Extreme Search Cases', function () {
    
    beforeEach(function () {
        $this->parser = new SearchQueryParser();
    });
    
    describe('Unbalanced parentheses', function () {
        
        it('throws on missing closing parenthesis', function () {
            $this->parser->parse('(educação AND tecnologia');
        })->throws(ParseException::class, 'parêntese');
        
        it('throws on missing opening parenthesis', function () {
            $this->parser->parse('educação AND tecnologia)');
        })->throws(ParseException::class, 'parêntese');
        
        it('throws on multiple unbalanced parentheses', function () {
            $this->parser->parse('((educação AND tecnologia)');
        })->throws(ParseException::class);
    });
    
    describe('Multiple NOT operators', function () {
        
        it('handles double negation', function () {
            $ast = $this->parser->parse('NOT NOT educação');
            // Após simplificação, NOT NOT A = A
            expect($ast->toString())->toBe('educação');
        });
        
        it('handles triple negation', function () {
            $ast = $this->parser->parse('NOT NOT NOT educação');
            // NOT NOT NOT A = NOT A
            expect($ast->toString())->toBe('NOT educação');
        });
        
        it('handles NOT in complex expression', function () {
            $ast = $this->parser->parse('NOT (a OR NOT b)');
            expect($ast->toString())->toContain('NOT');
        });
    });
    
    describe('Redundant parentheses removal', function () {
        
        it('removes single level outer parentheses', function () {
            $ast = $this->parser->parse('(educação)');
            expect($ast->toString())->toBe('educação');
        });
        
        it('removes multiple levels of outer parentheses', function () {
            $ast = $this->parser->parse('((((educação))))');
            expect($ast->toString())->toBe('educação');
        });
        
        it('removes outer parentheses from complex expression', function () {
            $ast = $this->parser->parse('((educação OR tecnologia))');
            // Deve remover parênteses externos mas manter os internos necessários
            expect($ast->toString())->toBe('(educação OR tecnologia)');
        });
    });
    
    describe('Duplicate operands simplification', function () {
        
        it('simplifies A AND A to A', function () {
            $ast = $this->parser->parse('educação AND educação');
            expect($ast->toString())->toBe('educação');
        });
        
        it('simplifies A OR A to A', function () {
            $ast = $this->parser->parse('educação OR educação');
            expect($ast->toString())->toBe('educação');
        });
    });
    
    describe('Invalid operator sequences', function () {
        
        it('handles AND OR sequence', function () {
            // Parser deve lidar com isso ou lançar erro claro
            try {
                $ast = $this->parser->parse('educação AND OR tecnologia');
                // Se não lançar erro, deve ter tratado de alguma forma
                expect($ast)->not->toBeNull();
            } catch (ParseException $e) {
                expect($e->getMessage())->toContain('esperado');
            }
        });
        
        it('handles trailing operator', function () {
            try {
                $ast = $this->parser->parse('educação AND');
                fail('Should have thrown ParseException');
            } catch (ParseException $e) {
                expect($e->getMessage())->toContain('Termo esperado');
            }
        });
    });
    
    describe('Special characters and edge cases', function () {
        
        it('handles empty phrases', function () {
            $ast = $this->parser->parse('""');
            expect($ast->toString())->toBe('""');
        });
        
        it('handles phrases with special chars', function () {
            $ast = $this->parser->parse('"educação & tecnologia"');
            expect($ast->toString())->toContain('&');
        });
        
        it('handles wildcards in phrases', function () {
            // Wildcards dentro de frases devem ser literais
            $ast = $this->parser->parse('"educa*"');
            expect($ast->toString())->toBe('"educa*"');
        });
        
        it('handles multiple consecutive spaces', function () {
            $ast = $this->parser->parse('educação     AND     tecnologia');
            expect($ast->toString())->toBe('(educação AND tecnologia)');
        });
    });
    
    describe('Performance edge cases', function () {
        
        it('handles deeply nested expressions', function () {
            $query = '((((a OR b) AND (c OR d)) OR ((e OR f) AND (g OR h))))';
            $ast = $this->parser->parse($query);
            expect($ast)->not->toBeNull();
        });
        
        it('handles long query with many terms', function () {
            $terms = array_map(fn($i) => "term{$i}", range(1, 20));
            $query = implode(' AND ', $terms);
            $ast = $this->parser->parse($query);
            expect($ast)->not->toBeNull();
        });
    });
    
    describe('Mixed operators and precedence', function () {
        
        it('correctly parses a OR b AND c OR d', function () {
            $ast = $this->parser->parse('a OR b AND c OR d');
            // Precedência: AND > OR
            // Deve ser: a OR (b AND c) OR d = (a OR (b AND c)) OR d
            expect($ast->toString())->toBe('((a OR (b AND c)) OR d)');
        });
        
        it('correctly parses NOT a OR b AND NOT c', function () {
            $ast = $this->parser->parse('NOT a OR b AND NOT c');
            // Precedência: NOT > AND > OR
            expect($ast->toString())->toContain('NOT');
        });
    });
});