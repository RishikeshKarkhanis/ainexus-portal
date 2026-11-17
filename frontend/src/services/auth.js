import { apiRequest } from "../lib/api";

// Register a new user
export async function registerUser(userData) {
  return apiRequest("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(userData),
  });
}

// Login an existing user
export async function loginUser(credentials) {
  const data = await apiRequest("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(credentials),
  });

  // Save authentication details
  localStorage.setItem("authToken", data.token);

  const userData = {
    userId: data.userId,
    name: data.name,
    email: data.email,
    isAdmin: data.isAdmin === true,
  };

  localStorage.setItem("authUser", JSON.stringify(userData));

  return data;
}

// Logout the current user
export function logoutUser() {
  localStorage.removeItem("authToken");
  localStorage.removeItem("authUser");
}

// Get currently logged-in user
export function getCurrentUser() {
  try {
    const user = localStorage.getItem("authUser");
    return user ? JSON.parse(user) : null;
  } catch {
    localStorage.removeItem("authUser");
    return null;
  }
}

// Check whether a user is logged in
export function isAuthenticated() {
  return Boolean(localStorage.getItem("authToken"));
}
