import { ReactNode } from 'react';

interface KanbanHorizontalContainerProps {
  headers: Array<{ id: string; title: string; color?: string }>;
  children: ReactNode;
}

// Container básico para Fase 1: rolagem horizontal + cabeçalhos sticky
export default function KanbanHorizontalContainer({ headers, children }: KanbanHorizontalContainerProps) {
  return (
    <div className="w-full">
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b">
        <div className="flex gap-4 px-4 py-3 overflow-x-auto">
          {headers.map(h => (
            <div key={h.id} className={`min-w-[260px] shrink-0 px-3 py-2 rounded-md border ${h.color ?? ''}`}>
              <div className="font-semibold text-sm">{h.title}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="flex gap-4 px-4 py-4 overflow-x-auto">
        {children}
      </div>
    </div>
  );
}
