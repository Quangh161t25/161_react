import React from 'react';
import { FINANCE_SECTIONS } from '../../data/finance';
import { FinanceCard } from './FinanceCard';

interface FinancePageProps {
  onNavigate: (href: string) => void;
}

export const FinancePage: React.FC<FinancePageProps> = ({ onNavigate }) => {
  return (
    <div className="flex-1 min-h-0 flex flex-col p-1.5 md:p-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
      <div className="flex-1 min-h-0 flex flex-col">
        <div className="pb-10 pt-2 shrink-0">
          <div className="space-y-6 md:space-y-8">
            {FINANCE_SECTIONS.map((section) => (
              <div key={section.id} className="space-y-4 md:space-y-5">
                {/* Section Header */}
                <div className="flex items-center gap-3">
                  <div className="w-1 h-5 rounded-full bg-primary/80" aria-hidden="true" />
                  <h2 className="text-sm font-semibold text-primary">{section.title}</h2>
                  <div className="flex-1 h-px bg-border" />
                </div>

                {/* Section Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
                  {section.items.map((item) => (
                    <FinanceCard
                      key={item.id}
                      item={item}
                      onClick={onNavigate}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
