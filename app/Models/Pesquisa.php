<?php

declare(strict_types=1);

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;

/**
 * Class Pesquisa
 *
 * @property int $id
 * @property string|null $texto
 * @property string|null $campos
 * @property string|null $areas
 * @property string|null $condicao
 * @property Carbon|null $data_hora_criacao
 * @property Carbon|null $ultimo_acesso
 * @property int|null $duracao
 */
class Pesquisa extends Model
{
    protected $table = 'pesquisa';

    public $timestamps = false;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'id',
        'texto',
        'campos',
        'areas',
        'condicao',
        'data_hora_criacao',
        'ultimo_acesso',
        'duracao',
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
            'texto' => 'string',
            'campos' => 'string',
            'areas' => 'string',
            'condicao' => 'string',
            'data_hora_criacao' => 'datetime',
            'ultimo_acesso' => 'datetime',
            'duracao' => 'integer',
        ];
    }
}
