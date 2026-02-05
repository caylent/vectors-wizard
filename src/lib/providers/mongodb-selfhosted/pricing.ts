// MongoDB Self-Hosted infrastructure pricing estimates
// Based on typical AWS EC2 + EBS pricing for US East
// MongoDB Community Edition is free (SSPL license)

export const PRICING = {
  // EC2 instance types suitable for MongoDB
  instances: {
    "t3.medium": { hourly: 0.0416, vcpu: 2, ram: 4, label: "Dev/Test" },
    "t3.large": { hourly: 0.0832, vcpu: 2, ram: 8, label: "Small" },
    "m5.large": { hourly: 0.096, vcpu: 2, ram: 8, label: "Production" },
    "m5.xlarge": { hourly: 0.192, vcpu: 4, ram: 16, label: "Production+" },
    "m5.2xlarge": { hourly: 0.384, vcpu: 8, ram: 32, label: "Large" },
    "r5.xlarge": { hourly: 0.252, vcpu: 4, ram: 32, label: "Memory-optimized" },
    "r5.2xlarge": { hourly: 0.504, vcpu: 8, ram: 64, label: "Memory-optimized+" },
    "r5.4xlarge": { hourly: 1.008, vcpu: 16, ram: 128, label: "High memory" },
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
  replicaCount: number;
  storageGB: number;
  storageType: "gp3" | "io1";
  dataTransferGB: number;
  includeConfigServers: number; // 0 = no (replica set only), 1 = yes (sharded)
  mongosCount: number; // For sharded clusters
}

export interface CostBreakdown {
  compute: {
    instanceType: string;
    replicaCount: number;
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
  configServers: {
    included: boolean;
    monthlyCost: number;
  };
  mongos: {
    count: number;
    perInstanceCost: number;
    monthlyCost: number;
  };
  totalMonthlyCost: number;
}

export function calculateCosts(inputs: CostInputs): CostBreakdown {
  const instanceConfig = PRICING.instances[inputs.instanceType];
  const perInstanceMonthlyCost = instanceConfig.hourly * PRICING.hoursPerMonth;
  const computeMonthlyCost = perInstanceMonthlyCost * inputs.replicaCount;

  // Storage
  const storageRate = PRICING.storage[inputs.storageType].perGBMonth;
  const storageMonthlyCost = inputs.storageGB * storageRate * inputs.replicaCount;

  // Data transfer (first 100GB free, then $0.09/GB)
  const billableTransfer = Math.max(0, inputs.dataTransferGB - 100);
  const dataTransferMonthlyCost = billableTransfer * PRICING.dataTransfer.perGBOut;

  // Config servers for sharded clusters (3 t3.small instances)
  const includeConfigServers = inputs.includeConfigServers === 1;
  const configServerCost = 0.0208 * PRICING.hoursPerMonth; // t3.small
  const configServersMonthlyCost = includeConfigServers ? configServerCost * 3 : 0;

  // Mongos routers (for sharded clusters)
  const mongosPerInstanceCost = 0.0416 * PRICING.hoursPerMonth; // t3.medium
  const mongosMonthlyCost = includeConfigServers ? mongosPerInstanceCost * inputs.mongosCount : 0;

  const totalMonthlyCost =
    computeMonthlyCost +
    storageMonthlyCost +
    dataTransferMonthlyCost +
    configServersMonthlyCost +
    mongosMonthlyCost;

  return {
    compute: {
      instanceType: inputs.instanceType,
      replicaCount: inputs.replicaCount,
      perInstanceCost: perInstanceMonthlyCost,
      monthlyCost: computeMonthlyCost,
    },
    storage: {
      totalGB: inputs.storageGB * inputs.replicaCount,
      type: PRICING.storage[inputs.storageType].label,
      monthlyCost: storageMonthlyCost,
    },
    dataTransfer: {
      totalGB: inputs.dataTransferGB,
      monthlyCost: dataTransferMonthlyCost,
    },
    configServers: {
      included: includeConfigServers,
      monthlyCost: configServersMonthlyCost,
    },
    mongos: {
      count: includeConfigServers ? inputs.mongosCount : 0,
      perInstanceCost: mongosPerInstanceCost,
      monthlyCost: mongosMonthlyCost,
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
