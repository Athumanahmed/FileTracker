import { useMutation } from "@tanstack/react-query";
import { resendResetOtp } from "../utils/apiServices";

const resend = async (payload) => {
  const { data } = await resendResetOtp(payload);
  return data;
};

export const useResendResetOtp = () => useMutation({ mutationFn: resend });
