<?php

declare(strict_types=1);

namespace Tests\Feature\Admin;

use App\Models\Autor;
use App\Models\PalavraChave;
use App\Models\Publicacao;
use App\Models\TipoPublicacao;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PublicacoesCrudTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();
        $this->withoutMiddleware(\Illuminate\Foundation\Http\Middleware\ValidateCsrfToken::class);
        $this->user = User::factory()->create();
    }

    public function test_index_lista_publicacoes(): void
    {
        Publicacao::factory()->count(3)->create();

        $this->actingAs($this->user)
            ->get('/admin/publicacoes')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('admin/Publicacoes/Index')
                ->has('publicacoes', 3),
            );
    }

    public function test_create_renderiza_form(): void
    {
        $this->actingAs($this->user)
            ->get('/admin/publicacoes/create')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('admin/Publicacoes/Create')
                ->has('tiposPublicacao')
                ->has('areas'),
            );
    }

    public function test_store_cria_publicacao(): void
    {
        $tipo = TipoPublicacao::firstOrCreate(['nome' => 'Artigo']);

        $this->actingAs($this->user)
            ->post('/admin/publicacoes', [
                'titulo'             => 'Teste de avaliação formativa',
                'ano'                => 2024,
                'tipo_publicacao_id' => $tipo->id,
                'autores'            => [['nome' => 'João Silva', 'autor_id' => null, 'ordem' => 1]],
                'palavras_chave'     => ['avaliação', 'formativa'],
                'area_ids'           => [],
            ])
            ->assertRedirect('/admin/publicacoes');

        $this->assertDatabaseHas('publicacao', ['titulo' => 'Teste de avaliação formativa']);
        $pub = Publicacao::where('titulo', 'Teste de avaliação formativa')->first();
        $this->assertNotNull($pub);
        $this->assertCount(1, $pub->autores);
        $this->assertCount(2, $pub->palavrasChave);
    }

    public function test_edit_renderiza_form_com_dados(): void
    {
        $pub = Publicacao::factory()->create();

        $this->actingAs($this->user)
            ->get("/admin/publicacoes/{$pub->id}/edit")
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('admin/Publicacoes/Edit')
                ->has('initialData')
                ->where('publicacao.id', $pub->id),
            );
    }

    public function test_update_atualiza_publicacao(): void
    {
        $pub = Publicacao::factory()->create(['titulo' => 'Título original']);

        $this->actingAs($this->user)
            ->put("/admin/publicacoes/{$pub->id}", [
                'titulo'         => 'Título atualizado',
                'ano'            => 2023,
                'autores'        => [],
                'palavras_chave' => [],
                'area_ids'       => [],
            ])
            ->assertRedirect('/admin/publicacoes');

        $this->assertDatabaseHas('publicacao', ['id' => $pub->id, 'titulo' => 'Título atualizado']);
    }

    public function test_destroy_exclui_publicacao(): void
    {
        $pub = Publicacao::factory()->create();

        $this->actingAs($this->user)
            ->delete("/admin/publicacoes/{$pub->id}")
            ->assertRedirect();

        $this->assertDatabaseMissing('publicacao', ['id' => $pub->id]);
    }

    public function test_store_valida_titulo_obrigatorio(): void
    {
        $this->actingAs($this->user)
            ->post('/admin/publicacoes', ['ano' => 2024])
            ->assertSessionHasErrors('titulo');
    }

    public function test_buscar_autores_retorna_json(): void
    {
        Autor::factory()->create(['nome' => 'Maria Oliveira']);
        Autor::factory()->create(['nome' => 'João Silva']);

        $this->actingAs($this->user)
            ->getJson('/admin/autores/busca?q=maria')
            ->assertOk()
            ->assertJsonFragment(['nome' => 'Maria Oliveira'])
            ->assertJsonMissing(['nome' => 'João Silva']);
    }

    public function test_buscar_palavras_chave_retorna_json(): void
    {
        PalavraChave::factory()->create(['texto' => 'avaliação formativa']);
        PalavraChave::factory()->create(['texto' => 'currículo']);

        $this->actingAs($this->user)
            ->getJson('/admin/palavras-chave/busca?q=avalia')
            ->assertOk()
            ->assertJsonFragment(['texto' => 'avaliação formativa'])
            ->assertJsonMissing(['texto' => 'currículo']);
    }
}
