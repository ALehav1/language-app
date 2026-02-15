import { useLocation, useNavigate } from 'react-router-dom';

interface BottomNavProps {
    reviewCount?: number;  // Number of words needing review
}

/**
 * Bottom navigation bar for main app navigation.
 * Makes My Words a prominent, central feature.
 */
export function BottomNav({ reviewCount = 0 }: BottomNavProps) {
    const location = useLocation();
    const navigate = useNavigate();

    // Don't show on exercise pages
    if (location.pathname.startsWith('/exercise')) {
        return null;
    }

    const navItems = [
        {
            path: '/',
            label: 'Lessons',
            icon: (active: boolean) => (
                <svg className="w-6 h-6" fill={active ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
            ),
        },
        {
            path: '/saved',
            label: 'My Words',
            icon: (active: boolean) => (
                <svg className="w-6 h-6" fill={active ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
            ),
            badge: reviewCount > 0 ? reviewCount : undefined,
        },
    ];

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-surface-300/95 backdrop-blur-sm border-t border-white/10 safe-area-pb">
            <div className="flex justify-around items-center h-16 max-w-md mx-auto">
                {navItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                        <button
                            key={item.path}
                            onClick={() => navigate(item.path)}
                            className={`flex flex-col items-center justify-center w-20 h-full relative transition-colors ${
                                isActive ? 'text-white' : 'text-white/50 hover:text-white/70'
                            }`}
                        >
                            <div className="relative">
                                {item.icon(isActive)}
                                {item.badge && (
                                    <span className="absolute -top-1 -right-2 min-w-[18px] h-[18px] flex items-center justify-center px-1 text-[10px] font-bold bg-amber-500 text-white rounded-full">
                                        {item.badge > 99 ? '99+' : item.badge}
                                    </span>
                                )}
                            </div>
                            <span className="text-xs mt-1 font-medium">{item.label}</span>
                        </button>
                    );
                })}
            </div>
        </nav>
    );
}
