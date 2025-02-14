import axios from "axios";
import Global from "../Global/Global";
import { Buffer } from "buffer";

const redirect_uri = Global.redirect_uri;
const client_id = Global.client_id;
const client_secret = Global.client_secret;

export const spotyfyAuthCall = async (code) => {
  try {
    const searchParams = new URLSearchParams({
      code: code,
      grant_type: "authorization_code",
      redirect_uri: redirect_uri,
      client_id: client_id,
      client_secret: client_secret,
    });
    const response = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type":
          "application/x-www-form-urlencoded;charset=UTF-8",
      },
      body: searchParams,
    });

    const data = await response.json();

    // 🔹 Guarda los tokens en localStorage
    if (data.access_token) {
      localStorage.setItem("access_token", data.access_token);
    }
    if (data.refresh_token) {
      localStorage.setItem("refresh_token", data.refresh_token);
    }

    return data;
  } catch (error) {
    console.log(error);
  }
};

export const getRefreshedAccesToken = () => {
  var refresh_token = window.localStorage.getItem("refresh_token");

  if (!refresh_token) {
    console.error("No se encontró refresh_token en localStorage.");
    return null;
  }

  return axios.post('https://accounts.spotify.com/api/token', new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refresh_token
  }), {
    headers: {
      'Authorization': 'Basic ' + (new Buffer.from(client_id + ':' + client_secret).toString('base64'))
    }
  }).then(response => {
    console.log("Nuevo Access Token:", response.data.access_token);

    // 🔹 Guarda el nuevo token en localStorage
    localStorage.setItem("access_token", response.data.access_token);

    return response.data.access_token;
  }).catch(error => {
    console.error("Error al refrescar el token:", error);
    return null;
  });
};
