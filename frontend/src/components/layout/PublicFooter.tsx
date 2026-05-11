import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEnvelope, faPhone } from '@fortawesome/free-solid-svg-icons';
import { faFacebook, faInstagram, faTwitter, faWhatsapp } from '@fortawesome/free-brands-svg-icons';
import { useLanguage } from '../../hooks/useLanguage';

export function PublicFooter() {
  const { t, isRTL } = useLanguage();

  const columns = [
    { title: t('footer.support'),  items: [
      { label: t('footer.helpCenter'), href: '/help' },
      { label: t('footer.liveChat'),   href: 'https://wa.me/60174212823' },
      { label: t('footer.security'),   href: '/security' },
    ] },
    { title: t('footer.company2'), items: [
      { label: t('footer.aboutUs'), href: '/about' },
      { label: t('footer.careers'), href: '/careers' },
      { label: t('footer.contact'), href: '/contact' },
    ] },
    { title: t('footer.services'), items: [
      { label: t('footer.hotels'),    href: '/hotels' },
      { label: t('footer.flights'),   href: '/flights' },
      { label: t('footer.guide'),     href: '/guides' },
      { label: t('footer.transport'), href: '/transport' },
    ] },
    { title: t('footer.legal'), items: [
      { label: t('footer.terms'),   href: '/terms' },
      { label: t('footer.privacy'), href: '/privacy' },
      { label: t('footer.cookies'), href: '/cookies' },
    ] },
  ];

  const socials = [
    { icon: faFacebook,  href: 'https://www.facebook.com/mybridge.my' },
    { icon: faInstagram, href: 'https://www.instagram.com/mybridge.my' },
    { icon: faTwitter,   href: 'https://twitter.com/mybridge_my' },
    { icon: faWhatsapp,  href: 'https://wa.me/60174212823' },
  ];

  return (
    <footer className="bg-gray-900 text-gray-400" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-8 mb-12">
          <div className="col-span-2">
            <div className={`flex items-center gap-2 mb-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <img src="/logo.svg" alt="MYBRIDGE" className="h-8 w-auto brightness-0 invert" />
              <span className="text-white font-bold text-lg">MYBRIDGE</span>
            </div>
            <p className="text-xs text-gray-500 italic mb-4">{t('footer.tagline')}</p>
            <div className={`space-y-1 text-xs text-gray-500 ${isRTL ? 'text-right' : ''}`}>
              <p className="font-medium text-gray-400">{t('footer.license')}</p>
              <p>{t('footer.company')}</p>
              <p>{t('footer.regNo')}</p>
              <p className="text-[#FF6B35]">www.mybridge.my</p>
            </div>
            <div className={`mt-4 ${isRTL ? 'text-right' : ''}`}>
              <p className="text-xs flex items-center gap-2">
                <FontAwesomeIcon icon={faEnvelope} className="flex-shrink-0 text-[#FF6B35]" />
                {t('footer.email')}
              </p>
              <p className="text-xs flex items-center gap-2 mt-1" dir="ltr">
                <FontAwesomeIcon icon={faPhone} className="flex-shrink-0 text-[#FF6B35]" />
                +60 17-421 2823
              </p>
            </div>
          </div>
          {columns.map(col => (
            <div key={col.title} className={isRTL ? 'text-right' : ''}>
              <h4 className="text-white font-bold text-sm mb-4">{col.title}</h4>
              <ul className="space-y-2.5">
                {col.items.map(item => (
                  <li key={item.label}>
                    {item.href.startsWith('/') ? (
                      <Link to={item.href} className="text-sm hover:text-orange-400 transition-colors">{item.label}</Link>
                    ) : (
                      <a href={item.href} target="_blank" rel="noopener noreferrer" className="text-sm hover:text-orange-400 transition-colors">{item.label}</a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t border-gray-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs">{t('footer.copyright')}</p>
          <div className="flex items-center gap-3">
            {socials.map((s, i) => (
              <a key={i} href={s.href} target="_blank" rel="noopener noreferrer" className="w-8 h-8 bg-gray-800 hover:bg-[#FF6B35] rounded-lg flex items-center justify-center transition-colors">
                <FontAwesomeIcon icon={s.icon} className="text-gray-400 hover:text-white text-sm" />
              </a>
            ))}
          </div>
          <div className={`flex items-center gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
            {[
              { label: t('footer.terms'),   href: '/terms' },
              { label: t('footer.privacy'), href: '/privacy' },
              { label: t('footer.cookies'), href: '/cookies' },
            ].map(item => (
              <Link key={item.label} to={item.href} className="text-xs hover:text-orange-400 transition-colors">{item.label}</Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
