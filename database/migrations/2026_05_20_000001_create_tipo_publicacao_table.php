<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('tipo_publicacao')) {
            return;
        }

        Schema::create('tipo_publicacao', function (Blueprint $table) {
            $table->id();
            $table->string('nome', 255)->nullable();
        });

        DB::table('tipo_publicacao')->insert([
            ['id' => 1, 'nome' => 'Artigo'],
            ['id' => 2, 'nome' => 'Livro'],
            ['id' => 3, 'nome' => 'Capítulo de livro'],
            ['id' => 4, 'nome' => 'Dissertação'],
            ['id' => 5, 'nome' => 'Tese'],
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('tipo_publicacao');
    }
};
