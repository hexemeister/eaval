<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;

class ClearLogs extends Command
{
    protected $signature = 'logs:clear';
    protected $description = 'Limpa os arquivos de log';

    public function handle()
    {
        $logFile = storage_path('logs/laravel.log');
        if (File::exists($logFile)) {
            File::put($logFile, '');
            $this->info('Logs limpos com sucesso!');
        } else {
            $this->info('Arquivo de log não encontrado.');
        }
    }
}