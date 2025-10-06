<?php

namespace App\Console\Commands;

use App\Services\ArticleSearch\ParseException;
use App\Services\ArticleSearch\SearchQueryParser;
use App\Services\ArticleSearch\Tokenizer;
use Illuminate\Console\Command;

class DebugSearchCommand extends Command
{
    protected $signature = 'search:debug {query : A query de busca para debugar}';
    
    protected $description = 'Debug de queries de busca - mostra tokenização e AST';
    
    public function handle(SearchQueryParser $parser, Tokenizer $tokenizer): int
    {
        $query = $this->argument('query');
        
        $this->newLine();
        $this->line('═══════════════════════════════════════════════════════════════');
        $this->info('🔍 DEBUG DE QUERY');
        $this->line('═══════════════════════════════════════════════════════════════');
        $this->line("Query original: <comment>{$query}</comment>");
        $this->line('───────────────────────────────────────────────────────────────');
        
        // Passo 1: Tokenização
        $this->newLine();
        $this->info('📝 PASSO 1: TOKENIZAÇÃO');
        try {
            $tokens = $tokenizer->tokenize($query);
            
            $this->line('Tokens gerados:');
            foreach ($tokens as $i => $token) {
                $this->line(sprintf(
                    "  <fg=gray>[%d]</> <fg=yellow>%-10s</> → <fg=cyan>'%s'</>",
                    $i,
                    $token['type'],
                    $token['value']
                ));
            }
        } catch (\Exception $e) {
            $this->error("❌ ERRO: {$e->getMessage()}");
            return self::FAILURE;
        }
        
        // Passo 2: Parsing
        $this->newLine();
        $this->info('🌳 PASSO 2: PARSING (AST)');
        try {
            $ast = $parser->parse($query);
            
            $this->line('AST gerada:');
            $this->line("  <fg=green>{$ast->toString()}</>");
            
            $this->newLine();
            $this->info('✅ Query parseada com sucesso!');
            
            return self::SUCCESS;
            
        } catch (ParseException $e) {
            $this->error("❌ ERRO DE SINTAXE: {$e->getMessage()}");
            
            // Sugestões
            $this->newLine();
            $this->warn('💡 SUGESTÕES:');
            
            if (str_contains($e->getMessage(), 'aspas')) {
                $this->line('  • Verifique se todas as aspas estão fechadas');
            }
            if (str_contains($e->getMessage(), 'parêntese')) {
                $this->line('  • Verifique se todos os parênteses estão balanceados');
            }
            if (str_contains($e->getMessage(), 'Termo esperado')) {
                $this->line('  • Verifique se não há operadores seguidos (ex: AND OR)');
                $this->line('  • Verifique se há termo após operadores (ex: AND <termo>)');
            }
            
            return self::FAILURE;
            
        } catch (\Exception $e) {
            $this->error("❌ ERRO: {$e->getMessage()}");
            return self::FAILURE;
        }
    }
}