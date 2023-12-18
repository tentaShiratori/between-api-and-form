import { HttpResponse, http, passthrough } from "msw";
import { setupWorker } from "msw/browser";
import { sampleSchema } from "./validator";

export async function setupMSW() {
  const server = setupWorker();
  server.use(
    http.get("http://localhost:8000/sample", ({ request }) => {
      return HttpResponse.json(
        sampleSchema.parse({
          name: "Mr.Test",
          email: "hogehoge@gmail.com",
          age: 12,
          is_adult: false,
          gender: 2,
          hobby:["sports"]
        }),
      );
    }),
    http.post("http://localhost:8000/sample", ({ request }) => {
      return HttpResponse.text("OK");
    }),
  );
  await server.start();
  return server;
}
