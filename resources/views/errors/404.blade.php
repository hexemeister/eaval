<!DOCTYPE html>
<html lang="pt-BR" class="{{ Cookie::get('appearance') === 'dark' ? 'dark' : '' }}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Página não encontrada — e-Aval</title>
    <style>
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        body {
            font-family: system-ui, -apple-system, sans-serif;
            background: #fafafa;
            color: #18181b;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 2rem;
        }

        .card {
            background: #fff;
            border: 1px solid #e4e4e7;
            border-radius: 1rem;
            padding: 3rem 3.5rem;
            text-align: center;
            max-width: 420px;
            width: 100%;
            box-shadow: 0 1px 3px rgba(0,0,0,.06), 0 4px 24px rgba(0,0,0,.04);
        }

        .code {
            font-size: 6rem;
            font-weight: 800;
            letter-spacing: -0.05em;
            color: #e4e4e7;
            line-height: 1;
        }

        .title {
            font-size: 1.25rem;
            font-weight: 600;
            margin-top: 1rem;
            color: #18181b;
        }

        .subtitle {
            font-size: 0.9rem;
            color: #71717a;
            margin-top: 0.5rem;
            line-height: 1.6;
        }

        .countdown {
            display: inline-flex;
            align-items: center;
            gap: 0.4rem;
            margin-top: 1.75rem;
            font-size: 0.85rem;
            color: #a1a1aa;
        }

        .badge {
            background: #f4f4f5;
            border-radius: 9999px;
            width: 1.6rem;
            height: 1.6rem;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            font-weight: 700;
            font-size: 0.8rem;
            color: #52525b;
        }

        .home-link {
            display: inline-block;
            margin-top: 1.25rem;
            padding: 0.5rem 1.25rem;
            background: #18181b;
            color: #fff;
            border-radius: 0.5rem;
            font-size: 0.875rem;
            font-weight: 500;
            text-decoration: none;
            transition: background .15s;
        }

        .home-link:hover { background: #3f3f46; }

        .brand {
            margin-top: 2.5rem;
            font-size: 0.75rem;
            color: #d4d4d8;
            letter-spacing: 0.05em;
            text-transform: uppercase;
        }

        /* dark mode */
        .dark body {
            background: #09090b;
            color: #fafafa;
        }

        .dark .card {
            background: #18181b;
            border-color: #27272a;
            box-shadow: 0 1px 3px rgba(0,0,0,.3), 0 4px 24px rgba(0,0,0,.2);
        }

        .dark .code { color: #27272a; }
        .dark .title { color: #fafafa; }
        .dark .subtitle { color: #71717a; }
        .dark .countdown { color: #52525b; }

        .dark .badge {
            background: #27272a;
            color: #a1a1aa;
        }

        .dark .home-link {
            background: #fafafa;
            color: #18181b;
        }

        .dark .home-link:hover { background: #e4e4e7; }
        .dark .brand { color: #3f3f46; }

        /* system preference (quando cookie = 'system' ou ausente) */
        @media (prefers-color-scheme: dark) {
            html:not(.dark) body { background: #09090b; color: #fafafa; }
            html:not(.dark) .card { background: #18181b; border-color: #27272a; box-shadow: 0 1px 3px rgba(0,0,0,.3), 0 4px 24px rgba(0,0,0,.2); }
            html:not(.dark) .code { color: #27272a; }
            html:not(.dark) .title { color: #fafafa; }
            html:not(.dark) .subtitle { color: #71717a; }
            html:not(.dark) .countdown { color: #52525b; }
            html:not(.dark) .badge { background: #27272a; color: #a1a1aa; }
            html:not(.dark) .home-link { background: #fafafa; color: #18181b; }
            html:not(.dark) .home-link:hover { background: #e4e4e7; }
            html:not(.dark) .brand { color: #3f3f46; }
        }
    </style>
</head>
<body>
    <div class="card">
        <div class="code">404</div>
        <div class="title">Página não encontrada</div>
        <div class="subtitle">O endereço que você acessou não existe ou foi removido.</div>

        <a href="/" class="home-link">Ir para a página inicial</a>

        <div class="countdown">
            Redirecionando em <span class="badge" id="count">5</span> segundos
        </div>
    </div>

    <div class="brand">e-Aval</div>

    <script>
        var n = 5;
        var el = document.getElementById('count');
        var t = setInterval(function () {
            n--;
            el.textContent = n;
            if (n <= 0) { clearInterval(t); window.location.href = '/'; }
        }, 1000);
    </script>
</body>
</html>
