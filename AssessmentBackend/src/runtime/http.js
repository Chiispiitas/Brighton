export function response({ status = 200, headers = {}, body = null }) {
  return new Response(body, { status, headers });
}
export const ok = value => response({ ...value, status: 200 });
export const badRequest = value => response({ ...value, status: 400 });
export const serverError = value => response({ ...value, status: 500 });

