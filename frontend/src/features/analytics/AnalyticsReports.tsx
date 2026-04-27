import { useState } from 'react';
import { Download, Calendar, TrendingUp, Star, Award, Target } from 'lucide-react';
import { useLanguage } from '../../hooks/useLanguage';

export function AnalyticsReports() {
  const { t, isRTL } = useLanguage();
  const [reportType, setReportType] = useState<'sales' | 'destinations' | 'packages' | 'ratings'>('sales');
  const [period, setPeriod] = useState<'week' | 'month' | 'quarter' | 'year'>('month');

  const salesData = [
    { period: t('analyticsRpt.sales.week1'), bookings: 45, revenue: '$78,500', conversion: '12.5%' },
    { period: t('analyticsRpt.sales.week2'), bookings: 52, revenue: '$89,200', conversion: '14.2%' },
    { period: t('analyticsRpt.sales.week3'), bookings: 48, revenue: '$82,100', conversion: '13.1%' },
    { period: t('analyticsRpt.sales.week4'), bookings: 61, revenue: '$92,700', conversion: '15.8%' },
  ];

  const destinationPerformance = [
    { name: t('analyticsRpt.destinations.dubai'),    bookings: 245, revenue: '$425,000', growth: '+15%', rating: 4.8, trend: 'up' as const },
    { name: t('analyticsRpt.destinations.istanbul'), bookings: 167, revenue: '$289,000', growth: '+12%', rating: 4.9, trend: 'up' as const },
    { name: t('analyticsRpt.destinations.cairo'),    bookings: 189, revenue: '$312,000', growth: '+8%',  rating: 4.6, trend: 'up' as const },
    { name: t('analyticsRpt.destinations.paris'),    bookings: 134, revenue: '$567,000', growth: '+22%', rating: 4.7, trend: 'up' as const },
    { name: t('analyticsRpt.destinations.london'),   bookings: 98,  revenue: '$412,000', growth: '-3%',  rating: 4.5, trend: 'down' as const },
  ];

  const packagePerformance = [
    { name: t('analyticsRpt.packages.pkg1'), bookings: 127, revenue: '$444,500', rating: 4.8, satisfaction: 96 },
    { name: t('analyticsRpt.packages.pkg2'), bookings: 67,  revenue: '$140,700', rating: 4.9, satisfaction: 98 },
    { name: t('analyticsRpt.packages.pkg3'), bookings: 89,  revenue: '$106,800', rating: 4.6, satisfaction: 92 },
    { name: t('analyticsRpt.packages.pkg4'), bookings: 72,  revenue: '$230,400', rating: 4.6, satisfaction: 91 },
    { name: t('analyticsRpt.packages.pkg5'), bookings: 98,  revenue: '$176,400', rating: 4.7, satisfaction: 94 },
  ];

  const customerRatings = [
    { category: t('analyticsRpt.ratings.cat1'), rating: 4.8, reviews: 1234, percentage: 96 },
    { category: t('analyticsRpt.ratings.cat2'), rating: 4.6, reviews: 1156, percentage: 92 },
    { category: t('analyticsRpt.ratings.cat3'), rating: 4.7, reviews: 987,  percentage: 94 },
    { category: t('analyticsRpt.ratings.cat4'), rating: 4.5, reviews: 1087, percentage: 90 },
    { category: t('analyticsRpt.ratings.cat5'), rating: 4.9, reviews: 1345, percentage: 98 },
  ];

  const maxBookings = Math.max(...destinationPerformance.map(d => d.bookings));
  const align = isRTL ? 'text-right' : 'text-left';
  const opposite = isRTL ? 'text-left' : 'text-right';

  return (
    <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="mb-1">{t('analyticsRpt.title')}</h2>
          <p className="text-muted-foreground">{t('analyticsRpt.subtitle')}</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as any)}
            className="px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="week">{t('analyticsRpt.period.week')}</option>
            <option value="month">{t('analyticsRpt.period.month')}</option>
            <option value="quarter">{t('analyticsRpt.period.quarter')}</option>
            <option value="year">{t('analyticsRpt.period.year')}</option>
          </select>
          <button className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity">
            <Download className="w-5 h-5" />
            <span>{t('analyticsRpt.export')}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <button
          onClick={() => setReportType('sales')}
          className={`p-6 rounded-lg border transition-all ${align} ${
            reportType === 'sales'
              ? 'bg-primary text-primary-foreground border-primary'
              : 'bg-card border-border hover:border-primary/50'
          }`}
        >
          <Calendar className="w-8 h-8 mb-3" />
          <h3 className="text-sm mb-1">{t('analyticsRpt.cards.sales.title')}</h3>
          <p className="text-xs opacity-80">{t('analyticsRpt.cards.sales.desc')}</p>
        </button>

        <button
          onClick={() => setReportType('destinations')}
          className={`p-6 rounded-lg border transition-all ${align} ${
            reportType === 'destinations'
              ? 'bg-primary text-primary-foreground border-primary'
              : 'bg-card border-border hover:border-primary/50'
          }`}
        >
          <Target className="w-8 h-8 mb-3" />
          <h3 className="text-sm mb-1">{t('analyticsRpt.cards.destinations.title')}</h3>
          <p className="text-xs opacity-80">{t('analyticsRpt.cards.destinations.desc')}</p>
        </button>

        <button
          onClick={() => setReportType('packages')}
          className={`p-6 rounded-lg border transition-all ${align} ${
            reportType === 'packages'
              ? 'bg-primary text-primary-foreground border-primary'
              : 'bg-card border-border hover:border-primary/50'
          }`}
        >
          <Award className="w-8 h-8 mb-3" />
          <h3 className="text-sm mb-1">{t('analyticsRpt.cards.packages.title')}</h3>
          <p className="text-xs opacity-80">{t('analyticsRpt.cards.packages.desc')}</p>
        </button>

        <button
          onClick={() => setReportType('ratings')}
          className={`p-6 rounded-lg border transition-all ${align} ${
            reportType === 'ratings'
              ? 'bg-primary text-primary-foreground border-primary'
              : 'bg-card border-border hover:border-primary/50'
          }`}
        >
          <Star className="w-8 h-8 mb-3" />
          <h3 className="text-sm mb-1">{t('analyticsRpt.cards.ratings.title')}</h3>
          <p className="text-xs opacity-80">{t('analyticsRpt.cards.ratings.desc')}</p>
        </button>
      </div>

      {reportType === 'sales' && (
        <div className="bg-card rounded-lg border border-border p-6">
          <h3 className="mb-6">{t('analyticsRpt.sales.title')} - {t(`analyticsRpt.period.${period}`)}</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className={`${align} py-3 px-4 font-medium`}>{t('analyticsRpt.sales.cols.period')}</th>
                  <th className={`${align} py-3 px-4 font-medium`}>{t('analyticsRpt.sales.cols.bookings')}</th>
                  <th className={`${align} py-3 px-4 font-medium`}>{t('analyticsRpt.sales.cols.revenue')}</th>
                  <th className={`${align} py-3 px-4 font-medium`}>{t('analyticsRpt.sales.cols.conversion')}</th>
                  <th className={`${align} py-3 px-4 font-medium`}>{t('analyticsRpt.sales.cols.performance')}</th>
                </tr>
              </thead>
              <tbody>
                {salesData.map((item, index) => (
                  <tr key={index} className="border-b border-border hover:bg-accent/50 transition-colors">
                    <td className="py-3 px-4">{item.period}</td>
                    <td className="py-3 px-4 font-medium">{item.bookings}</td>
                    <td className="py-3 px-4 text-green-500 font-medium">{item.revenue}</td>
                    <td className="py-3 px-4">{item.conversion}</td>
                    <td className="py-3 px-4">
                      <div className="h-2 bg-accent rounded-full overflow-hidden w-32">
                        <div
                          className="h-full bg-primary transition-all"
                          style={{ width: `${(item.bookings / 70) * 100}%` }}
                        ></div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-6 p-4 bg-accent/50 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">{t('analyticsRpt.sales.totalBookings')}</p>
                <p className="text-2xl font-bold">206</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">{t('analyticsRpt.sales.totalRevenue')}</p>
                <p className="text-2xl font-bold text-green-500">$342,500</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">{t('analyticsRpt.sales.avgConversion')}</p>
                <p className="text-2xl font-bold">13.9%</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {reportType === 'destinations' && (
        <div className="bg-card rounded-lg border border-border p-6">
          <h3 className="mb-6">{t('analyticsRpt.destinations.title')}</h3>
          <div className="space-y-4">
            {destinationPerformance.map((dest) => (
              <div key={dest.name} className="p-4 bg-background rounded-lg">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-medium mb-1">{dest.name}</h4>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                        {dest.rating}
                      </span>
                      <span>{dest.bookings} {t('analyticsRpt.destinations.bookings')}</span>
                    </div>
                  </div>
                  <div className={opposite}>
                    <p className="font-medium text-green-500">{dest.revenue}</p>
                    <p className={`text-sm flex items-center gap-1 ${
                      dest.trend === 'up' ? 'text-green-500' : 'text-red-500'
                    }`}>
                      <TrendingUp className={`w-4 h-4 ${dest.trend === 'down' ? 'rotate-180' : ''}`} />
                      {dest.growth}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{t('analyticsRpt.destinations.bookingsLabel')}</span>
                    <span>{((dest.bookings / maxBookings) * 100).toFixed(0)}%</span>
                  </div>
                  <div className="h-2 bg-accent rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 transition-all"
                      style={{ width: `${(dest.bookings / maxBookings) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {reportType === 'packages' && (
        <div className="bg-card rounded-lg border border-border p-6">
          <h3 className="mb-6">{t('analyticsRpt.packages.title')}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {packagePerformance.map((pkg) => (
              <div key={pkg.name} className="p-4 bg-background rounded-lg border border-border">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h4 className="font-medium mb-2">{pkg.name}</h4>
                    <div className="flex items-center gap-1 mb-2">
                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      <span className="text-sm font-medium">{pkg.rating}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{t('analyticsRpt.packages.bookings')}</span>
                    <span className="font-medium">{pkg.bookings}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{t('analyticsRpt.packages.revenue')}</span>
                    <span className="font-medium text-green-500">{pkg.revenue}</span>
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-muted-foreground">{t('analyticsRpt.packages.satisfaction')}</span>
                      <span className="font-medium">{pkg.satisfaction}%</span>
                    </div>
                    <div className="h-2 bg-accent rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500 transition-all"
                        style={{ width: `${pkg.satisfaction}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {reportType === 'ratings' && (
        <div className="bg-card rounded-lg border border-border p-6">
          <h3 className="mb-6">{t('analyticsRpt.ratings.title')}</h3>
          <div className="space-y-6">
            {customerRatings.map((rating) => (
              <div key={rating.category} className="p-4 bg-background rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="font-medium mb-1">{rating.category}</h4>
                    <p className="text-sm text-muted-foreground">{rating.reviews} {t('analyticsRpt.ratings.reviews')}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                    <span className="text-2xl font-bold">{rating.rating}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{t('analyticsRpt.ratings.satisfactionRate')}</span>
                    <span className="font-medium text-green-500">{rating.percentage}%</span>
                  </div>
                  <div className="h-3 bg-accent rounded-full overflow-hidden">
                    <div
                      className={`h-full bg-gradient-to-${isRTL ? 'l' : 'r'} from-green-500 to-green-400 transition-all`}
                      style={{ width: `${rating.percentage}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 bg-primary/10 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">{t('analyticsRpt.ratings.overallTitle')}</p>
                <div className="flex items-center gap-2">
                  <span className="text-3xl font-bold">4.7</span>
                  <div className="flex">
                    {Array.from({ length: 5 }).map((_, idx) => (
                      <Star
                        key={idx}
                        className={`w-5 h-5 ${
                          idx < 4 ? 'text-yellow-500 fill-yellow-500' : 'text-yellow-500 fill-yellow-500 opacity-50'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <div className={opposite}>
                <p className="text-sm text-muted-foreground mb-1">{t('analyticsRpt.ratings.totalRatings')}</p>
                <p className="text-2xl font-bold">5,809</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
