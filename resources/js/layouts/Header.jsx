// resources/js/components/layout/Header.jsx
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { NavBar } from '@/layouts/NavBar';
import logoUrl from '../../images/eaval-logo_b.png';
import { Link } from '@inertiajs/react';
import { ThemeSwitcher } from '@space-man/react-theme-animation'

export function Header() {
  return (
    <header className="flex items-center justify-between p-4 border-b">
      <div className="flex items-center space-x-2">
        <Link href="/">
          <Avatar className="size-14">
            <AvatarImage src={logoUrl} alt="e-Aval" />
            <AvatarFallback className="whitespace-nowrap">e-Aval</AvatarFallback>
          </Avatar>
        </Link>
      </div>
      <nav className='flex'>
        <NavBar />
        <ThemeSwitcher className="ml-10" />
      </nav>
    </header>
  );
}