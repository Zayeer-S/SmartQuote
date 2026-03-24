import React, { useEffect } from 'react';
import { useListTickets } from '../../hooks/tickets/useListTicket';
import StatsOverview from '../../features/dashboard/StatsOverview';
import TicketStatusChart from '../../features/dashboard/TicketStatusChart';
import './AdminAnalyticsPage.css';

const AdminAnalyticsPage: React.FC = () => {
  const { execute, data, loading, error } = useListTickets();

  useEffect(() => {
    void execute();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const tickets = data?.tickets ?? [];

  if (loading) {
    return (
      <p className="loading-text" data-testid="analytics-loading">
        Loading analytics...
      </p>
    );
  }

  if (error) {
    return (
      <p className="feedback-error" role="alert" data-testid="analytics-error">
        {error}
      </p>
    );
  }

  return (
    <div className="admin-page" data-testid="admin-analytics-page">
      <div className="page-header">
        <h1 className="page-title">Analytics</h1>
      </div>

      <section className="analytics-section" aria-labelledby="overview-heading">
        <h2 className="analytics-section-heading" id="overview-heading">
          Overview
        </h2>
        <StatsOverview tickets={tickets} />
      </section>

      <section className="analytics-section" aria-labelledby="status-breakdown-heading">
        <h2 className="analytics-section-heading" id="status-breakdown-heading">
          Ticket Status Breakdown
        </h2>
        <TicketStatusChart tickets={tickets} />
      </section>

      <section
        className="analytics-section"
        aria-labelledby="resolution-time-heading"
        data-testid="chart-slot-resolution-time"
      >
        <h2 className="analytics-section-heading" id="resolution-time-heading">
          Average Resolution Time
        </h2>
        <div
          className="chart-placeholder"
          aria-label="Average resolution time chart — coming soon"
          data-testid="chart-placeholder-resolution-time"
        >
          <p className="chart-placeholder-text">Chart coming soon.</p>
        </div>
      </section>

      <section
        className="analytics-section"
        aria-labelledby="quote-accuracy-heading"
        data-testid="chart-slot-quote-accuracy"
      >
        <h2 className="analytics-section-heading" id="quote-accuracy-heading">
          Quote Accuracy
        </h2>
        <div
          className="chart-placeholder"
          aria-label="Quote accuracy chart — coming soon"
          data-testid="chart-placeholder-quote-accuracy"
        >
          <p className="chart-placeholder-text">Chart coming soon.</p>
        </div>
      </section>

      <section
        className="analytics-section"
        aria-labelledby="ticket-volume-heading"
        data-testid="chart-slot-ticket-volume"
      >
        <h2 className="analytics-section-heading" id="ticket-volume-heading">
          Ticket Volume Over Time
        </h2>
        <div
          className="chart-placeholder"
          aria-label="Ticket volume chart — coming soon"
          data-testid="chart-placeholder-ticket-volume"
        >
          <p className="chart-placeholder-text">Chart coming soon.</p>
        </div>
      </section>

      <section
        className="analytics-section"
        aria-labelledby="user-activity-heading"
        data-testid="chart-slot-user-activity"
      >
        <h2 className="analytics-section-heading" id="user-activity-heading">
          User Activity
        </h2>
        <div
          className="chart-placeholder"
          aria-label="User activity chart — coming soon"
          data-testid="chart-placeholder-user-activity"
        >
          <p className="chart-placeholder-text">Chart coming soon.</p>
        </div>
      </section>
    </div>
  );
};

export default AdminAnalyticsPage;
