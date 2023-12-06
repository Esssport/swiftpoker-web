import { testing } from "https://deno.land/x/oak/mod.ts";
import type { Middleware } from "https://deno.land/x/oak/mod.ts";
import { assert, assertEquals } from "https://deno.land/std/testing/asserts.ts";

const mw: Middleware = async (ctx, next) => {
  await next();
  if (ctx.request.url.pathname === "/a") {
    ctx.response.body = "Hello a";
    ctx.response.headers.set("x-hello-a", "hello");
  }
};

Deno.test({
  name: "example test",
  async fn() {
    //     const options = testing.mockContextOptions({
    //       export interface MockContextOptions<
    //   P extends RouteParams = RouteParams,
    //   S extends State = Record<string, any>,
    // > {
    //   app?: Application<S>;
    //   method?: string;
    //   params?: P;
    //   path?: string;
    //   state?: S;
    // }
    //     })
    const ctx = testing.createMockContext({});
    const next = testing.createMockNext();

    await mw(ctx, next);

    assertEquals(ctx.response.body, "Hello a");
    assert(ctx.response.headers.has("x-hello-a"));
  },
});
