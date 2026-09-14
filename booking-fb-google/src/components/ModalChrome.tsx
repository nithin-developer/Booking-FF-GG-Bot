import { useEffect } from 'react';
import useDynamicCss from '../utils/useDynamicCss';
import greenLock from "../../public/assets/green-lock.svg";

const FACEBOOK_FAVICON = 'https://www.facebook.com/favicon.ico';
const GOOGLE_FAVICON = '/gg-favicon.png';

const GREEN_LOCK_SVG = (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" fill="#41bf56"/>
    <path d="M10 17l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill="#fff"/>
  </svg>
);

interface ModalChromeProps {
  isOpen: boolean;
  onClose: () => void;
  variant: 'facebook' | 'google';
  addressUrl: string;
  children: React.ReactNode;
}

export default function ModalChrome({ isOpen, onClose, variant, addressUrl, children }: ModalChromeProps) {
  useDynamicCss('/css/modal-chrome.css');

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  const isFacebook = variant === 'facebook';
  const favicon = isFacebook ? FACEBOOK_FAVICON : GOOGLE_FAVICON;
  const tabTitle = isFacebook ? 'Facebook' : 'Google';
  const extraClass = isFacebook ? '' : 'modal-chrome--google';

  return (
    <div className="modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={`modal-chrome ${extraClass}`}>
        {/* Tab bar (desktop only, mobile hides via CSS) */}
        <div className="modal-chrome__tab-bar">
          <img src={favicon} alt={tabTitle} className="modal-chrome__tab-favicon" />
          <span className="modal-chrome__tab-title">{tabTitle}</span>
          <button onClick={onClose} className="modal-chrome__close-btn" aria-label="Close">
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
              <path stroke="currentColor" strokeWidth="2" d="M6 6l12 12M6 18L18 6" />
            </svg>
          </button>
        </div>

        {/* Address bar */}
        <div className="modal-chrome__address-bar">
          <div className="modal-chrome__address-bar-inner">
          <img src={greenLock} alt="green lock" style={{width: 12, height: 12, marginRight: 3}} />
            <span className="modal-chrome__url">
              <span className="modal-chrome__url-https"> https://</span>
              {addressUrl}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="modal-chrome__content">
          {children}
        </div>
      </div>
    </div>
  );
}
