import React from 'react';

interface BreadcrumbsProps {
  engineStatus?: string;
  section?: string;
  page?: string;
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({
  engineStatus = 'Grammar Engine Ready',
  section = 'Bottom-Up Parsing',
  page = 'Operator Precedence',
}) => {
  return (
    <div className="h-[36px] bg-[#1F2333] border-b border-[#2E354B] flex items-center justify-between px-4 md:px-8 text-xs font-mono text-[#8F94A6] select-none">
      <div className="flex items-center gap-1.5">
        <span className="hover:text-white cursor-pointer transition-colors">Home</span>
        <span className="text-[#52576B]">›</span>
        <span className="hover:text-white cursor-pointer transition-colors">{section}</span>
        <span className="text-[#52576B]">›</span>
        <span className="text-white font-medium">{page}</span>
      </div>

      <div className="hidden sm:flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-[#8FF3F4] animate-pulse"></span>
        <span className="text-white/80">{engineStatus}</span>
      </div>
    </div>
  );
};
