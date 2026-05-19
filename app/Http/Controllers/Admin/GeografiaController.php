<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Estado;
use App\Models\LocalPublicacao;
use App\Models\Pais;
use App\Models\Regiao;
use App\Models\User;
use App\Notifications\LookupItemDeleted;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class GeografiaController extends Controller
{
    public function index(): Response
    {
        $paises  = Pais::orderBy('nome')->get();
        $regioes = Regiao::orderBy('nome')->get();
        $estados = Estado::orderBy('nome')->get();

        return Inertia::render('admin/cadastros/GeografiaCrud', [
            'paises'  => $paises,
            'regioes' => $regioes,
            'estados' => $estados,
        ]);
    }

    // ─── País ─────────────────────────────────────────────────────────────────

    public function storePais(Request $request): RedirectResponse
    {
        $request->validate([
            'sigla' => 'required|string|max:2|unique:pais,sigla',
            'nome'  => 'required|string|max:255|unique:pais,nome',
        ], $this->messages());

        Pais::create([
            'sigla' => strtoupper(trim($request->string('sigla'))),
            'nome'  => trim($request->string('nome')),
        ]);

        return back()->with('success', 'País criado com sucesso.');
    }

    public function updatePais(Request $request, int $id): RedirectResponse
    {
        $pais = Pais::findOrFail($id);

        $request->validate([
            'sigla' => "required|string|max:2|unique:pais,sigla,{$id}",
            'nome'  => "required|string|max:255|unique:pais,nome,{$id}",
        ], $this->messages());

        $oldSigla = $pais->sigla;
        $newSigla = strtoupper(trim($request->string('sigla')));

        DB::transaction(function () use ($pais, $oldSigla, $newSigla, $request): void {
            if ($oldSigla !== $newSigla) {
                Regiao::where('sigla_pais', $oldSigla)->update(['sigla_pais' => $newSigla]);
            }
            $pais->update([
                'sigla' => $newSigla,
                'nome'  => trim($request->string('nome')),
            ]);
        });

        return back()->with('success', 'País atualizado com sucesso.');
    }

    public function destroyPais(int $id): JsonResponse
    {
        $pais  = Pais::findOrFail($id);
        $count = Regiao::where('sigla_pais', $pais->sigla)->count();

        return response()->json(['affected' => ['regioes' => $count]]);
    }

    public function destroyPaisConfirmed(int $id): RedirectResponse
    {
        $pais  = Pais::findOrFail($id);
        $count = Regiao::where('sigla_pais', $pais->sigla)->count();

        DB::transaction(function () use ($pais): void {
            Regiao::where('sigla_pais', $pais->sigla)->update(['sigla_pais' => null]);
            $pais->delete();
        });

        if ($count > 0) {
            $this->notify('País', $pais->nome, $count, 'região');
        }

        return back()->with('success', 'País excluído.');
    }

    // ─── Região ───────────────────────────────────────────────────────────────

    public function storeRegiao(Request $request): RedirectResponse
    {
        $request->validate([
            'sigla'     => 'required|string|max:6|unique:regiao,sigla',
            'nome'      => 'required|string|max:40|unique:regiao,nome',
            'sigla_pais' => 'nullable|string|exists:pais,sigla',
        ], $this->messages());

        Regiao::create([
            'sigla'     => strtoupper(trim($request->string('sigla'))),
            'nome'      => trim($request->string('nome')),
            'sigla_pais' => $request->input('sigla_pais') ?: null,
        ]);

        return back()->with('success', 'Região criada com sucesso.');
    }

    public function updateRegiao(Request $request, int $id): RedirectResponse
    {
        $regiao = Regiao::findOrFail($id);

        $request->validate([
            'sigla'     => "required|string|max:6|unique:regiao,sigla,{$id}",
            'nome'      => "required|string|max:40|unique:regiao,nome,{$id}",
            'sigla_pais' => 'nullable|string|exists:pais,sigla',
        ], $this->messages());

        $oldSigla = $regiao->sigla;
        $newSigla = strtoupper(trim($request->string('sigla')));

        DB::transaction(function () use ($regiao, $oldSigla, $newSigla, $request): void {
            if ($oldSigla !== $newSigla) {
                Estado::where('sigla_regiao', $oldSigla)->update(['sigla_regiao' => $newSigla]);
            }
            $regiao->update([
                'sigla'     => $newSigla,
                'nome'      => trim($request->string('nome')),
                'sigla_pais' => $request->input('sigla_pais') ?: null,
            ]);
        });

        return back()->with('success', 'Região atualizada com sucesso.');
    }

    public function destroyRegiao(int $id): JsonResponse
    {
        $regiao = Regiao::findOrFail($id);
        $count  = Estado::where('sigla_regiao', $regiao->sigla)->count();

        return response()->json(['affected' => ['estados' => $count]]);
    }

    public function destroyRegiaoConfirmed(int $id): RedirectResponse
    {
        $regiao = Regiao::findOrFail($id);
        $count  = Estado::where('sigla_regiao', $regiao->sigla)->count();

        DB::transaction(function () use ($regiao): void {
            Estado::where('sigla_regiao', $regiao->sigla)->update(['sigla_regiao' => null]);
            $regiao->delete();
        });

        if ($count > 0) {
            $this->notify('Região', $regiao->nome, $count, 'estado');
        }

        return back()->with('success', 'Região excluída.');
    }

    // ─── Estado ───────────────────────────────────────────────────────────────

    public function storeEstado(Request $request): RedirectResponse
    {
        $request->validate([
            'sigla'       => 'required|string|max:6|unique:estado,sigla',
            'nome'        => 'required|string|max:30|unique:estado,nome',
            'sigla_regiao' => 'nullable|string|exists:regiao,sigla',
        ], $this->messages());

        Estado::create([
            'sigla'       => strtoupper(trim($request->string('sigla'))),
            'nome'        => trim($request->string('nome')),
            'sigla_regiao' => $request->input('sigla_regiao') ?: null,
        ]);

        return back()->with('success', 'Estado criado com sucesso.');
    }

    public function updateEstado(Request $request, int $id): RedirectResponse
    {
        $estado = Estado::findOrFail($id);

        $request->validate([
            'sigla'       => "required|string|max:6|unique:estado,sigla,{$id}",
            'nome'        => "required|string|max:30|unique:estado,nome,{$id}",
            'sigla_regiao' => 'nullable|string|exists:regiao,sigla',
        ], $this->messages());

        $oldSigla = $estado->sigla;
        $newSigla = strtoupper(trim($request->string('sigla')));

        DB::transaction(function () use ($estado, $oldSigla, $newSigla, $request): void {
            if ($oldSigla !== $newSigla) {
                LocalPublicacao::where('estado', $oldSigla)->update(['estado' => $newSigla]);
            }
            $estado->update([
                'sigla'       => $newSigla,
                'nome'        => trim($request->string('nome')),
                'sigla_regiao' => $request->input('sigla_regiao') ?: null,
            ]);
        });

        return back()->with('success', 'Estado atualizado com sucesso.');
    }

    public function destroyEstado(int $id): JsonResponse
    {
        $estado = Estado::findOrFail($id);
        $count  = LocalPublicacao::where('estado', $estado->sigla)->count();

        return response()->json(['affected' => ['locais_publicacao' => $count]]);
    }

    public function destroyEstadoConfirmed(int $id): RedirectResponse
    {
        $estado = Estado::findOrFail($id);
        $count  = LocalPublicacao::where('estado', $estado->sigla)->count();

        DB::transaction(function () use ($estado): void {
            LocalPublicacao::where('estado', $estado->sigla)->update(['estado' => null]);
            $estado->delete();
        });

        if ($count > 0) {
            $this->notify('Estado', $estado->nome, $count, 'local de publicação');
        }

        return back()->with('success', 'Estado excluído.');
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    private function notify(string $tipo, string $nome, int $count, string $entidadeAfetada): void
    {
        $notification = new LookupItemDeleted($tipo, $nome, $count);
        User::all()->each(fn(User $user) => $user->notify($notification));
    }

    private function messages(): array
    {
        return [
            'sigla.required' => 'A sigla é obrigatória.',
            'sigla.max'      => 'A sigla não pode ter mais de :max caracteres.',
            'sigla.unique'   => 'Esta sigla já está cadastrada.',
            'nome.required'  => 'O nome é obrigatório.',
            'nome.max'       => 'O nome não pode ter mais de :max caracteres.',
            'nome.unique'    => 'Este nome já está cadastrado.',
            'sigla_pais.exists'   => 'País inválido.',
            'sigla_regiao.exists' => 'Região inválida.',
        ];
    }
}
