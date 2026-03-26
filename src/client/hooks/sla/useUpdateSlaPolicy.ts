import { useState } from 'react';
import { slaAPI } from '../../lib/api/sla.api.js';
import type {
  UpdateSlaPolicyRequest,
  SlaPolicyResponse,
} from '../../../shared/contracts/sla-contracts.js';

interface UseUpdateSlaPolicyState {
  data: SlaPolicyResponse | null;
  loading: boolean;
  error: string | null;
}

interface UseUpdateSlaPolicyReturn extends UseUpdateSlaPolicyState {
  execute: (slaPolicyId: number, data: UpdateSlaPolicyRequest) => Promise<SlaPolicyResponse | null>;
}

export function useUpdateSlaPolicy(): UseUpdateSlaPolicyReturn {
  const [state, setState] = useState<UseUpdateSlaPolicyState>({
    data: null,
    loading: false,
    error: null,
  });

  async function execute(
    slaPolicyId: number,
    data: UpdateSlaPolicyRequest
  ): Promise<SlaPolicyResponse | null> {
    setState({ data: null, loading: true, error: null });
    try {
      const result = await slaAPI.updatePolicy(slaPolicyId, data);
      setState({ data: result, loading: false, error: null });
      return result;
    } catch (err) {
      setState({ data: null, loading: false, error: (err as Error).message });
      return null;
    }
  }

  return { ...state, execute };
}
