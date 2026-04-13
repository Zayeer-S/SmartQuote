/* eslint-disable @typescript-eslint/unbound-method */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { QuoteApprovalService } from '../../../src/server/services/quote/quote-approval.service';
import { ForbiddenError } from '../../../src/server/services/ticket/ticket.errors';
import { QUOTE_ERROR_MSGS } from '../../../src/server/services/quote/quote.errors';
import { QUOTE_APPROVAL_STATUSES } from '../../../src/shared/constants/lookup-values';
import type {
  QuotesDAO,
  QuoteApprovalsDAO,
} from '../../../src/server/daos/children/quotes-domain.dao';
import type { UsersDAO } from '../../../src/server/daos/children/users-domain.dao';
import type { Quote, QuoteApproval } from '../../../src/server/database/types/tables';
import type { QuoteId, UserId } from '../../../src/server/database/types/ids';
import { makeMockQuoteApprovalsDAO, makeMockQuotesDAO, makeMockUsersDAO } from './utils/mock.daos';
import { makeMockRBACService } from './utils/mock.services';

const ACTOR_ID = 'user-1' as unknown as UserId;
const QUOTE_ID = 'quote-1' as unknown as QuoteId;
const APPROVAL_ID = 99;

const STATUS_IDS: Record<string, number> = {
  [QUOTE_APPROVAL_STATUSES.APPROVED_BY_AGENT]: 1,
  [QUOTE_APPROVAL_STATUSES.APPROVED_BY_MANAGER]: 2,
  [QUOTE_APPROVAL_STATUSES.APPROVED_BY_ADMIN]: 3,
  [QUOTE_APPROVAL_STATUSES.APPROVED_BY_CUSTOMER]: 4,
  [QUOTE_APPROVAL_STATUSES.REJECTED_BY_MANAGER]: 5,
  [QUOTE_APPROVAL_STATUSES.REJECTED_BY_CUSTOMER]: 6,
  [QUOTE_APPROVAL_STATUSES.REVISED]: 7,
};

const stubLookup = {
  quoteApprovalStatusId: vi.fn((name: string) => STATUS_IDS[name]),
};

function makeQuote(overrides: Partial<Quote> = {}): Quote {
  return {
    id: QUOTE_ID,
    quote_approval_id: null,
    ticket_id: 'ticket-1',
    ...overrides,
  } as unknown as Quote;
}

function makeApproval(statusName: keyof typeof STATUS_IDS): QuoteApproval {
  return {
    id: APPROVAL_ID,
    approval_status_id: STATUS_IDS[statusName],
    comment: null,
    approved_at: null,
  } as unknown as QuoteApproval;
}

