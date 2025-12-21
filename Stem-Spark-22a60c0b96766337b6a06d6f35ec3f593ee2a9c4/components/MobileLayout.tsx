import React from 'react';

interface MobileLayoutProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'small' | 'medium' | 'large';
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

export const MobileLayout: React.FC<MobileLayoutProps> = ({ 
  children, 
  className = '', 
  padding = 'medium',
  maxWidth = 'lg'
}) => {
  const paddingClasses = {
    none: '',
    small: 'px-3 py-4',
    medium: 'px-4 py-6 sm:px-6',
    large: 'px-6 py-8 sm:px-8'
  };

  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    full: 'max-w-full'
  };

  return (
    <div className={`
      w-full mx-auto
      ${paddingClasses[padding]}
      ${maxWidthClasses[maxWidth]}
      ${className}
    `}>
      {children}
    </div>
  );
};

interface MobileSectionProps {
  children: React.ReactNode;
  className?: string;
  background?: 'white' | 'gray' | 'blue' | 'gradient';
  padding?: 'none' | 'small' | 'medium' | 'large';
}

export const MobileSection: React.FC<MobileSectionProps> = ({ 
  children, 
  className = '',
  background = 'white',
  padding = 'medium'
}) => {
  const backgroundClasses = {
    white: 'bg-white',
    gray: 'bg-gray-50',
    blue: 'bg-blue-50',
    gradient: 'bg-gradient-to-br from-blue-50 to-indigo-100'
  };

  const paddingClasses = {
    none: '',
    small: 'py-6',
    medium: 'py-8 sm:py-12',
    large: 'py-12 sm:py-16'
  };

  return (
    <section className={`
      ${backgroundClasses[background]}
      ${paddingClasses[padding]}
      ${className}
    `}>
      {children}
    </section>
  );
};

interface MobileContainerProps {
  children: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  centered?: boolean;
}

export const MobileContainer: React.FC<MobileContainerProps> = ({ 
  children, 
  className = '',
  size = 'lg',
  centered = true
}) => {
  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    full: 'max-w-full'
  };

  return (
    <div className={`
      w-full mx-auto
      ${sizeClasses[size]}
      ${centered ? 'text-center' : ''}
      ${className}
    `}>
      {children}
    </div>
  );
};

interface MobileGridProps {
  children: React.ReactNode;
  className?: string;
  cols?: 1 | 2 | 3 | 4;
  gap?: 'sm' | 'md' | 'lg';
  responsive?: boolean;
}

export const MobileGrid: React.FC<MobileGridProps> = ({ 
  children, 
  className = '',
  cols = 1,
  gap = 'md',
  responsive = true
}) => {
  const colsClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
  };

  const gapClasses = {
    sm: 'gap-3',
    md: 'gap-4 sm:gap-6',
    lg: 'gap-6 sm:gap-8'
  };

  return (
    <div className={`
      grid
      ${colsClasses[cols]}
      ${gapClasses[gap]}
      ${className}
    `}>
      {children}
    </div>
  );
};

interface MobileCardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'elevated' | 'outlined' | 'filled';
  interactive?: boolean;
  padding?: 'sm' | 'md' | 'lg';
}

export const MobileCard: React.FC<MobileCardProps> = ({ 
  children, 
  className = '',
  variant = 'default',
  interactive = false,
  padding = 'md'
}) => {
  const variantClasses = {
    default: 'bg-white border border-gray-200',
    elevated: 'bg-white shadow-lg border-0',
    outlined: 'bg-transparent border-2 border-gray-300',
    filled: 'bg-gray-50 border border-gray-200'
  };

  const paddingClasses = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  };

  const interactiveClasses = interactive 
    ? 'cursor-pointer transition-all duration-200 hover:shadow-md hover:-translate-y-1 active:translate-y-0' 
    : '';

  return (
    <div className={`
      rounded-xl
      ${variantClasses[variant]}
      ${paddingClasses[padding]}
      ${interactiveClasses}
      ${className}
    `}>
      {children}
    </div>
  );
};

interface MobileButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  disabled?: boolean;
  loading?: boolean;
}

export const MobileButton: React.FC<MobileButtonProps> = ({ 
  children, 
  onClick,
  className = '',
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  disabled = false,
  loading = false
}) => {
  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800',
    secondary: 'bg-gray-600 text-white hover:bg-gray-700 active:bg-gray-800',
    outline: 'bg-transparent border-2 border-blue-600 text-blue-600 hover:bg-blue-50',
    ghost: 'bg-transparent text-gray-700 hover:bg-gray-100'
  };

  const sizeClasses = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg'
  };

  const widthClass = fullWidth ? 'w-full' : '';

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        font-medium rounded-lg
        transition-all duration-200
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${widthClass}
        ${className}
      `}
    >
      {loading ? (
        <div className="flex items-center justify-center space-x-2">
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          <span>Loading...</span>
        </div>
      ) : (
        children
      )}
    </button>
  );
};

interface MobileTextProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'h1' | 'h2' | 'h3' | 'h4' | 'body' | 'caption' | 'label';
  color?: 'default' | 'muted' | 'primary' | 'secondary';
  align?: 'left' | 'center' | 'right';
}

export const MobileText: React.FC<MobileTextProps> = ({ 
  children, 
  className = '',
  variant = 'body',
  color = 'default',
  align = 'left'
}) => {
  const variantClasses = {
    h1: 'text-2xl sm:text-3xl md:text-4xl font-bold',
    h2: 'text-xl sm:text-2xl md:text-3xl font-semibold',
    h3: 'text-lg sm:text-xl md:text-2xl font-semibold',
    h4: 'text-base sm:text-lg md:text-xl font-medium',
    body: 'text-sm sm:text-base md:text-lg',
    caption: 'text-xs sm:text-sm',
    label: 'text-sm font-medium'
  };

  const colorClasses = {
    default: 'text-gray-900',
    muted: 'text-gray-600',
    primary: 'text-blue-600',
    secondary: 'text-purple-600'
  };

  const alignClasses = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right'
  };

  return (
    <div className={`
      ${variantClasses[variant]}
      ${colorClasses[color]}
      ${alignClasses[align]}
      ${className}
    `}>
      {children}
    </div>
  );
};
