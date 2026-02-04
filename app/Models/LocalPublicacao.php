<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * Class LocalPublicacao
 *
 * @property int $id
 * @property string|null $nome
 * @property string|null $nome_abreviado
 * @property string|null $issn
 * @property string|null $estado
 */
class LocalPublicacao extends Model
{
    protected $table = 'local_publicacao';

    public $timestamps = false;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'id',
        'nome',
        'nome_abreviado',
        'issn',
        'estado',
    ];

    /**
     * The model's default values for attributes.
     *
     * @var array<string, mixed>
     */
    protected $attributes = [];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'id' => 'integer',
            'nome' => 'string',
            'nome_abreviado' => 'string',
            'issn' => 'string',
            'estado' => 'string',
        ];
    }
    
    public function publicacoes()
    {
        return $this->hasMany(Publicacao::class, 'local_publicacao_id');
    }
}
