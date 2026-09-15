import type {
  EngineInput,
  EngineResult,
  OperationOptions,
} from "../types";
import { operations } from "./operations";

// The single entry point that turns a Job (operation + inputs + options) into a
// Result. Every client surface (web, future API, workflows) funnels through here.
export async function runOperation(
  operation: string,
  inputs: EngineInput[],
  options: OperationOptions
): Promise<EngineResult> {
  const handler = operations[operation];
  if (!handler) {
    throw new Error(
      `Operation "${operation}" is not implemented yet. It is on the roadmap.`
    );
  }
  return handler(inputs, options);
}

export function isImplemented(operation: string): boolean {
  return Boolean(operations[operation]);
}
