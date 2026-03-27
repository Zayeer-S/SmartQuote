import React, { useEffect, useState } from 'react';
import { useListTickets } from '../../hooks/tickets/useListTicket.js';
import { useResolutionTime } from '../../hooks/analytics/useResolutionTime.js';
import { useTicketVolume } from '../../hooks/analytics/useTicketVolume.js';
import { useQuoteAccuracy } from '../../hooks/analytics/useQuoteAccuracy.js';
import StatsOverview from '../../features/dashboard/StatsOverview.js';
import TicketStatusChart from '../../features/dashboard/TicketStatusChart.js';
import ResolutionTimeChart from '../../features/dashboard/ResolutionTimeChart.js';
import TicketVolumeChart from '../../features/dashboard/TicketVolumeChart.js';
import QuoteAccuracyChart from '../../features/dashboard/QuoteAccuracyChart.js';
import DateRangeFilter, { type DateRange } from '../../features/dashboard/DateRangeFilter.js';
import { exportToCsv } from '../../lib/utils/export-csv.js';
import { exportToPdf, type PdfSection } from '../../lib/utils/export-pdf.js';
import { KEYS } from '../../lib/storage/keys.js';
import './AdminAnalyticsPage.css';

const CAROUSEL_STORAGE_KEY = KEYS.ANALYTICS_CAROUSEL_INDEX;

interface CarouselSlide {
  id: string;
  title: string;
}

const CAROUSEL_SLIDES: CarouselSlide[] = [
  { id: 'resolution-time', title: 'Avg Resolution Time' },
  { id: 'ticket-volume', title: 'Ticket Volume' },
  { id: 'quote-accuracy', title: 'Quote Accuracy' },
];

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

const DEFAULT_RANGE: DateRange = { from: daysAgo(30), to: today() };

function formatDateRange(range: DateRange): string {
  return `${range.from} to ${range.to}`;
}

function readStoredIndex(): number {
  try {
    const raw = localStorage.getItem(CAROUSEL_STORAGE_KEY);
    if (raw === null) return 0;
    const parsed = parseInt(raw, 10);
    if (isNaN(parsed) || parsed < 0 || parsed >= CAROUSEL_SLIDES.length) return 0;
    return parsed;
  } catch {
    return 0;
  }
}

