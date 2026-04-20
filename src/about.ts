import packageJson from "../package.json";

export type AppMetadata = {
  name: string;
  version: string;
  description: string;
};

export function getAppMetadata(): AppMetadata {
  return {
    name: packageJson.name,
    version: packageJson.version,
    description: packageJson.description
  };
}

export function formatAboutText(metadata: AppMetadata): string {
  return [
    `${metadata.name} v${metadata.version}`,
    metadata.description
  ].join("\n");
}
