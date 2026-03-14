/* eslint-disable @typescript-eslint/no-explicit-any */
// Minimal Vitest type shims for environments without installed @types
declare function describe(name: string, fn: () => void): void;
declare function beforeAll(fn: () => void | Promise<void>): void;
declare function afterAll(fn: () => void | Promise<void>): void;
declare function test(name: string, fn: () => void | Promise<void>): void;
declare const expect: any;
