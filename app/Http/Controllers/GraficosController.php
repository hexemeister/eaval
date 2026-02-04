<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Publicacao;


class GraficosController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        // return Inertia::render('Estatisticas/Graficos/ProducaoPorAnoForm', [
        //     'breadcrumb' => [
        //         ['label' => 'Página Inicial', 'href' => '/'],
        //         ['label' => 'Estatísticas - Gráficos de Publicações Científicas por ano'],
        //     ],
        //     'title' => 'Estatísticas - Gráficos de Publicações Científicas por ano',
        // ]);
    }


    public function porAno(Request $request)
    {
        // Obtém os anos mínimo e máximo do banco
        $minAno = Publicacao::min('ano');
        $maxAno = Publicacao::max('ano');

        // Se não houver publicações, define valores padrão seguros
        if ($minAno === null || $maxAno === null) {
            $minAno = $maxAno = date('Y');
        }

        // Define valores padrão com base nos dados reais
        $start = $request->integer('ano_inicio', $minAno);
        $end = $request->integer('ano_fim', $maxAno);

        // Garante que os valores estejam dentro do intervalo válido
        $start = max($minAno, min($start, $maxAno));
        $end = max($minAno, min($end, $maxAno));

        if ($start > $end) {
            [$start, $end] = [$end, $start];
        }

        // Busca os dados
        $data = Publicacao::selectRaw('ano, COUNT(*) as total')
            ->whereBetween('ano', [$start, $end])
            ->groupBy('ano')
            ->orderBy('ano')
            ->get()
            ->toArray();

        if ($request->wantsJson()) {
            return ['producaoData' => $data];
        }
        $anosDisponiveis = Publicacao::distinct()->pluck('ano')->sort()->values();

        return inertia('Estatisticas/Graficos/ProducaoPorAnoForm', [
            'initialData' => $data,
            'initialAnoInicio' => $start,
            'initialAnoFim' => $end,
            'anosDisponiveis' => $anosDisponiveis,
            'breadcrumb' => [
                ['label' => 'Página Inicial', 'href' => '/'],
                ['label' => 'Estatísticas - Gráficos de Publicações Científicas por ano'],
            ],
            'title' => 'Estatísticas - Gráficos de Publicações Científicas por ano',
        ]);
    }

    /**
     * Gera os gráficos de estatísticas com base nos dados das publicações científicas.
     */
    public function generate()
    {
        //
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        //
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $id)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        //
    }
}
