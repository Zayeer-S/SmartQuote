import { useState } from 'react';
import { quoteAPI } from '../../lib/api/quote.api.js';
import type {
  ApproveQuoteRequest,
  RejectQuoteRequest,
  QuoteApprovalResponse,
} from '../../../shared/contracts/quote-contracts.js';

// ─── Shared hook factory ──────────────────────────────────────────────────────

interface QuoteActionState {
  data: QuoteApprovalResponse | null;
  loading: boolean;
  error: string | null;
}

type ApproveExecuteFn = (
  ticketId: string,
  quoteId: string,
  payload: ApproveQuoteRequest
) => Promise<void>;

type RejectExecuteFn = (
  ticketId: string,
  quoteId: string,
  payload: RejectQuoteRequest
) => Promise<void>;

function useQuoteApproveAction(
  apiFn: (
    ticketId: string,
    quoteId: string,
    payload: ApproveQuoteRequest
  ) => Promise<QuoteApprovalResponse>
): QuoteActionState & { execute: ApproveExecuteFn } {
  const [state, setState] = useState<QuoteActionState>({
    data: null,
    loading: false,
    error: null,
  });

  async function execute(
    ticketId: string,
    quoteId: string,
    payload: ApproveQuoteRequest
  ): Promise<void> {
    setState({ data: null, loading: true, error: null });
    try {
      const data = await apiFn(ticketId, quoteId, payload);
      setState({ data, loading: false, error: null });
    } catch (err) {
      setState({ data: null, loading: false, error: (err as Error).message });
    }
  }

  return { ...state, execute };
}

function useQuoteRejectAction(
  apiFn: (
    ticketId: string,
    quoteId: string,
    payload: RejectQuoteRequest
  ) => Promise<QuoteApprovalResponse>
): QuoteActionState & { execute: RejectExecuteFn } {
  const [state, setState] = useState<QuoteActionState>({
    data: null,
    loading: false,
    error: null,
  });

  async function execute(
    ticketId: string,
    quoteId: string,
    payload: RejectQuoteRequest
  ): Promise<void> {
    setState({ data: null, loading: true, error: null });
    try {
      const data = await apiFn(ticketId, quoteId, payload);
      setState({ data, loading: false, error: null });
    } catch (err) {
      setState({ data: null, loading: false, error: (err as Error).message });
    }
  }

  return { ...state, execute };
}

// ─── Public hooks ─────────────────────────────────────────────────────────────

export function useManagerApproveQuote() {
  return useQuoteApproveAction(quoteAPI.managerApproveQuote.bind(quoteAPI));
}

export function useAdminApproveQuote() {
  return useQuoteApproveAction(quoteAPI.adminApproveQuote.bind(quoteAPI));
}

export function useCustomerApproveQuote() {
  return useQuoteApproveAction(quoteAPI.customerApproveQuote.bind(quoteAPI));
}

export function useManagerRejectQuote() {
  return useQuoteRejectAction(quoteAPI.managerRejectQuote.bind(quoteAPI));
}

export function useCustomerRejectQuote() {
  return useQuoteRejectAction(quoteAPI.customerRejectQuote.bind(quoteAPI));
}
