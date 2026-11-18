import { apiRequest } from "../lib/api";

export async function getMyRegisteredEvents() {
  return apiRequest("/api/users/me/events");
}
