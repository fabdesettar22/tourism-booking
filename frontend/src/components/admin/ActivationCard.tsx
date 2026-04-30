// frontend/src/components/admin/ActivationCard.tsx
//
// مكوّن إدارة التفعيل والعمولة لخدمة أو فندق
// يُعرَض داخل البطاقات في صفحات إدارة الفنادق/الخدمات

import { useState } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Loader2 } from 'lucide-react';

const BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

interface ActivationCardProps {
  itemId: number;
  itemType: 'hotel' | 'service';
  isActive: boolean;
  basePrice?: number | string | null;
  currency?: string;
  commissionPercentage?: number | string | null;
  isReadyForActivation: boolean;
  missingForActivation: string[];
  onUpdate?: () => void;  // callback بعد التحديث الناجح
  lang?: 'ar' | 'en' | 'ms';
}

const LABELS = {
  ar: {
    supplierPrice:    'سعر المورد',
    commission:       'العمولة',
    finalPrice:       'السعر النهائي للسائح',
    notSet:           'لم تُحدَّد',
    notReady:         'ينقصها',
    activate:         'تفعيل',
    deactivate:       'إخفاء',
    active:           'نشط — يظهر للسائح',
    inactive:         'غير نشط',
    save:             'حفظ',
    saving:           'جاري الحفظ...',
    activating:       'جاري التفعيل...',
    image:            'صورة',
    description:      'وصف',
    commission_pct:   'نسبة عمولة',
  },
  en: {
    supplierPrice:    'Supplier Price',
    commission:       'Commission',
    finalPrice:       'Final Price for Tourist',
    notSet:           'Not set',
    notReady:         'Missing',
    activate:         'Activate',
    deactivate:       'Hide',
    active:           'Active — visible to tourists',
    inactive:         'Inactive',
    save:             'Save',
    saving:           'Saving...',
    activating:       'Activating...',
    image:            'image',
    description:      'description',
    commission_pct:   'commission %',
  },
  ms: {
    supplierPrice:    'Harga Pembekal',
    commission:       'Komisen',
    finalPrice:       'Harga Akhir untuk Pelancong',
    notSet:           'Belum ditetapkan',
    notReady:         'Kekurangan',
    activate:         'Aktifkan',
    deactivate:       'Sembunyikan',
    active:           'Aktif — kelihatan kepada pelancong',
    inactive:         'Tidak aktif',
    save:             'Simpan',
    saving:           'Menyimpan...',
    activating:       'Mengaktifkan...',
    image:            'imej',
    description:      'penerangan',
    commission_pct:   'peratus komisen',
  },
};

