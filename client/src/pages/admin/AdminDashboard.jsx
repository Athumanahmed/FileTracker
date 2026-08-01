import { Link } from "react-router-dom";
import {
  Users,
  Building2,
  Boxes,
  IdCard,
  ShieldCheck,
  KeyRound,
  Link2,
  ArrowRight,
} from "lucide-react";
import useAuthStore from "../../store/authStore";

const AdminDashboard = () => {
  const user = useAuthStore((state) => state.user);

  return (
    <div className="p-2 xl:p-4">
      <h1 className="text-xl font-bold text-gray-900">
        Welcome back, {user?.fullName || user?.username}
      </h1>
      <p className="text-sm text-gray-500 mt-1">
        System Administration - manage the platform's organizational structure
        and access control.
      </p>
    </div>
  );
};

export default AdminDashboard;
