<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * Class PalavraChave
 *
 * @property int $id
 * @property string|null $texto
 * @property int $frequencia
 */
class PalavraChave extends Model
{
    protected $table = 'palavra_chave';

    public $timestamps = false;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'id',
        'texto',
        'frequencia',
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
            'frequencia' => 'integer',
        ];
    }
}
