import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import logoUrl from '../../images/eaval-avatar.webp';

export default function AppLogo() {
  return (
    <>
      <div className="flex aspect-square size-8 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
        {/* <AppLogoIcon className="size-5 fill-current text-white dark:text-black" /> */}
        <Avatar>
          <AvatarImage src={logoUrl} alt="e-Aval" />
          <AvatarFallback className="text-xs whitespace-nowrap sm:text-sm">e-Aval</AvatarFallback>
        </Avatar>
      </div>
      <div className="ml-1 grid flex-1 text-left text-sm">
        <span className="mb-0.5 truncate leading-tight font-semibold">e-Aval: Base de Dados</span>
      </div>
    </>
  );
}
