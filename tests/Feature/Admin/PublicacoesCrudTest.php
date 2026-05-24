<?php

declare(strict_types=1);

namespace Tests\Feature\Admin;

use App\Models\Area;
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

    // ─── Helpers ─────────────────────────────────────────────────────────────

    private function localPublicacaoId(): int
    {
        return \App\Models\LocalPublicacao::firstOrCreate(['nome' => 'Periódico Teste'])->id;
    }

    private function areaId(): int
    {
        return Area::firstOrCreate(['nome' => 'Educação'])->id;
    }

    private function resumoValido(): string
    {
        return 'Este é um resumo com mais de cinquenta caracteres para passar na validação.';
    }

    private function dadosMinimos(): array
    {
        return [
            'titulo'              => 'Título com dez ou mais caracteres',
            'ano'                 => 2024,
            'doi'                 => '10.1000/xyz',
            'local_publicacao_id' => $this->localPublicacaoId(),
            'resumo'              => $this->resumoValido(),
            'autores'             => [['nome' => 'Autor Padrão da Silva', 'autor_id' => null, 'ordem' => 1]],
            'area_ids'            => [$this->areaId()],
        ];
    }

    // ─── CRUD básico ─────────────────────────────────────────────────────────

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
                'titulo'              => 'Teste de avaliação formativa',
                'ano'                 => 2024,
                'link'                => 'https://exemplo.com/artigo',
                'local_publicacao_id' => $this->localPublicacaoId(),
                'tipo_publicacao_id'  => $tipo->id,
                'resumo'              => $this->resumoValido(),
                'autores'             => [['nome' => 'João Silva', 'autor_id' => null, 'ordem' => 1]],
                'palavras_chave'      => ['avaliação', 'formativa'],
                'area_ids'            => [$this->areaId()],
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
        $pub = Publicacao::factory()->create(['titulo' => 'Título original longo o suficiente', 'ano' => 2020]);

        $this->actingAs($this->user)
            ->put("/admin/publicacoes/{$pub->id}", array_merge($this->dadosMinimos(), [
                'titulo' => 'Título atualizado com tamanho suficiente',
                'ano'    => 2023,
            ]))
            ->assertRedirect('/admin/publicacoes');

        $this->assertDatabaseHas('publicacao', ['id' => $pub->id, 'titulo' => 'Título atualizado com tamanho suficiente']);
    }

    public function test_destroy_exclui_publicacao(): void
    {
        $pub = Publicacao::factory()->create();

        $this->actingAs($this->user)
            ->delete("/admin/publicacoes/{$pub->id}")
            ->assertRedirect();

        $this->assertDatabaseMissing('publicacao', ['id' => $pub->id]);
    }

    // ─── Acesso de convidados ─────────────────────────────────────────────────

    public function test_guest_nao_acessa_create(): void
    {
        $this->get('/admin/publicacoes/create')->assertRedirect();
    }

    public function test_guest_nao_acessa_store(): void
    {
        $this->post('/admin/publicacoes', ['titulo' => 'X', 'ano' => 2024])
            ->assertRedirect();
    }

    // ─── Campos retornados no index ───────────────────────────────────────────

    public function test_index_inclui_campos_esperados(): void
    {
        Publicacao::factory()->create(['titulo' => 'Artigo extenso com X', 'ano' => 2023, 'doi' => '10.1/x', 'isbn' => '978-0']);

        $this->actingAs($this->user)
            ->get('/admin/publicacoes')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('admin/Publicacoes/Index')
                ->where('publicacoes.0.title', 'Artigo extenso com X')
                ->where('publicacoes.0.year', 2023)
                ->where('publicacoes.0.doi', '10.1/x')
                ->where('publicacoes.0.isbn', '978-0'),
            );
    }

    // ─── Timestamps ──────────────────────────────────────────────────────────

    public function test_store_define_incluida_em(): void
    {
        $this->actingAs($this->user)
            ->post('/admin/publicacoes', $this->dadosMinimos())
            ->assertRedirect('/admin/publicacoes');

        $pub = Publicacao::where('titulo', 'Título com dez ou mais caracteres')->first();
        $this->assertNotNull($pub->incluida_em);
    }

    public function test_update_define_editada_em(): void
    {
        $pub = Publicacao::factory()->create(['editada_em' => null, 'ano' => 2020]);

        $this->actingAs($this->user)
            ->put("/admin/publicacoes/{$pub->id}", array_merge($this->dadosMinimos(), ['ano' => 2020]))
            ->assertRedirect('/admin/publicacoes');

        $this->assertNotNull($pub->fresh()->editada_em);
    }

    // ─── Validação de campos obrigatórios ────────────────────────────────────

    public function test_store_valida_titulo_obrigatorio(): void
    {
        $this->actingAs($this->user)
            ->post('/admin/publicacoes', ['ano' => 2024])
            ->assertSessionHasErrors('titulo');
    }

    public function test_store_valida_titulo_minimo(): void
    {
        $this->actingAs($this->user)
            ->post('/admin/publicacoes', array_merge($this->dadosMinimos(), ['titulo' => 'Curto']))
            ->assertSessionHasErrors('titulo');
    }

    public function test_store_valida_ano_obrigatorio(): void
    {
        $this->actingAs($this->user)
            ->post('/admin/publicacoes', ['titulo' => 'Título sem ano longo suficiente'])
            ->assertSessionHasErrors('ano');
    }

    public function test_store_valida_resumo_obrigatorio(): void
    {
        $dados = $this->dadosMinimos();
        unset($dados['resumo']);

        $this->actingAs($this->user)
            ->post('/admin/publicacoes', $dados)
            ->assertSessionHasErrors('resumo');
    }

    public function test_store_valida_resumo_minimo(): void
    {
        $this->actingAs($this->user)
            ->post('/admin/publicacoes', array_merge($this->dadosMinimos(), ['resumo' => 'Curto demais']))
            ->assertSessionHasErrors('resumo');
    }

    public function test_store_valida_autores_obrigatorio(): void
    {
        $dados = $this->dadosMinimos();
        unset($dados['autores']);

        $this->actingAs($this->user)
            ->post('/admin/publicacoes', $dados)
            ->assertSessionHasErrors('autores');
    }

    public function test_store_valida_pelo_menos_um_autor(): void
    {
        $this->actingAs($this->user)
            ->post('/admin/publicacoes', array_merge($this->dadosMinimos(), ['autores' => []]))
            ->assertSessionHasErrors('autores');
    }

    public function test_store_valida_area_obrigatoria(): void
    {
        $dados = array_merge($this->dadosMinimos(), ['area_ids' => []]);

        $this->actingAs($this->user)
            ->post('/admin/publicacoes', $dados)
            ->assertSessionHasErrors('area_ids');
    }

    public function test_store_valida_localizador_obrigatorio(): void
    {
        $dados = $this->dadosMinimos();
        unset($dados['doi']);

        $this->actingAs($this->user)
            ->post('/admin/publicacoes', $dados)
            ->assertSessionHasErrors(['doi', 'link', 'isbn']);
    }

    public function test_store_valida_local_publicacao_obrigatorio(): void
    {
        $dados = $this->dadosMinimos();
        unset($dados['local_publicacao_id']);

        $this->actingAs($this->user)
            ->post('/admin/publicacoes', $dados)
            ->assertSessionHasErrors('local_publicacao_id');
    }

    public function test_store_valida_link_invalido(): void
    {
        $this->actingAs($this->user)
            ->post('/admin/publicacoes', array_merge($this->dadosMinimos(), ['doi' => null, 'link' => 'nao-e-url']))
            ->assertSessionHasErrors('link');
    }

    // ─── Validação de localizadores alternativos ──────────────────────────────

    public function test_store_aceita_apenas_doi_como_localizador(): void
    {
        $this->actingAs($this->user)
            ->post('/admin/publicacoes', $this->dadosMinimos())
            ->assertRedirect('/admin/publicacoes');
    }

    public function test_store_aceita_apenas_link_como_localizador(): void
    {
        $dados = $this->dadosMinimos();
        unset($dados['doi']);
        $dados['link'] = 'https://exemplo.com/artigo';

        $this->actingAs($this->user)
            ->post('/admin/publicacoes', $dados)
            ->assertRedirect('/admin/publicacoes');
    }

    public function test_store_aceita_apenas_isbn_como_localizador(): void
    {
        $dados = $this->dadosMinimos();
        unset($dados['doi']);
        $dados['isbn'] = '978-3-16-148410-0';

        $this->actingAs($this->user)
            ->post('/admin/publicacoes', $dados)
            ->assertRedirect('/admin/publicacoes');
    }

    // ─── Sincronização de autores ─────────────────────────────────────────────

    public function test_update_sincroniza_ordem_dos_autores(): void
    {
        $pub   = Publicacao::factory()->create(['ano' => 2020]);
        $autor1 = Autor::factory()->create(['nome' => 'Primeiro Autor']);
        $autor2 = Autor::factory()->create(['nome' => 'Segundo Autor']);

        $this->actingAs($this->user)
            ->put("/admin/publicacoes/{$pub->id}", [
                'titulo'              => 'Título atualizado com tamanho suficiente',
                'ano'                 => 2020,
                'link'                => 'https://exemplo.com',
                'local_publicacao_id' => $this->localPublicacaoId(),
                'resumo'              => $this->resumoValido(),
                'autores'             => [
                    ['autor_id' => $autor2->id, 'nome' => $autor2->nome, 'ordem' => 1],
                    ['autor_id' => $autor1->id, 'nome' => $autor1->nome, 'ordem' => 2],
                ],
                'area_ids'            => [$this->areaId()],
            ])
            ->assertRedirect('/admin/publicacoes');

        $pivot = \DB::table('autor_publicacao')
            ->where('publicacao_id', $pub->id)
            ->orderBy('ordem')
            ->get();

        $this->assertEquals($autor2->id, $pivot[0]->autor_id);
        $this->assertEquals(1, $pivot[0]->ordem);
        $this->assertEquals($autor1->id, $pivot[1]->autor_id);
        $this->assertEquals(2, $pivot[1]->ordem);
    }

    // ─── Busca de autores e palavras-chave ────────────────────────────────────

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

    public function test_buscar_autores_exclui_ids_informados(): void
    {
        $autor1 = Autor::factory()->create(['nome' => 'Maria Oliveira']);
        Autor::factory()->create(['nome' => 'Maria Santos']);

        $this->actingAs($this->user)
            ->getJson("/admin/autores/busca?q=maria&exclude[]={$autor1->id}")
            ->assertOk()
            ->assertJsonMissing(['nome' => 'Maria Oliveira'])
            ->assertJsonFragment(['nome' => 'Maria Santos']);
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

    // ─── Criação inline ───────────────────────────────────────────────────────

    public function test_criar_autor_inline(): void
    {
        $this->actingAs($this->user)
            ->postJson('/admin/autores/inline', ['nome' => 'Ana Beatriz Costa'])
            ->assertStatus(201)
            ->assertJsonFragment(['nome' => 'Ana Beatriz Costa']);

        $this->assertDatabaseHas('autor', ['nome' => 'Ana Beatriz Costa']);
    }

    public function test_criar_autor_inline_sem_nome_retorna_erro(): void
    {
        $this->actingAs($this->user)
            ->postJson('/admin/autores/inline', ['nome' => ''])
            ->assertStatus(422);
    }

    public function test_criar_autor_inline_idempotente(): void
    {
        Autor::factory()->create(['nome' => 'Carlos Mendes']);

        $this->actingAs($this->user)
            ->postJson('/admin/autores/inline', ['nome' => 'Carlos Mendes'])
            ->assertStatus(201)
            ->assertJsonFragment(['nome' => 'Carlos Mendes']);

        $this->assertDatabaseCount('autor', 1);
    }

    public function test_criar_palavra_chave_inline(): void
    {
        $this->actingAs($this->user)
            ->postJson('/admin/palavras-chave/inline', ['texto' => 'avaliação formativa'])
            ->assertStatus(201)
            ->assertJsonFragment(['texto' => 'Avaliação formativa']);

        $this->assertDatabaseHas('palavra_chave', ['texto' => 'Avaliação formativa']);
    }

    public function test_criar_palavra_chave_inline_sem_texto_retorna_erro(): void
    {
        $this->actingAs($this->user)
            ->postJson('/admin/palavras-chave/inline', ['texto' => ''])
            ->assertStatus(422);
    }

    public function test_guest_nao_acessa_criar_autor_inline(): void
    {
        $this->postJson('/admin/autores/inline', ['nome' => 'X'])
            ->assertStatus(401);
    }

    public function test_guest_nao_acessa_criar_palavra_chave_inline(): void
    {
        $this->postJson('/admin/palavras-chave/inline', ['texto' => 'X'])
            ->assertStatus(401);
    }

    // ─── Locais de publicação inline ─────────────────────────────────────────

    public function test_buscar_locais_publicacao_retorna_json(): void
    {
        \App\Models\LocalPublicacao::firstOrCreate(['nome' => 'Revista Brasileira de Educação'], [
            'issn' => '1413-2478', 'estado' => 'RJ',
        ]);
        \App\Models\LocalPublicacao::firstOrCreate(['nome' => 'Cadernos de Pesquisa'], [
            'issn' => '0100-1574', 'estado' => 'SP',
        ]);

        $this->actingAs($this->user)
            ->getJson('/admin/locais-publicacao/busca?q=revista')
            ->assertOk()
            ->assertJsonFragment(['nome' => 'Revista Brasileira de Educação'])
            ->assertJsonMissing(['nome' => 'Cadernos de Pesquisa']);
    }

    public function test_buscar_locais_publicacao_filtra_por_estado(): void
    {
        \App\Models\LocalPublicacao::firstOrCreate(['nome' => 'Periódico SP'], ['estado' => 'SP']);
        \App\Models\LocalPublicacao::firstOrCreate(['nome' => 'Periódico RJ'], ['estado' => 'RJ']);

        $this->actingAs($this->user)
            ->getJson('/admin/locais-publicacao/busca?estado=SP')
            ->assertOk()
            ->assertJsonFragment(['nome' => 'Periódico SP'])
            ->assertJsonMissing(['nome' => 'Periódico RJ']);
    }

    public function test_criar_local_publicacao_inline(): void
    {
        $this->actingAs($this->user)
            ->postJson('/admin/locais-publicacao/inline', [
                'nome'           => 'Novo Periódico Teste',
                'nome_abreviado' => 'NPT',
                'issn'           => '0000-0001',
                'estado'         => 'MG',
            ])
            ->assertStatus(201)
            ->assertJsonFragment(['nome' => 'Novo Periódico Teste', 'issn' => '0000-0001', 'estado' => 'MG']);

        $this->assertDatabaseHas('local_publicacao', ['nome' => 'Novo Periódico Teste']);
    }

    public function test_criar_local_publicacao_inline_sem_nome_retorna_erro(): void
    {
        $this->actingAs($this->user)
            ->postJson('/admin/locais-publicacao/inline', ['issn' => '0000-0001'])
            ->assertStatus(422);
    }

    public function test_update_inline_local_publicacao(): void
    {
        $local = \App\Models\LocalPublicacao::firstOrCreate(['nome' => 'Periódico Para Editar']);

        $this->actingAs($this->user)
            ->patchJson("/admin/locais-publicacao/{$local->id}/inline", [
                'nome_abreviado' => 'PPE',
                'issn'           => '1234-5678',
                'estado'         => 'BA',
            ])
            ->assertOk()
            ->assertJsonFragment(['nome_abreviado' => 'PPE', 'issn' => '1234-5678', 'estado' => 'BA']);

        $this->assertDatabaseHas('local_publicacao', [
            'id'             => $local->id,
            'nome_abreviado' => 'PPE',
            'issn'           => '1234-5678',
            'estado'         => 'BA',
        ]);
    }

    public function test_guest_nao_acessa_locais_publicacao_inline(): void
    {
        $this->postJson('/admin/locais-publicacao/inline', ['nome' => 'X'])
            ->assertStatus(401);
    }
}
