<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use App\Services\ArticleSearch\SearchQueryParser;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        // Registra como singleton (uma única instância compartilhada)
        $this->app->singleton(SearchQueryParser::class);
        
        // Alternativa: registrar com função de criação
        // $this->app->singleton(SearchQueryParser::class, function ($app) {
        //     return new SearchQueryParser();
        // });
    }

    public function boot(): void
    {
        //
    }
}