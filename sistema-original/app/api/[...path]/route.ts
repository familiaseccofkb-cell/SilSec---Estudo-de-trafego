import { env } from "cloudflare:workers";
import { handleApi } from "../../../server/api.mjs";
export const dynamic = "force-dynamic";
export const GET = (request: Request) => handleApi(request, env);
export const POST = GET;
export const PUT = GET;
export const DELETE = GET;
