<?php

namespace App\Http\Controllers;

use App\Models\Publicacao;
use App\Services\ArticleSearch\ParseException;
use App\Services\ArticleSearch\SearchQueryParser;
use App\Services\SearchLoggerService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;

class PublicacoesController extends Controller
{
    public function __construct(
        private SearchQueryParser $parser,
        private SearchLoggerService $logger
    ) {}

    public function index(Request $request): Response
    {
        $startTime = microtime(true);

        // Decodificar search se vier URL encoded
        $search = $request->input('search');
        if ($search) {
            $search = urldecode($search);
        }

        // test_mode expõe SQL gerado, bindings e query log — restrito a usuários autenticados
        $testMode = $request->boolean('test_mode') && $request->user() !== null;
        $fields = $request->input('fields');
        $areas = $request->input('areas');

        // Query base com relacionamentos
        $baseQuery = Publicacao::with([
            'autores' => fn ($q) => $q->orderBy('ordem', 'asc'),
            'palavrasChave',
        ])
            ->orderBy('incluida_em', 'desc')
            ->orderBy('titulo', 'asc');

        $results = [];
        $testResult = null;
        $error = null;
        $warning = null;
        $parsedQuery = null;
        $originalQuery = $search;
        $correctedQuery = null;

        // Se não há busca ou busca vazia, retorna todos os artigos
        if (empty(trim($search ?? ''))) {
            $results = $baseQuery->get()->map(function ($publicacao) {
                return $this->formatPublicacao($publicacao);
            });

            return $this->renderResponse(
                $results,
                $originalQuery,
                $parsedQuery,
                $error,
                $warning,
                $correctedQuery,
                $testResult
            );
        }

        try {
            // Se for modo de teste, não balancear automaticamente para testar erros
            if ($testMode) {
                $balancedSearch = $search;
            } else {
                // Tentar balancear parênteses automaticamente
                $balancedSearch = $this->balanceParentheses($search);
            }

            if ($balancedSearch !== $search) {
                $correctedQuery = $balancedSearch;
                $warning = 'Parênteses desbalanceados foram corrigidos automaticamente.';
                Log::info('Parentheses auto-balanced', [
                    'original' => $search,
                    'corrected' => $balancedSearch,
                ]);
            }

            $queryToUse = $correctedQuery ?? $search;

            // Parse da query
            $ast = $this->parser->parse($queryToUse);
            $parsedQuery = $ast->toString();

            Log::debug('Search query parsed successfully', [
                'original_query' => $originalQuery,
                'corrected_query' => $correctedQuery,
                'parsed_ast' => $parsedQuery,
            ]);

            // Processar campos de busca
            $fieldMap = [
                '0' => 'titulo',
                '1' => 'autores',
                '2' => 'palavras_chave',
                '3' => 'resumo',
            ];

            $selectedFields = [];
            if ($fields) {
                $fieldIndexes = explode(',', $fields);
                foreach ($fieldIndexes as $index) {
                    if (isset($fieldMap[$index])) {
                        $selectedFields[] = $fieldMap[$index];
                    }
                }
            }

            if (empty($selectedFields)) {
                $selectedFields = ['titulo', 'autores', 'palavras_chave', 'resumo'];
            }

            // Aplicar condições ao query
            $query = clone $baseQuery;
            $ast->applyTo($query, true, ['fields' => $selectedFields]);

            // Filtrar por áreas se selecionado
            if ($areas) {
                $areaIndexes = explode(',', $areas);
                // Mapear índices para nomes de áreas (baseado no frontend AREAS = ['Educação', 'Saúde', 'Ambiental', 'Social'])
                $areaMap = [
                    '0' => 'Educação',
                    '1' => 'Saúde',
                    '2' => 'Ambiental',
                    '3' => 'Social',
                ];

                $selectedAreaNames = [];
                foreach ($areaIndexes as $index) {
                    if (isset($areaMap[$index])) {
                        $selectedAreaNames[] = $areaMap[$index];
                    }
                }

                if (! empty($selectedAreaNames)) {
                    $query->whereHas('areas', function ($q) use ($selectedAreaNames) {
                        $q->whereIn('nome', $selectedAreaNames);
                    });
                }
            }

            // Executar query
            $results = $query->get()->map(function ($publicacao) {
                return $this->formatPublicacao($publicacao);
            });

            // Modo de teste
            if ($testMode) {
                $testResult = $this->runTestMode($queryToUse, $ast, $query);
            }

            // Log de busca para auditoria
            $this->logger->log($request, [
                'query' => $originalQuery,
                'filters' => [
                    'url' => $request->fullUrl(),
                    'fields' => $fields,
                    'areas' => $areas,
                    'corrected' => $correctedQuery,
                ],
                'results_count' => count($results),
                'execution_time_ms' => (microtime(true) - $startTime) * 1000,
            ]);

        } catch (ParseException $e) {
            $this->logger->log($request, [
                'query' => $originalQuery,
                'filters' => ['url' => $request->fullUrl(), 'fields' => $fields, 'areas' => $areas],
                'error' => $e->getMessage(),
                'execution_time_ms' => (microtime(true) - $startTime) * 1000,
            ]);

            // Erro de sintaxe - tentar recuperação
            $error = 'Erro de sintaxe: '.$e->getMessage();

            // Tentar uma query simplificada removendo caracteres problemáticos
            $simplifiedQuery = $this->simplifyQuery($search);

            if ($simplifiedQuery !== $search) {
                Log::warning('Parse error, attempting simplified query', [
                    'original' => $search,
                    'simplified' => $simplifiedQuery,
                    'error' => $e->getMessage(),
                ]);

                try {
                    $ast = $this->parser->parse($simplifiedQuery);
                    $correctedQuery = $simplifiedQuery;
                    $parsedQuery = $ast->toString();
                    $warning = 'Query foi simplificada automaticamente devido a erro de sintaxe.';
                    $error = null; // Limpar erro já que conseguimos recuperar

                    $query = clone $baseQuery;
                    $ast->applyTo($query, true);
                    $results = $query->get()->map(function ($publicacao) {
                        return $this->formatPublicacao($publicacao);
                    });

                } catch (\Exception $e2) {
                    Log::error('Failed to parse even simplified query', [
                        'original' => $search,
                        'simplified' => $simplifiedQuery,
                        'error' => $e2->getMessage(),
                    ]);
                }
            } else {
                Log::warning('Parse error in search', [
                    'query' => $search,
                    'error' => $e->getMessage(),
                ]);
            }

        } catch (\Exception $e) {
            $this->logger->log($request, [
                'query' => $originalQuery,
                'filters' => ['url' => $request->fullUrl(), 'fields' => $fields, 'areas' => $areas],
                'error' => $e->getMessage(),
                'execution_time_ms' => (microtime(true) - $startTime) * 1000,
            ]);

            $error = 'Erro ao processar busca: '.$e->getMessage();
            Log::error('Search error', [
                'query' => $search,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
        }

        return $this->renderResponse(
            $results,
            $originalQuery,
            $parsedQuery,
            $error,
            $warning,
            $correctedQuery,
            $testResult
        );
    }

    /**
     * Balanceia parênteses automaticamente.
     */
    private function balanceParentheses(string $query): string
    {
        $open = substr_count($query, '(');
        $close = substr_count($query, ')');

        if ($open === $close) {
            return $query;
        }

        Log::warning('Unbalanced parentheses detected', [
            'query' => $query,
            'open' => $open,
            'close' => $close,
        ]);

        // Adicionar parênteses faltantes
        if ($open > $close) {
            // Faltam parênteses de fechamento
            $query .= str_repeat(')', $open - $close);
        } else {
            // Faltam parênteses de abertura
            $query = str_repeat('(', $close - $open).$query;
        }

        return $query;
    }

    /**
     * Simplifica query removendo caracteres problemáticos.
     */
    private function simplifyQuery(string $query): string
    {
        // Remover todos os parênteses
        $simplified = str_replace(['(', ')'], '', $query);

        // Remover aspas desbalanceadas
        $quoteCount = substr_count($simplified, '"');
        if ($quoteCount % 2 !== 0) {
            $simplified = str_replace('"', '', $simplified);
        }

        return trim($simplified);
    }

    /**
     * Formata uma publicação para exibição.
     */
    private function formatPublicacao($publicacao): array
    {
        return [
            'id' => $publicacao->id,
            'titulo' => $publicacao->titulo ?? 'Sem título',
            'autores' => $publicacao->autores->pluck('nome')->join("\n"),
            'ano' => $publicacao->ano ?? 'Sem ano',
            'link' => $publicacao->link ?? '#',
        ];
    }

    /**
     * Renderiza a resposta Inertia.
     */
    private function renderResponse(
        $results,
        ?string $originalQuery,
        ?string $parsedQuery,
        ?string $error,
        ?string $warning,
        ?string $correctedQuery,
        ?array $testResult
    ): Response {
        return Inertia::render('Publicacoes', [
            'breadcrumb' => [
                ['label' => 'Página Inicial', 'href' => '/'],
                ['label' => 'Publicações científicas'],
            ],
            'title' => 'Publicações científicas',
            'results' => $results,
            'search' => [
                'original' => $originalQuery ?? '',
                'corrected' => $correctedQuery,
                'parsed' => $parsedQuery,
            ],
            'error' => $error,
            'warning' => $warning,
            'testResult' => $testResult,
        ]);
    }

    /**
     * Executa testes de consistência da query.
     */
    private function runTestMode(string $queryUsed, $ast, $query): array
    {
        DB::enableQueryLog();

        try {
            // Medir tempo de início
            $startTime = microtime(true);

            // Obter SQL gerado
            $sql = $query->toSql();
            $bindings = $query->getBindings();

            // Executar query
            $results = $query->get();
            $resultIds = $results->pluck('id')->toArray();

            // Calcular tempo de execução
            $executionTime = round((microtime(true) - $startTime) * 1000, 2);

            // Obter log de queries
            $queryLog = DB::getQueryLog();

            // Estatísticas sobre a query
            $stats = [
                'total_queries' => count($queryLog),
                'total_time' => collect($queryLog)->sum('time'),
                'slowest_query' => collect($queryLog)->max('time'),
                'has_joins' => substr_count($sql, 'join') > 0,
                'has_subqueries' => substr_count($sql, 'exists') > 0,
            ];

            Log::info('Search Test Mode - Detailed Performance', [
                'query_used' => $queryUsed,
                'parsed_query' => $ast->toString(),
                'sql' => $sql,
                'bindings' => $bindings,
                'result_count' => count($resultIds),
                'execution_time_ms' => $executionTime,
                'stats' => $stats,
                'query_log' => $queryLog,
            ]);

            // Verificar performance
            if ($executionTime > 1000) {
                Log::warning('Search Test Mode - Slow query detected', [
                    'execution_time_ms' => $executionTime,
                    'threshold_ms' => 1000,
                    'result_count' => count($resultIds),
                ]);
            }

            return [
                'query_used' => $queryUsed,
                'parsed' => $ast->toString(),
                'sql' => $sql,
                'bindings' => $bindings,
                'result_count' => count($resultIds),
                'sample_ids' => array_slice($resultIds, 0, 10),
                'execution_time' => $executionTime,
                'stats' => $stats,
                'query_log' => $queryLog,
            ];
        } finally {
            // Sem isso o Laravel acumula todas as queries da request em memória
            DB::disableQueryLog();
        }
    }
}
