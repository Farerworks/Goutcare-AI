import React from 'react';
import type { TranslationKey } from '../translations';

export type NavigationSection = 'home' | 'chat' | 'records' | 'settings';

interface MainNavigationProps {
  activeSection: NavigationSection;
  onSectionChange: (section: NavigationSection) => void;
  t: (key: TranslationKey, substitutions?: Record<string, string | number>) => string;
}

const MainNavigation: React.FC<MainNavigationProps> = ({ 
  activeSection, 
  onSectionChange, 
  t 
}) => {
  const navItems = [
    {
      id: 'home' as NavigationSection,
      icon: '🏠',
      label: '홈',
      description: '현재 상태와 빠른 액션'
    },
    {
      id: 'chat' as NavigationSection,
      icon: '💬',
      label: 'AI 상담',
      description: '채팅과 기록'
    },
    {
      id: 'records' as NavigationSection,
      icon: '📈',
      label: '내 기록',
      description: '건강 트렌드'
    },
    {
      id: 'settings' as NavigationSection,
      icon: '⚙️',
      label: '설정',
      description: '앱 설정과 고급 기능'
    }
  ];

  return (
    <nav className="bg-gradient-to-r from-zinc-900/80 to-zinc-800/60 border-b border-zinc-700/50 px-4 py-3">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-teal-500 to-emerald-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">G</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">GoutCare AI</h1>
            </div>
          </div>

          {/* Navigation Items */}
          <div className="flex gap-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onSectionChange(item.id)}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200
                  ${activeSection === item.id
                    ? 'bg-teal-600 text-white shadow-lg'
                    : 'text-zinc-300 hover:text-white hover:bg-zinc-700/50'
                  }
                `}
                title={item.description}
              >
                <span className="text-lg">{item.icon}</span>
                <span className="font-medium hidden sm:block">{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default MainNavigation;