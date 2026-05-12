import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEnvelope, faPhone, faLocationDot } from '@fortawesome/free-solid-svg-icons';
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
    <footer className="bg-[#06091E] text-gray-400" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Gold top divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-[#F26522]/50 to-transparent" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-10">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-8 mb-14">

          {/* Brand column */}
          <div className="col-span-2">
            <div className={`flex items-center gap-2 mb-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <img src="/logo.svg" alt="MYBRIDGE" className="h-8 w-auto brightness-0 invert opacity-90" />
              <span className="font-display text-xl text-white/95 tracking-wide">MYBRIDGE</span>
            </div>
            <p className="text-xs text-[#F26522]/70 italic mb-5 leading-relaxed">{t('footer.tagline')}</p>

            <div className={`space-y-1 text-xs text-gray-500 mb-5 ${isRTL ? 'text-right' : ''}`}>
              <p className="font-medium text-gray-400">{t('footer.license')}</p>
              <p>{t('footer.company')}</p>
              <p>{t('footer.regNo')}</p>
              <p className="text-[#F26522]">www.mybridge.my</p>
            </div>

            <div className={`space-y-2 ${isRTL ? 'text-right' : ''}`}>
              <p className="text-xs flex items-center gap-2.5">
                <FontAwesomeIcon icon={faEnvelope} className="flex-shrink-0 text-[#F26522]/70 w-3" />
                {t('footer.email')}
              </p>
              <p className="text-xs flex items-center gap-2.5" dir="ltr">
                <FontAwesomeIcon icon={faPhone} className="flex-shrink-0 text-[#F26522]/70 w-3" />
                +60 17-421 2823
              </p>
              <p className="text-xs flex items-center gap-2.5">
                <FontAwesomeIcon icon={faLocationDot} className="flex-shrink-0 text-[#F26522]/70 w-3" />
                Kuala Lumpur, Malaysia
              </p>
            </div>
          </div>

          {/* Nav columns */}
          {columns.map(col => (
            <div key={col.title} className={isRTL ? 'text-right' : ''}>
              <h4 className="text-white/90 font-semibold text-sm mb-4 tracking-wide uppercase text-[11px] text-[#F26522]/80">
                {col.title}
              </h4>
              <ul className="space-y-2.5">
                {col.items.map(item => (
                  <li key={item.label}>
                    {item.href.startsWith('/') ? (
                      <Link
                        to={item.href}
                        className="text-sm text-gray-500 hover:text-[#F26522] transition-colors duration-200"
                      >
                        {item.label}
                      </Link>
                    ) : (
                      <a
                        href={item.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-gray-500 hover:text-[#F26522] transition-colors duration-200"
                      >
                        {item.label}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Gold divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-[#F26522]/20 to-transparent mb-6" />

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-gray-600">{t('footer.copyright')}</p>

          {/* Socials */}
          <div className="flex items-center gap-2.5">
            {socials.map((s, i) => (
              <a
                key={i}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 bg-white/5 hover:bg-[#F26522]/20 border border-white/8 hover:border-[#F26522]/40 rounded-xl flex items-center justify-center transition-all duration-200 hover:-translate-y-0.5"
              >
                <FontAwesomeIcon icon={s.icon} className="text-gray-500 hover:text-[#F26522] text-xs transition-colors" />
              </a>
            ))}
          </div>

          {/* Legal links */}
          <div className={`flex items-center gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
            {[
              { label: t('footer.terms'),   href: '/terms' },
              { label: t('footer.privacy'), href: '/privacy' },
              { label: t('footer.cookies'), href: '/cookies' },
            ].map(item => (
              <Link
                key={item.label}
                to={item.href}
                className="text-xs text-gray-600 hover:text-[#F26522] transition-colors duration-200"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
