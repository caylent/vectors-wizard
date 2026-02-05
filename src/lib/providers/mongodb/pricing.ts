// MongoDB Atlas pricing constants (AWS US East)
// Source: https://www.mongodb.com/pricing
// Note: Vector search is included with Atlas clusters at no extra cost

export { formatBytes, formatNumber, formatCurrency } from "@/lib/format";

export const PRICING = {
  flex: {
    tiers: [
      { maxOpsPerSec: 100, monthlyPrice: 8 },
      { maxOpsPerSec: 200, monthlyPrice: 15 },
      { maxOpsPerSec: 300, monthlyPrice: 21 },
      { maxOpsPerSec: 400, monthlyPrice: 26 },
      { maxOpsPerSec: 500, monthlyPrice: 30 },
    ],
    storageGB: 5,
    label: "Flex",
  },
  dedicated: {
    tiers: {
      M10: { hourly: 0.08, ram: 2, vcpu: 2, storageMin: 10, storageMax: 128 },
      M20: { hourly: 0.20, ram: 4, vcpu: 2, storageMin: 20, storageMax: 256 },
      M30: { hourly: 0.54, ram: 8, vcpu: 2, storageMin: 40, storageMax: 512 },
      M40: { hourly: 1.04, ram: 16, vcpu: 4, storageMin: 80, storageMax: 1024 },
      M50: { hourly: 2.00, ram: 32, vcpu: 8, storageMin: 160, storageMax: 4096 },
      M60: { hourly: 3.95, ram: 64, vcpu: 16, storageMin: 320, storageMax: 4096 },
      M80: { hourly: 7.30, ram: 128, vcpu: 32, storageMin: 750, storageMax: 4096 },
    },
    label: "Dedicated",
  },
  hoursPerMonth: 730,
} as const;

export type DedicatedTier = keyof typeof PRICING.dedicated.tiers;

export interface CostInputs {
  clusterType: "flex" | "dedicated";
  flexOpsPerSec: number;
  dedicatedTier: DedicatedTier;
  storageGB: number;
  replicaCount: number;
}

export interface CostBreakdown {
  compute: {
    tier: string;
    monthlyCost: number;
    perNodeCost: number;
  };
  storage: {
    totalGB: number;
    included: boolean;
    additionalCost: number;
  };
  totalMonthlyCost: number;
}

function getFlexPrice(opsPerSec: number): number {
  for (const tier of PRICING.flex.tiers) {
    if (opsPerSec <= tier.maxOpsPerSec) {
      return tier.monthlyPrice;
    }
  }
  // Above 500 ops/sec - recommend dedicated
  return PRICING.flex.tiers[PRICING.flex.tiers.length - 1].monthlyPrice;
}

export function calculateCosts(inputs: CostInputs): CostBreakdown {
  if (inputs.clusterType === "flex") {
    const monthlyPrice = getFlexPrice(inputs.flexOpsPerSec);
    return {
      compute: {
        tier: `Flex (${inputs.flexOpsPerSec} ops/sec)`,
        monthlyCost: monthlyPrice,
        perNodeCost: monthlyPrice,
      },
      storage: {
        totalGB: PRICING.flex.storageGB,
        included: true,
        additionalCost: 0,
      },
      totalMonthlyCost: monthlyPrice,
    };
  }

  // Dedicated cluster
  const tierConfig = PRICING.dedicated.tiers[inputs.dedicatedTier];
  const perNodeMonthlyCost = tierConfig.hourly * PRICING.hoursPerMonth;
  const totalComputeCost = perNodeMonthlyCost * inputs.replicaCount;

  return {
    compute: {
      tier: `${inputs.dedicatedTier} (${tierConfig.ram}GB RAM, ${tierConfig.vcpu} vCPU)`,
      monthlyCost: totalComputeCost,
      perNodeCost: perNodeMonthlyCost,
    },
    storage: {
      totalGB: inputs.storageGB,
      included: inputs.storageGB <= tierConfig.storageMax,
      additionalCost: 0, // Storage is included in tier pricing up to max
    },
    totalMonthlyCost: totalComputeCost,
  };
}

