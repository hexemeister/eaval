<?php

namespace Database\Seeders;

use App\Models\TermoExcecaoCaso;
use Illuminate\Database\Seeder;

class TermoExcecaoCasoSeeder extends Seeder
{
    public function run(): void
    {
        $termos = ['LGPD', 'EaD', 'CNPq', 'SciELO', 'COVID-19', 'BNCC', 'ENEM', 'MEC', 'UNESCO', 'CAPES'];

        foreach ($termos as $termo) {
            TermoExcecaoCaso::firstOrCreate(['termo' => $termo]);
        }
    }
}
