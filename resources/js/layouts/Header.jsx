// resources/js/components/layout/Header.jsx
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { NavBar } from '@/layouts/NavBar';
import logoUrl from '../../images/eaval-logo_b.png';

export function Header() {
  return (
    <header className="flex items-center justify-between p-4 border-b">
      <div className="flex items-center space-x-2">
        <Avatar className="size-14">
          <AvatarImage src={logoUrl} alt="e-Aval" />
          <AvatarFallback className="whitespace-nowrap">e-Aval</AvatarFallback>
        </Avatar>
      </div>
      <nav className='mr-10'>
        <NavBar />
      </nav>
    </header>
  );
}