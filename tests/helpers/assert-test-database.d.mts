export type TestDatabaseTarget = {
  databaseName: string;
  host: string;
  port: number;
};

export function assertTestDatabaseEnvironment(
  environment?: NodeJS.ProcessEnv,
): TestDatabaseTarget;
