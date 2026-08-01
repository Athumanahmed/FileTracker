import { Navigate } from "react-router-dom";
import useAuthStore from "../../store/authStore";
import { getDashboardHomePath } from "../../utils/dashboardHome";

/** The literal `/dashboard` route -- never rendered itself, just routes each actor to its own branch. */
const DashboardRedirect = () => {
  const user = useAuthStore((state) => state.user);
  return <Navigate to={getDashboardHomePath(user)} replace />;
};

export default DashboardRedirect;
