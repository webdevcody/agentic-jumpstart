import { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  highlightedWord: string;
  description: string;
  actions?: ReactNode;
}

export function PageHeader({
  title,
  highlightedWord,
  description,
  actions,
}: PageHeaderProps) {
  const titleParts = title.split(highlightedWord);
  
  return (
    <div className="mb-12">
      <div className={`flex items-start justify-between mb-6 ${actions ? '' : 'mb-6'}`}>
        <div>
          <h1 className="text-4xl font-bold mb-4">
            {titleParts[0]}
            <span className="text-gradient">{highlightedWord}</span>
            {titleParts[1]}
          </h1>
          <p className="text-description max-w-2xl">
            {description}
          </p>
        </div>
        {actions && (
          <div>
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}