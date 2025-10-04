<?php

declare(strict_types=1);

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;

/**
 * Class Usuario
 *
 * @property int $id
 * @property string|null $nome
 * @property string|null $email
 * @property string|null $senha
 * @property Carbon|null $ultimo_login
 * @property bool $ativo
 */
class Usuario extends Model
{
    protected $table = 'usuario';

    public $timestamps = false;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'id',
        'nome',
        'email',
        'senha',
        'ultimo_login',
        'ativo',
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
            'nome' => 'string',
            'email' => 'string',
            'senha' => 'string',
            'ultimo_login' => 'datetime',
            'ativo' => 'boolean',
        ];
    }
}