const AdminAnalyticsPage: React.FC = () => {
  const [dateRange, setDateRange] = useState<DateRange>(DEFAULT_RANGE);
  const [carouselIndex, setCarouselIndex] = useState<number>(readStoredIndex);

  const ticketsHook = useListTickets();
  const resolutionHook = useResolutionTime();
  const volumeHook = useTicketVolume();
  const accuracyHook = useQuoteAccuracy();

  // Fetch all data when date range changes
  useEffect(() => {
    const timer = setTimeout(() => {
      void ticketsHook.execute({ from: dateRange.from, to: dateRange.to });
      void resolutionHook.execute(dateRange.from, dateRange.to);
      void volumeHook.execute(dateRange.from, dateRange.to);
      void accuracyHook.execute(dateRange.from, dateRange.to);
    }, 1000);

    return () => {
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateRange.from, dateRange.to]);

  const tickets = ticketsHook.data?.tickets ?? [];

  function goTo(index: number): void {
    const clamped = Math.max(0, Math.min(CAROUSEL_SLIDES.length - 1, index));
    setCarouselIndex(clamped);
    try {
      localStorage.setItem(CAROUSEL_STORAGE_KEY, String(clamped));
    } catch {
      // Storage unavailable -- silently ignore, carousel still works in-memory
    }
  }

  function goLeft(): void {
    goTo(carouselIndex === 0 ? CAROUSEL_SLIDES.length - 1 : carouselIndex - 1);
  }

  function goRight(): void {
    goTo(carouselIndex === CAROUSEL_SLIDES.length - 1 ? 0 : carouselIndex + 1);
  }

  const currentSlide = CAROUSEL_SLIDES[carouselIndex];

  function renderCarouselContent(): React.ReactNode {
    if (currentSlide.id === 'resolution-time') {
      if (resolutionHook.loading) return <p className="chart-loading-text">Loading...</p>;
      if (resolutionHook.error)
        return (
          <p className="feedback-error" role="alert">
            {resolutionHook.error}
          </p>
        );
      if (!resolutionHook.data) return null;
      return <ResolutionTimeChart data={resolutionHook.data} />;
    }

    if (currentSlide.id === 'ticket-volume') {
      if (volumeHook.loading) return <p className="chart-loading-text">Loading...</p>;
      if (volumeHook.error)
        return (
          <p className="feedback-error" role="alert">
            {volumeHook.error}
          </p>
        );
      if (!volumeHook.data) return null;
      return <TicketVolumeChart data={volumeHook.data} />;
    }

    if (currentSlide.id === 'quote-accuracy') {
      if (accuracyHook.loading) return <p className="chart-loading-text">Loading...</p>;
      if (accuracyHook.error)
        return (
          <p className="feedback-error" role="alert">
            {accuracyHook.error}
          </p>
        );
      if (!accuracyHook.data) return null;
      return <QuoteAccuracyChart data={accuracyHook.data} />;
    }

    return null;
  }

  function buildExportRows(): Record<string, unknown>[] {
    const rows: Record<string, unknown>[] = [];

    for (const t of tickets) {
      rows.push({
        type: 'ticket',
        id: t.id,
        title: t.title,
        status: t.ticketStatus,
        priority: t.ticketPriority,
        severity: t.ticketSeverity,
        createdAt: t.createdAt,
      });
    }

    for (const r of resolutionHook.data?.data ?? []) {
      rows.push({
        type: 'resolution',
        ticketId: r.ticketId,
        resolutionTimeHours: r.resolutionTimeHours,
        ticketSeverity: r.ticketSeverity,
        businessImpact: r.businessImpact,
        resolvedAt: r.resolvedAt,
      });
    }

    for (const v of volumeHook.data?.data ?? []) {
      rows.push({ type: 'volume', day: v.day, count: v.count });
    }

    for (const q of accuracyHook.data?.data ?? []) {
      rows.push({
        type: 'quote_accuracy',
        quoteId: q.quoteId,
        estimatedCost: q.estimatedCost,
        finalCost: q.finalCost,
        variance: q.variance,
        accuracyPercentage: q.accuracyPercentage,
      });
    }

    return rows;
  }

  function buildPdfSections(): PdfSection[] {
    return [
      {
        title: 'Ticket Status Breakdown',
        rows: tickets.map((t) => ({
          id: t.id,
          title: t.title,
          status: t.ticketStatus,
          priority: t.ticketPriority,
          severity: t.ticketSeverity,
          createdAt: t.createdAt,
        })),
      },
      {
        title: 'Average Resolution Time',
        rows: (resolutionHook.data?.data ?? []).map((r) => ({
          ticketId: r.ticketId,
          resolutionTimeHours: r.resolutionTimeHours,
          severity: r.ticketSeverity,
          businessImpact: r.businessImpact,
          resolvedAt: r.resolvedAt,
        })),
      },
      {
        title: 'Ticket Volume Over Time',
        rows: (volumeHook.data?.data ?? []).map((v) => ({
          day: v.day,
          count: v.count,
        })),
      },
      {
        title: 'Quote Accuracy',
        rows: (accuracyHook.data?.data ?? []).map((q) => ({
          quoteId: q.quoteId,
          estimatedCost: q.estimatedCost,
          finalCost: q.finalCost,
          variance: q.variance,
          accuracyPct: q.accuracyPercentage,
        })),
      },
    ];
  }

  const filename = `analytics-${dateRange.from}-${dateRange.to}`;

  function handleExportCsv(): void {
    exportToCsv(buildExportRows(), filename);
  }

  function handleExportPdf(): void {
    exportToPdf(
      buildPdfSections(),
      'SmartQuote Analytics Report',
      filename,
      formatDateRange(dateRange)
    );
  }

  const pageLoading = ticketsHook.loading;
  const pageError = ticketsHook.error;

  if (pageLoading) {
    return (
      <p className="loading-text" data-testid="analytics-loading">
        Loading analytics...
      </p>
    );
  }

  if (pageError) {
    return (
      <p className="feedback-error" role="alert" data-testid="analytics-error">
        {pageError}
      </p>
    );
  }

  return (
    <div className="admin-page" data-testid="admin-analytics-page">
      {/* Header */}
      <div className="page-header">
        <h1 className="page-title">Analytics</h1>
        <div className="analytics-header-actions">
          <button
            className="export-btn"
            onClick={handleExportCsv}
            type="button"
            data-testid="export-csv-btn"
          >
            Export CSV
          </button>
          <button
            className="export-btn"
            onClick={handleExportPdf}
            type="button"
            data-testid="export-pdf-btn"
          >
            Export PDF
          </button>
        </div>
      </div>

      {/* Date range filter */}
      <DateRangeFilter value={dateRange} onChange={setDateRange} />

      {/* Stats overview */}
      <section className="analytics-section" aria-labelledby="overview-heading">
        <h2 className="analytics-section-heading" id="overview-heading">
          Overview
        </h2>
        <StatsOverview tickets={tickets} />
      </section>

      {/* Pie chart + carousel row */}
      <section
        className="analytics-section analytics-charts-row"
        aria-labelledby="charts-row-heading"
      >
        <h2 className="analytics-section-heading" id="charts-row-heading">
          Breakdown
        </h2>
        <div className="analytics-charts-grid">
          {/* Pie chart -- fixed left */}
          <div className="analytics-pie-panel" aria-labelledby="status-breakdown-heading">
            <h3 className="chart-panel-heading" id="status-breakdown-heading">
              Status Breakdown
            </h3>
            <TicketStatusChart tickets={tickets} />
          </div>

          {/* Carousel -- fills remaining space */}
          <div className="analytics-carousel-panel" data-testid="analytics-carousel">
            <div className="carousel-header">
              <h3 className="chart-panel-heading">{currentSlide.title}</h3>
              <div className="carousel-controls">
                <button
                  className="carousel-arrow"
                  onClick={goLeft}
                  type="button"
                  aria-label="Previous chart"
                  data-testid="carousel-prev"
                >
                  &#8592;
                </button>
                <span className="carousel-indicator" aria-live="polite">
                  {carouselIndex + 1} / {CAROUSEL_SLIDES.length}
                </span>
                <button
                  className="carousel-arrow"
                  onClick={goRight}
                  type="button"
                  aria-label="Next chart"
                  data-testid="carousel-next"
                >
                  &#8594;
                </button>
              </div>
            </div>
            <div className="carousel-content">{renderCarouselContent()}</div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AdminAnalyticsPage;
