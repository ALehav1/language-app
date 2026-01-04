import { forwardRef, type ReactNode, type HTMLAttributes } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
    children: ReactNode;
    variant?: 'glass' | 'solid';
    padding?: 'sm' | 'md' | 'lg';
}

const paddingMap = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
};

export const Card = forwardRef<HTMLDivElement, CardProps>(
    ({ children, variant = 'glass', padding = 'md', className = '', ...props }, ref) => {
        const baseClass = variant === 'glass'
            ? 'glass-card'
            : 'bg-surface-100 rounded-3xl';

        return (
            <div
                ref={ref}
                className={`${baseClass} ${paddingMap[padding]} ${className}`}
                {...props}
            >
                {children}
            </div>
        );
    }
);

Card.displayName = 'Card';
