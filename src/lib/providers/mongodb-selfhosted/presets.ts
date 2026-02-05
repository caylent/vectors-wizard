import type { ProviderPreset } from "../types";

export const MONGODB_SELFHOSTED_PRESETS: ProviderPreset[] = [
  {
    name: "Dev/Test",
    description: "Single t3.medium for development",
    config: {
      instanceType: 0, // t3.medium
      replicaCount: 1,
      storageGB: 50,
      storageType: 0, // gp3
      dataTransferGB: 10,
      includeConfigServers: 0,
      mongosCount: 0,
    },
  },
  {
    name: "Small Replica Set",
    description: "3x m5.large for HA",
    config: {
      instanceType: 2, // m5.large
      replicaCount: 3,
      storageGB: 100,
      storageType: 0, // gp3
      dataTransferGB: 100,
      includeConfigServers: 0,
      mongosCount: 0,
    },
  },
  {
    name: "Production Replica Set",
    description: "3x m5.xlarge with io1 storage",
    config: {
      instanceType: 3, // m5.xlarge
      replicaCount: 3,
      storageGB: 200,
      storageType: 1, // io1
      dataTransferGB: 500,
      includeConfigServers: 0,
      mongosCount: 0,
    },
  },
  {
    name: "Sharded Cluster",
    description: "3x r5.xlarge + config servers + mongos",
    config: {
      instanceType: 5, // r5.xlarge
      replicaCount: 3,
      storageGB: 500,
      storageType: 1, // io1
      dataTransferGB: 1000,
      includeConfigServers: 1,
      mongosCount: 2,
    },
  },
];
