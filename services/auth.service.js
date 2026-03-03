function buildGatewayUrl(path) {
  const baseUrl =
    process.env.GATEWAY_BASE_URL ||
    `http://localhost:${process.env.PORT || 8080}`;

  if (!baseUrl) {
    throw new Error("Gateway base URL is not configured");
  }

  const normalizedBaseUrl = baseUrl.replace(/\/$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  return `${normalizedBaseUrl}${normalizedPath}`;
}

async function verifyUserForLogin(loginPayload) {
  const loginPath = process.env.USER_LOGIN_PROXY_PATH || "/users/login";
  const url = buildGatewayUrl(loginPath);

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(loginPayload),
  });

  let responseData = {};
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    responseData = await response.json();
  }

  if (!response.ok) {
    const error = new Error(responseData.message || "Invalid credentials");
    error.statusCode = response.status;
    throw error;
  }

  const user = responseData.user || responseData;

  return {
    id: user.id || user._id,
    email: user.email || loginPayload.email,
    role: user.role || "USER",
  };
}

module.exports = {
  verifyUserForLogin,
};
