<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SearchLog extends Model
{
    protected $fillable = [
        'query',
        'filters',
        'results_count',
        'execution_time_ms',
        'ip_address',
        'user_agent',
        'user_id',
        'error',
    ];

    protected $casts = [
        'filters' => 'json',
        'execution_time_ms' => 'float',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
