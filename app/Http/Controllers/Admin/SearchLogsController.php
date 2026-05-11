<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\SearchLog;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SearchLogsController extends Controller
{
    public function index()
    {
        $logs = SearchLog::with('user')
            ->orderBy('created_at', 'desc')
            ->paginate(50);

        return Inertia::render('admin/SearchLogs/Index', [
            'logs' => $logs,
        ]);
    }
}
