// resources/js/components/layout/CustomBreadcrumb.jsx
import {
    Breadcrumb,
    BreadcrumbList,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

export function CustomBreadcrumb({ items, separator = '/', variant = 'default' }) {
    const variantClasses = {
        default: "text-gray-600",
        primary: "text-blue-600 font-medium",
        secondary: "text-gray-500 italic",
    };

    return (
        <nav className={`px-6 py-3 border-b ${variantClasses[variant]}`}>
            <Breadcrumb className="flex items-center space-x-1 text-sm list-none">
                {items.map((item, index) => (
                    <div key={index} className="flex items-center">
                        {index > 0 && (
                            <BreadcrumbSeparator className="mx-2">
                                {separator}
                            </BreadcrumbSeparator>
                        )}
                        {item.href ? (
			  <BreadcrumbList>
                            <BreadcrumbItem >
                                <BreadcrumbLink 
                                    href={item.href} 
                                    className="hover:underline"
                                >
                                    {item.label}
                                </BreadcrumbLink>
                            </BreadcrumbItem>
			</BreadcrumbList>
                        ) : (
			<BreadcrumbList>
                            <BreadcrumbItem>
                                <BreadcrumbPage className="font-semibold">
                                    {item.label}
                                </BreadcrumbPage>
                            </BreadcrumbItem>
			</BreadcrumbList>
                        )}
                    </div>
                ))}
            </Breadcrumb>
        </nav>
    );
}