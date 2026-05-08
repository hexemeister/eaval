<?php

namespace Database\Factories;

use App\Models\Publicacao;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Publicacao>
 */
class PublicacaoFactory extends Factory
{
    protected $model = Publicacao::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'titulo' => $this->faker->sentence(),
            'ano' => $this->faker->year(),
            'resumo' => $this->faker->paragraph(),
            'local_publicacao_id' => 1, // Assumindo que existe
            'forma' => 'Artigo',
            'tipo' => 'Periódico',
            'link' => $this->faker->url(),
            'incluida_em' => now(),
            'turma_id' => 1,
            'eixo_tematico_id' => 1,
            'segmento_educacional_id' => 1,
        ];
    }
}
