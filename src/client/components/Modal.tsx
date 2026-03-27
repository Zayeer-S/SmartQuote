import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import './Modal.css';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  /** Accessible description shown below the title, optional */
  description?: string;
  children: React.ReactNode;
  /** Max width of the modal panel -- defaults to 640px */
  maxWidth?: string;
  /** data-testid applied to the dialog element */
  testId?: string;
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  maxWidth = '640px',
  testId = 'modal',
}) => {
  const dialogRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  // -------------------------------------------------------------------------
  // Lock body scroll and store previously focused element
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (!isOpen) return;

    previouslyFocusedRef.current = document.activeElement as HTMLElement;
    document.body.style.overflow = 'hidden';

    // Focus the dialog panel itself on open so focus trap has a root
    dialogRef.current?.focus();

    return () => {
      document.body.style.overflow = '';
      previouslyFocusedRef.current?.focus();
    };
  }, [isOpen]);

  // -------------------------------------------------------------------------
  // Esc to close
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }

      // Focus trap -- keep Tab/Shift+Tab inside the dialog
      if (e.key !== 'Tab' || !dialogRef.current) return;

      const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), ' +
          'textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    // Backdrop
    <div
      className="modal-backdrop"
      onClick={onClose}
      aria-hidden="true"
      data-testid="modal-backdrop"
    >
      {/* Panel -- stop clicks propagating to backdrop */}
      <div
        ref={dialogRef}
        className="modal-panel"
        style={{ maxWidth }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        aria-describedby={description ? 'modal-description' : undefined}
        tabIndex={-1}
        onClick={(e) => {
          e.stopPropagation();
        }}
        data-testid={testId}
      >
        <div className="modal-header">
          <div className="modal-header-text">
            <h2 className="modal-title" id="modal-title">
              {title}
            </h2>
            {description && (
              <p className="modal-description" id="modal-description">
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close modal"
            data-testid="modal-close-btn"
          >
            {/* Close icon -- inline SVG, no external dep */}
            <svg
              width="18"
              height="18"
              viewBox="0 0 18 18"
              fill="none"
              aria-hidden="true"
              focusable="false"
            >
              <path
                d="M1 1L17 17M17 1L1 17"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        <div className="modal-body">{children}</div>
      </div>
    </div>,
    document.body
  );
};

export default Modal;
