<?php

declare(strict_types=1);

namespace Tests\Feature\Admin;

use App\Models\Estado;
use App\Models\LocalPublicacao;
use App\Models\Publicacao;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

/**
 * Testes do CRUD de Periódicos (PeriodicoController / local_publicacao).
 *
 * Além do contrato padrão de lookup, cobre os comportamentos específicos:
 * campos extras (nome_abreviado, issn, estado), validação de formato ISSN
 * e unicidade de nome relaxada para registros legados duplicados.
 */
class PeriodicoCrudTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();
        $this->user = User::factory()->create();

        DB::table('pais')->insert(['sigla' => 'BR', 'nome' => 'Brasil']);
        DB::table('regiao')->insert(['sigla' => 'SE', 'sigla_pais' => 'BR', 'nome' => 'Sudeste']);
        Estado::create(['sigla' => 'SP', 'sigla_regiao' => 'SE', 'nome' => 'São Paulo']);
    }

    public function test_index_returns_config_with_estado_options(): void
    {
        LocalPublicacao::create(['nome' => 'Revista Teste']);

        $this->actingAs($this->user)
            ->get(route('admin.cadastros.periodicos.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('admin/cadastros/LookupCrud', false)
                ->has('items', 1)
                ->where('config.label', 'Periódico')
                ->where('config.labelPlural', 'Periódicos')
                ->has('config.fields', 4)
                ->where('config.fields.3.type', 'select')
                ->where('config.fields.3.options.0.value', 'SP')
            );
    }

    public function test_store_creates_record_with_all_fields(): void
    {
        $this->actingAs($this->user)
            ->post(route('admin.cadastros.periodicos.store'), [
                'nome' => 'Revista Brasileira de Avaliação',
                'nome_abreviado' => 'Rev. Bras. Aval.',
                'issn' => '1234-567X',
                'estado' => 'SP',
            ])
            ->assertRedirect()
            ->assertSessionHasNoErrors();

        $this->assertDatabaseHas('local_publicacao', [
            'nome' => 'Revista Brasileira de Avaliação',
            'nome_abreviado' => 'Rev. Bras. Aval.',
            'issn' => '1234-567X',
            'estado' => 'SP',
        ]);
    }

    public function test_store_converts_empty_optional_fields_to_null(): void
    {
        $this->actingAs($this->user)
            ->post(route('admin.cadastros.periodicos.store'), [
                'nome' => 'Revista Só Nome',
                'nome_abreviado' => '',
                'issn' => '',
                'estado' => '',
            ])
            ->assertRedirect()
            ->assertSessionHasNoErrors();

        $this->assertDatabaseHas('local_publicacao', [
            'nome' => 'Revista Só Nome',
            'nome_abreviado' => null,
            'issn' => null,
            'estado' => null,
        ]);
    }

    public function test_store_rejects_invalid_issn(): void
    {
        $this->actingAs($this->user)
            ->post(route('admin.cadastros.periodicos.store'), [
                'nome' => 'Revista ISSN Ruim',
                'issn' => '12345678',
            ])
            ->assertSessionHasErrors('issn');

        $this->assertDatabaseMissing('local_publicacao', ['nome' => 'Revista ISSN Ruim']);
    }

    public function test_store_rejects_invalid_estado(): void
    {
        $this->actingAs($this->user)
            ->post(route('admin.cadastros.periodicos.store'), [
                'nome' => 'Revista UF Ruim',
                'estado' => 'XX',
            ])
            ->assertSessionHasErrors('estado');
    }

    public function test_store_rejects_duplicate_nome(): void
    {
        LocalPublicacao::create(['nome' => 'Revista Duplicada']);

        $this->actingAs($this->user)
            ->post(route('admin.cadastros.periodicos.store'), ['nome' => 'Revista Duplicada'])
            ->assertSessionHasErrors('nome');
    }

    public function test_update_allows_saving_legacy_duplicate_without_renaming(): void
    {
        // Duplicatas pré-existentes no schema legado
        LocalPublicacao::create(['nome' => 'Educar em Revista']);
        $b = LocalPublicacao::create(['nome' => 'Educar em Revista']);

        $this->actingAs($this->user)
            ->put(route('admin.cadastros.periodicos.update', $b->id), [
                'nome' => 'Educar em Revista',
                'issn' => '1234-5678',
            ])
            ->assertRedirect()
            ->assertSessionHasNoErrors();

        $this->assertDatabaseHas('local_publicacao', ['id' => $b->id, 'issn' => '1234-5678']);
    }

    public function test_update_rejects_renaming_to_existing_nome(): void
    {
        LocalPublicacao::create(['nome' => 'Revista A']);
        $b = LocalPublicacao::create(['nome' => 'Revista B']);

        $this->actingAs($this->user)
            ->put(route('admin.cadastros.periodicos.update', $b->id), ['nome' => 'Revista A'])
            ->assertSessionHasErrors('nome');
    }

    public function test_destroy_preflight_counts_publicacoes(): void
    {
        $periodico = LocalPublicacao::create(['nome' => 'Revista Com Pubs']);
        Publicacao::create(['titulo' => 'Artigo vinculado ao periódico', 'ano' => 2024, 'local_publicacao_id' => $periodico->id]);

        $this->actingAs($this->user)
            ->deleteJson(route('admin.cadastros.periodicos.destroy', $periodico->id))
            ->assertOk()
            ->assertJsonPath('affected.publicacoes', 1);

        $this->assertDatabaseHas('local_publicacao', ['id' => $periodico->id]);
    }

    public function test_destroy_confirmed_nullifies_fk_and_deletes(): void
    {
        $periodico = LocalPublicacao::create(['nome' => 'Revista a Excluir']);
        $pub = Publicacao::create(['titulo' => 'Artigo que ficará sem periódico', 'ano' => 2024, 'local_publicacao_id' => $periodico->id]);

        $this->actingAs($this->user)
            ->post(route('admin.cadastros.periodicos.destroy-confirmed', $periodico->id))
            ->assertRedirect();

        $this->assertDatabaseMissing('local_publicacao', ['id' => $periodico->id]);
        $this->assertDatabaseHas('publicacao', ['id' => $pub->id, 'local_publicacao_id' => null]);
    }
}
