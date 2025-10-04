<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * Class AreaPublicacao
 *
 * @property int $area_id
 * @property int $publicacao_id
 */
class AreaPublicacao extends Model
{
    protected $table = 'area_publicacao';

    public $timestamps = false;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'area_id',
        'publicacao_id',
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
            'area_id' => 'integer',
            'publicacao_id' => 'integer',
        ];
    }
}
