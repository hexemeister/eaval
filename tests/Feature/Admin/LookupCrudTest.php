<?php

declare(strict_types=1);

namespace Tests\Feature\Admin;

use App\Models\Publicacao;
use App\Models\SegmentoEducacional;
use App\Models\User;
use App\Notifications\LookupItemDeleted;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

/**
 * Testes de integração do LookupController via SegmentoEducacional.
 *
 * Cobrem as 5 actions: index, store, update, destroy (preflight JSON), destroyConfirmed.
 * Servem de contrato para todos os subcontrollers — basta replicar o padrão para outros CRUDs.
 */
class LookupCrudTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();
        $this->user = User::factory()->create();
    }

    // ─── Autenticação ────────────────────────────────────────────────────────

    /** @test */
    public function test_guests_cannot_access_index(): void
    {
        $this->get(route('admin.cadastros.segmentos-educacionais.index'))
            ->assertRedirect(route('login'));
    }

    /** @test */
    public function test_guests_cannot_store(): void
    {
        $this->post(route('admin.cadastros.segmentos-educacionais.store'), ['nome' => 'Novo'])
            ->assertRedirect(route('login'));
    }

    // ─── Index ───────────────────────────────────────────────────────────────

    /** @test */
    public function test_index_returns_all_items(): void
    {
        SegmentoEducacional::create(['nome' => 'Educação Básica']);
        SegmentoEducacional::create(['nome' => 'Educação Superior']);

        $this->actingAs($this->user)
            ->get(route('admin.cadastros.segmentos-educacionais.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('admin/cadastros/LookupCrud', false)
                ->has('items', 2)
                ->where('config.label', 'Segmento Educacional')
                ->where('config.datasetWarning', true)
            );
    }

    /** @test */
    public function test_index_returns_items_ordered_by_id(): void
    {
        $a = SegmentoEducacional::create(['nome' => 'Zebra']);
        $b = SegmentoEducacional::create(['nome' => 'Alfa']);

        $this->actingAs($this->user)
            ->get(route('admin.cadastros.segmentos-educacionais.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->has('items', 2)
                ->where('items.0.id', $a->id)
                ->where('items.1.id', $b->id)
            );
    }

    // ─── Store ───────────────────────────────────────────────────────────────

    /** @test */
    public function test_store_creates_record(): void
    {
        $this->actingAs($this->user)
            ->post(route('admin.cadastros.segmentos-educacionais.store'), ['nome' => 'Novo Segmento'])
            ->assertRedirect();

        $this->assertDatabaseHas('segmento_educacional', ['nome' => 'Novo Segmento']);
    }

    /** @test */
    public function test_store_rejects_duplicate_nome(): void
    {
        SegmentoEducacional::create(['nome' => 'Duplicado']);

        $this->actingAs($this->user)
            ->post(route('admin.cadastros.segmentos-educacionais.store'), ['nome' => 'Duplicado'])
            ->assertSessionHasErrors('nome');

        $this->assertDatabaseCount('segmento_educacional', 1);
    }

    /** @test */
    public function test_store_rejects_empty_nome(): void
    {
        $this->actingAs($this->user)
            ->post(route('admin.cadastros.segmentos-educacionais.store'), ['nome' => ''])
            ->assertSessionHasErrors('nome');
    }

    // ─── Update ──────────────────────────────────────────────────────────────

    /** @test */
    public function test_update_changes_nome(): void
    {
        $seg = SegmentoEducacional::create(['nome' => 'Antigo']);

        $this->actingAs($this->user)
            ->put(route('admin.cadastros.segmentos-educacionais.update', $seg->id), ['nome' => 'Novo Nome'])
            ->assertRedirect();

        $this->assertDatabaseHas('segmento_educacional', ['id' => $seg->id, 'nome' => 'Novo Nome']);
    }

    /** @test */
    public function test_update_allows_saving_same_nome(): void
    {
        $seg = SegmentoEducacional::create(['nome' => 'Mesmo Nome']);

        $this->actingAs($this->user)
            ->put(route('admin.cadastros.segmentos-educacionais.update', $seg->id), ['nome' => 'Mesmo Nome'])
            ->assertRedirect()
            ->assertSessionHasNoErrors();
    }

    /** @test */
    public function test_update_rejects_nome_already_taken_by_other(): void
    {
        SegmentoEducacional::create(['nome' => 'Ocupado']);
        $seg = SegmentoEducacional::create(['nome' => 'Outro']);

        $this->actingAs($this->user)
            ->put(route('admin.cadastros.segmentos-educacionais.update', $seg->id), ['nome' => 'Ocupado'])
            ->assertSessionHasErrors('nome');
    }

    // ─── Destroy (preflight JSON) ────────────────────────────────────────────

    /** @test */
    public function test_destroy_returns_json_with_zero_affected(): void
    {
        $seg = SegmentoEducacional::create(['nome' => 'Sem Publicacoes']);

        $this->actingAs($this->user)
            ->deleteJson(route('admin.cadastros.segmentos-educacionais.destroy', $seg->id))
            ->assertOk()
            ->assertJson([
                'affected' => ['publicacoes' => 0],
                'sample'   => [],
            ]);

        // Preflight não deleta
        $this->assertDatabaseHas('segmento_educacional', ['id' => $seg->id]);
    }

    /** @test */
    public function test_destroy_returns_count_of_affected_publicacoes(): void
    {
        $seg = SegmentoEducacional::create(['nome' => 'Com Publicacoes']);

        // Inserções mínimas: SQLite não enforça FK, só 'id' é NOT NULL
        \Illuminate\Support\Facades\DB::table('publicacao')->insert([
            ['titulo' => 'Pub 1', 'segmento_educacional_id' => $seg->id],
            ['titulo' => 'Pub 2', 'segmento_educacional_id' => $seg->id],
            ['titulo' => 'Pub 3', 'segmento_educacional_id' => $seg->id],
        ]);

        $this->actingAs($this->user)
            ->deleteJson(route('admin.cadastros.segmentos-educacionais.destroy', $seg->id))
            ->assertOk()
            ->assertJson(['affected' => ['publicacoes' => 3]]);
    }

    /** @test */
    public function test_destroy_returns_404_for_missing_id(): void
    {
        $this->actingAs($this->user)
            ->deleteJson(route('admin.cadastros.segmentos-educacionais.destroy', 99999))
            ->assertNotFound();
    }

    // ─── DestroyConfirmed ────────────────────────────────────────────────────

    /** @test */
    public function test_destroy_confirmed_deletes_record(): void
    {
        $seg = SegmentoEducacional::create(['nome' => 'A Deletar']);

        $this->actingAs($this->user)
            ->post(route('admin.cadastros.segmentos-educacionais.destroy-confirmed', $seg->id))
            ->assertRedirect();

        $this->assertDatabaseMissing('segmento_educacional', ['id' => $seg->id]);
    }

    /** @test */
    public function test_destroy_confirmed_nullifies_fk_on_publicacoes(): void
    {
        $seg = SegmentoEducacional::create(['nome' => 'Tem Vinculo']);

        $ids = \Illuminate\Support\Facades\DB::table('publicacao')->insertGetId(['titulo' => 'Pub A', 'segmento_educacional_id' => $seg->id]);
        \Illuminate\Support\Facades\DB::table('publicacao')->insert(['titulo' => 'Pub B', 'segmento_educacional_id' => $seg->id]);

        $affected = \Illuminate\Support\Facades\DB::table('publicacao')
            ->where('segmento_educacional_id', $seg->id)
            ->pluck('id');

        $this->actingAs($this->user)
            ->post(route('admin.cadastros.segmentos-educacionais.destroy-confirmed', $seg->id))
            ->assertRedirect();

        $this->assertDatabaseMissing('segmento_educacional', ['id' => $seg->id]);

        foreach ($affected as $pubId) {
            $this->assertDatabaseHas('publicacao', ['id' => $pubId, 'segmento_educacional_id' => null]);
        }
    }

    /** @test */
    public function test_destroy_confirmed_sends_notification_when_affected(): void
    {
        Notification::fake();

        $seg = SegmentoEducacional::create(['nome' => 'Notificar']);
        \Illuminate\Support\Facades\DB::table('publicacao')->insert(['titulo' => 'Vinculada', 'segmento_educacional_id' => $seg->id]);

        $this->actingAs($this->user)
            ->post(route('admin.cadastros.segmentos-educacionais.destroy-confirmed', $seg->id));

        Notification::assertSentTo($this->user, LookupItemDeleted::class);
    }

    /** @test */
    public function test_destroy_confirmed_does_not_notify_when_no_affected(): void
    {
        Notification::fake();

        $seg = SegmentoEducacional::create(['nome' => 'Sem Vinculo']);

        $this->actingAs($this->user)
            ->post(route('admin.cadastros.segmentos-educacionais.destroy-confirmed', $seg->id));

        Notification::assertNothingSent();
    }
}
