import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.error('Unhandled Server Error:', err);

  if (err instanceof ZodError) {
    const formattedErrors = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    res.status(400).json({
      message: err.errors[0]?.message || 'Validation failed',
      errors: formattedErrors,
    });
    return;
  }

  // Prisma unique constraint violation
  if (err.code === 'P2002') {
    const target = (err.meta?.target as string[])?.join(', ') || 'field';
    res.status(409).json({
      message: `A record with this ${target} already exists.`,
    });
    return;
  }

  // Prisma record not found
  if (err.code === 'P2025') {
    res.status(404).json({
      message: 'The requested resource was not found.',
    });
    return;
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || 'An unexpected error occurred. Please try again.';

  res.status(statusCode).json({
    message,
  });
};
