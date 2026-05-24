<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Area;
use App\Models\EixoTematico;
use App\Models\Estado;
use App\Models\FormaApresentacao;
use App\Models\LocalPublicacao;
use App\Models\PalavraChave;
use App\Models\Publicacao;
use App\Models\QualisCape;
use App\Models\SegmentoEducacional;
use App\Models\TipoInstituicao;
use App\Models\TipoPublicacao;
use App\Models\Turma;
use App\Services\NormalizacaoTextoService;
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
            'publicacoes'     => $publicacoes,
            'pageDescription' => 'Repositório central do sistema. Cada registro representa um artigo indexado. Use a busca global para filtrar, os checkboxes para mesclar duplicatas.',
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('admin/Publicacoes/Create', [
            ...$this->formProps(),
            'defaults'        => $this->formDefaults(),
            'pageDescription' => 'Formulário completo de cadastro. Títulos e palavras-chave são normalizados automaticamente para sentence case ao salvar.',
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $this->validateRequest($request);

        DB::transaction(function () use ($validated): void {
            $fields = $validated['fields'];
            if (isset($fields['titulo']) && is_string($fields['titulo'])) {
                $fields['titulo'] = NormalizacaoTextoService::sentenceCase($fields['titulo']);
            }
            $pub = Publicacao::create([...$fields, 'incluida_em' => now()]);
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
            'publicacao'      => ['id' => $pub->id],
            'initialData'     => $initialData,
            'pageDescription' => 'Formulário completo de cadastro. Títulos e palavras-chave são normalizados automaticamente para sentence case ao salvar.',
        ]);
    }

    public function update(Request $request, int $id): RedirectResponse
    {
        $pub = Publicacao::findOrFail($id);
        $validated = $this->validateRequest($request);

        DB::transaction(function () use ($pub, $validated): void {
            $fields = $validated['fields'];
            if (isset($fields['titulo']) && is_string($fields['titulo'])) {
                $fields['titulo'] = NormalizacaoTextoService::sentenceCase($fields['titulo']);
            }
            $pub->update([...$fields, 'editada_em' => now()]);
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

    public function clone(int $id): RedirectResponse
    {
        $original = Publicacao::with(['autores', 'palavrasChave', 'areas'])->findOrFail($id);

        $novoId = DB::transaction(function () use ($original): int {
            $novo = $original->replicate(['incluida_em', 'editada_em']);
            $novo->titulo      = $original->titulo . ' (cópia)';
            $novo->incluida_em = now();
            $novo->editada_em  = null;
            $novo->save();

            foreach ($original->autores as $autor) {
                DB::table('autor_publicacao')->insert([
                    'autor_id'      => $autor->id,
                    'publicacao_id' => $novo->id,
                    'ordem'         => $autor->pivot->ordem,
                ]);
            }

            foreach ($original->palavrasChave as $pk) {
                DB::table('palavra_chave_publicacao')->insert([
                    'publicacao_id'    => $novo->id,
                    'palavra_chave_id' => $pk->id,
                ]);
            }

            $novo->areas()->sync($original->areas->pluck('id'));

            return $novo->id;
        });

        $clone = Publicacao::findOrFail($novoId);
        \App\Models\User::all()->each(fn ($u) => $u->notify(new \App\Notifications\PublicacaoClonada($clone)));

        return redirect("/admin/publicacoes/{$novoId}/edit")
            ->with('success', 'Publicação clonada com sucesso.');
    }

    public function mergePage(Request $request): Response|\Illuminate\Http\RedirectResponse
    {
        $ids = array_values(array_unique(array_filter(array_map('intval', (array) $request->get('ids', [])))));

        if (count($ids) !== 2) {
            return redirect('/admin/publicacoes')->with('error', 'Selecione exatamente 2 publicações para mesclar.');
        }

        $pubs = Publicacao::with([
            'autores', 'palavrasChave', 'areas',
            'localPublicacao', 'tipoPublicacao', 'formaApresentacao',
            'tipoInstituicao', 'turma', 'eixoTematico', 'segmentoEducacional', 'qualisCape',
        ])->findMany($ids)->sortBy('id')->values();

        [$pub1, $pub2] = [$pubs[0], $pubs[1]];

        $camposEscolares = [
            ['campo' => 'titulo',                  'label' => 'Título',                'v1' => $pub1->titulo,                       'v2' => $pub2->titulo],
            ['campo' => 'ano',                     'label' => 'Ano',                   'v1' => (string) $pub1->ano,                 'v2' => (string) $pub2->ano],
            ['campo' => 'doi',                     'label' => 'DOI',                   'v1' => $pub1->doi,                          'v2' => $pub2->doi],
            ['campo' => 'isbn',                    'label' => 'ISBN',                  'v1' => $pub1->isbn,                         'v2' => $pub2->isbn],
            ['campo' => 'link',                    'label' => 'Link',                  'v1' => $pub1->link,                         'v2' => $pub2->link],
            ['campo' => 'volume',                  'label' => 'Volume',                'v1' => $pub1->volume,                       'v2' => $pub2->volume],
            ['campo' => 'numero',                  'label' => 'Número',                'v1' => $pub1->numero,                       'v2' => $pub2->numero],
            ['campo' => 'pagina',                  'label' => 'Páginas',               'v1' => $pub1->pagina,                       'v2' => $pub2->pagina],
            ['campo' => 'resumo',                  'label' => 'Resumo',                'v1' => $pub1->resumo,                       'v2' => $pub2->resumo],
            ['campo' => 'local_publicacao_id',     'label' => 'Local de Publicação',   'v1' => $pub1->localPublicacao?->nome,       'v2' => $pub2->localPublicacao?->nome],
            ['campo' => 'tipo_publicacao_id',      'label' => 'Tipo de Publicação',    'v1' => $pub1->tipoPublicacao?->nome,        'v2' => $pub2->tipoPublicacao?->nome],
            ['campo' => 'forma_apresentacao_id',   'label' => 'Forma de Apresentação', 'v1' => $pub1->formaApresentacao?->nome,     'v2' => $pub2->formaApresentacao?->nome],
            ['campo' => 'tipo_instituicao_id',     'label' => 'Tipo de Instituição',   'v1' => $pub1->tipoInstituicao?->nome,       'v2' => $pub2->tipoInstituicao?->nome],
            ['campo' => 'turma_id',                'label' => 'Turma',                 'v1' => $pub1->turma?->nome,                 'v2' => $pub2->turma?->nome],
            ['campo' => 'eixo_tematico_id',        'label' => 'Eixo Temático',         'v1' => $pub1->eixoTematico?->nome,          'v2' => $pub2->eixoTematico?->nome],
            ['campo' => 'segmento_educacional_id', 'label' => 'Segmento Educacional',  'v1' => $pub1->segmentoEducacional?->nome,   'v2' => $pub2->segmentoEducacional?->nome],
            ['campo' => 'qualis_capes_id',         'label' => 'Qualis CAPES',          'v1' => $pub1->qualisCape?->classificacao,   'v2' => $pub2->qualisCape?->classificacao],
        ];

        $camposDiferentes = collect($camposEscolares)
            ->filter(fn ($c) => $c['v1'] !== $c['v2'])
            ->values();

        return Inertia::render('admin/Publicacoes/Merge', [
            'pub1' => [
                'id'           => $pub1->id,
                'titulo'       => $pub1->titulo,
                'autores'      => $pub1->autores->map(fn ($a) => ['id' => $a->id, 'nome' => $a->nome, 'ordem' => $a->pivot->ordem])->values(),
                'palavrasChave'=> $pub1->palavrasChave->pluck('texto')->values(),
                'areas'        => $pub1->areas->map(fn ($a) => ['id' => $a->id, 'nome' => $a->nome])->values(),
            ],
            'pub2' => [
                'id'           => $pub2->id,
                'titulo'       => $pub2->titulo,
                'autores'      => $pub2->autores->map(fn ($a) => ['id' => $a->id, 'nome' => $a->nome, 'ordem' => $a->pivot->ordem])->values(),
                'palavrasChave'=> $pub2->palavrasChave->pluck('texto')->values(),
                'areas'        => $pub2->areas->map(fn ($a) => ['id' => $a->id, 'nome' => $a->nome])->values(),
            ],
            'camposDiferentes' => $camposDiferentes,
            'pageDescription'  => 'Une dois registros em um. O registro de menor ID é mantido; o outro é excluído permanentemente. Escolha campo a campo qual valor preservar.',
        ]);
    }

    public function mergeConfirm(Request $request): RedirectResponse
    {
        $request->validate([
            'ids'                       => ['required', 'array', 'size:2'],
            'ids.*'                     => ['required', 'integer', 'exists:publicacao,id'],
            'selecoes'                  => ['present', 'array'],
            'selecoes.*'                => ['required', 'in:1,2'],
            'selecoesMn'                => ['required', 'array'],
            'selecoesMn.autores'        => ['required', 'in:1,2,union'],
            'selecoesMn.palavras_chave' => ['required', 'in:1,2,union'],
            'selecoesMn.areas'          => ['required', 'in:1,2,union'],
        ]);

        $ids        = $request->input('ids');
        $selecoes   = $request->input('selecoes', []);
        $selecoesMn = $request->input('selecoesMn');

        [$keepId, $discardId] = [min($ids), max($ids)];

        $keep    = Publicacao::with(['autores', 'palavrasChave', 'areas'])->findOrFail($keepId);
        $discard = Publicacao::with(['autores', 'palavrasChave', 'areas'])->findOrFail($discardId);

        $pubByIndex = ['1' => $keep, '2' => $discard];

        DB::transaction(function () use ($keep, $discard, $selecoes, $selecoesMn, $pubByIndex): void {
            $updateData = ['editada_em' => now()];
            foreach ($selecoes as $campo => $choice) {
                $updateData[$campo] = $pubByIndex[$choice]->{$campo};
            }
            $keep->update($updateData);

            $autoresChoice = $selecoesMn['autores'];
            if ($autoresChoice === 'union') {
                $autoresKeep    = $keep->autores->map(fn ($a) => ['autor_id' => $a->id, 'ordem' => $a->pivot->ordem]);
                $autoresDiscard = $discard->autores
                    ->reject(fn ($a) => $keep->autores->contains('id', $a->id))
                    ->values()
                    ->map(fn ($a, $i) => ['autor_id' => $a->id, 'ordem' => $autoresKeep->count() + $i + 1]);
                $todosAutores = $autoresKeep->merge($autoresDiscard);
            } else {
                $fonte        = $pubByIndex[$autoresChoice];
                $todosAutores = $fonte->autores->map(fn ($a) => ['autor_id' => $a->id, 'ordem' => $a->pivot->ordem]);
            }

            DB::table('autor_publicacao')->where('publicacao_id', $keep->id)->delete();
            foreach ($todosAutores as $a) {
                DB::table('autor_publicacao')->insert(['autor_id' => $a['autor_id'], 'publicacao_id' => $keep->id, 'ordem' => $a['ordem']]);
            }

            $pkChoice = $selecoesMn['palavras_chave'];
            if ($pkChoice === 'union') {
                $pkIds = $keep->palavrasChave->pluck('id')
                    ->merge($discard->palavrasChave->pluck('id'))
                    ->unique()->values();
            } else {
                $pkIds = $pubByIndex[$pkChoice]->palavrasChave->pluck('id');
            }

            DB::table('palavra_chave_publicacao')->where('publicacao_id', $keep->id)->delete();
            foreach ($pkIds as $pkId) {
                DB::table('palavra_chave_publicacao')->insert(['publicacao_id' => $keep->id, 'palavra_chave_id' => $pkId]);
            }

            $areasChoice = $selecoesMn['areas'];
            if ($areasChoice === 'union') {
                $areaIds = $keep->areas->pluck('id')
                    ->merge($discard->areas->pluck('id'))
                    ->unique()->values()->toArray();
            } else {
                $areaIds = $pubByIndex[$areasChoice]->areas->pluck('id')->toArray();
            }
            $keep->areas()->sync($areaIds);

            DB::table('autor_publicacao')->where('publicacao_id', $discard->id)->delete();
            DB::table('palavra_chave_publicacao')->where('publicacao_id', $discard->id)->delete();
            DB::table('area_publicacao')->where('publicacao_id', $discard->id)->delete();
            $discard->delete();
        });

        return redirect("/admin/publicacoes/{$keep->id}/edit")
            ->with('success', "Publicações #{$keep->id} e #{$discard->id} mescladas. A #{$discard->id} foi excluída.");
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    public function buscarAutores(Request $request): \Illuminate\Http\JsonResponse
    {
        $q       = trim((string) $request->get('q', ''));
        $exclude = array_filter(array_map('intval', (array) $request->get('exclude', [])));

        $autores = \App\Models\Autor::when($q !== '', fn ($query) => $query->where('nome', 'like', "%{$q}%"))
            ->when($exclude !== [], fn ($query) => $query->whereNotIn('id', $exclude))
            ->orderBy('nome')
            ->limit(20)
            ->get(['id', 'nome']);

        return response()->json($autores);
    }

    public function criarAutorInline(Request $request): \Illuminate\Http\JsonResponse
    {
        $nome = trim((string) $request->input('nome', ''));

        if ($nome === '') {
            return response()->json(['message' => 'Nome é obrigatório.'], 422);
        }

        $autor = \App\Models\Autor::firstOrCreate(['nome' => $nome]);

        return response()->json(['id' => $autor->id, 'nome' => $autor->nome], 201);
    }

    public function buscarPalavrasChave(Request $request): \Illuminate\Http\JsonResponse
    {
        $q = trim((string) $request->get('q', ''));
        $palavras = PalavraChave::when($q !== '', fn ($query) => $query->where('texto', 'like', "%{$q}%"))
            ->orderBy('texto')
            ->limit(20)
            ->get(['id', 'texto']);

        return response()->json($palavras);
    }

    public function criarPalavraChaveInline(Request $request): \Illuminate\Http\JsonResponse
    {
        $texto = trim((string) $request->input('texto', ''));

        if ($texto === '') {
            return response()->json(['message' => 'Texto é obrigatório.'], 422);
        }

        $pk = PalavraChave::firstOrCreate(['texto' => NormalizacaoTextoService::sentenceCase($texto)]);

        return response()->json(['id' => $pk->id, 'texto' => $pk->texto], 201);
    }

    /**
     * @return array<string, mixed>
     */
    private function formProps(): array
    {
        return [
            'tiposPublicacao'       => TipoPublicacao::orderBy('nome')->get(['id', 'nome']),
            'formasApresentacao'    => FormaApresentacao::orderBy('nome')->get(['id', 'nome']),
            'locaisPublicacao'      => LocalPublicacao::orderBy('nome')->get(['id', 'nome', 'nome_abreviado', 'issn', 'estado']),
            'estados'               => Estado::orderBy('nome')->get(['sigla', 'nome']),
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
     * @return array{tipo_publicacao_id: int|null, forma_apresentacao_id: int|null, area_ids: list<int>}
     */
    private function formDefaults(): array
    {
        return [
            'tipo_publicacao_id'    => TipoPublicacao::where('nome', 'Artigo')->value('id'),
            'forma_apresentacao_id' => FormaApresentacao::where('nome', 'On-line')->value('id'),
            'area_ids'              => Area::where('nome', 'Educação')->pluck('id')->toArray(),
        ];
    }

    /**
     * @return array{fields: array<string, mixed>, autores: list<array<string, mixed>>, palavras_chave: list<string>, area_ids: list<int>}
     */
    private function validateRequest(Request $request): array
    {
        $data = $request->validate([
            'titulo'                 => ['required', 'string', 'min:10', 'max:1000'],
            'ano'                    => ['required', 'integer', 'min:1990', 'max:' . (date('Y') + 1)],
            'tipo_publicacao_id'     => ['nullable', 'exists:tipo_publicacao,id'],
            'forma_apresentacao_id'  => ['nullable', 'exists:forma_apresentacao,id'],
            'isbn'                   => ['nullable', 'string', 'max:30', 'required_without_all:doi,link'],
            'doi'                    => ['nullable', 'string', 'max:255', 'required_without_all:link,isbn'],
            'link'                   => ['nullable', 'url', 'max:2048', 'required_without_all:doi,isbn'],
            'volume'                 => ['nullable', 'string', 'max:50'],
            'numero'                 => ['nullable', 'string', 'max:50'],
            'pagina'                 => ['nullable', 'string', 'max:50'],
            'local_publicacao_id'    => ['required', 'exists:local_publicacao,id'],
            'qualis_capes_id'        => ['nullable', 'exists:qualis_capes,id'],
            'tipo_instituicao_id'    => ['nullable', 'exists:tipo_instituicao,id'],
            'turma_id'               => ['nullable', 'exists:turma,id'],
            'eixo_tematico_id'       => ['nullable', 'exists:eixo_tematico,id'],
            'segmento_educacional_id' => ['nullable', 'exists:segmento_educacional,id'],
            'resumo'                 => ['required', 'string', 'min:50'],
            'autores'                => ['required', 'array', 'min:1'],
            'autores.*.nome'         => ['required_with:autores', 'string', 'max:255'],
            'autores.*.autor_id'     => ['nullable', 'integer', 'exists:autor,id'],
            'autores.*.ordem'        => ['required_with:autores', 'integer', 'min:1'],
            'palavras_chave'         => ['nullable', 'array'],
            'palavras_chave.*'       => ['string', 'max:255'],
            'area_ids'               => ['required', 'array', 'min:1'],
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

            $pk = PalavraChave::firstOrCreate(['texto' => NormalizacaoTextoService::sentenceCase($texto)]);
            DB::table('palavra_chave_publicacao')->insert([
                'publicacao_id'   => $pub->id,
                'palavra_chave_id' => $pk->id,
            ]);
        }
    }
}
