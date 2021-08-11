import { RequestHandlerSettings } from "./typings.ts";
import { urlcat } from "../../deps.ts";

export function handleRequest(data: RequestHandlerSettings) {
  return new Promise((resolve, reject) => {
    const url = urlcat(`https://${data.domain}.fandom.com`, "wikia.php", {
      controller: data.controller,
      method: data.method,
      ...data.params,
    });

    if (data.body && typeof data.body == "object") {
      Object.keys(data.body).forEach((key) => {
        if (data.body![key] == undefined) delete data.body![key];
      });
    }

    fetch(url, {
      method: data.requestMethod,
      headers: {
        "cookie": (data.useAuthentication
          ? `access_token=${data.authToken}`
          : "") ?? "",
        "User-Agent":
          `Automoderator(socialMod, https://github.com/RumbleWikis/socialMod)`,
      },
      body: JSON.stringify(data.body) || null,
    }).then((response) => {
      if (!response.ok) reject(`${response.status} ${response.statusText}`);
      console.log(data.body);
      console.log(response.status, response.statusText);
      console.log(Deno.inspect(response.body));
      if (response.status != 204) {
        response.json().then((json) => {
          resolve(json);
        });
      } else {
        resolve({});
      }
    }, reject);
  });
}
