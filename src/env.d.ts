/// <reference types="astro/client" />
declare namespace App {
  interface Locals {
    cfContext: { waitUntil(promise: Promise<unknown>): void };
  }
}
