import PageHeader from "../components/shared/PageHeader";
import ChangePasswordCard from "../components/settings/ChangePasswordCard";
import SessionsCard from "../components/settings/SessionsCard";
import useAuthStore from "../store/authStore";
import { getDashboardHomePath } from "../utils/dashboardHome";

const Settings = () => {
  const user = useAuthStore((state) => state.user);

  return (
    <div className="p-2 xl:p-4">
      <PageHeader
        title="Account Settings"
        description="Manage your password and see where you're signed in."
        breadcrumbs={[{ label: "Dashboard", to: getDashboardHomePath(user) }, { label: "Account Settings" }]}
      />

      <div className="max-w-3xl space-y-6">
        <ChangePasswordCard />
        <SessionsCard />
      </div>
    </div>
  );
};

export default Settings;
