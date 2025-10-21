// resources/js/components/layout/CustomBreadcrumb.jsx
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Link, usePage } from '@inertiajs/react';

export function CustomBreadcrumb({ items, separator = '/', variant = 'default' }) {
  const { breadcrumb } = usePage().props;
  if (breadcrumb) {
    items = breadcrumb;
  }

  const variantClasses = {
    default: 'text-gray-600',
    primary: 'text-blue-600 font-medium',
    secondary: 'text-gray-500 italic',
  };

  return (
    <nav className={`border-b px-6 py-3 ${variantClasses[variant]}`}>
      <Breadcrumb className="flex list-none items-center space-x-1 text-sm">
        {items.map((item, index) => (
          <div key={index} className="flex items-center">
            {index > 0 && <BreadcrumbSeparator className="mx-2">{separator}</BreadcrumbSeparator>}
            {item.href ? (
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link href={item.href} className="hover:underline">
                      {item.label}
                    </Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
              </BreadcrumbList>
            ) : (
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbPage className="font-semibold">{item.label}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            )}
          </div>
        ))}
      </Breadcrumb>
    </nav>
  );
}
