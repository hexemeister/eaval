<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('turma')) {
            Schema::create('turma', function (Blueprint $table) {
                $table->id();
                $table->string('nome', 60);
            });
        }

        if (!Schema::hasTable('tipo_instituicao')) {
            Schema::create('tipo_instituicao', function (Blueprint $table) {
                $table->id();
                $table->string('nome', 50);
            });
        }

        if (!Schema::hasTable('forma_apresentacao')) {
            Schema::create('forma_apresentacao', function (Blueprint $table) {
                $table->id();
                $table->string('nome', 50);
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('forma_apresentacao');
        Schema::dropIfExists('tipo_instituicao');
        Schema::dropIfExists('turma');
    }
};
