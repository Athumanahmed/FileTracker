import { useMutation } from "@tanstack/react-query";
import { loginUser } from "../utils/apiServices";

const login = async (credentials) => {
  const { data } = await loginUser(credentials);
  return data;
};

export const useLogin = () => useMutation({ mutationFn: login });
