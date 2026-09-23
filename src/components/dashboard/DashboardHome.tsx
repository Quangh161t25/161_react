import React from 'react';
import { DASHBOARD_MODULES } from '../../data/navigation';
import { useAuth } from '../../context/AuthContext';
import { ModuleCard } from './ModuleCard';

interface DashboardHomeProps {
  onNavigate: (href: string) => void;
}

export const DashboardHome: React.FC<DashboardHomeProps> = ({ onNavigate }) => {
  const { currentUser } = useAuth();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Chào buổi sáng';
    if (hour < 18) return 'Chào buổi chiều';
    return 'Chào buổi tối';
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col p-1.5 md:p-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
      <div className="flex-1 min-h-0 flex flex-col">
        <div className="pb-10 pt-2 shrink-0">
          {/* Greeting Header */}
          <div className="mb-6">
            <h1 className="text-lg md:text-xl font-semibold text-foreground tracking-tight">
              {getGreeting()},{' '}
              <span className="text-primary font-bold">{currentUser.name}</span> 👋
            </h1>
          </div>

          {/* Divider */}
          <div className="h-px bg-border w-full mb-6" />

          {/* Module Cards Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 h-full items-start content-start">
            {DASHBOARD_MODULES.map((module) => (
              <ModuleCard
                key={module.id}
                module={module}
                onClick={onNavigate}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
