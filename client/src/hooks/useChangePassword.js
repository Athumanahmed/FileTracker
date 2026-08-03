import { useMutation } from "@tanstack/react-query";
import { changePassword } from "../utils/apiServices";

const submit = async (payload) => {
  const { data } = await changePassword(payload);
  return data;
};

/** No new tokens come back -- the backend deliberately expects the caller to sign in again afterward (see server/controller/auth.controller.js#forceChangePassword). */
export const useChangePassword = () => useMutation({ mutationFn: submit });
