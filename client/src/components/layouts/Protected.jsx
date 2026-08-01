import useAuthStore from "../../store/authStore";
import { Navigate, useLocation } from "react-router-dom";
import AppLoading from "../shared/AppLoading";

const Protected = ({ children }) => {
  const { user, loadingUser } = useAuthStore();
  const location = useLocation();

  if (loadingUser) {
    return <AppLoading />;
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // Defense in depth: normally the user only ever has mustChangePassword
  // set right after login, before Login.jsx redirects to /change-password
  // itself -- this catches anyone who reaches a protected route directly
  // (back button, stale tab, bookmark) before finishing that step.
  if (user.mustChangePassword) {
    return <Navigate to="/change-password" replace />;
  }

  return children;
};

export default Protected;
