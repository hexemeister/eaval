<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Area;
use App\Models\EixoTematico;
use App\Models\FormaApresentacao;
use App\Models\LocalPublicacao;
use App\Models\PalavraChave;
use App\Models\Publicacao;
use App\Models\QualisCape;
use App\Models\SegmentoEducacional;
use App\Models\TipoInstituicao;
use App\Models\TipoPublicacao;
use App\Models\Turma;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class PublicacoesController extends Controller
{
    public function index(): Response
    {
        $publicacoes = Publicacao::with(['autores', 'tipoPublicacao'])
            ->orderBy('id')
            ->get()
            ->map(fn ($pub) => [
                'id'      => $pub->id,
                'title'   => $pub->titulo,
                'authors' => $pub->autores->pluck('nome')->implode(', '),
                'year'    => $pub->ano,
                'tipo'    => $pub->tipoPublicacao?->nome,
                'doi'     => $pub->doi,
                'isbn'    => $pub->isbn,
            ]);

        return Inertia::render('admin/Publicacoes/Index', [
            'publicacoes' => $publicacoes,
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('admin/Publicacoes/Create', $this->formProps());
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $this->validateRequest($request);

        DB::transaction(function () use ($validated): void {
            $pub = Publicacao::create($validated['fields']);
            $this->syncAutores($pub, $validated['autores']);
            $this->syncPalavrasChave($pub, $validated['palavras_chave']);
            $pub->areas()->sync($validated['area_ids']);
        });

        return redirect('/admin/publicacoes')->with('success', 'Publicação criada com sucesso.');
    }

    public function edit(int $id): Response
    {
        $pub = Publicacao::with(['autores', 'palavrasChave', 'areas'])->findOrFail($id);

        $initialData = [
            'titulo'                 => $pub->titulo ?? '',
            'ano'                    => (string) $pub->ano,
            'tipo_publicacao_id'     => $pub->tipo_publicacao_id,
            'forma_apresentacao_id'  => $pub->forma_apresentacao_id,
            'doi'                    => $pub->doi ?? '',
            'isbn'                   => $pub->isbn ?? '',
            'link'                   => $pub->link ?? '',
            'volume'                 => $pub->volume ?? '',
            'numero'                 => $pub->numero ?? '',
            'pagina'                 => $pub->pagina ?? '',
            'local_publicacao_id'    => $pub->local_publicacao_id,
            'qualis_capes_id'        => $pub->qualis_capes_id,
            'tipo_instituicao_id'    => $pub->tipo_instituicao_id,
            'turma_id'               => $pub->turma_id,
            'eixo_tematico_id'       => $pub->eixo_tematico_id,
            'segmento_educacional_id' => $pub->segmento_educacional_id,
            'resumo'                 => $pub->resumo ?? '',
            'autores'                => $pub->autores->map(fn ($a) => [
                'autor_id' => $a->id,
                'nome'     => $a->nome,
                'ordem'    => $a->pivot->ordem,
            ])->sortBy('ordem')->values()->toArray(),
            'palavras_chave'         => $pub->palavrasChave->pluck('texto')->toArray(),
            'area_ids'               => $pub->areas->pluck('id')->toArray(),
        ];

        return Inertia::render('admin/Publicacoes/Edit', [
            ...$this->formProps(),
            'publicacao'  => ['id' => $pub->id],
            'initialData' => $initialData,
        ]);
    }

    public function update(Request $request, int $id): RedirectResponse
    {
        $pub = Publicacao::findOrFail($id);
        $validated = $this->validateRequest($request);

        DB::transaction(function () use ($pub, $validated): void {
            $pub->update($validated['fields']);
            $this->syncAutores($pub, $validated['autores']);
            $this->syncPalavrasChave($pub, $validated['palavras_chave']);
            $pub->areas()->sync($validated['area_ids']);
        });

        return redirect('/admin/publicacoes')->with('success', 'Publicação atualizada com sucesso.');
    }

    public function destroy(int $id): RedirectResponse
    {
        $pub = Publicacao::findOrFail($id);

        DB::transaction(function () use ($pub): void {
            DB::table('autor_publicacao')->where('publicacao_id', $pub->id)->delete();
            DB::table('palavra_chave_publicacao')->where('publicacao_id', $pub->id)->delete();
            DB::table('area_publicacao')->where('publicacao_id', $pub->id)->delete();
            $pub->delete();
        });

        return back()->with('success', 'Publicação excluída.');
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    /**
     * @return array<string, mixed>
     */
    private function formProps(): array
    {
        return [
            'tiposPublicacao'       => TipoPublicacao::orderBy('nome')->get(['id', 'nome']),
            'formasApresentacao'    => FormaApresentacao::orderBy('nome')->get(['id', 'nome']),
            'locaisPublicacao'      => LocalPublicacao::orderBy('nome')->get(['id', 'nome']),
            'qualisCapes'           => QualisCape::orderBy('classificacao')->get()
                ->map(fn ($q) => ['id' => $q->id, 'nome' => $q->classificacao]),
            'tiposInstituicao'      => TipoInstituicao::orderBy('nome')->get(['id', 'nome']),
            'turmas'                => Turma::orderBy('nome')->get(['id', 'nome']),
            'eixosTematicos'        => EixoTematico::orderBy('nome')->get(['id', 'nome']),
            'segmentosEducacionais' => SegmentoEducacional::orderBy('nome')->get(['id', 'nome']),
            'areas'                 => Area::orderBy('nome')->get(['id', 'nome']),
        ];
    }

    /**
     * @return array{fields: array<string, mixed>, autores: list<array<string, mixed>>, palavras_chave: list<string>, area_ids: list<int>}
     */
    private function validateRequest(Request $request): array
    {
        $data = $request->validate([
            'titulo'                 => ['required', 'string', 'max:1000'],
            'ano'                    => ['required', 'integer', 'min:1990', 'max:' . (date('Y') + 1)],
            'tipo_publicacao_id'     => ['nullable', 'exists:tipo_publicacao,id'],
            'forma_apresentacao_id'  => ['nullable', 'exists:forma_apresentacao,id'],
            'doi'                    => ['nullable', 'string', 'max:255'],
            'isbn'                   => ['nullable', 'string', 'max:30'],
            'link'                   => ['nullable', 'url', 'max:2048'],
            'volume'                 => ['nullable', 'string', 'max:50'],
            'numero'                 => ['nullable', 'string', 'max:50'],
            'pagina'                 => ['nullable', 'string', 'max:50'],
            'local_publicacao_id'    => ['nullable', 'exists:local_publicacao,id'],
            'qualis_capes_id'        => ['nullable', 'exists:qualis_capes,id'],
            'tipo_instituicao_id'    => ['nullable', 'exists:tipo_instituicao,id'],
            'turma_id'               => ['nullable', 'exists:turma,id'],
            'eixo_tematico_id'       => ['nullable', 'exists:eixo_tematico,id'],
            'segmento_educacional_id' => ['nullable', 'exists:segmento_educacional,id'],
            'resumo'                 => ['nullable', 'string'],
            'autores'                => ['nullable', 'array'],
            'autores.*.nome'         => ['required_with:autores', 'string', 'max:255'],
            'autores.*.ordem'        => ['required_with:autores', 'integer', 'min:1'],
            'palavras_chave'         => ['nullable', 'array'],
            'palavras_chave.*'       => ['string', 'max:255'],
            'area_ids'               => ['nullable', 'array'],
            'area_ids.*'             => ['integer', 'exists:area,id'],
        ]);

        $fields = collect($data)->except(['autores', 'palavras_chave', 'area_ids'])
            ->map(fn ($v) => $v === '' ? null : $v)
            ->toArray();

        return [
            'fields'       => $fields,
            'autores'      => $data['autores'] ?? [],
            'palavras_chave' => $data['palavras_chave'] ?? [],
            'area_ids'     => $data['area_ids'] ?? [],
        ];
    }

    /**
     * @param list<array{nome: string, autor_id: int|null, ordem: int}> $autores
     */
    private function syncAutores(Publicacao $pub, array $autores): void
    {
        DB::table('autor_publicacao')->where('publicacao_id', $pub->id)->delete();

        foreach ($autores as $autorData) {
            $nome = trim($autorData['nome'] ?? '');
            if ($nome === '') {
                continue;
            }

            $autorId = $autorData['autor_id'] ?? null;

            if ($autorId === null) {
                $autor   = \App\Models\Autor::firstOrCreate(['nome' => $nome]);
                $autorId = $autor->id;
            }

            DB::table('autor_publicacao')->insert([
                'autor_id'      => $autorId,
                'publicacao_id' => $pub->id,
                'ordem'         => $autorData['ordem'],
            ]);
        }
    }

    /**
     * @param list<string> $palavras
     */
    private function syncPalavrasChave(Publicacao $pub, array $palavras): void
    {
        DB::table('palavra_chave_publicacao')->where('publicacao_id', $pub->id)->delete();

        foreach ($palavras as $texto) {
            $texto = trim($texto);
            if ($texto === '') {
                continue;
            }

            $pk = PalavraChave::firstOrCreate(['texto' => $texto]);
            DB::table('palavra_chave_publicacao')->insert([
                'publicacao_id'   => $pub->id,
                'palavra_chave_id' => $pk->id,
            ]);
        }
    }
}
