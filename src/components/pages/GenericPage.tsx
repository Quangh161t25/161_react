import React from 'react';
import { ArrowLeft } from 'lucide-react';

interface GenericPageProps {
  title: string;
  description: string;
  onBack: () => void;
}

export const GenericPage: React.FC<GenericPageProps> = ({
  title,
  description,
  onBack,
}) => {
  return (
    <div className="flex-1 p-4 md:p-6">
      <div className="max-w-4xl mx-auto bg-card border border-border rounded-2xl p-6 shadow-sm">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-primary mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Quay lại trang chủ
        </button>

        <h1 className="text-xl font-bold text-foreground mb-2">{title}</h1>
        <p className="text-sm text-muted-foreground mb-6">{description}</p>

        <div className="rounded-xl border border-dashed border-border p-8 text-center bg-muted/20">
          <p className="text-sm text-muted-foreground">
            Nội dung phân hệ <strong className="text-foreground">{title}</strong> đang được phát triển.
          </p>
        </div>
      </div>
    </div>
  );
};
