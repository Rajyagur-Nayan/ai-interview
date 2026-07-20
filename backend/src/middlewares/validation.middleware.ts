import { Request, Response, NextFunction } from "express";
import { ZodSchema } from "zod";
import { BadRequestError } from "../utils/errors";

export const validateRequest = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const errorMsg = result.error.errors.map(err => err.message).join(", ");
      return next(new BadRequestError(errorMsg));
    }
    // Replace with parsed and validated payload
    req.body = result.data;
    next();
  };
};
