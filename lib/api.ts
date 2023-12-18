import api from "./api/$api";
import asipda from "@aspida/fetch";

export const apiClient = api(
  asipda(fetch, { baseURL: "http://localhost:8000" }),
);
