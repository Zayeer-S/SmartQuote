import type { Response } from 'express';

export function success(res: Response, data: unknown, status = 200) {
  return res.status(status).json({
    success: true,
    data: data,
    error: null,
  });
}

export function error(res: Response, status: number, errorMsg: string) {
  return res.status(status).json({
    success: false,
    data: null,
    error: errorMsg,
  });
}
