<?php

namespace App\Services;

use App\Models\SearchLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class SearchLoggerService
{
    public function log(Request $request, array $data): void
    {
        SearchLog::create([
            'query' => $data['query'] ?? null,
            'filters' => $data['filters'] ?? null,
            'results_count' => $data['results_count'] ?? 0,
            'execution_time_ms' => $data['execution_time_ms'] ?? 0,
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'user_id' => Auth::id(),
            'error' => $data['error'] ?? null,
        ]);
    }
}
