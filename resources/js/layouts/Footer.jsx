// resources/js/components/layout/Footer.jsx
import { Separator } from '@/components/ui/separator';

export function Footer() {
    return (
        <footer className="p-4 border-t">
            <p className="text-center text-sm text-muted-foreground">
                © 2025 e-Aval. Todos os direitos reservados. <span className='font-bold'>Código aberto</span> disponível no{' '}
                <a
                    href="https://github.com/hexemeister/eaval"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline underline-offset-4 text-blue-500 hover:text-blue-700"
                >
                    GitHub
                </a>
            </p>
        </footer>
    );
}