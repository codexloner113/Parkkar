// Standard response envelope used by every controller in the app.
export function sendSuccess(res, { message = 'OK', data = null, status = 200, meta } = {}) {
  const body = { success: true, message, data };
  if (meta) body.meta = meta;
  return res.status(status).json(body);
}

export function sendError(res, { message = 'Something went wrong', error = 'INTERNAL_ERROR', status = 500 } = {}) {
  return res.status(status).json({ success: false, message, error });
}