describe('QuoteApprovalService', () => {
  let quotesDAO: QuotesDAO;
  let quoteApprovalsDAO: QuoteApprovalsDAO;
  let usersDAO: UsersDAO;
  let rbac: ReturnType<typeof makeMockRBACService>;

  function makeService(): QuoteApprovalService {
    return new QuoteApprovalService(
      quotesDAO,
      quoteApprovalsDAO,
      usersDAO,
      rbac,
      stubLookup as never
    );
  }

  beforeEach(() => {
    quotesDAO = makeMockQuotesDAO();
    quoteApprovalsDAO = makeMockQuoteApprovalsDAO();
    usersDAO = makeMockUsersDAO();
    rbac = makeMockRBACService();
    vi.mocked(stubLookup.quoteApprovalStatusId).mockImplementation(
      (name: string) => STATUS_IDS[name]
    );
  });

  describe('submitForApproval', () => {
    it('throws ForbiddenError when actor lacks QUOTES_AGENT_APPROVE', async () => {
      vi.mocked(rbac.hasPermission).mockResolvedValue(false);

      await expect(makeService().submitForApproval(QUOTE_ID, ACTOR_ID)).rejects.toThrow(
        ForbiddenError
      );
      expect(quotesDAO.getById).not.toHaveBeenCalled();
    });

    it('throws QuoteError NOT_FOUND when quote does not exist', async () => {
      vi.mocked(rbac.hasPermission).mockResolvedValue(true);
      vi.mocked(quotesDAO.getById).mockResolvedValue(null);

      await expect(makeService().submitForApproval(QUOTE_ID, ACTOR_ID)).rejects.toThrow(
        QUOTE_ERROR_MSGS.NOT_FOUND
      );
    });

    it('throws QuoteError WRONG_STAGE when quote already has an approval record', async () => {
      vi.mocked(rbac.hasPermission).mockResolvedValue(true);
      vi.mocked(quotesDAO.getById).mockResolvedValue(
        makeQuote({ quote_approval_id: APPROVAL_ID as never })
      );

      await expect(makeService().submitForApproval(QUOTE_ID, ACTOR_ID)).rejects.toThrow(
        QUOTE_ERROR_MSGS.WRONG_STAGE
      );
    });

    it('creates approval with APPROVED_BY_AGENT status and links it to the quote', async () => {
      vi.mocked(rbac.hasPermission).mockResolvedValue(true);
      vi.mocked(quotesDAO.getById).mockResolvedValue(makeQuote());
      vi.mocked(usersDAO.getById).mockResolvedValue({
        id: ACTOR_ID,
        role: { name: 'Support Agent' },
      } as never);

      const createdApproval = makeApproval(QUOTE_APPROVAL_STATUSES.APPROVED_BY_AGENT);
      vi.mocked(quoteApprovalsDAO.create).mockResolvedValue(createdApproval);

      const result = await makeService().submitForApproval(QUOTE_ID, ACTOR_ID);

      const createCall = vi.mocked(quoteApprovalsDAO.create).mock.calls[0][0];
      expect(createCall.approval_status_id).toBe(
        STATUS_IDS[QUOTE_APPROVAL_STATUSES.APPROVED_BY_AGENT]
      );
      expect(createCall.approved_at).toBeInstanceOf(Date);

      expect(quotesDAO.update).toHaveBeenCalledWith(
        { id: QUOTE_ID },
        { quote_approval_id: createdApproval.id },
        undefined
      );

      expect(result).toBe(createdApproval);
    });
  });

  describe('managerApprove', () => {
    it('throws ForbiddenError when actor lacks QUOTES_MANAGER_APPROVE', async () => {
      vi.mocked(rbac.hasPermission).mockResolvedValue(false);

      await expect(makeService().managerApprove(QUOTE_ID, ACTOR_ID, null)).rejects.toThrow(
        ForbiddenError
      );
    });

    it('throws QuoteError NOT_SUBMITTED when quote has no approval record', async () => {
      vi.mocked(rbac.hasPermission).mockResolvedValue(true);
      vi.mocked(quotesDAO.getById).mockResolvedValue(makeQuote({ quote_approval_id: null }));

      await expect(makeService().managerApprove(QUOTE_ID, ACTOR_ID, null)).rejects.toThrow(
        QUOTE_ERROR_MSGS.NOT_SUBMITTED
      );
    });

    it('throws QuoteError WRONG_STAGE when status is not APPROVED_BY_AGENT', async () => {
      vi.mocked(rbac.hasPermission).mockResolvedValue(true);
      vi.mocked(quotesDAO.getById).mockResolvedValue(
        makeQuote({ quote_approval_id: APPROVAL_ID as never })
      );
      // Already manager-approved -- wrong stage for another manager approval
      vi.mocked(quoteApprovalsDAO.getById).mockResolvedValue(
        makeApproval(QUOTE_APPROVAL_STATUSES.APPROVED_BY_MANAGER)
      );

      await expect(makeService().managerApprove(QUOTE_ID, ACTOR_ID, null)).rejects.toThrow(
        QUOTE_ERROR_MSGS.WRONG_STAGE
      );
    });

    it('transitions to APPROVED_BY_MANAGER and returns updated approval', async () => {
      vi.mocked(rbac.hasPermission).mockResolvedValue(true);
      vi.mocked(quotesDAO.getById).mockResolvedValue(
        makeQuote({ quote_approval_id: APPROVAL_ID as never })
      );
      vi.mocked(quoteApprovalsDAO.getById).mockResolvedValue(
        makeApproval(QUOTE_APPROVAL_STATUSES.APPROVED_BY_AGENT)
      );
      const updated = makeApproval(QUOTE_APPROVAL_STATUSES.APPROVED_BY_MANAGER);
      // getById is called twice: once in resolveApproval, once to return the refreshed row
      vi.mocked(quoteApprovalsDAO.getById)
        .mockResolvedValueOnce(makeApproval(QUOTE_APPROVAL_STATUSES.APPROVED_BY_AGENT))
        .mockResolvedValueOnce(updated);

      const result = await makeService().managerApprove(QUOTE_ID, ACTOR_ID, 'Looks good');

      const updateCall = vi.mocked(quoteApprovalsDAO.update).mock.calls[0][1];
      expect(updateCall.approval_status_id).toBe(
        STATUS_IDS[QUOTE_APPROVAL_STATUSES.APPROVED_BY_MANAGER]
      );
      expect(updateCall.comment).toBe('Looks good');
      expect(result).toBe(updated);
    });
  });

  describe('managerReject', () => {
    it('throws ForbiddenError when actor lacks QUOTES_MANAGER_REJECT', async () => {
      vi.mocked(rbac.hasPermission).mockResolvedValue(false);

      await expect(makeService().managerReject(QUOTE_ID, ACTOR_ID, 'reason')).rejects.toThrow(
        ForbiddenError
      );
    });

    it('throws WRONG_STAGE when status is not APPROVED_BY_AGENT', async () => {
      vi.mocked(rbac.hasPermission).mockResolvedValue(true);
      vi.mocked(quotesDAO.getById).mockResolvedValue(
        makeQuote({ quote_approval_id: APPROVAL_ID as never })
      );
      vi.mocked(quoteApprovalsDAO.getById).mockResolvedValue(
        makeApproval(QUOTE_APPROVAL_STATUSES.REJECTED_BY_MANAGER)
      );

      await expect(makeService().managerReject(QUOTE_ID, ACTOR_ID, 'reason')).rejects.toThrow(
        QUOTE_ERROR_MSGS.WRONG_STAGE
      );
    });

    it('transitions to REJECTED_BY_MANAGER with mandatory comment', async () => {
      vi.mocked(rbac.hasPermission).mockResolvedValue(true);
      vi.mocked(quotesDAO.getById).mockResolvedValue(
        makeQuote({ quote_approval_id: APPROVAL_ID as never })
      );
      const updated = makeApproval(QUOTE_APPROVAL_STATUSES.REJECTED_BY_MANAGER);
      vi.mocked(quoteApprovalsDAO.getById)
        .mockResolvedValueOnce(makeApproval(QUOTE_APPROVAL_STATUSES.APPROVED_BY_AGENT))
        .mockResolvedValueOnce(updated);

      const result = await makeService().managerReject(QUOTE_ID, ACTOR_ID, 'Needs more detail');

      const updateCall = vi.mocked(quoteApprovalsDAO.update).mock.calls[0][1];
      expect(updateCall.approval_status_id).toBe(
        STATUS_IDS[QUOTE_APPROVAL_STATUSES.REJECTED_BY_MANAGER]
      );
      expect(updateCall.comment).toBe('Needs more detail');
      expect(result).toBe(updated);
    });
  });

  describe('adminApprove', () => {
    it('throws ForbiddenError when actor lacks QUOTES_ADMIN_APPROVE', async () => {
      vi.mocked(rbac.hasPermission).mockResolvedValue(false);

      await expect(makeService().adminApprove(QUOTE_ID, ACTOR_ID, null)).rejects.toThrow(
        ForbiddenError
      );
    });

    it('throws WRONG_STAGE when status is not APPROVED_BY_AGENT', async () => {
      vi.mocked(rbac.hasPermission).mockResolvedValue(true);
      vi.mocked(quotesDAO.getById).mockResolvedValue(
        makeQuote({ quote_approval_id: APPROVAL_ID as never })
      );
      // Already past agent stage
      vi.mocked(quoteApprovalsDAO.getById).mockResolvedValue(
        makeApproval(QUOTE_APPROVAL_STATUSES.APPROVED_BY_MANAGER)
      );

      await expect(makeService().adminApprove(QUOTE_ID, ACTOR_ID, null)).rejects.toThrow(
        QUOTE_ERROR_MSGS.WRONG_STAGE
      );
    });

    it('transitions to APPROVED_BY_ADMIN, bypassing manager step', async () => {
      vi.mocked(rbac.hasPermission).mockResolvedValue(true);
      vi.mocked(quotesDAO.getById).mockResolvedValue(
        makeQuote({ quote_approval_id: APPROVAL_ID as never })
      );
      const updated = makeApproval(QUOTE_APPROVAL_STATUSES.APPROVED_BY_ADMIN);
      vi.mocked(quoteApprovalsDAO.getById)
        .mockResolvedValueOnce(makeApproval(QUOTE_APPROVAL_STATUSES.APPROVED_BY_AGENT))
        .mockResolvedValueOnce(updated);

      const result = await makeService().adminApprove(QUOTE_ID, ACTOR_ID, 'Admin bypass');

      const updateCall = vi.mocked(quoteApprovalsDAO.update).mock.calls[0][1];
      expect(updateCall.approval_status_id).toBe(
        STATUS_IDS[QUOTE_APPROVAL_STATUSES.APPROVED_BY_ADMIN]
      );
      expect(result).toBe(updated);
    });
  });

  describe('customerApprove', () => {
    it('throws ForbiddenError when actor lacks QUOTES_CUSTOMER_APPROVE', async () => {
      vi.mocked(rbac.hasPermission).mockResolvedValue(false);

      await expect(makeService().customerApprove(QUOTE_ID, ACTOR_ID, null)).rejects.toThrow(
        ForbiddenError
      );
    });

    it('throws WRONG_STAGE when status is APPROVED_BY_AGENT (not yet manager-approved)', async () => {
      vi.mocked(rbac.hasPermission).mockResolvedValue(true);
      vi.mocked(quotesDAO.getById).mockResolvedValue(
        makeQuote({ quote_approval_id: APPROVAL_ID as never })
      );
      vi.mocked(quoteApprovalsDAO.getById).mockResolvedValue(
        makeApproval(QUOTE_APPROVAL_STATUSES.APPROVED_BY_AGENT)
      );

      await expect(makeService().customerApprove(QUOTE_ID, ACTOR_ID, null)).rejects.toThrow(
        QUOTE_ERROR_MSGS.WRONG_STAGE
      );
    });

    it('transitions to APPROVED_BY_CUSTOMER from APPROVED_BY_MANAGER', async () => {
      vi.mocked(rbac.hasPermission).mockResolvedValue(true);
      vi.mocked(quotesDAO.getById).mockResolvedValue(
        makeQuote({ quote_approval_id: APPROVAL_ID as never })
      );
      const updated = makeApproval(QUOTE_APPROVAL_STATUSES.APPROVED_BY_CUSTOMER);
      vi.mocked(quoteApprovalsDAO.getById)
        .mockResolvedValueOnce(makeApproval(QUOTE_APPROVAL_STATUSES.APPROVED_BY_MANAGER))
        .mockResolvedValueOnce(updated);

      const result = await makeService().customerApprove(QUOTE_ID, ACTOR_ID, null);

      const updateCall = vi.mocked(quoteApprovalsDAO.update).mock.calls[0][1];
      expect(updateCall.approval_status_id).toBe(
        STATUS_IDS[QUOTE_APPROVAL_STATUSES.APPROVED_BY_CUSTOMER]
      );
      expect(result).toBe(updated);
    });

    it('transitions to APPROVED_BY_CUSTOMER from APPROVED_BY_ADMIN', async () => {
      vi.mocked(rbac.hasPermission).mockResolvedValue(true);
      vi.mocked(quotesDAO.getById).mockResolvedValue(
        makeQuote({ quote_approval_id: APPROVAL_ID as never })
      );
      const updated = makeApproval(QUOTE_APPROVAL_STATUSES.APPROVED_BY_CUSTOMER);
      vi.mocked(quoteApprovalsDAO.getById)
        .mockResolvedValueOnce(makeApproval(QUOTE_APPROVAL_STATUSES.APPROVED_BY_ADMIN))
        .mockResolvedValueOnce(updated);

      const result = await makeService().customerApprove(QUOTE_ID, ACTOR_ID, null);

      const updateCall = vi.mocked(quoteApprovalsDAO.update).mock.calls[0][1];
      expect(updateCall.approval_status_id).toBe(
        STATUS_IDS[QUOTE_APPROVAL_STATUSES.APPROVED_BY_CUSTOMER]
      );
      expect(result).toBe(updated);
    });
  });

  describe('customerReject', () => {
    it('throws ForbiddenError when actor lacks QUOTES_CUSTOMER_REJECT', async () => {
      vi.mocked(rbac.hasPermission).mockResolvedValue(false);

      await expect(
        makeService().customerReject(QUOTE_ID, ACTOR_ID, 'too expensive')
      ).rejects.toThrow(ForbiddenError);
    });

    it('throws WRONG_STAGE when status is APPROVED_BY_AGENT (not yet manager-approved)', async () => {
      vi.mocked(rbac.hasPermission).mockResolvedValue(true);
      vi.mocked(quotesDAO.getById).mockResolvedValue(
        makeQuote({ quote_approval_id: APPROVAL_ID as never })
      );
      vi.mocked(quoteApprovalsDAO.getById).mockResolvedValue(
        makeApproval(QUOTE_APPROVAL_STATUSES.APPROVED_BY_AGENT)
      );

      await expect(
        makeService().customerReject(QUOTE_ID, ACTOR_ID, 'too expensive')
      ).rejects.toThrow(QUOTE_ERROR_MSGS.WRONG_STAGE);
    });

    it('transitions to REJECTED_BY_CUSTOMER from APPROVED_BY_MANAGER', async () => {
      vi.mocked(rbac.hasPermission).mockResolvedValue(true);
      vi.mocked(quotesDAO.getById).mockResolvedValue(
        makeQuote({ quote_approval_id: APPROVAL_ID as never })
      );
      const updated = makeApproval(QUOTE_APPROVAL_STATUSES.REJECTED_BY_CUSTOMER);
      vi.mocked(quoteApprovalsDAO.getById)
        .mockResolvedValueOnce(makeApproval(QUOTE_APPROVAL_STATUSES.APPROVED_BY_MANAGER))
        .mockResolvedValueOnce(updated);

      const result = await makeService().customerReject(QUOTE_ID, ACTOR_ID, 'too expensive');

      const updateCall = vi.mocked(quoteApprovalsDAO.update).mock.calls[0][1];
      expect(updateCall.approval_status_id).toBe(
        STATUS_IDS[QUOTE_APPROVAL_STATUSES.REJECTED_BY_CUSTOMER]
      );
      expect(updateCall.comment).toBe('too expensive');
      expect(result).toBe(updated);
    });

    it('transitions to REJECTED_BY_CUSTOMER from APPROVED_BY_ADMIN', async () => {
      vi.mocked(rbac.hasPermission).mockResolvedValue(true);
      vi.mocked(quotesDAO.getById).mockResolvedValue(
        makeQuote({ quote_approval_id: APPROVAL_ID as never })
      );
      const updated = makeApproval(QUOTE_APPROVAL_STATUSES.REJECTED_BY_CUSTOMER);
      vi.mocked(quoteApprovalsDAO.getById)
        .mockResolvedValueOnce(makeApproval(QUOTE_APPROVAL_STATUSES.APPROVED_BY_ADMIN))
        .mockResolvedValueOnce(updated);

      const result = await makeService().customerReject(QUOTE_ID, ACTOR_ID, 'too expensive');

      const updateCall = vi.mocked(quoteApprovalsDAO.update).mock.calls[0][1];
      expect(updateCall.approval_status_id).toBe(
        STATUS_IDS[QUOTE_APPROVAL_STATUSES.REJECTED_BY_CUSTOMER]
      );
      expect(result).toBe(updated);
    });
  });
});
