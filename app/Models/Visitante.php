<?php

declare(strict_types=1);

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;

/**
 * Class Visitante
 *
 * @property int $id
 * @property string|null $visitante_id
 * @property Carbon $data_visita
 * @property string|null $ip
 * @property string|null $user_agent
 */
class Visitante extends Model
{
    protected $table = 'visitante';

    public $timestamps = false;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'id',
        'visitante_id',
        'data_visita',
        'ip',
        'user_agent',
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
            'visitante_id' => 'string',
            'data_visita' => 'datetime',
            'ip' => 'string',
            'user_agent' => 'string',
        ];
    }
}
