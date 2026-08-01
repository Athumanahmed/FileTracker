import { useMutation } from "@tanstack/react-query";
import { resetPassword } from "../utils/apiServices";

const reset = async (payload) => {
  const { data } = await resetPassword(payload);
  return data;
};

export const useResetPassword = () => useMutation({ mutationFn: reset });
