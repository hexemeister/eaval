<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\SearchLog;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SearchLogController extends Controller
{
    public function index(Request $request): Response
    {
        $query = SearchLog::orderBy('created_at', 'desc');

        if ($request->filled('search')) {
            $term = '%' . $request->string('search')->trim() . '%';
            $query->where('query', 'like', $term);
        }

        $logs  = $query->paginate(50)->withQueryString();
        $total = SearchLog::count();

        return Inertia::render('admin/SearchLogs/Index', [
            'logs'    => $logs,
            'total'   => $total,
            'filters' => ['search' => $request->get('search', '')],
        ]);
    }

    public function cleanup(Request $request): RedirectResponse
    {
        $days  = max(7, (int) $request->input('days', 30));
        $count = SearchLog::where('created_at', '<', now()->subDays($days))->delete();

        return back()->with('success', "Removidos {$count} log(s) com mais de {$days} dias.");
    }
}
