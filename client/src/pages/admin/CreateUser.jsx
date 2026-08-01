import { useState } from "react";
import { UserPlus } from "lucide-react";
import useAuthStore from "../../store/authStore";
import PageHeader from "../../components/shared/PageHeader";
import ActorTypeSelector from "../../components/users/ActorTypeSelector";
import {
  CreateUserFormPlaceholder,
  NoActorSelected,
} from "../../components/users/CreateUserFormPlaceholder";
import { getCreatableActorTypes } from "../../utils/creatableActorTypes";

const CreateUser = () => {
  const user = useAuthStore((state) => state.user);
  const [selectedActor, setSelectedActor] = useState(null);
  const actors = getCreatableActorTypes(user?.permissions);

  return (
    <div className="p-2 xl:p-4">
      <PageHeader
        title="Create User"
        description="Select a user type to create -- available options are based on your account's creation privileges."
        icon={UserPlus}
        breadcrumbs={[
          { label: "Dashboard", to: "/admin" },
          { label: "Users", to: "/admin/users" },
          { label: "Create" },
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-5">
        <ActorTypeSelector
          actors={actors}
          selectedRoleCode={selectedActor?.roleCode}
          onSelect={setSelectedActor}
        />

        {selectedActor ? (
          <CreateUserFormPlaceholder actor={selectedActor} />
        ) : (
          <NoActorSelected />
        )}
      </div>
    </div>
  );
};

export default CreateUser;
