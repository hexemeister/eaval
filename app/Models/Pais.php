<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * Class Pais
 *
 * @property int $id
 * @property string|null $sigla
 * @property string|null $nome
 */
class Pais extends Model
{
    protected $table = 'pais';

    public $timestamps = false;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'id',
        'sigla',
        'nome',
    ];

    /**
     * The model's default values for attributes.
     *
     * @var array<string, mixed>
     */
    protected $attributes = [
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'id' => 'integer',
            'sigla' => 'string',
            'nome' => 'string',
        ];
    }
}
