<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin\Lookups;

use App\Http\Controllers\Admin\LookupController;
use App\Models\Estado;
use App\Models\LocalPublicacao;

/**
 * CRUD de Periódicos (tabela local_publicacao).
 *
 * O schema legado contém nomes e ISSNs duplicados, então a unicidade de nome
 * só é validada quando o valor muda — permite editar os registros duplicados
 * existentes sem exigir saneamento prévio (isso é papel do módulo de curadoria).
 *
 * Não confundir com Admin\LocalPublicacaoController, que atende a criação
 * inline no formulário de publicação (buscar/storeInline/updateInline).
 */
class PeriodicoController extends LookupController
{
    /** @return class-string<LocalPublicacao> */
    protected function model(): string
    {
        return LocalPublicacao::class;
    }

    protected function label(): string
    {
        return 'Periódico';
    }

    protected function publicacaoFkColumn(): ?string
    {
        return 'local_publicacao_id';
    }

    protected function fields(): array
    {
        $estados = Estado::query()
            ->orderBy('nome')
            ->get()
            ->map(fn (Estado $e) => ['value' => $e->sigla, 'label' => "{$e->nome} ({$e->sigla})"])
            ->values()
            ->all();

        return [
            ['name' => 'nome', 'label' => 'Nome', 'type' => 'text', 'required' => true],
            ['name' => 'nome_abreviado', 'label' => 'Nome abreviado', 'type' => 'text', 'required' => false],
            [
                'name' => 'issn',
                'label' => 'ISSN',
                'type' => 'text',
                'required' => false,
                'width' => 200,
                'rules' => ['nullable', 'string', 'regex:/^\d{4}-\d{3}[\dXx]$/'],
            ],
            [
                'name' => 'estado',
                'label' => 'Estado/UF',
                'type' => 'select',
                'required' => false,
                'options' => $estados,
                'rules' => ['nullable', 'string', 'exists:estado,sigla'],
            ],
        ];
    }

    protected function nameRules(?int $ignoreId = null): array
    {
        return [
            'required',
            'string',
            'max:255',
            function (string $attribute, mixed $value, \Closure $fail) use ($ignoreId): void {
                $nome = trim((string) $value);

                // Nome inalterado em edição: não valida unicidade (legado tem duplicatas)
                if ($ignoreId !== null) {
                    $atual = LocalPublicacao::find($ignoreId);
                    if ($atual !== null && trim((string) $atual->nome) === $nome) {
                        return;
                    }
                }

                $query = LocalPublicacao::where('nome', $nome);
                if ($ignoreId !== null) {
                    $query->where('id', '!=', $ignoreId);
                }
                if ($query->exists()) {
                    $fail('Este nome já está cadastrado.');
                }
            },
        ];
    }

    protected function validationMessages(): array
    {
        return parent::validationMessages() + [
            'issn.regex' => 'O ISSN deve estar no formato 1234-5678 (o último dígito pode ser X).',
            'estado.exists' => 'Estado inválido.',
        ];
    }

    protected function datasetWarning(): bool
    {
        return true;
    }

    protected function description(): string
    {
        return 'Periódicos e locais de publicação dos artigos do acervo. O ISSN identifica o periódico; o Estado/UF indica a origem editorial e alimenta as estatísticas geográficas.';
    }
}
