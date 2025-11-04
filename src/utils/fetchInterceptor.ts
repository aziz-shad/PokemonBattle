const originalFetch = window.fetch;
const authServiceURL = import.meta.env.VITE_APP_AUTH_SERVER_URL;

if (!authServiceURL) {
  console.error(
    "VITE_APP_AUTH_SERVER_URL is not defined in environment variables."
  );
}

window.fetch = async (url, options = {}, ...rest) => {
  const retry = options._retry;

  let res = await originalFetch(
    url,
    { ...options, credentials: "include" },
    ...rest
  );

  const authHeader = res.headers.get("WWW-Authenticate");
  if (authHeader?.includes("token_expired") && !retry) {
    console.log("Token expired, attempting to refresh...");

    const refreshResponse = await originalFetch(
      `${authServiceURL}/auth/refresh`,
      {
        method: "POST",
        credentials: "include",
      }
    );

    if (!refreshResponse.ok) throw new Error("Login required");

    res = await originalFetch(
      url,
      { ...options, _retry: true, credentials: "include" },
      ...rest
    );
  }

  return res;
};

export { authServiceURL };
