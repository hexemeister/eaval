<?php

namespace App\Http\Controllers;

use App\Models\Autor;
use App\Models\PalavraChave;
use Illuminate\Http\Request;
use App\Models\Publicacao;
use App\Models\LocalPublicacao;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class EstatisticaController extends Controller
{
    public function index($tipo)
    {
        switch ($tipo) {
            case 'total':
                $totalPublicacoes = Publicacao::count();
                // return response()->json(['totalPublicacoes' => $totalPublicacoes]);
                return Inertia::render('Estatisticas/Quantitativos/TotalGeral', [
                    'totalPublicacoes' => [
                        [
                            'Título' => 'Publicações Científicas',
                            'Total' => $totalPublicacoes
                        ]
                    ],
                    'breadcrumb' => [
                        ['label' => 'Página Inicial', 'href' => '/'],
                        ['label' => 'Estatísticas - Quantitativos de publicações Científicas'],
                    ],
                    'title' => 'Estatísticas - Quantitativos de publicações Científicas',
                ]);
            case 'ano':
                $publicacoesPorAno = Publicacao::select('ano', DB::raw('count(*) as total'))
                    ->groupBy('ano')
                    ->orderBy('ano', 'desc')
                    ->get();
                // return response()->json(['publicacoesPorAno' => $publicacoesPorAno]);
                return Inertia::render('Estatisticas/Quantitativos/PorAno', [
                    'publicacoesPorAno' => $publicacoesPorAno,
                    'breadcrumb' => [
                        ['label' => 'Página Inicial', 'href' => '/'],
                        ['label' => 'Estatísticas - Quantitativos de publicações Científicas por ano'],
                    ],
                    'title' => 'Estatísticas - Quantitativos de publicações Científicas por ano',
                ]);
            case 'autor':
                $publicacoesPorAutor = Autor::publicacoesPorAutor();
                // $publicacoesPorAutor = Autor::withCount('publicacoes')
                //     ->whereHas('publicacoes')
                //     ->orderByDesc('publicacoes_count')
                //     ->get()
                //     ->map(fn ($autor) => [
                //             'Autor' => $autor->nome,
                //             'Frequência' => $autor->publicacoes_count,
                //         ]);
                // return response()->json(['publicacoesPorAutor' => $publicacoesPorAutor]);
                return Inertia::render('Estatisticas/Quantitativos/PorAutor', [
                    'publicacoesPorAutor' => $publicacoesPorAutor,
                    'breadcrumb' => [
                        ['label' => 'Página Inicial', 'href' => '/'],
                        ['label' => 'Estatísticas - Quantitativos de publicações Científicas por autor'],
                    ],
                    'title' => 'Estatísticas - Quantitativos de publicações Científicas por autor',
                ]);
                break;
            case 'palavra-chave':
                $quantidadePalavrasChave = PalavraChave::select('texto', 'frequencia')
                    ->groupBy('texto')
                    ->orderBy('frequencia', 'desc')
                    ->get();
                // return response()->json(['quantidadePalavrasChave' => $quantidadePalavrasChave]);
                return Inertia::render('Estatisticas/Quantitativos/PorPalavraChave', [
                    'quantidadePalavrasChave' => $quantidadePalavrasChave,
                    'breadcrumb' => [
                        ['label' => 'Página Inicial', 'href' => '/'],
                        ['label' => 'Estatísticas - Quantitativos de publicações Científicas por palavra-chave'],
                    ],
                    'title' => 'Estatísticas - Quantitativos de publicações Científicas por ano',
                ]);
            case 'periodico':
                $publicacoesPorPeriodico = LocalPublicacao::query()
                    ->select('nome', 'estado', 'issn')
                    ->withCount('publicacoes as Total')
                    ->orderByDesc('Total')
                    ->get();
                // return response()->json(['publicacoesPorPeriodico' => $publicacoesPorPeriodico]);
                return Inertia::render('Estatisticas/Quantitativos/PorPeriodico', [
                    'publicacoesPorPeriodico' => $publicacoesPorPeriodico,
                    'breadcrumb' => [
                        ['label' => 'Página Inicial', 'href' => '/'],
                        ['label' => 'Estatísticas - Quantitativos de publicações Científicas por periódico'],
                    ],
                    'title' => 'Estatísticas - Quantitativos de publicações Científicas por ano',
                ]);
                break;
            case 'qualis':
                $dados = \App\Models\QualisCape::withCount('publicacoes')
                    ->get()
                    ->map(fn($item) => ['Qualis' => $item->classificacao, 'Total' => $item->publicacoes_count]);

                $nullCount = Publicacao::whereNull('qualis_capes_id')->count();
                if ($nullCount > 0) {
                    $dados->push(['Qualis' => 'Não informado', 'Total' => $nullCount]);
                }

                return Inertia::render('Estatisticas/Quantitativos/Generico', [
                    'dados' => $dados,
                    'colunas' => ['Qualis', 'Total'],
                    'title' => 'Estatísticas - Por Qualis CAPES',
                ]);
            case 'area-conhecimento':
                $dados = \App\Models\Area::withCount('publicacoes')
                    ->get()
                    ->filter(fn($item) => $item->publicacoes_count > 0)
                    ->sortByDesc('publicacoes_count')
                    ->values()
                    ->map(fn($item) => ['Área' => $item->nome, 'Total' => $item->publicacoes_count]);

                return Inertia::render('Estatisticas/Quantitativos/Generico', [
                    'dados' => $dados,
                    'colunas' => ['Área', 'Total'],
                    'title' => 'Estatísticas - Por Área de Conhecimento',
                ]);
            case 'tipo-publicacao':
                $dados = Publicacao::select('tipo', DB::raw('count(*) as total'))
                    ->whereNotNull('tipo')
                    ->groupBy('tipo')
                    ->orderByDesc('total')
                    ->get()
                    ->map(fn($item) => ['Tipo' => $item->tipo, 'Total' => $item->total]);

                return Inertia::render('Estatisticas/Quantitativos/Generico', [
                    'dados' => $dados,
                    'colunas' => ['Tipo', 'Total'],
                    'title' => 'Estatísticas - Por Tipo de Publicação',
                ]);
            case 'eixo-tematico':
                $dados = \App\Models\EixoTematico::withCount('publicacoes')
                    ->get()
                    ->filter(fn($item) => $item->publicacoes_count > 0)
                    ->sortByDesc('publicacoes_count')
                    ->values()
                    ->map(fn($item) => ['Eixo Temático' => $item->nome, 'Total' => $item->publicacoes_count]);

                return Inertia::render('Estatisticas/Quantitativos/Generico', [
                    'dados' => $dados,
                    'colunas' => ['Eixo Temático', 'Total'],
                    'title' => 'Estatísticas - Por Eixo Temático',
                ]);
            case 'segmento-educacional':
                $dados = \App\Models\SegmentoEducacional::withCount('publicacoes')
                    ->get()
                    ->filter(fn($item) => $item->publicacoes_count > 0)
                    ->sortByDesc('publicacoes_count')
                    ->values()
                    ->map(fn($item) => ['Segmento' => $item->nome, 'Total' => $item->publicacoes_count]);

                return Inertia::render('Estatisticas/Quantitativos/Generico', [
                    'dados' => $dados,
                    'colunas' => ['Segmento', 'Total'],
                    'title' => 'Estatísticas - Por Segmento Educacional',
                ]);
            case 'forma-apresentacao':
                $dados = Publicacao::select('forma', DB::raw('count(*) as total'))
                    ->whereNotNull('forma')
                    ->groupBy('forma')
                    ->orderByDesc('total')
                    ->get()
                    ->map(fn($item) => ['Forma' => $item->forma, 'Total' => $item->total]);

                return Inertia::render('Estatisticas/Quantitativos/Generico', [
                    'dados' => $dados,
                    'colunas' => ['Forma', 'Total'],
                    'title' => 'Estatísticas - Por Forma de Apresentação',
                ]);
            case 'estado':
                $dados = \App\Models\LocalPublicacao::with('estadoModel')
                    ->get()
                    ->groupBy('estadoModel.nome')
                    ->map(fn($group) => ['Estado' => $group->first()->estadoModel->nome ?? 'N/A', 'Total' => $group->sum(fn($lp) => $lp->publicacoes()->count())])
                    ->filter(fn($item) => $item['Total'] > 0 && $item['Estado'] !== 'N/A')
                    ->sortByDesc('Total')
                    ->values();

                return Inertia::render('Estatisticas/Quantitativos/Generico', [
                    'dados' => $dados,
                    'colunas' => ['Estado', 'Total'],
                    'title' => 'Estatísticas - Por Estado',
                ]);
            case 'regiao':
                 $dados = \App\Models\LocalPublicacao::with('estadoModel.regiao')
                    ->get()
                    ->groupBy('estadoModel.regiao.nome')
                    ->map(fn($group) => ['Região' => $group->first()->estadoModel->regiao->nome ?? 'N/A', 'Total' => $group->sum(fn($lp) => $lp->publicacoes()->count())])
                    ->filter(fn($item) => $item['Total'] > 0 && $item['Região'] !== 'N/A')
                    ->sortByDesc('Total')
                    ->values();

                return Inertia::render('Estatisticas/Quantitativos/Generico', [
                    'dados' => $dados,
                    'colunas' => ['Região', 'Total'],
                    'title' => 'Estatísticas - Por Região',
                ]);
            case 'pais':
                 $dados = \App\Models\LocalPublicacao::with('estadoModel.regiao.pais')
                    ->get()
                    ->groupBy('estadoModel.regiao.pais.nome')
                    ->map(fn($group) => ['País' => $group->first()->estadoModel->regiao->pais->nome ?? 'N/A', 'Total' => $group->sum(fn($lp) => $lp->publicacoes()->count())])
                    ->filter(fn($item) => $item['Total'] > 0 && $item['País'] !== 'N/A')
                    ->sortByDesc('Total')
                    ->values();

                return Inertia::render('Estatisticas/Quantitativos/Generico', [
                    'dados' => $dados,
                    'colunas' => ['País', 'Total'],
                    'title' => 'Estatísticas - Por País',
                ]);
            default:
                return response()->json(['error' => 'Tipo de estatística inválido'], 400);
        }
    }
}
