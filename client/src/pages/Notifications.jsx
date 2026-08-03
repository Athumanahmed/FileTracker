import { useState } from "react";
import { Inbox, Settings2 } from "lucide-react";
import PageHeader from "../components/shared/PageHeader";
import Tabs from "../components/shared/Tabs";
import NotificationInboxTab from "../components/notifications/NotificationInboxTab";
import NotificationPreferencesTab from "../components/notifications/NotificationPreferencesTab";
import useAuthStore from "../store/authStore";
import { getDashboardHomePath } from "../utils/dashboardHome";

const TABS = [
  { id: "inbox", name: "Inbox", icon: Inbox },
  { id: "preferences", name: "Preferences", icon: Settings2 },
];

/** Shared across every role -- self-scoped by the access token server-side, no role branching needed. */
const Notifications = () => {
  const user = useAuthStore((state) => state.user);
  const basePath = getDashboardHomePath(user);
  const [activeTab, setActiveTab] = useState("inbox");

  return (
    <div className="p-2 xl:p-4">
      <PageHeader
        title="Notifications"
        description="Activity that involves you, and how you want to be alerted."
        breadcrumbs={[{ label: "Dashboard", to: basePath }, { label: "Notifications" }]}
        divider={false}
      >
        <Tabs activeTab={activeTab} setActiveTab={setActiveTab} tabs={TABS} />
      </PageHeader>

      <div className="mt-5">
        {activeTab === "inbox" && <NotificationInboxTab />}
        {activeTab === "preferences" && <NotificationPreferencesTab />}
      </div>
    </div>
  );
};

export default Notifications;
