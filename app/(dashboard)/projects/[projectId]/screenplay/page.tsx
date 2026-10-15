import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { ScreenplayClientView } from "@/src/features/screenplay/components/ScreenplayClientView";


interface ScreenplayPageProps {
  params: Promise<{ projectId: string }>;
}

export default async function ScreenplayPage({ params }: ScreenplayPageProps) {
  const { projectId } = await params;

  return (
    <Suspense
      fallback={
        <div className="flex h-64 items-center justify-center text-zinc-400">
          <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
        </div>
      }
    >
      <ScreenplayClientView key={projectId} projectId={projectId} />
    </Suspense>
  );
}
