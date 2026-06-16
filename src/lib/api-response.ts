import { NextResponse } from "next/server";
import { ZodError } from "zod";

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

export function created<T>(data: T) {
  return ok(data, { status: 201 });
}

export function handleApiError(error: unknown) {
  if (error instanceof Response) return error;
  if (error instanceof ZodError) {
    return NextResponse.json(
      { error: "Validation failed", issues: error.issues },
      { status: 422 },
    );
  }
  console.error(error);
  return NextResponse.json({ error: "Unexpected server error" }, { status: 500 });
}
