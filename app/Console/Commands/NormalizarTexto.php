<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Models\PalavraChave;
use App\Models\Publicacao;
use App\Models\User;
use App\Notifications\TextoNormalizado;
use App\Services\NormalizacaoTextoService;
use Illuminate\Console\Command;

class NormalizarTexto extends Command
{
    protected $signature   = 'texto:normalizar {--dry-run} {--tipo= : publicacoes, palavras-chave (omitir = ambos)}';
    protected $description = 'Normaliza títulos e palavras-chave existentes para sentence case';

    public function handle(): int
    {
        $dryRun = (bool) $this->option('dry-run');
        $tipo   = $this->option('tipo');

        $alteracoes = [];

        if ($tipo === null || $tipo === 'publicacoes') {
            $alteracoes = array_merge($alteracoes, $this->processarPublicacoes($dryRun));
        }

        if ($tipo === null || $tipo === 'palavras-chave') {
            $alteracoes = array_merge($alteracoes, $this->processarPalavrasChave($dryRun));
        }

        $total = count($alteracoes);

        if ($total === 0) {
            $this->info('Nenhum registro precisou de normalização.');
            return self::SUCCESS;
        }

        $this->info(($dryRun ? '[DRY-RUN] ' : '') . "{$total} registro(s) " . ($dryRun ? 'seriam alterados.' : 'normalizados.'));

        if (!$dryRun) {
            $this->criarNotificacoes($alteracoes);
        }

        return self::SUCCESS;
    }

    /** @return list<array{tipo: string, id: int, original: string, normalizado: string}> */
    private function processarPublicacoes(bool $dryRun): array
    {
        $alteracoes = [];

        Publicacao::select(['id', 'titulo'])->chunk(200, function ($pubs) use ($dryRun, &$alteracoes): void {
            foreach ($pubs as $pub) {
                if ($pub->titulo === null) {
                    continue;
                }

                $normalizado = NormalizacaoTextoService::sentenceCase($pub->titulo);

                if ($normalizado === $pub->titulo) {
                    continue;
                }

                $this->line("  [{$pub->id}] \"{$pub->titulo}\" → \"{$normalizado}\"");

                if (!$dryRun) {
                    $pub->update(['titulo' => $normalizado, 'editada_em' => now()]);
                }

                $alteracoes[] = [
                    'tipo'        => 'Publicação',
                    'id'          => $pub->id,
                    'original'    => $pub->titulo,
                    'normalizado' => $normalizado,
                ];
            }
        });

        return $alteracoes;
    }

    /** @return list<array{tipo: string, id: int, original: string, normalizado: string}> */
    private function processarPalavrasChave(bool $dryRun): array
    {
        $alteracoes = [];

        PalavraChave::select(['id', 'texto'])->chunk(200, function ($pks) use ($dryRun, &$alteracoes): void {
            foreach ($pks as $pk) {
                $normalizado = NormalizacaoTextoService::sentenceCase($pk->texto);

                if ($normalizado === $pk->texto) {
                    continue;
                }

                $this->line("  [{$pk->id}] \"{$pk->texto}\" → \"{$normalizado}\"");

                if (!$dryRun) {
                    $pk->update(['texto' => $normalizado]);
                }

                $alteracoes[] = [
                    'tipo'        => 'Palavra-chave',
                    'id'          => $pk->id,
                    'original'    => $pk->texto,
                    'normalizado' => $normalizado,
                ];
            }
        });

        return $alteracoes;
    }

    /** @param list<array{tipo: string, id: int, original: string, normalizado: string}> $alteracoes */
    private function criarNotificacoes(array $alteracoes): void
    {
        $total = count($alteracoes);
        $users = User::all();

        if ($total > 10) {
            $mensagem = "{$total} registros normalizados para sentence case — revise na listagem.";
            $users->each(fn ($u) => $u->notify(new TextoNormalizado($mensagem)));
            return;
        }

        foreach ($alteracoes as $a) {
            $mensagem = "{$a['tipo']} normalizado para revisão: \"{$a['normalizado']}\" (era: \"{$a['original']}\").";
            $users->each(fn ($u) => $u->notify(new TextoNormalizado($mensagem)));
        }
    }
}
