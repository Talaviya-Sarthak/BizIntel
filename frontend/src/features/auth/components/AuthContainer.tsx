import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import AuthBackground from "./AuthBackground";
import LoginPage from "../pages/LoginPage";
import SignUpPage from "../pages/SignUpPage";
import ForgotPasswordPage from "../pages/ForgotPasswordPage";

export type AuthMode = "login" | "signup" | "forgot-password";

interface AuthContainerProps {
  initialMode?: AuthMode;
}

export default function AuthContainer({ initialMode = "login" }: AuthContainerProps) {
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (location.pathname === "/signup") {
      setMode("signup");
    } else if (location.pathname === "/forgot-password") {
      setMode("forgot-password");
    } else if (location.pathname === "/signin") {
      setMode("login");
    } else {
      setMode(initialMode);
    }
  }, [location.pathname, initialMode]);

  const handleModeChange = (newMode: AuthMode) => {
    setMode(newMode);
    if (newMode === "login") {
      navigate("/signin");
    } else if (newMode === "signup") {
      navigate("/signup");
    } else if (newMode === "forgot-password") {
      navigate("/forgot-password");
    }
  };

  return (
    <AuthBackground>
      {mode === "login" && (
        <LoginPage
          onNavigateSignUp={() => handleModeChange("signup")}
          onNavigateForgotPassword={() => handleModeChange("forgot-password")}
        />
      )}
      {mode === "signup" && (
        <SignUpPage onNavigateSignIn={() => handleModeChange("login")} />
      )}
      {mode === "forgot-password" && (
        <ForgotPasswordPage onNavigateSignIn={() => handleModeChange("login")} />
      )}
    </AuthBackground>
  );
}
