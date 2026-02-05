import { VectorCostCalculator } from "@/components/calculator/VectorCostCalculator";

interface PageProps {
  searchParams: Promise<{ provider?: string; s?: string }>;
}

export default async function Home({ searchParams }: PageProps) {
  const params = await searchParams;
  const providerId = params.provider || "s3-vectors";
  const initialState = params.s; // base64 encoded shareable state
  return <VectorCostCalculator providerId={providerId} initialState={initialState} />;
}
