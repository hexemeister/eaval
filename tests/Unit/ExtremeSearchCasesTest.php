<?php

/**
 * Testes de casos extremos para o sistema de busca.
 * Testa validações, recuperação de erros e otimizações.
 */

namespace Tests\Unit;

use App\Services\ArticleSearch\ParseException;
use App\Services\ArticleSearch\SearchQueryParser;
use Tests\TestCase;

class ExtremeSearchCasesTest extends TestCase
{
    private SearchQueryParser $parser;

    protected function setUp(): void
    {
        parent::setUp();
        $this->parser = new SearchQueryParser();
    }
    
    public function test_throws_on_missing_closing_parenthesis()
    {
        $this->expectException(ParseException::class);
        $this->parser->parse('(educação AND tecnologia');
    }
    
    public function test_throws_on_missing_opening_parenthesis()
    {
        $this->expectException(ParseException::class);
        $this->parser->parse('educação AND tecnologia)');
    }
    
    public function test_handles_double_negation()
    {
        $ast = $this->parser->parse('NOT NOT educação');
        $this->assertEquals('educação', $ast->toString());
    }
    
    public function test_handles_triple_negation()
    {
        $ast = $this->parser->parse('NOT NOT NOT educação');
        $this->assertEquals('NOT educação', $ast->toString());
    }
    
    public function test_removes_single_level_outer_parentheses()
    {
        $ast = $this->parser->parse('(educação)');
        $this->assertEquals('educação', $ast->toString());
    }
    
    public function test_removes_multiple_levels_of_outer_parentheses()
    {
        $ast = $this->parser->parse('((((educação))))');
        $this->assertEquals('educação', $ast->toString());
    }
    
    public function test_simplifies_a_and_a_to_a()
    {
        $ast = $this->parser->parse('educação AND educação');
        $this->assertEquals('educação', $ast->toString());
    }
    
    public function test_simplifies_a_or_a_to_a()
    {
        $ast = $this->parser->parse('educação OR educação');
        $this->assertEquals('educação', $ast->toString());
    }

    public function test_handles_empty_phrases()
    {
        $ast = $this->parser->parse('""');
        $this->assertEquals('""', $ast->toString());
    }
}
