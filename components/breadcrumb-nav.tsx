"use client"

import { usePathname } from "next/navigation";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList } from "./ui/breadcrumb";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function BreadcrumbNav() {
  const pathname = usePathname();
  const pathnames = pathname.split('/').filter(Boolean);
  const breadcrumbs = pathnames.map((name, index) => {
    const href = `/${pathnames.slice(0, index + 1).join('/')}`;
    return {
      href,
      label: name,
    };
  });

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {/* When it's in the Your MVPs page, it should be able to fetch the project name instead of just doing the uuid */}
        {breadcrumbs.map((breadcrumb, index) => (
          (index !== breadcrumbs.length - 1) ? (
            <BreadcrumbItem key={breadcrumb.href} className={cn(index === breadcrumbs.length - 1 && 'text-blue-500 dark:text-blue-400')}>
              <BreadcrumbLink href={breadcrumb.href}>{breadcrumb.label.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}</BreadcrumbLink>
              <ChevronRight className="w-4 h-4" />
            </BreadcrumbItem>) : (
            <BreadcrumbItem key={breadcrumb.href} className={cn(index === breadcrumbs.length - 1 && 'text-blue-500 dark:text-blue-400')}>
              {breadcrumb.label.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
            </BreadcrumbItem>
          )
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}