<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * @property int $id
 * @property string $termo
 */
class TermoExcecaoCaso extends Model
{
    protected $table = 'termos_excecao_caso';

    public $timestamps = false;

    protected $fillable = ['termo'];

    protected function casts(): array
    {
        return ['id' => 'integer', 'termo' => 'string'];
    }
}
