import { useMutation } from "@tanstack/react-query";
import { verifyResetOtp } from "../utils/apiServices";

const verify = async (payload) => {
  const { data } = await verifyResetOtp(payload);
  return data;
};

export const useVerifyResetOtp = () => useMutation({ mutationFn: verify });
