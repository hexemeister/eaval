<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\LocalPublicacao;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LocalPublicacaoController extends Controller
{
    public function buscar(Request $request): JsonResponse
    {
        $q      = trim((string) $request->get('q', ''));
        $estado = trim((string) $request->get('estado', ''));

        $query = LocalPublicacao::query();

        if ($q !== '') {
            $query->where(function ($sub) use ($q): void {
                $sub->where('nome', 'like', "%{$q}%")
                    ->orWhere('nome_abreviado', 'like', "%{$q}%")
                    ->orWhere('issn', 'like', "%{$q}%");
            });
        }

        if ($estado !== '') {
            $query->where('estado', $estado);
        }

        $results = $query->orderBy('nome')
            ->limit(20)
            ->get(['id', 'nome', 'nome_abreviado', 'issn', 'estado']);

        return response()->json($results);
    }

    public function storeInline(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'nome'           => ['required', 'string', 'max:500'],
            'nome_abreviado' => ['nullable', 'string', 'max:255'],
            'issn'           => ['nullable', 'string', 'max:20'],
            'estado'         => ['nullable', 'string', 'max:2'],
        ], [
            'nome.required' => 'O nome do periódico é obrigatório.',
            'nome.max'      => 'O nome não pode ter mais de :max caracteres.',
        ]);

        $record = LocalPublicacao::create([
            'nome'           => trim($validated['nome']),
            'nome_abreviado' => isset($validated['nome_abreviado']) ? (trim($validated['nome_abreviado']) ?: null) : null,
            'issn'           => isset($validated['issn']) ? (trim($validated['issn']) ?: null) : null,
            'estado'         => ($validated['estado'] ?? null) ?: null,
        ]);

        return response()->json([
            'id'             => $record->id,
            'nome'           => $record->nome,
            'nome_abreviado' => $record->nome_abreviado,
            'issn'           => $record->issn,
            'estado'         => $record->estado,
        ], 201);
    }

    public function updateInline(Request $request, int $id): JsonResponse
    {
        $record = LocalPublicacao::findOrFail($id);

        $validated = $request->validate([
            'nome_abreviado' => ['nullable', 'string', 'max:255'],
            'issn'           => ['nullable', 'string', 'max:20'],
            'estado'         => ['nullable', 'string', 'max:2'],
        ]);

        $record->update([
            'nome_abreviado' => isset($validated['nome_abreviado']) ? (trim($validated['nome_abreviado']) ?: null) : null,
            'issn'           => isset($validated['issn']) ? (trim($validated['issn']) ?: null) : null,
            'estado'         => ($validated['estado'] ?? null) ?: null,
        ]);

        return response()->json([
            'id'             => $record->id,
            'nome'           => $record->nome,
            'nome_abreviado' => $record->nome_abreviado,
            'issn'           => $record->issn,
            'estado'         => $record->estado,
        ]);
    }
}
