// resources/js/layouts/NavBar.jsx
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@/components/ui/navigation-menu';
import { menuItems } from '@/hooks/menuConfig';
import { useClickOutside } from '@/hooks/useClickOutside';
import { useEscapeKey } from '@/hooks/useEscapeKey';
import { useSmartPosition } from '@/hooks/useSmartPosition';
import { Link, usePage } from '@inertiajs/react';
import { ThemeSwitcher } from '@space-man/react-theme-animation';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronsRight } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

const getSubmenuKey = (path) => path.join(' > ');

// Componente recursivo para submenus
const SubmenuDesktop = ({ items, path, openSubmenus, onToggle, isActive, level = 0 }) => {
  return (
    <ul className={`grid gap-0 px-2 ${level === 0 ? 'w-[200px]' : 'w-[200px]'}`}>
      {' '}
      {items.map((item) => {
        console.log('Rendering item:', item.label, 'at level', level, 'disabled:', item.disabled);
        const hasChildren = item.items && item.items.length > 0;
        const currentPath = [...path, item.label];
        const submenuKey = getSubmenuKey(currentPath);
        const isSubmenuOpen = openSubmenus[submenuKey];

        if (hasChildren) {
          return (
            <SubmenuItem
              key={submenuKey}
              item={item}
              submenuKey={submenuKey}
              isSubmenuOpen={isSubmenuOpen}
              onToggle={onToggle}
              currentPath={currentPath}
              openSubmenus={openSubmenus}
              isActive={isActive}
              level={level}
            />
          );
        }

        return (
          <li key={item.href}>
            <NavigationMenuLink asChild>
              {item.disabled ? (
                <span className="block cursor-not-allowed space-y-1 rounded-md px-3 leading-none text-gray-400 select-none">
                  <div className="flex items-center text-sm font-medium">
                    {item.label}
                    <span className="ml-1 text-xs text-gray-500">(WIP)</span>
                  </div>
                </span>
              ) : (
                <Link
                  href={item.href}
                  className={`navigation-menu-submenu-item block space-y-1 rounded-md px-3 leading-none no-underline outline-none select-none ${
                    isActive(item.href) ? 'bg-blue-50 font-semibold text-blue-600' : 'hover:bg-accent hover:text-accent-foreground'
                  }`}
                >
                  <div className="text-sm font-medium">{item.label}</div>
                </Link>
              )}
            </NavigationMenuLink>
          </li>
        );
      })}
    </ul>
  );
};

const SubmenuItem = ({ item, submenuKey, isSubmenuOpen, onToggle, currentPath, openSubmenus, isActive, level }) => {
  const { triggerRef, position } = useSmartPosition();
  const submenuRef = useRef(null);
  const timeoutRef = useRef(null);

  const handleMouseEnter = () => {
    // Limpa timeout anterior
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    onToggle(submenuKey, true);
  };

  const handleMouseLeave = () => {
    // Fecha submenu após 200ms se mouse sair
    timeoutRef.current = setTimeout(() => {
      onToggle(submenuKey, false);
    }, 200);
  };

  // Limpa timeout quando o componente desmonta
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <li className="relative" ref={triggerRef}>
      <div
        className="flex w-full cursor-pointer items-center justify-between rounded-md p-3 text-sm font-medium outline-none hover:bg-accent hover:text-accent-foreground"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={() => onToggle(submenuKey, !isSubmenuOpen)}
      >
        {item.label}
        <span className="ml-2">
          <ChevronsRight size={16} />
        </span>
      </div>

      {isSubmenuOpen && (
        <div
          ref={submenuRef}
          className={`absolute top-0 z-50 w-[220px] border bg-background shadow-lg ${
            position === 'left' ? 'right-full left-auto' : 'right-auto left-full'
          }`}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <div className="max-h-[60vh] overflow-y-auto">
            <SubmenuDesktop
              items={item.items}
              path={currentPath}
              openSubmenus={openSubmenus}
              onToggle={onToggle}
              isActive={isActive}
              level={level + 1}
            />
          </div>
        </div>
      )}
    </li>
  );
};

