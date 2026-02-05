// Milvus Self-Hosted infrastructure pricing estimates
// Based on typical AWS EC2 + EBS pricing for US East
// Milvus software is free (Apache 2.0 license)

export const PRICING = {
  // EC2 instance types suitable for Milvus (on-demand US East)
  instances: {
    "t3.medium": { hourly: 0.0416, vcpu: 2, ram: 4, label: "Dev/Test" },
    "t3.large": { hourly: 0.0832, vcpu: 2, ram: 8, label: "Small" },
    "m5.large": { hourly: 0.096, vcpu: 2, ram: 8, label: "Production" },
    "m5.xlarge": { hourly: 0.192, vcpu: 4, ram: 16, label: "Production+" },
    "m5.2xlarge": { hourly: 0.384, vcpu: 8, ram: 32, label: "Large" },
    "r5.xlarge": { hourly: 0.252, vcpu: 4, ram: 32, label: "Memory-optimized" },
    "r5.2xlarge": { hourly: 0.504, vcpu: 8, ram: 64, label: "Memory-optimized+" },
  },
  // EBS storage
  storage: {
    gp3: { perGBMonth: 0.08, label: "GP3 SSD" },
    io1: { perGBMonth: 0.125, label: "io1 Provisioned IOPS" },
  },
  // Data transfer (simplified)
  dataTransfer: {
    perGBOut: 0.09, // After first 100GB
  },
  hoursPerMonth: 730,
} as const;

export type InstanceType = keyof typeof PRICING.instances;

export interface CostInputs {
  instanceType: InstanceType;
  instanceCount: number;
  storageGB: number;
  storageType: "gp3" | "io1";
  dataTransferGB: number;
  includeEtcd: number; // 0 = no, 1 = yes (for production)
  includeMinio: number; // 0 = no (use S3), 1 = yes (self-hosted)
}

export interface CostBreakdown {
  compute: {
    instanceType: string;
    instanceCount: number;
    perInstanceCost: number;
    monthlyCost: number;
  };
  storage: {
    totalGB: number;
    type: string;
    monthlyCost: number;
  };
  dataTransfer: {
    totalGB: number;
    monthlyCost: number;
  };
  etcd: {
    included: boolean;
    instanceCost: number;
    monthlyCost: number;
  };
  minio: {
    included: boolean;
    instanceCost: number;
    monthlyCost: number;
  };
  totalMonthlyCost: number;
}

export function calculateCosts(inputs: CostInputs): CostBreakdown {
  const instanceConfig = PRICING.instances[inputs.instanceType];
  const perInstanceMonthlyCost = instanceConfig.hourly * PRICING.hoursPerMonth;
  const computeMonthlyCost = perInstanceMonthlyCost * inputs.instanceCount;

  // Storage
  const storageRate = PRICING.storage[inputs.storageType].perGBMonth;
  const storageMonthlyCost = inputs.storageGB * storageRate * inputs.instanceCount;

  // Data transfer (first 100GB free, then $0.09/GB)
  const billableTransfer = Math.max(0, inputs.dataTransferGB - 100);
  const dataTransferMonthlyCost = billableTransfer * PRICING.dataTransfer.perGBOut;

  // etcd cluster (3 t3.small instances for HA) - required for production
  const includeEtcd = inputs.includeEtcd === 1;
  const etcdInstanceCost = 0.0208 * PRICING.hoursPerMonth; // t3.small
  const etcdMonthlyCost = includeEtcd ? etcdInstanceCost * 3 : 0;

  // MinIO (optional, alternative is S3)
  const includeMinio = inputs.includeMinio === 1;
  const minioInstanceCost = 0.0416 * PRICING.hoursPerMonth; // t3.medium
  const minioMonthlyCost = includeMinio ? minioInstanceCost * 2 : 0; // 2 instances for redundancy

  const totalMonthlyCost =
    computeMonthlyCost +
    storageMonthlyCost +
    dataTransferMonthlyCost +
    etcdMonthlyCost +
    minioMonthlyCost;

  return {
    compute: {
      instanceType: inputs.instanceType,
      instanceCount: inputs.instanceCount,
      perInstanceCost: perInstanceMonthlyCost,
      monthlyCost: computeMonthlyCost,
    },
    storage: {
      totalGB: inputs.storageGB * inputs.instanceCount,
      type: PRICING.storage[inputs.storageType].label,
      monthlyCost: storageMonthlyCost,
    },
    dataTransfer: {
      totalGB: inputs.dataTransferGB,
      monthlyCost: dataTransferMonthlyCost,
    },
    etcd: {
      included: includeEtcd,
      instanceCost: etcdInstanceCost,
      monthlyCost: etcdMonthlyCost,
    },
    minio: {
      included: includeMinio,
      instanceCost: minioInstanceCost,
      monthlyCost: minioMonthlyCost,
    },
    totalMonthlyCost,
  };
}

export function formatNumber(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

export function formatCurrency(n: number): string {
  if (n < 0.01 && n > 0) return `< $0.01`;
  if (n >= 1000) return `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  return `$${n.toFixed(2)}`;
}

// Estimate instance requirements based on vector count
export function recommendInstanceType(numVectors: number, dimensions: number): InstanceType {
  const memoryNeededGB = (numVectors * dimensions * 4) / (1024 ** 3) * 2; // 2x for index overhead

  if (memoryNeededGB < 4) return "t3.medium";
  if (memoryNeededGB < 8) return "t3.large";
  if (memoryNeededGB < 16) return "m5.xlarge";
  if (memoryNeededGB < 32) return "r5.xlarge";
  return "r5.2xlarge";
}
