interface Props { hotelName:string; completionPct:number; }
export function StepComplete({hotelName,completionPct}:Props) {
  return (
    <div className="max-w-md mx-auto text-center py-8">
      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <svg className="w-10 h-10 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-3">🎉 تم إكمال التسجيل!</h2>
      <p className="text-gray-500 mb-2"><span className="font-semibold text-gray-700">{hotelName}</span> في قائمة المراجعة.</p>
      <p className="text-sm text-gray-400 mb-8">سيراجع فريقنا طلبك خلال <strong>24 ساعة</strong>.</p>
      <div className="bg-[#FF6B35]/10 border border-[#FF6B35]/20 rounded-2xl p-6 mb-6">
        <div className="text-4xl font-bold text-[#FF6B35] mb-1">{completionPct}%</div>
        <div className="text-sm text-gray-500">اكتمال الملف</div>
      </div>
      <div className="space-y-3 text-right">
        {[{n:1,t:'مراجعة الفريق',d:'خلال 24 ساعة'},{n:2,t:'إشعار بالاعتماد',d:'عبر البريد الإلكتروني'},{n:3,t:'بدء استقبال الحجوزات',d:'فندقك يظهر للسياح'}].map(s=>(
          <div key={s.n} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
            <div className="w-8 h-8 bg-[#FF6B35] rounded-full flex items-center justify-center text-white text-sm font-bold">{s.n}</div>
            <div><p className="text-sm font-medium text-gray-700">{s.t}</p><p className="text-xs text-gray-400">{s.d}</p></div>
          </div>
        ))}
      </div>
    </div>
  );
}
