<?php

namespace App\Http\Controllers;

use App\Models\Area;
use App\Models\Autor;
use App\Models\EixoTematico;
use App\Models\LocalPublicacao;
use App\Models\PalavraChave;
use App\Models\Publicacao;
use App\Models\QualisCape;
use App\Models\SegmentoEducacional;
use App\Models\TipoPublicacao;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class EstatisticaController extends Controller
{
    public function index(string $tipo)
    {
        switch ($tipo) {
            case 'visao-geral':
                return Inertia::render('Estatisticas/VisaoGeral', $this->visaoGeralProps());

            case 'ano':
                $dados = Publicacao::select('ano', DB::raw('count(*) as total'))
                    ->groupBy('ano')
                    ->orderBy('ano')
                    ->get()
                    ->map(fn ($item) => ['Ano' => (int) $item->ano, 'Total' => $item->total]);

                return Inertia::render('Estatisticas/Quantitativos/Generico', [
                    'dados'         => $dados,
                    'colunas'       => ['Ano', 'Total'],
                    'title'         => 'Estatísticas - Por Ano',
                    'hasYearFilter' => true,
                ]);

            case 'autor':
                return Inertia::render('Estatisticas/Quantitativos/Generico', [
                    'dados'   => Autor::publicacoesPorAutor(),
                    'colunas' => ['Autor', 'Total'],
                    'title'   => 'Estatísticas - Por Autor',
                ]);

            case 'palavra-chave':
                $dados = PalavraChave::select('texto', 'frequencia')
                    ->groupBy('texto')
                    ->orderBy('frequencia', 'desc')
                    ->get()
                    ->map(fn ($item) => ['Palavra-chave' => $item->texto, 'Total' => $item->frequencia]);

                return Inertia::render('Estatisticas/Quantitativos/Generico', [
                    'dados'   => $dados,
                    'colunas' => ['Palavra-chave', 'Total'],
                    'title'   => 'Estatísticas - Por Palavra-chave',
                ]);

            case 'periodico':
                $dados = LocalPublicacao::withCount('publicacoes as Total')
                    ->orderByDesc('Total')
                    ->get()
                    ->map(fn ($item) => ['Periódico' => $item->nome, 'Total' => $item->Total]);

                return Inertia::render('Estatisticas/Quantitativos/Generico', [
                    'dados'   => $dados,
                    'colunas' => ['Periódico', 'Total'],
                    'title'   => 'Estatísticas - Por Periódico',
                ]);

            case 'qualis':
                $dados = QualisCape::withCount('publicacoes')
                    ->get()
                    ->map(fn ($item) => ['Qualis' => $item->classificacao, 'Total' => $item->publicacoes_count]);

                $nullCount = Publicacao::whereNull('qualis_capes_id')->count();
                if ($nullCount > 0) {
                    $dados->push(['Qualis' => 'Não informado', 'Total' => $nullCount]);
                }

                return Inertia::render('Estatisticas/Quantitativos/Generico', [
                    'dados'   => $dados,
                    'colunas' => ['Qualis', 'Total'],
                    'title'   => 'Estatísticas - Por Qualis CAPES',
                ]);

            case 'area-conhecimento':
                $dados = Area::withCount('publicacoes')
                    ->get()
                    ->filter(fn ($item) => $item->publicacoes_count > 0)
                    ->sortByDesc('publicacoes_count')
                    ->values()
                    ->map(fn ($item) => ['Área' => $item->nome, 'Total' => $item->publicacoes_count]);

                return Inertia::render('Estatisticas/Quantitativos/Generico', [
                    'dados'   => $dados,
                    'colunas' => ['Área', 'Total'],
                    'title'   => 'Estatísticas - Por Área do Conhecimento',
                ]);

            case 'tipo-publicacao':
                $dados = Publicacao::join('tipo_publicacao', 'tipo_publicacao.id', '=', 'publicacao.tipo_publicacao_id')
                    ->select('tipo_publicacao.nome as tipo', DB::raw('count(*) as total'))
                    ->groupBy('tipo_publicacao.id', 'tipo_publicacao.nome')
                    ->orderByDesc('total')
                    ->get()
                    ->map(fn ($item) => ['Tipo' => $item->tipo, 'Total' => $item->total]);

                return Inertia::render('Estatisticas/Quantitativos/Generico', [
                    'dados'   => $dados,
                    'colunas' => ['Tipo', 'Total'],
                    'title'   => 'Estatísticas - Por Tipo de Publicação',
                ]);

            case 'eixo-tematico':
                $dados = EixoTematico::withCount('publicacoes')
                    ->get()
                    ->filter(fn ($item) => $item->publicacoes_count > 0)
                    ->sortByDesc('publicacoes_count')
                    ->values()
                    ->map(fn ($item) => ['Eixo Temático' => $item->nome, 'Total' => $item->publicacoes_count]);

                return Inertia::render('Estatisticas/Quantitativos/Generico', [
                    'dados'   => $dados,
                    'colunas' => ['Eixo Temático', 'Total'],
                    'title'   => 'Estatísticas - Por Eixo Temático',
                ]);

            case 'segmento-educacional':
                $dados = SegmentoEducacional::withCount('publicacoes')
                    ->get()
                    ->filter(fn ($item) => $item->publicacoes_count > 0)
                    ->sortByDesc('publicacoes_count')
                    ->values()
                    ->map(fn ($item) => ['Segmento' => $item->nome, 'Total' => $item->publicacoes_count]);

                return Inertia::render('Estatisticas/Quantitativos/Generico', [
                    'dados'   => $dados,
                    'colunas' => ['Segmento', 'Total'],
                    'title'   => 'Estatísticas - Por Segmento Educacional',
                ]);

            case 'forma-apresentacao':
                $dados = Publicacao::join('forma_apresentacao', 'forma_apresentacao.id', '=', 'publicacao.forma_apresentacao_id')
                    ->select('forma_apresentacao.nome as forma', DB::raw('count(*) as total'))
                    ->groupBy('forma_apresentacao.id', 'forma_apresentacao.nome')
                    ->orderByDesc('total')
                    ->get()
                    ->map(fn ($item) => ['Forma' => $item->forma, 'Total' => $item->total]);

                return Inertia::render('Estatisticas/Quantitativos/Generico', [
                    'dados'   => $dados,
                    'colunas' => ['Forma', 'Total'],
                    'title'   => 'Estatísticas - Por Forma de Apresentação',
                ]);

            case 'estado':
                $dados = LocalPublicacao::with('estadoModel')
                    ->get()
                    ->groupBy('estadoModel.nome')
                    ->map(fn ($group) => ['Estado' => $group->first()->estadoModel->nome ?? 'N/A', 'Total' => $group->sum(fn ($lp) => $lp->publicacoes()->count())])
                    ->filter(fn ($item) => $item['Total'] > 0 && $item['Estado'] !== 'N/A')
                    ->sortByDesc('Total')
                    ->values();

                return Inertia::render('Estatisticas/Quantitativos/Generico', [
                    'dados'   => $dados,
                    'colunas' => ['Estado', 'Total'],
                    'title'   => 'Estatísticas - Por Estado',
                ]);

            case 'regiao':
                $dados = LocalPublicacao::with('estadoModel.regiao')
                    ->get()
                    ->groupBy('estadoModel.regiao.nome')
                    ->map(fn ($group) => ['Região' => $group->first()->estadoModel->regiao->nome ?? 'N/A', 'Total' => $group->sum(fn ($lp) => $lp->publicacoes()->count())])
                    ->filter(fn ($item) => $item['Total'] > 0 && $item['Região'] !== 'N/A')
                    ->sortByDesc('Total')
                    ->values();

                return Inertia::render('Estatisticas/Quantitativos/Generico', [
                    'dados'   => $dados,
                    'colunas' => ['Região', 'Total'],
                    'title'   => 'Estatísticas - Por Região Geográfica',
                ]);

            case 'pais':
                $dados = LocalPublicacao::with('estadoModel.regiao.pais')
                    ->get()
                    ->groupBy('estadoModel.regiao.pais.nome')
                    ->map(fn ($group) => ['País' => $group->first()->estadoModel->regiao->pais->nome ?? 'N/A', 'Total' => $group->sum(fn ($lp) => $lp->publicacoes()->count())])
                    ->filter(fn ($item) => $item['Total'] > 0 && $item['País'] !== 'N/A')
                    ->sortByDesc('Total')
                    ->values();

                return Inertia::render('Estatisticas/Quantitativos/Generico', [
                    'dados'   => $dados,
                    'colunas' => ['País', 'Total'],
                    'title'   => 'Estatísticas - Por País',
                ]);

            default:
                abort(404);
        }
    }

    private function visaoGeralProps(): array
    {
        $total = Publicacao::count();

        $autorTop     = Autor::withCount('publicacoes')->orderByDesc('publicacoes_count')->first();
        $periodicoTop = LocalPublicacao::withCount('publicacoes')->orderByDesc('publicacoes_count')->first();
        $qualisTop    = QualisCape::withCount('publicacoes')->orderByDesc('publicacoes_count')->first();
        $areaTop      = Area::withCount('publicacoes')->orderByDesc('publicacoes_count')->first();
        $eixoTop      = EixoTematico::withCount('publicacoes')->orderByDesc('publicacoes_count')->first();
        $segmentoTop  = SegmentoEducacional::withCount('publicacoes')->orderByDesc('publicacoes_count')->first();
        $tipoTop      = TipoPublicacao::withCount('publicacoes')->orderByDesc('publicacoes_count')->first();

        $formaTop = DB::table('publicacao')
            ->join('forma_apresentacao', 'forma_apresentacao.id', '=', 'publicacao.forma_apresentacao_id')
            ->select('forma_apresentacao.nome', DB::raw('count(*) as total'))
            ->whereNotNull('publicacao.forma_apresentacao_id')
            ->groupBy('forma_apresentacao.id', 'forma_apresentacao.nome')
            ->orderByDesc('total')
            ->first();

        $estadoTop = DB::table('publicacao')
            ->join('local_publicacao', 'publicacao.local_publicacao_id', '=', 'local_publicacao.id')
            ->join('estado', 'local_publicacao.estado', '=', 'estado.sigla')
            ->select('estado.sigla', 'estado.nome', DB::raw('count(*) as total'))
            ->whereNotNull('publicacao.local_publicacao_id')
            ->groupBy('estado.sigla', 'estado.nome')
            ->orderByDesc('total')
            ->first();

        $regiaoTop = DB::table('publicacao')
            ->join('local_publicacao', 'publicacao.local_publicacao_id', '=', 'local_publicacao.id')
            ->join('estado', 'local_publicacao.estado', '=', 'estado.sigla')
            ->join('regiao', 'estado.sigla_regiao', '=', 'regiao.sigla')
            ->select('regiao.sigla', 'regiao.nome', DB::raw('count(*) as total'))
            ->whereNotNull('publicacao.local_publicacao_id')
            ->groupBy('regiao.sigla', 'regiao.nome')
            ->orderByDesc('total')
            ->first();

        $paisTop = DB::table('publicacao')
            ->join('local_publicacao', 'publicacao.local_publicacao_id', '=', 'local_publicacao.id')
            ->join('estado', 'local_publicacao.estado', '=', 'estado.sigla')
            ->join('regiao', 'estado.sigla_regiao', '=', 'regiao.sigla')
            ->join('pais', 'regiao.sigla_pais', '=', 'pais.sigla')
            ->select('pais.sigla', 'pais.nome', DB::raw('count(*) as total'))
            ->whereNotNull('publicacao.local_publicacao_id')
            ->groupBy('pais.sigla', 'pais.nome')
            ->orderByDesc('total')
            ->first();

        $totalComDoi   = Publicacao::whereNotNull('doi')->where('doi', '!=', '')->count();
        $totalComResumo = Publicacao::whereNotNull('resumo')->where('resumo', '!=', '')->count();

        $titulos = Publicacao::pluck('titulo');
        $mediaPalavrasTitulo = $titulos->isNotEmpty()
            ? round((float) $titulos->avg(fn ($t) => count(preg_split('/\s+/', trim($t ?? ''), -1, PREG_SPLIT_NO_EMPTY))), 1)
            : 0.0;

        $resumos = Publicacao::whereNotNull('resumo')->where('resumo', '!=', '')->pluck('resumo');
        $mediaPalavrasResumo = $resumos->isNotEmpty()
            ? round((float) $resumos->avg(fn ($r) => count(preg_split('/\s+/', trim($r), -1, PREG_SPLIT_NO_EMPTY))), 1)
            : 0.0;

        return [
            // Grupo 1 — Sobre o Acervo
            'totalPublicacoes'  => $total,
            'anoMin'            => (int) Publicacao::min('ano'),
            'anoMax'            => (int) Publicacao::max('ano'),
            'ultimaAtualizacao' => Publicacao::latest('updated_at')->first()?->updated_at?->format('d/m/Y'),
            'autorTopNome'      => $autorTop?->nome,
            'autorTopTotal'     => $autorTop?->publicacoes_count ?? 0,
            'periodicoTopNome'  => $periodicoTop?->nome,
            'periodicoTopTotal' => $periodicoTop?->publicacoes_count ?? 0,

            // Grupo 2 — Perfil das Publicações
            'qualisTopNome'    => $qualisTop?->classificacao,
            'qualisTopTotal'   => $qualisTop?->publicacoes_count ?? 0,
            'areaTopNome'      => $areaTop?->nome,
            'areaTopTotal'     => $areaTop?->publicacoes_count ?? 0,
            'eixoTopNome'      => $eixoTop?->nome,
            'eixoTopTotal'     => $eixoTop?->publicacoes_count ?? 0,
            'segmentoTopNome'  => $segmentoTop?->nome,
            'segmentoTopTotal' => $segmentoTop?->publicacoes_count ?? 0,
            'tipoTopNome'      => $tipoTop?->nome,
            'tipoTopTotal'     => $tipoTop?->publicacoes_count ?? 0,
            'formaTopNome'     => $formaTop?->nome,
            'formaTopTotal'    => (int) ($formaTop?->total ?? 0),

            // Grupo 3 — Distribuição Geográfica
            'estadoTopNome'  => $estadoTop?->nome,
            'estadoTopTotal' => (int) ($estadoTop?->total ?? 0),
            'regiaoTopNome'  => $regiaoTop?->nome,
            'regiaoTopTotal' => (int) ($regiaoTop?->total ?? 0),
            'paisTopNome'    => $paisTop?->nome,
            'paisTopTotal'   => (int) ($paisTop?->total ?? 0),

            // Grupo 4 — Riqueza do Conteúdo
            'mediaAutoresPorArtigo'    => $total > 0 ? round(DB::table('autor_publicacao')->count() / $total, 1) : 0.0,
            'mediaPalavrasChaveArtigo' => $total > 0 ? round(DB::table('palavra_chave_publicacao')->count() / $total, 1) : 0.0,
            'mediaPalavrasTitulo'      => $mediaPalavrasTitulo,
            'mediaPalavrasResumo'      => $mediaPalavrasResumo,
            'totalAutores'             => Autor::count(),
            'totalPeriodicos'          => LocalPublicacao::count(),
            'totalPalavrasChave'       => PalavraChave::count(),
            'percentualDOI'            => $total > 0 ? round($totalComDoi / $total * 100, 1) : 0.0,
            'percentualResumo'         => $total > 0 ? round($totalComResumo / $total * 100, 1) : 0.0,
        ];
    }
}
