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
    public function quantitativo($tipo)
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
            case 'area-conhecimento':
                // Lógica para estatísticas por instituição
                break;
            case 'tipo-publicacao':
                // Lógica para estatísticas por Qualis CAPES
                break;
            case 'eixo-tematico':
                // Lógica para estatísticas por instituição
                break;
            case 'segmento-educacional':
                // Lógica para estatísticas por Qualis CAPES
                break;
            case 'forma-apresentacao':
                // Lógica para estatísticas por instituição
                break;
            case 'estado':
                // Lógica para estatísticas por instituição
                break;
            case 'regiao':
                // Lógica para estatísticas por instituição
                break;
            case 'pais':
                // Lógica para estatísticas por instituição
                break;
            default:
                return response()->json(['error' => 'Tipo de estatística inválido'], 400);
        }
    }
}
