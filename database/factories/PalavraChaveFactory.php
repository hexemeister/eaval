<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\PalavraChave;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<PalavraChave>
 */
class PalavraChaveFactory extends Factory
{
    protected $model = PalavraChave::class;

    public function definition(): array
    {
        return [
            'texto'      => $this->faker->unique()->words(nb: 2, asText: true),
            'frequencia' => 0,
        ];
    }
}
