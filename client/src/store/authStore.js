import { create } from "zustand";
import toast from "react-hot-toast";
import { getUserProfile, logoutUser, refreshAccessToken } from "../utils/apiServices";

const useAuthStore = create((set, get) => ({
  user: null,
  accessToken: null,
  
  loadingUser: true,

  setAuth: ({ accessToken, user }) => set({ accessToken, user }),
  clearAuth: () => set({ accessToken: null, user: null }),
  // Used by apiClient.js's response interceptor after a silent refresh --
  // deliberately leaves `user` untouched, unlike setAuth.
  setAccessToken: (accessToken) => set({ accessToken }),


  fetchUserProfile: async () => {
    set({ loadingUser: true });
    try {
      let token = get().accessToken;

      if (!token) {
        const { data } = await refreshAccessToken();
        token = data.data.accessToken;
        set({ accessToken: token });
      }

      const { data } = await getUserProfile(token);
      if (data.success) {
        set({ user: data.data });
      }
    } catch {
      set({ user: null, accessToken: null });
    } finally {
      set({ loadingUser: false });
    }
  },

  logout: async () => {
    const { accessToken } = get();
    try {
      if (accessToken) {
        const { data } = await logoutUser(accessToken);
        if (data?.message) toast.success(data.message);
      }
    } catch (error) {
      console.error("Logout failed:", error?.response?.data || error.message);
    } finally {
      set({ user: null, accessToken: null });
    }
  },
}));

export default useAuthStore;
