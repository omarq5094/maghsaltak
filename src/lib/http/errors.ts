import { NextResponse } from "next/server";
import { ZodError } from "zod";

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

export function toErrorResponse(error: unknown) {
  if (error instanceof ApiError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }

  if (error instanceof ZodError) {
    return NextResponse.json(
      { error: "Invalid request body.", details: error.issues },
      { status: 400 },
    );
  }

  console.error(error);
  return NextResponse.json({ error: "Internal server error." }, { status: 500 });
}
