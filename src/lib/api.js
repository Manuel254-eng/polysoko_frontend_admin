import axios from "axios";

const baseURL = import.meta.env.VITE_APP_API_URL;

const api = axios.create({
  baseURL,
  withCredentials: true,
});

let refreshPromise = null;

function refreshAccessToken() {
  if (!refreshPromise) {
    refreshPromise = axios
      .post(`${baseURL}/user/token/refresh/`, null, { withCredentials: true })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { config, response } = error;

    if (response?.status === 401 && config && !config._retry) {
      config._retry = true;
      try {
        await refreshAccessToken();
        return api(config);
      } catch {
        // refresh failed too — fall through and reject with the original error
      }
    }

    return Promise.reject(error);
  }
);

export default api;
