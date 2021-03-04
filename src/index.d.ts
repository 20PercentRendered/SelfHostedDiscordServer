declare namespace Express {
  export interface Response {
      session?: import("@main/classes/Session").Session;
  }
}