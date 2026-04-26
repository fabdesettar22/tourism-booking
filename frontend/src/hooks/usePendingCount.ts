// frontend/src/hooks/usePendingCount.ts
// يجلب عدد الطلبات المعلّقة (Agencies + Suppliers)

import { useEffect, useState } from 'react';
import { apiFetch } from '../services/apiFetch';

interface PendingCounts {
  agencies:  number;
  suppliers: number;
  total:     number;
}

export function usePendingCount(refreshInterval: number = 30000) {
  const [counts, setCounts] = useState<PendingCounts>({ agencies: 0, suppliers: 0, total: 0 });

  const fetchCounts = async () => {
    try {
      const [agRes, supRes] = await Promise.all([
        apiFetch('/api/v1/waitlist-agency/admin/pending/').catch(() => null),
        apiFetch('/api/v1/accounts/admin/suppliers/pending/').catch(() => null),
      ]);

      let ag = 0, sup = 0;
      if (agRes?.ok) {
        const data = await agRes.json();
        ag = data.count ?? data.agencies?.length ?? 0;
      }
      if (supRes?.ok) {
        const data = await supRes.json();
        sup = data.count ?? data.suppliers?.length ?? data.length ?? 0;
      }

      setCounts({ agencies: ag, suppliers: sup, total: ag + sup });
    } catch {
      // silent fail — badge will show 0
    }
  };

  useEffect(() => {
    fetchCounts();
    const interval = setInterval(fetchCounts, refreshInterval);
    return () => clearInterval(interval);
  }, [refreshInterval]);

  return { counts, refetch: fetchCounts };
}
