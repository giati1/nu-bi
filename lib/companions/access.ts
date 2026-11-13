export function assertCompanionPrototypeAccess() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Companion Studio is not available in production until age verification and provider review are complete.");
  }
}
