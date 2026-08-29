import axios from "axios";

// Always a relative path. In dev the Vite proxy forwards /api to the
// backend; in the production image nginx proxies /api/v1/track. Nothing
// backend-specific is baked into the build.
const client = axios.create({ timeout: 15000 });

/**
 * Public file-tracking lookup. No auth -- the citizen is not a system user.
 * The backend returns an identical generic 404 for "not found" and "phone
 * mismatch", so the caller can't tell them apart (by design).
 */
export const trackFile = async ({ trackingNumber, phone }) => {
  const { data } = await client.get("/api/v1/track", {
    params: { trackingNumber: trackingNumber.trim(), phone: phone.trim() },
  });
  return data.data;
};
