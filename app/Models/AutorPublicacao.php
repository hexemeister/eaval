<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * Class AutorPublicacao
 *
 * @property int $id
 * @property int $publicacao_id
 * @property int $autor_id
 * @property int $ordem
 */
class AutorPublicacao extends Model
{
    protected $table = 'autor_publicacao';

    public $timestamps = false;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'publicacao_id',
        'autor_id',
        'ordem',
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
            'publicacao_id' => 'integer',
            'autor_id' => 'integer',
            'ordem' => 'integer',
        ];
    }
    
    public function publicacao()
    {
        return $this->belongsTo(Publicacao::class);
    }

    public function autor()
    {
        return $this->belongsTo(Autor::class);
    }
}
