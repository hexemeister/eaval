import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { NavBar } from '@/layouts/NavBar';
import { Link } from '@inertiajs/react';
import logoUrl from '../../images/eaval-logo_b.png';

export function Header() {
  return (
    <header className="flex items-center justify-between border-b p-4 relative">
      <div className="flex items-center space-x-2">
        <Link href="/">
          <Avatar className="size-8 sm:size-14">
            <AvatarImage src={logoUrl} alt="e-Aval" />
            <AvatarFallback className="whitespace-nowrap text-xs sm:text-sm">e-Aval</AvatarFallback>
          </Avatar>
        </Link>
      </div>
      <nav className="flex items-center space-x-4">
        <NavBar />
      </nav>
    </header>
  );
}


//       <div className="flex items-center space-x-4">
//         <NavBar />
//         <ThemeSwitcher className="hidden sm:block" />
//         {/* Em mobile, o ThemeSwitcher pode ir dentro do menu ou ser removido para simplificar */}
//       </div>
//     </header>
//   );
// }