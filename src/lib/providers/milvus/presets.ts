import type { ProviderPreset } from "../types";

export const MILVUS_PRESETS: ProviderPreset[] = [
  {
    name: "Dev/Test",
    description: "Single t3.medium for development",
    config: {
      instanceType: 0, // t3.medium
      instanceCount: 1,
      storageGB: 50,
      storageType: 0, // gp3
      dataTransferGB: 10,
      includeEtcd: 0,
      includeMinio: 0,
    },
  },
  {
    name: "Small Production",
    description: "m5.large with etcd cluster",
    config: {
      instanceType: 2, // m5.large
      instanceCount: 1,
      storageGB: 100,
      storageType: 0, // gp3
      dataTransferGB: 100,
      includeEtcd: 1,
      includeMinio: 0,
    },
  },
  {
    name: "HA Production",
    description: "3x m5.xlarge with etcd + MinIO",
    config: {
      instanceType: 3, // m5.xlarge
      instanceCount: 3,
      storageGB: 200,
      storageType: 0, // gp3
      dataTransferGB: 500,
      includeEtcd: 1,
      includeMinio: 1,
    },
  },
  {
    name: "Large Scale",
    description: "3x r5.2xlarge memory-optimized",
    config: {
      instanceType: 6, // r5.2xlarge
      instanceCount: 3,
      storageGB: 500,
      storageType: 1, // io1
      dataTransferGB: 1000,
      includeEtcd: 1,
      includeMinio: 1,
    },
  },
];
