import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { CLIENT_ROUTES } from '../../constants/client.routes.js';
import Breadcrumb from '../../components/Breadcrumb.js';
import TicketTitle from '../../features/shared/TicketTitle.js';
import TabNav, { TabNavItem } from '../../components/TabNav.js';
import TicketDetailCard from '../../features/shared/TicketDetailCard.js';
import TicketDetailSidePanel from '../../features/shared/TicketDetailSidePanel.js';
import AdminQuoteDetail from '../../features/admin/quotes/AdminQuoteDetail.js';
import {
  AdminCreateQuoteForm,
  AdminUpdateQuoteForm,
} from '../../features/admin/quotes/AdminQuoteEditor.js';
import AdminQuoteApproval from '../../features/admin/quotes/AdminQuoteApproval.js';
import AdminQuoteRevisions from '../../features/admin/quotes/AdminQuoteRevisions.js';
import { useListQuotes } from '../../hooks/quotes/useListQuote.js';
import type { QuoteWithApprovalResponse } from '../../../shared/contracts/quote-contracts.js';

type AdminTab = 'details' | 'quote' | 'revision';

const ADMIN_TABS: TabNavItem<AdminTab>[] = [
  { key: 'details', label: 'Details' },
  { key: 'quote', label: 'Quote' },
  { key: 'revision', label: 'Revise Quote' },
];

function resolveLatestQuote(quotes: QuoteWithApprovalResponse[]): QuoteWithApprovalResponse | null {
  if (quotes.length === 0) return null;
  return quotes.reduce((latest, q) => (q.version > latest.version ? q : latest));
}

const AdminTicketDetailPage: React.FC = () => {
  const { ticketId } = useParams<{ ticketId: string }>();
  const [activeTab, setActiveTab] = useState<AdminTab>('details');
  const { data, loading, error, execute: fetchQuotes } = useListQuotes();

  const latestQuote = data ? resolveLatestQuote(data.quotes) : null;

  useEffect(() => {
    if (ticketId) void fetchQuotes(ticketId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticketId]);

  const handleQuoteMutated = (): void => {
    if (ticketId) void fetchQuotes(ticketId);
  };

  if (!ticketId) {
    return (
      <p className="feedback-error" role="alert" data-testid="admin-ticket-detail-page-no-id">
        No ticket ID provided.
      </p>
    );
  }

  return (
    <div className="admin-page ticket-detail-page" data-testid="admin-ticket-detail-page">
      <Breadcrumb
        route={CLIENT_ROUTES.ADMIN.ROOT}
        previousPage="Home"
        currentPage="Ticket Detail"
      />

      <TicketTitle ticketId={ticketId} />

      <div className="ticket-detail-layout" data-testid="ticket-detail-layout">
        <div className="ticket-detail-main" data-testid="ticket-detail-main">
          <TabNav tabs={ADMIN_TABS} activeTab={activeTab} onTabChange={setActiveTab} />

          {activeTab === 'details' && <TicketDetailCard ticketId={ticketId} />}

          {activeTab === 'quote' && (
            <>
              {loading && (
                <p className="loading-text" data-testid="quote-loading">
                  Loading quote...
                </p>
              )}
              {error && (
                <p className="feedback-error" role="alert" data-testid="quote-error">
                  {error}
                </p>
              )}
              {!loading && !error && (
                <>
                  <AdminCreateQuoteForm
                    ticketId={ticketId}
                    latestQuote={latestQuote}
                    onSuccess={handleQuoteMutated}
                  />
                  {latestQuote && (
                    <>
                      <AdminQuoteDetail quote={latestQuote} />
                      <AdminQuoteApproval
                        ticketId={ticketId}
                        latestQuote={latestQuote}
                        onQuoteMutated={handleQuoteMutated}
                      />
                    </>
                  )}
                </>
              )}
            </>
          )}

          {activeTab === 'revision' && (
            <>
              {loading && (
                <p className="loading-text" data-testid="quote-loading-revision">
                  Loading quote...
                </p>
              )}
              {error && (
                <p className="feedback-error" role="alert" data-testid="quote-error-revision">
                  {error}
                </p>
              )}
              {!loading && !error && latestQuote && (
                <>
                  <AdminUpdateQuoteForm
                    ticketId={ticketId}
                    latestQuote={latestQuote}
                    onSuccess={handleQuoteMutated}
                  />
                  <AdminQuoteRevisions ticketId={ticketId} latestQuote={latestQuote} />
                </>
              )}
              {!loading && !error && !latestQuote && (
                <p className="loading-text" data-testid="no-quote-for-revision">
                  No quote exists yet. Create one from the Quote tab first.
                </p>
              )}
            </>
          )}
        </div>

        <TicketDetailSidePanel ticketId={ticketId} tabs={['comments', 'similar']} />
      </div>
    </div>
  );
};

export default AdminTicketDetailPage;
