import { useMutation } from "@tanstack/react-query";
import { forgotPassword } from "../utils/apiServices";

const requestReset = async (payload) => {
  const { data } = await forgotPassword(payload);
  return data;
};

export const useForgotPassword = () => useMutation({ mutationFn: requestReset });
