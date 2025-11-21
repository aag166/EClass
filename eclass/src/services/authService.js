import axios from "axios";

const API_URL = "http://localhost:3005/api/auth/login";

export const login = async (email, password) => {
  const response = await axios.post(API_URL, {
    email,
    password
  });

  localStorage.setItem("token", response.data.token);

  return response.data;
}
