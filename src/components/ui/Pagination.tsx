import { ChevronLeft, ChevronRight } from 'lucide-react';
import { IconButton } from './Button';

interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ page, pageSize, total, onPageChange }: PaginationProps) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (total <= pageSize) return null;
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <nav aria-label="Pagination" className="flex items-center justify-between gap-3 border-t border-slate-100 px-5 py-3">
      <p className="text-sm text-slate-500">
        <span className="font-medium text-slate-900">{from}</span>–<span className="font-medium text-slate-900">{to}</span> of{' '}
        <span className="font-medium text-slate-900">{total}</span>
      </p>
      <div className="flex items-center gap-1">
        <IconButton
          variant="secondary"
          label="Previous page"
          icon={<ChevronLeft className="size-4" />}
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        />
        <span className="px-2 text-sm text-slate-600 tabular-nums">
          {page} / {pages}
        </span>
        <IconButton
          variant="secondary"
          label="Next page"
          icon={<ChevronRight className="size-4" />}
          disabled={page >= pages}
          onClick={() => onPageChange(page + 1)}
        />
      </div>
    </nav>
  );
}
