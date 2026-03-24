import React from 'react';
import './TicketPagination.css';

interface TicketPaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const TicketPagination: React.FC<TicketPaginationProps> = ({ page, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;

  return (
    <nav
      className="ticket-pagination"
      aria-label="Ticket list pagination"
      data-testid="ticket-pagination"
    >
      <button
        type="button"
        className="btn btn-secondary btn-sm"
        onClick={() => {
          onPageChange(page - 1);
        }}
        disabled={page <= 1}
        aria-label="Previous page"
        data-testid="pagination-prev"
      >
        ← Previous
      </button>

      <span className="ticket-pagination-label" aria-current="page" data-testid="pagination-label">
        Page {page} of {totalPages}
      </span>

      <button
        type="button"
        className="btn btn-secondary btn-sm"
        onClick={() => {
          onPageChange(page + 1);
        }}
        disabled={page >= totalPages}
        aria-label="Next page"
        data-testid="pagination-next"
      >
        Next →
      </button>
    </nav>
  );
};

export default TicketPagination;
