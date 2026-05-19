<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\SearchLog;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

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

    public function export(Request $request): StreamedResponse
    {
        $query = SearchLog::orderBy('created_at', 'desc');

        if ($request->filled('search')) {
            $term = '%' . $request->string('search')->trim() . '%';
            $query->where('query', 'like', $term);
        }

        $logs = $query->get();

        return response()->streamDownload(function () use ($logs) {
            $handle = fopen('php://output', 'w');
            fwrite($handle, "\xEF\xBB\xBF"); // BOM UTF-8
            fputcsv($handle, ['Data/Hora', 'Query', 'Resultados', 'Tempo (ms)', 'Status', 'IP']);
            foreach ($logs as $log) {
                fputcsv($handle, [
                    $log->created_at->format('d/m/Y H:i:s'),
                    $log->query ?? '',
                    $log->results_count,
                    $log->execution_time_ms !== null ? number_format($log->execution_time_ms, 2, '.', '') : '',
                    $log->error ? 'Erro' : 'Sucesso',
                    $log->ip_address ?? '',
                ]);
            }
            fclose($handle);
        }, 'logs-busca-' . now()->format('Y-m-d') . '.csv', ['Content-Type' => 'text/csv; charset=UTF-8']);
    }

    public function cleanup(Request $request): RedirectResponse
    {
        $days  = max(7, (int) $request->input('days', 30));
        $count = SearchLog::where('created_at', '<', now()->subDays($days))->delete();

        return back()->with('success', "Removidos {$count} log(s) com mais de {$days} dias.");
    }

    public function truncate(): RedirectResponse
    {
        $count = SearchLog::count();
        SearchLog::truncate();

        return back()->with('success', "Todos os {$count} log(s) foram removidos.");
    }
}
