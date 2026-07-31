import { useMutation } from "@tanstack/react-query";
import { forceChangePassword } from "../utils/apiServices";

const changePassword = async (payload) => {
  const { data } = await forceChangePassword(payload);
  return data;
};

export const useForceChangePassword = () => useMutation({ mutationFn: changePassword });
