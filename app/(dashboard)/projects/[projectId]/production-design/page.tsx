import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { ProjectClientView } from "@/src/features/projects/components/ProjectClientView";


interface ProductionDesignPageProps {
  params: Promise<{ projectId: string }>;
}

export default async function ProductionDesignPage({
  params,
}: ProductionDesignPageProps) {
  const { projectId } = await params;

  return (
    <Suspense
      fallback={
        <div className="flex h-64 items-center justify-center text-zinc-400">
          <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
        </div>
      }
    >
      <ProjectClientView key={projectId} projectId={projectId} initialStage="stylebook" />
    </Suspense>
  );
}
