import { useState } from "react";
import { UserPlus } from "lucide-react";
import useAuthStore from "../../store/authStore";
import PageHeader from "../../components/shared/PageHeader";
import ActorTypeSelector from "../../components/users/ActorTypeSelector";
import {
  CreateUserFormPlaceholder,
  NoActorSelected,
} from "../../components/users/CreateUserFormPlaceholder";
import CreateDirector from "../../components/users/CreateDirector";
import CreateHoD from "../../components/users/CreateHoD";
import CreateRegistryOfficer from "../../components/users/CreateRegistryOfficer";
import CreateArchiveOfficer from "../../components/users/CreateArchiveOfficer";
import CreateIctAdmin from "../../components/users/CreateIctAdmin";
import { getCreatableActorTypes } from "../../utils/creatableActorTypes";

// Real forms for every SYSTEM_ADMIN-creatable actor -- Supervisor/Officer/
// Super Admin still fall back to CreateUserFormPlaceholder since those
// belong to other roles (HOD, Supervisor) or are off-by-default.
const ACTOR_FORMS = {
  DIRECTOR: CreateDirector,
  HOD: CreateHoD,
  REGISTRY: CreateRegistryOfficer,
  ARCHIVE: CreateArchiveOfficer,
  ICT_ADMIN: CreateIctAdmin,
};

const CreateUser = () => {
  const user = useAuthStore((state) => state.user);
  const [selectedActor, setSelectedActor] = useState(null);
  const actors = getCreatableActorTypes(user?.permissions);
  const ActorForm = selectedActor && ACTOR_FORMS[selectedActor.roleCode];

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

        {!selectedActor ? (
          <NoActorSelected />
        ) : ActorForm ? (
          <ActorForm />
        ) : (
          <CreateUserFormPlaceholder actor={selectedActor} />
        )}
      </div>
    </div>
  );
};

export default CreateUser;