export function NavBar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [openSubmenus, setOpenSubmenus] = useState({});
  const menuRef = useRef(null);
  const submenuTimeoutRef = useRef(null);
  const { url } = usePage();

  const normalizeUrl = (path) => path.replace(/\/$/, '') || '/';
  const currentUrl = normalizeUrl(url);
  const isActive = (href) => href && normalizeUrl(href) === currentUrl;

  // Função para lidar com abertura/fechamento de submenus
  const handleSubmenuToggle = useCallback(
    (key, isOpen) => {
      if (isOpen) {
        // Fecha todos os submenus do mesmo nível
        const level = key.split(' > ').length;
        const newOpen = {};

        for (const submenuKey in openSubmenus) {
          const submenuLevel = submenuKey.split(' > ').length;
          if (submenuLevel !== level) {
            newOpen[submenuKey] = openSubmenus[submenuKey];
          }
        }

        newOpen[key] = true;
        setOpenSubmenus(newOpen);
      } else {
        setOpenSubmenus((prev) => {
          const newOpen = { ...prev };
          delete newOpen[key];
          return newOpen;
        });
      }
    },
    [openSubmenus],
  );

  // Fecha todos os submenus após 200ms se mouse sair do menu
  const handleMenuLeave = useCallback(() => {
    submenuTimeoutRef.current = setTimeout(() => {
      setOpenSubmenus({});
    }, 200);
  }, []);

  // Cancela o timeout se o mouse voltar ao menu
  const handleMenuEnter = useCallback(() => {
    if (submenuTimeoutRef.current) {
      clearTimeout(submenuTimeoutRef.current);
    }
  }, []);

  // Fecha submenu de terceiro nível ao mudar de item no segundo nível
  const handleTopLevelHover = useCallback((item) => {
    if (item.type === 'submenu' && item.items) {
      // Fecha submenus de terceiro nível
      setOpenSubmenus((prev) => {
        const newOpen = {};
        for (const key in prev) {
          if (key.split(' > ').length <= 2) {
            newOpen[key] = prev[key];
          }
        }
        return newOpen;
      });
    }
  }, []);

  // Limpa timeout quando o componente desmonta
  useEffect(() => {
    return () => {
      if (submenuTimeoutRef.current) {
        clearTimeout(submenuTimeoutRef.current);
      }
    };
  }, []);

  useClickOutside(menuRef, () => {
    if (isMenuOpen) setIsMenuOpen(false);
    setOpenSubmenus({});
  });

  useEscapeKey(() => {
    if (isMenuOpen) setIsMenuOpen(false);
    setOpenSubmenus({});
  });

  const renderLinkItem = (item, isMobile = false) => {
    const baseClasses = isMobile
      ? 'text-base font-medium'
      : 'group inline-flex h-10 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors focus:outline-none';
    const activeClasses = item.disabled
      ? 'text-gray-400 cursor-not-allowed'
      : isActive(item.href)
        ? 'text-blue-600 font-semibold'
        : 'hover:text-blue-600 hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground';

    return (
      <span
        key={item.href}
        className={`${baseClasses} ${activeClasses} ${item.disabled ? 'pointer-events-none' : ''}`}
        aria-disabled={item.disabled}
        aria-current={isActive(item.href) ? 'page' : undefined}
      >
        {item.disabled ? (
          <span className="flex items-center">
            {item.label}
            <span className="ml-1 text-xs text-gray-500">(WIP)</span>
          </span>
        ) : (
          <Link href={item.href} onClick={() => isMobile && setIsMenuOpen(false)}>
            {item.label}
          </Link>
        )}
      </span>
    );
  };

  const renderSubmenuMobile = (items, depth = 0) => {
    return items.flatMap((item) => {
      const hasChildren = item.items && item.items.length > 0;
      const marginLeft = depth > 0 ? `ml-${depth * 4}` : '';

      const baseItem = hasChildren ? (
        <span key={item.label} className={`flex items-center text-base font-medium text-gray-700 ${marginLeft}`}>
          {item.label}
        </span>
      ) : item.disabled ? (
        <span key={item.href} className={`flex cursor-not-allowed items-center text-base text-gray-400 ${marginLeft}`}>
          • {item.label} <span className="ml-1 text-xs text-gray-500">(WIP)</span>
        </span>
      ) : (
        <Link
          key={item.href}
          href={item.href}
          className={`text-base ${isActive(item.href) ? 'font-semibold text-blue-600' : 'text-gray-600 hover:text-blue-600'} ${marginLeft}`}
          onClick={() => setIsMenuOpen(false)}
        >
          • {item.label}
        </Link>
      );

      let children = [];
      if (hasChildren) {
        children = renderSubmenuMobile(item.items, depth + 1);
      }

      return [baseItem, ...children];
    });
  };

  return (
    <>
      {/* Desktop */}
      <NavigationMenu className="hidden md:flex" viewport={false} onMouseEnter={handleMenuEnter} onMouseLeave={handleMenuLeave}>
        <NavigationMenuList>
          {menuItems.map((item) => {
            if (item.type === 'link') {
              return (
                <NavigationMenuItem key={item.href}>
                  <NavigationMenuLink asChild>{renderLinkItem(item)}</NavigationMenuLink>
                </NavigationMenuItem>
              );
            }
            if (item.type === 'submenu') {
              return (
                <NavigationMenuItem key={item.label} onMouseEnter={() => handleTopLevelHover(item)}>
                  <NavigationMenuTrigger
                    className={isActive(item.items?.[0]?.href) ? 'font-semibold text-blue-600' : ''}
                    disabled={item.disabled}
                    aria-disabled={item.disabled}
                  >
                    {item.disabled ? (
                      <span className="flex items-center">
                        {item.label}
                        <span className="ml-1 text-xs text-gray-500">(WIP)</span>
                      </span>
                    ) : (
                      item.label
                    )}
                  </NavigationMenuTrigger>
                  {!item.disabled && (
                    <NavigationMenuContent className="navigation-menu-content-overflow-fix z-[9999]">
                      <SubmenuDesktop
                        items={item.items}
                        path={[item.label]}
                        openSubmenus={openSubmenus}
                        onToggle={handleSubmenuToggle}
                        isActive={isActive}
                        level={0}
                      />
                    </NavigationMenuContent>
                  )}
                </NavigationMenuItem>
              );
            }
            return null;
          })}
        </NavigationMenuList>
      </NavigationMenu>

      <div className="hidden sm:flex">
        <ThemeSwitcher />
      </div>

      {/* Mobile */}
      <div className="flex items-center md:hidden">
        <button
          className="relative flex h-6 w-6 flex-col items-center justify-center focus:outline-none"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label={isMenuOpen ? 'Fechar menu' : 'Abrir menu'}
        >
          <span
            className={`absolute block h-0.5 w-6 bg-current transition-transform duration-300 ease-in-out ${
              isMenuOpen ? 'translate-y-0 rotate-45' : '-translate-y-1.5'
            }`}
          />
          <span
            className={`absolute block h-0.5 w-6 bg-current transition-opacity duration-300 ease-in-out ${isMenuOpen ? 'opacity-0' : 'opacity-100'}`}
          />
          <span
            className={`absolute block h-0.5 w-6 bg-current transition-transform duration-300 ease-in-out ${
              isMenuOpen ? 'translate-y-0 -rotate-45' : 'translate-y-1.5'
            }`}
          />
        </button>

        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              ref={menuRef}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
              className="absolute top-16 right-0 left-0 z-50 border-b bg-background"
            >
              <div className="flex flex-col space-y-3 px-4 py-4">
                {menuItems.map((item) => {
                  if (item.type === 'link') {
                    return renderLinkItem(item, true);
                  }
                  if (item.type === 'submenu') {
                    return [
                      <span key={`${item.label}-title`} className="text-base font-medium text-gray-700">
                        {item.label}
                      </span>,
                      ...renderSubmenuMobile(item.items),
                    ];
                  }
                  return null;
                })}
              </div>
              <div className="px-4 pb-4">
                <ThemeSwitcher />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
