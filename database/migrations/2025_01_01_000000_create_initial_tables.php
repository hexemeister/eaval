<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('publicacao', function (Blueprint $table) {
            $table->id();
            $table->string('tipo')->nullable();
            $table->string('titulo')->nullable();
            $table->integer('local_publicacao_id')->nullable();
            $table->string('forma')->nullable();
            $table->integer('ano')->nullable();
            $table->string('volume')->nullable();
            $table->string('numero')->nullable();
            $table->string('pagina')->nullable();
            $table->string('isbn')->nullable();
            $table->text('resumo')->nullable();
            $table->string('link')->nullable();
            $table->timestamp('incluida_em')->nullable();
            $table->timestamp('editada_em')->nullable();
            $table->integer('turma_id')->nullable();
            $table->integer('eixo_tematico_id')->nullable();
            $table->integer('segmento_educacional_id')->nullable();
            $table->integer('tipo_instituicao_id')->nullable();
            $table->integer('qualis_capes_id')->nullable();
            $table->integer('tipo_autoria_id')->nullable();
            $table->integer('modalidade_id')->nullable();
            $table->integer('vinculo_institucional_autor_id')->nullable();
        });

        Schema::create('autor', function (Blueprint $table) {
            $table->id();
            $table->string('nome')->nullable();
        });

        Schema::create('autor_publicacao', function (Blueprint $table) {
            $table->foreignId('publicacao_id');
            $table->foreignId('autor_id');
            $table->integer('ordem')->default(1);
        });

        Schema::create('palavra_chave', function (Blueprint $table) {
            $table->id();
            $table->string('texto')->nullable();
            $table->integer('frequencia')->default(0);
        });

        Schema::create('palavra_chave_publicacao', function (Blueprint $table) {
            $table->foreignId('publicacao_id');
            $table->foreignId('palavra_chave_id');
        });

        Schema::create('area', function (Blueprint $table) {
            $table->id();
            $table->string('nome')->nullable();
        });

        Schema::create('area_publicacao', function (Blueprint $table) {
            $table->foreignId('area_id');
            $table->foreignId('publicacao_id');
        });

        Schema::create('local_publicacao', function (Blueprint $table) {
            $table->id();
            $table->string('nome')->nullable();
            $table->string('nome_abreviado')->nullable();
            $table->string('issn')->nullable();
            $table->string('estado')->nullable();
        });

        Schema::create('estado', function (Blueprint $table) {
            $table->id();
            $table->string('sigla')->nullable();
            $table->string('sigla_regiao')->nullable();
            $table->string('nome')->nullable();
        });

        Schema::create('regiao', function (Blueprint $table) {
            $table->id();
            $table->string('sigla_pais')->nullable();
            $table->string('sigla')->nullable();
            $table->string('nome')->nullable();
        });

        Schema::create('pais', function (Blueprint $table) {
            $table->id();
            $table->string('sigla')->nullable();
            $table->string('nome')->nullable();
        });

        Schema::create('eixo_tematico', function (Blueprint $table) {
            $table->id();
            $table->string('nome')->nullable();
        });

        Schema::create('segmento_educacional', function (Blueprint $table) {
            $table->id();
            $table->string('nome')->nullable();
        });

        Schema::create('qualis_capes', function (Blueprint $table) {
            $table->id();
            $table->string('classificacao')->nullable();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('qualis_capes');
        Schema::dropIfExists('segmento_educacional');
        Schema::dropIfExists('eixo_tematico');
        Schema::dropIfExists('pais');
        Schema::dropIfExists('regiao');
        Schema::dropIfExists('estado');
        Schema::dropIfExists('local_publicacao');
        Schema::dropIfExists('area_publicacao');
        Schema::dropIfExists('area');
        Schema::dropIfExists('palavra_chave_publicacao');
        Schema::dropIfExists('palavra_chave');
        Schema::dropIfExists('autor_publicacao');
        Schema::dropIfExists('autor');
        Schema::dropIfExists('publicacao');
    }
};
