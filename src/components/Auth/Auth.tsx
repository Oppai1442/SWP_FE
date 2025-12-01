import React, { useRef, useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { showToast } from "../../utils";
import { Loading } from "../Loading";

import { useAuth } from "../../context/AuthContext";

import { Assets } from "@/assets";
import { Trans, useTranslation } from "react-i18next";
import { validateEmail } from "@/utils/validators";
import { handleAuthError } from "@/utils/errorHandler";
import { signIn, signUp, signInWithGoogle } from "./service/authService";
import { X, Eye, EyeOff } from "lucide-react";

interface AuthProps {
  mode: "signIn" | "signUp" | null;
  onClose: () => void;
}

type GoogleCredentialResponse = {
  credential?: string;
  select_by?: string;
};

const Auth: React.FC<AuthProps> = ({ mode: initialMode, onClose }) => {
  const popupRef = useRef<HTMLDivElement | null>(null);
  const formRef = useRef<HTMLFormElement | null>(null);
  const emailInputRef = useRef<HTMLInputElement | null>(null);
  const usernameInputRef = useRef<HTMLInputElement | null>(null);
  const passwordInputRef = useRef<HTMLInputElement | null>(null);
  const { authenticate } = useAuth();
  const { t } = useTranslation();

  const [mode, setMode] = useState<"signIn" | "signUp">(initialMode || "signIn");
  const [isPasswordVisible, setIsPasswordVisible] = useState<boolean>(false);
  const [isLoading, setIsHandling] = useState<boolean>(false);
  const [isGoogleReady, setIsGoogleReady] = useState<boolean>(false);
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim() || "";

  const [email, setEmail] = useState<string>("");
  const [emailError, setEmailError] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [username, setUsername] = useState<string>("");

  const [rememberMe, setRememberMe] = useState(false);

  const togglePasswordVisibility = () => {
    setIsPasswordVisible((prevState) => !prevState);
  };

  const isSignIn = () => mode === "signIn";

  const handleClickOutside = useCallback(
    (event: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        onClose();
      }
    },
    [onClose]
  );

  const handleCheckboxChange = () => {
    setRememberMe(!rememberMe);
  };

  const handleSwitchMode = () => {
    setMode((prevMode) => (prevMode === "signIn" ? "signUp" : "signIn"));
  };

  const requestGoogleCredential = useCallback(() => {
    return new Promise<string>((resolve, reject) => {
      const google = (window as any).google;

      if (!google?.accounts?.id) {
        reject(new Error("Google Sign-In is not ready yet. Please try again."));
        return;
      }

      if (!googleClientId) {
        reject(new Error("Google Client ID is missing."));
        return;
      }

      let settled = false;

      google.accounts.id.initialize({
        client_id: googleClientId,
        callback: (response: GoogleCredentialResponse) => {
          if (settled) return;
          settled = true;

          if (response?.credential) {
            resolve(response.credential);
          } else {
            reject(new Error("Google did not return a credential."));
          }
        },
        ux_mode: "popup",
      });

      google.accounts.id.prompt((notification: any) => {
        if (settled) return;

        if (notification?.isNotDisplayed?.() || notification?.isSkippedMoment?.() || notification?.isDismissedMoment?.()) {
          settled = true;
          reject(new Error("Google sign-in was cancelled."));
        }
      });
    });
  }, [googleClientId]);

  const handleGoogleAuth = async () => {
    if (!isGoogleReady) {
      showToast("error", "Google Sign-In is still loading. Please try again.");
      return;
    }
    if (isLoading) {
      return;
    }
    if (!googleClientId) {
      showToast("error", "Google Client ID is missing.");
      return;
    }

    setIsHandling(true);
    try {
      const credential = await requestGoogleCredential();
      const response = await signInWithGoogle(credential);

      if (response) {
        const { token, user } = response;
        authenticate(token, user);

        onClose();
        showToast("success", isSignIn() ? "Signed in with Google!" : "Account created with Google!");
      }
    } catch (error: any) {
      if (error?.response) {
        handleAuthError(error);
      } else {
        showToast("error", error?.message || "Google sign-in failed. Please try again.");
      }
    } finally {
      setIsHandling(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const trimmedUsername = username.trim();
    const trimmedPassword = password.trim();
    const trimmedEmail = email.trim();

    if (!trimmedUsername) {
      showToast("error", "Username is required");
      usernameInputRef.current?.focus();
      return;
    }

    if (!trimmedPassword) {
      showToast("error", "Password is required");
      passwordInputRef.current?.focus();
      return;
    }

    if (mode === "signUp" && !validateEmail(trimmedEmail)) {
      setEmailError("Invalid email format");
      emailInputRef.current?.focus();
      return;
    }

    setEmailError("");
    setUsername(trimmedUsername);
    setPassword(trimmedPassword);
    if (mode === "signUp") {
      setEmail(trimmedEmail);
    }

    setIsHandling(true);

    try {
      const response = isSignIn()
        ? await signIn({ username: trimmedUsername, password: trimmedPassword })
        : await signUp({
          "email": trimmedEmail,
          "username": trimmedUsername,
          "password": trimmedPassword
        });

      if (response) {
        const { token, user } = response;
        authenticate(token, user);

        onClose();
        showToast("success", isSignIn() ? "Login successful!" : "Sign Up successful!");
      }
    } catch (error: any) {
      handleAuthError(error);
    } finally {
      setIsHandling(false);
    }
  };

  const handleUsernameKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      passwordInputRef.current?.focus();
    }
  };

  const handlePasswordKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      formRef.current?.requestSubmit();
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [handleClickOutside]);

  useEffect(() => {
    setMode(initialMode || "signIn");
  }, [initialMode]);

  useEffect(() => {
    const scriptId = "google-identity-service";
    const existingScript = document.getElementById(scriptId);

    if (existingScript) {
      setIsGoogleReady(true);
      return;
    }

    const script = document.createElement("script");
    script.id = scriptId;
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => setIsGoogleReady(true);
    script.onerror = () => {
      setIsGoogleReady(false);
      showToast("error", "Unable to load Google Sign-In. Please try again.");
    };

    document.body.appendChild(script);

    return () => {
      script.onload = null;
      script.onerror = null;
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[1000] flex justify-center items-center p-4">

      <div
        ref={popupRef}
        className="relative max-w-[32rem] w-full mx-auto p-8 md:p-10 rounded-3xl bg-white shadow-2xl border border-orange-100"
      >
        {isLoading && (
          <div className="absolute inset-0 bg-white/70 backdrop-blur-sm rounded-3xl flex items-center justify-center z-10">
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />
              <p className="text-slate-600 font-light">Loading...</p>
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-xl text-slate-400 hover:text-orange-500 hover:bg-orange-50 transition-all duration-300"
        >
          <X className="w-5 h-5" />
        </button>

        <div className={`${isLoading ? "pointer-events-none opacity-60" : ""} transition-opacity duration-300`}>
          <h2 className="text-center mb-10 text-slate-900 text-4xl md:text-5xl font-light tracking-tight">
            {isSignIn() ? (
              <>
                Welcome <span className="text-orange-500">Back</span>
              </>
            ) : (
              'Create Account'
            )}
          </h2>

          <form ref={formRef} className="space-y-4" onSubmit={handleSubmit}>
            {!isSignIn() && (
              <div className="group">
                <input
                  className="w-full bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400 rounded-2xl px-6 py-4 font-light focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all duration-300"
                  type="email"
                  placeholder="Email address"
                  value={email}
                  autoComplete="email"
                  onChange={(e) => setEmail(e.target.value)}
                  ref={emailInputRef}
                  required
                />
                {emailError && (
                  <p className="text-red-500 text-sm mt-2 font-light">{emailError}</p>
                )}
              </div>
            )}

            <div className="group">
              <input
                className="w-full bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400 rounded-2xl px-6 py-4 font-light focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all duration-300"
                type="text"
                placeholder="Username"
                value={username}
                autoComplete="username"
                onChange={(e) => setUsername(e.target.value)}
                onKeyDown={handleUsernameKeyDown}
                ref={usernameInputRef}
                required
              />
            </div>

            <div className="relative group">
              <input
                className="w-full bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400 rounded-2xl px-6 py-4 pr-14 font-light focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all duration-300"
                type={isPasswordVisible ? "text" : "password"}
                placeholder="Password"
                value={password}
                autoComplete="current-password"
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={handlePasswordKeyDown}
                ref={passwordInputRef}
                required
              />
              <button
                type="button"
                className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-orange-500 transition-colors duration-300"
                onClick={togglePasswordVisibility}
              >
                {isPasswordVisible ? (
                  <Eye className="w-5 h-5" />
                ) : (
                  <EyeOff className="w-5 h-5" />
                )}
              </button>
            </div>

            {isSignIn() && (
              <div className="flex items-center justify-between pt-2">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    id="rememberMe"
                    className="w-4 h-4 rounded border-slate-300 bg-white text-orange-500 focus:ring-2 focus:ring-orange-200 cursor-pointer"
                    checked={rememberMe}
                    onChange={handleCheckboxChange}
                  />
                  <span className="text-slate-500 text-sm font-light group-hover:text-slate-700 transition-colors">
                    Remember me
                  </span>
                </label>
                <a
                  href="#"
                  className="text-sm text-orange-500 hover:text-orange-600 font-light transition-colors duration-300"
                >
                  Forgot password?
                </a>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-6 py-4 px-8 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-2xl font-medium text-lg hover:from-orange-400 hover:to-orange-500 hover:scale-[1.02] hover:shadow-lg hover:shadow-orange-200 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSignIn() ? 'Sign In' : 'Sign Up'}
            </button>

            <div className="flex items-center gap-4 py-6">
              <div className="h-px bg-slate-200 flex-1" />
              <span className="text-slate-500 text-sm font-light">
                or {isSignIn() ? 'sign in' : 'sign up'} with
              </span>
              <div className="h-px bg-slate-200 flex-1" />
            </div>

            <div className="flex justify-center gap-4">
              <button
                type="button"
                className="p-4 rounded-xl bg-white border border-slate-200 hover:border-orange-400 hover:bg-orange-50 transition-all duration-300 group"
                aria-label="Sign in with Apple"
              >
                <svg className="w-6 h-6 text-slate-900 group-hover:scale-110 transition-transform" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                </svg>
              </button>
              <button
                type="button"
                className="p-4 rounded-xl bg-white border border-slate-200 hover:border-orange-400 hover:bg-orange-50 transition-all duration-300 group disabled:opacity-60 disabled:cursor-not-allowed"
                aria-label="Sign in with Google"
                onClick={handleGoogleAuth}
                disabled={isLoading}
              >
                <svg className="w-6 h-6 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
              </button>
            </div>
          </form>

          <p className="text-center mt-8 text-slate-500 font-light">
            {isSignIn() ? (
              <>
                Don't have an account?{' '}
                <a
                  href="#"
                  onClick={handleSwitchMode}
                  className="text-orange-500 hover:text-orange-600 transition-colors duration-300 underline underline-offset-4"
                >
                  Sign up
                </a>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <a
                  href="#"
                  onClick={handleSwitchMode}
                  className="text-orange-500 hover:text-orange-600 transition-colors duration-300 underline underline-offset-4"
                >
                  Sign in
                </a>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
