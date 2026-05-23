<?php

declare(strict_types=1);

namespace Tests\Feature\Admin;

use App\Models\Area;
use App\Models\Autor;
use App\Models\LocalPublicacao;
use App\Models\PalavraChave;
use App\Models\Publicacao;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class PublicacoesMergeTest extends TestCase
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

    private function criarPub(string $titulo, array $extra = []): Publicacao
    {
        $local = LocalPublicacao::firstOrCreate(['nome' => 'Periódico Teste']);
        return Publicacao::create(array_merge([
            'titulo'              => $titulo,
            'ano'                 => 2024,
            'doi'                 => '10.1000/xyz',
            'resumo'              => 'Resumo com mais de cinquenta caracteres para ser válido.',
            'local_publicacao_id' => $local->id,
            'incluida_em'         => now(),
        ], $extra));
    }

    private function payloadMerge(int $id1, int $id2, array $selecoes = [], array $selecoesMn = []): array
    {
        return [
            'ids'        => [$id1, $id2],
            'selecoes'   => $selecoes,
            'selecoesMn' => array_merge([
                'autores'        => '1',
                'palavras_chave' => '1',
                'areas'          => '1',
            ], $selecoesMn),
        ];
    }

    public function test_merge_page_requer_exatamente_dois_ids(): void
    {
        $pub = $this->criarPub('Publicação única');

        $this->actingAs($this->user)
            ->get('/admin/publicacoes/merge?ids[]=' . $pub->id)
            ->assertRedirect('/admin/publicacoes');
    }

    public function test_merge_confirm_mantém_campo_selecionado(): void
    {
        $pub1 = $this->criarPub('Título da primeira publicação');
        $pub2 = $this->criarPub('Título da segunda publicação');

        $keepId = min($pub1->id, $pub2->id);

        $this->actingAs($this->user)
            ->post('/admin/publicacoes/merge', $this->payloadMerge(
                $pub1->id, $pub2->id,
                selecoes: ['titulo' => '2'],
            ))
            ->assertRedirect();

        $keep = Publicacao::find($keepId);
        $this->assertSame('Título da segunda publicação', $keep->titulo);
    }

    public function test_merge_confirm_union_de_autores(): void
    {
        $pub1 = $this->criarPub('Pub 1');
        $pub2 = $this->criarPub('Pub 2');

        $autor1 = Autor::firstOrCreate(['nome' => 'Autor Um']);
        $autor2 = Autor::firstOrCreate(['nome' => 'Autor Dois']);

        DB::table('autor_publicacao')->insert(['publicacao_id' => $pub1->id, 'autor_id' => $autor1->id, 'ordem' => 1]);
        DB::table('autor_publicacao')->insert(['publicacao_id' => $pub2->id, 'autor_id' => $autor2->id, 'ordem' => 1]);

        $keepId = min($pub1->id, $pub2->id);

        $this->actingAs($this->user)
            ->post('/admin/publicacoes/merge', $this->payloadMerge(
                $pub1->id, $pub2->id,
                selecoesMn: ['autores' => 'union'],
            ));

        $autoresKeep = DB::table('autor_publicacao')->where('publicacao_id', $keepId)->pluck('autor_id');
        $this->assertCount(2, $autoresKeep);
        $this->assertTrue($autoresKeep->contains($autor1->id));
        $this->assertTrue($autoresKeep->contains($autor2->id));
    }

    public function test_merge_confirm_exclui_publicacao_descartada(): void
    {
        $pub1      = $this->criarPub('Pub 1');
        $pub2      = $this->criarPub('Pub 2');
        $discardId = max($pub1->id, $pub2->id);

        $this->actingAs($this->user)
            ->post('/admin/publicacoes/merge', $this->payloadMerge($pub1->id, $pub2->id));

        $this->assertNull(Publicacao::find($discardId));
    }

    public function test_merge_confirm_union_de_areas(): void
    {
        $pub1 = $this->criarPub('Pub 1');
        $pub2 = $this->criarPub('Pub 2');

        $area1 = Area::firstOrCreate(['nome' => 'Educação']);
        $area2 = Area::firstOrCreate(['nome' => 'Linguística']);

        $pub1->areas()->sync([$area1->id]);
        $pub2->areas()->sync([$area2->id]);

        $keepId = min($pub1->id, $pub2->id);

        $this->actingAs($this->user)
            ->post('/admin/publicacoes/merge', $this->payloadMerge(
                $pub1->id, $pub2->id,
                selecoesMn: ['areas' => 'union'],
            ));

        $areasKeep = DB::table('area_publicacao')->where('publicacao_id', $keepId)->pluck('area_id');
        $this->assertCount(2, $areasKeep);
        $this->assertTrue($areasKeep->contains($area1->id));
        $this->assertTrue($areasKeep->contains($area2->id));
    }
}
