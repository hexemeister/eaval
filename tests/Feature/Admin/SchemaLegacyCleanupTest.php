<?php

declare(strict_types=1);

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Schema;

uses(RefreshDatabase::class);

it('dropped legacy tables no longer exist', function () {
    expect(Schema::hasTable('tipo_autoria'))->toBeFalse();
    expect(Schema::hasTable('modalidade'))->toBeFalse();
    expect(Schema::hasTable('vinculo_institucional_autor'))->toBeFalse();
    expect(Schema::hasTable('usuario'))->toBeFalse();
});

it('publicacao no longer has legacy fk columns', function () {
    expect(Schema::hasColumn('publicacao', 'tipo_autoria_id'))->toBeFalse();
    expect(Schema::hasColumn('publicacao', 'modalidade_id'))->toBeFalse();
    expect(Schema::hasColumn('publicacao', 'vinculo_institucional_autor_id'))->toBeFalse();
});

it('publicacao has tipo_publicacao_id and forma_apresentacao_id FKs', function () {
    expect(Schema::hasColumn('publicacao', 'tipo_publicacao_id'))->toBeTrue();
    expect(Schema::hasColumn('publicacao', 'forma_apresentacao_id'))->toBeTrue();
    expect(Schema::hasColumn('publicacao', 'tipo'))->toBeFalse();
    expect(Schema::hasColumn('publicacao', 'forma'))->toBeFalse();
});

it('publicacao has doi column', function () {
    expect(Schema::hasColumn('publicacao', 'doi'))->toBeTrue();
});
