import React from 'react';
import { SlaStatusResponse } from '../../../../shared/contracts/sla-contracts';
import { getSlaBadgeClass } from '../../../lib/utils/badge-utils';
import { getHours } from '../../../lib/utils/formatters';
import { useSlaCountdown } from '../../../hooks/sla/useSlaCountdown';
import './SlaStatus.css';

interface SlaSectionProps {
  slaStatus: SlaStatusResponse | null;
  onSlaBreachConfirm?: () => void;
}

const SlaStatus: React.FC<SlaSectionProps> = ({ slaStatus, onSlaBreachConfirm }) => {
  const { display: countdownDisplay, breached } = useSlaCountdown(
    slaStatus?.slaDeadline ?? null,
    onSlaBreachConfirm
  );

  if (slaStatus == null) return;

  const isBreached = breached || slaStatus.deadlineBreached;

  return (
    <section className="card" aria-labelledby="sla-section-heading" data-testid="sla-section">
      <h2 className="sla-section-heading" id="sla-section-heading">
        SLA
      </h2>

      <div className="sla-detail-header">
        <span className="sla-detail-policy-name" data-testid="sla-policy-name">
          {slaStatus.policyName}
        </span>
        <span className={getSlaBadgeClass(isBreached)} data-testid="sla-breach-badge">
          {isBreached ? 'Deadline Breached' : 'Within Deadline'}
        </span>
      </div>

      {slaStatus.severityTarget !== null && (
        <dl className="sla-detail-current-target">
          {!isBreached && slaStatus.slaDeadline !== null && (
            <div className="sla-detail-dl-row">
              <dt>Response Deadline</dt>
              <dd data-testid="sla-countdown">{countdownDisplay}</dd>
            </div>
          )}
          <div className="sla-detail-dl-row">
            <dt>Response Target</dt>
            <dd data-testid="sla-response-target">
              {getHours(slaStatus.severityTarget.responseTimeHours)}
            </dd>
          </div>
          <div className="sla-detail-dl-row">
            <dt>Resolution Target</dt>
            <dd data-testid="sla-resolution-target">
              {getHours(slaStatus.severityTarget.resolutionTimeHours)}
            </dd>
          </div>
        </dl>
      )}

      <table
        className="sla-targets-table"
        aria-label="SLA targets by severity"
        data-testid="sla-targets-table"
      >
        <thead>
          <tr>
            <th scope="col">Severity</th>
            <th scope="col">Response Target</th>
            <th scope="col">Resolution Target</th>
          </tr>
        </thead>
        <tbody>
          {slaStatus.allSeverityTargets.map((target) => (
            <tr
              key={target.severity}
              data-testid={`sla-target-row-${target.severity.toLowerCase()}`}
            >
              <td>{target.severity}</td>
              <td>{getHours(target.responseTimeHours)}</td>
              <td>{getHours(target.resolutionTimeHours)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
};

export default SlaStatus;
