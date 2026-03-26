import { useState } from 'react';
import { slaAPI } from '../../lib/api/sla.api.js';
import type {
  CreateSlaPolicyRequest,
  SlaPolicyResponse,
} from '../../../shared/contracts/sla-contracts.js';

interface UseCreateSlaPolicyState {
  data: SlaPolicyResponse | null;
  loading: boolean;
  error: string | null;
}

interface UseCreateSlaPolicyReturn extends UseCreateSlaPolicyState {
  execute: (data: CreateSlaPolicyRequest) => Promise<SlaPolicyResponse | null>;
}

export function useCreateSlaPolicy(): UseCreateSlaPolicyReturn {
  const [state, setState] = useState<UseCreateSlaPolicyState>({
    data: null,
    loading: false,
    error: null,
  });

  async function execute(data: CreateSlaPolicyRequest): Promise<SlaPolicyResponse | null> {
    setState({ data: null, loading: true, error: null });
    try {
      const result = await slaAPI.createPolicy(data);
      setState({ data: result, loading: false, error: null });
      return result;
    } catch (err) {
      setState({ data: null, loading: false, error: (err as Error).message });
      return null;
    }
  }

  return { ...state, execute };
}
