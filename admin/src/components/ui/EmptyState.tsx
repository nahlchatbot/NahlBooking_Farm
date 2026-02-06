import { ReactNode } from 'react';
import { FileX, Search, Calendar, Users, Package } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from './Button';

interface EmptyStateProps {
  icon?: 'file' | 'search' | 'calendar' | 'users' | 'package' | ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

const iconMap = {
  file: FileX,
  search: Search,
  calendar: Calendar,
  users: Users,
  package: Package,
};

export function EmptyState({
  icon = 'file',
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  const IconComponent = typeof icon === 'string' ? iconMap[icon] : null;

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-12 px-4 text-center',
        className
      )}
    >
      <div className="mb-4 p-4 bg-gray-100 rounded-full">
        {IconComponent ? (
          <IconComponent className="h-8 w-8 text-gray-400" />
        ) : (
          icon
        )}
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-gray-500 max-w-sm mb-4">{description}</p>
      )}
      {action && (
        <Button onClick={action.onClick} size="sm">
          {action.label}
        </Button>
      )}
    </div>
  );
}