export default function ActivationCard({
  itemId,
  itemType,
  isActive,
  basePrice,
  currency = 'MYR',
  commissionPercentage,
  isReadyForActivation,
  missingForActivation,
  onUpdate,
  lang = 'ar',
}: ActivationCardProps) {
  const t = LABELS[lang];

  const [commission, setCommission] = useState<string>(
    commissionPercentage !== null && commissionPercentage !== undefined
      ? String(commissionPercentage)
      : ''
  );
  const [savingCommission, setSavingCommission] = useState(false);
  const [activating, setActivating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const baseNum = basePrice ? parseFloat(String(basePrice)) : null;
  const commNum = commission ? parseFloat(commission) : null;
  const commAmount = baseNum && commNum ? (baseNum * commNum / 100) : null;
  const finalPrice = baseNum && commAmount !== null ? (baseNum + commAmount) : null;

  // ─── حفظ نسبة العمولة ───
  const saveCommission = async () => {
    if (!commission || isNaN(parseFloat(commission))) return;
    setSavingCommission(true);
    setError(null);

    try {
      const token = localStorage.getItem('access_token');
      const endpoint = itemType === 'hotel' ? 'hotels' : 'services';
      const res = await fetch(`${BASE}/api/v1/${endpoint}/${itemId}/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ commission_percentage: parseFloat(commission) }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || 'فشل في حفظ العمولة');
      }

      if (onUpdate) onUpdate();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSavingCommission(false);
    }
  };

  // ─── تفعيل/إلغاء التفعيل ───
  const toggleActivation = async () => {
    setActivating(true);
    setError(null);

    try {
      const token = localStorage.getItem('access_token');
      const endpoint = itemType === 'hotel' ? 'hotels' : 'services';
      const action = isActive ? 'deactivate' : 'activate';
      const res = await fetch(`${BASE}/api/v1/${endpoint}/${itemId}/${action}/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || data.hint || 'فشل في التحديث');
      }

      if (onUpdate) onUpdate();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActivating(false);
    }
  };

  // ─── ترجمة أسماء الحقول الناقصة ───
  const translateMissing = (key: string) => {
    const map: Record<string, string> = {
      'image':                  t.image,
      'description':            t.description,
      'commission_percentage':  t.commission_pct,
    };
    return map[key] || key;
  };

  const missingTranslated = missingForActivation
    .filter(m => m !== 'commission_percentage' || !commission)  // العمولة موجودة في الحقل لو كتبها
    .map(translateMissing);

  return (
    <div className="border-t border-gray-100 bg-gray-50 p-3 space-y-2 text-sm">
      {/* السعر الأساسي */}
      {basePrice !== null && basePrice !== undefined && (
        <div className="flex justify-between items-center">
          <span className="text-gray-600">{t.supplierPrice}:</span>
          <span className="font-medium text-gray-900">{baseNum?.toFixed(2)} {currency}</span>
        </div>
      )}

      {/* حقل العمولة */}
      <div className="flex justify-between items-center gap-2">
        <span className="text-gray-600 whitespace-nowrap">{t.commission}:</span>
        <div className="flex items-center gap-1 flex-1 max-w-[140px]">
          <input
            type="number"
            min="0"
            max="100"
            step="0.01"
            value={commission}
            onChange={e => setCommission(e.target.value)}
            placeholder={t.notSet}
            className="w-full px-2 py-1 text-sm border border-gray-200 rounded-lg focus:border-blue-400 focus:outline-none"
          />
          <span className="text-gray-500">%</span>
          <button
            onClick={saveCommission}
            disabled={savingCommission || !commission || commission === String(commissionPercentage)}
            className="px-2 py-1 text-xs bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-30 disabled:cursor-not-allowed transition"
          >
            {savingCommission ? <Loader2 className="w-3 h-3 animate-spin" /> : t.save}
          </button>
        </div>
      </div>

      {/* السعر النهائي */}
      {finalPrice !== null && (
        <div className="flex justify-between items-center pt-1 border-t border-gray-200">
          <span className="font-medium text-gray-700">{t.finalPrice}:</span>
          <span className="font-bold text-green-600">{finalPrice.toFixed(2)} {currency}</span>
        </div>
      )}

      {/* رسالة "ينقصها" */}
      {!isReadyForActivation && missingTranslated.length > 0 && (
        <div className="flex items-start gap-2 text-amber-700 bg-amber-50 px-2 py-1.5 rounded-lg">
          <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span className="text-xs">{t.notReady}: {missingTranslated.join('، ')}</span>
        </div>
      )}

      {/* خطأ */}
      {error && (
        <div className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded-lg">{error}</div>
      )}

      {/* زر التفعيل */}
      <button
        onClick={toggleActivation}
        disabled={activating || (!isActive && !isReadyForActivation)}
        className={`w-full py-2 px-3 rounded-lg font-medium text-sm transition flex items-center justify-center gap-2
          ${isActive
            ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200'
            : isReadyForActivation
              ? 'bg-green-500 text-white hover:bg-green-600'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          }`}
      >
        {activating ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            {isActive ? t.saving : t.activating}
          </>
        ) : isActive ? (
          <>
            <CheckCircle className="w-4 h-4" />
            {t.active} — {t.deactivate}
          </>
        ) : (
          <>
            <XCircle className="w-4 h-4" />
            {t.inactive} — {t.activate}
          </>
        )}
      </button>
    </div>
  );
}
