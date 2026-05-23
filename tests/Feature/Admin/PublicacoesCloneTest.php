<?php

declare(strict_types=1);

namespace Tests\Feature\Admin;

use App\Models\Area;
use App\Models\Autor;
use App\Models\LocalPublicacao;
use App\Models\PalavraChave;
use App\Models\Publicacao;
use App\Models\User;
use App\Notifications\PublicacaoClonada;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class PublicacoesCloneTest extends TestCase
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

    private function criarPublicacaoComPivots(): Publicacao
    {
        $local = LocalPublicacao::firstOrCreate(['nome' => 'Periódico Teste']);
        $area  = Area::firstOrCreate(['nome' => 'Educação']);
        $autor = Autor::firstOrCreate(['nome' => 'Autor Teste']);
        $pk    = PalavraChave::firstOrCreate(['texto' => 'avaliação']);

        $pub = Publicacao::create([
            'titulo'              => 'Título original da publicação',
            'ano'                 => 2024,
            'doi'                 => '10.1000/xyz',
            'resumo'              => 'Resumo com mais de cinquenta caracteres para ser válido.',
            'local_publicacao_id' => $local->id,
            'incluida_em'         => now(),
        ]);

        \Illuminate\Support\Facades\DB::table('autor_publicacao')->insert([
            'publicacao_id' => $pub->id,
            'autor_id'      => $autor->id,
            'ordem'         => 1,
        ]);
        \Illuminate\Support\Facades\DB::table('palavra_chave_publicacao')->insert([
            'publicacao_id'    => $pub->id,
            'palavra_chave_id' => $pk->id,
        ]);
        $pub->areas()->sync([$area->id]);

        return $pub;
    }

    public function test_clone_cria_copia_com_sufixo(): void
    {
        $original = $this->criarPublicacaoComPivots();

        $this->actingAs($this->user)
            ->post("/admin/publicacoes/{$original->id}/clone")
            ->assertRedirect();

        $clone = Publicacao::where('titulo', 'like', '%(cópia)')->first();
        $this->assertNotNull($clone);
        $this->assertSame($original->titulo . ' (cópia)', $clone->titulo);
        $this->assertNotNull($clone->incluida_em);
        $this->assertNull($clone->editada_em);
    }

    public function test_clone_copia_todos_os_pivots(): void
    {
        $original = $this->criarPublicacaoComPivots();

        $this->actingAs($this->user)
            ->post("/admin/publicacoes/{$original->id}/clone");

        $clone = Publicacao::where('titulo', 'like', '%(cópia)')->with(['autores', 'palavrasChave', 'areas'])->first();

        $this->assertCount(1, $clone->autores);
        $this->assertSame('Autor Teste', $clone->autores->first()->nome);
        $this->assertCount(1, $clone->palavrasChave);
        $this->assertSame('avaliação', $clone->palavrasChave->first()->texto);
        $this->assertCount(1, $clone->areas);
    }

    public function test_clone_cria_notificacao(): void
    {
        Notification::fake();
        $original = $this->criarPublicacaoComPivots();

        $this->actingAs($this->user)
            ->post("/admin/publicacoes/{$original->id}/clone");

        Notification::assertSentTo($this->user, PublicacaoClonada::class);
    }

    public function test_clone_redireciona_para_edicao(): void
    {
        $original = $this->criarPublicacaoComPivots();

        $this->actingAs($this->user)
            ->post("/admin/publicacoes/{$original->id}/clone")
            ->assertRedirectContains('/admin/publicacoes/')
            ->assertRedirectContains('/edit');
    }
}
