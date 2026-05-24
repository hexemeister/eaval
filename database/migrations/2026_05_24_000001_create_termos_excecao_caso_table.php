<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('termos_excecao_caso', function (Blueprint $table) {
            $table->id();
            $table->string('termo')->unique();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('termos_excecao_caso');
    }
};
