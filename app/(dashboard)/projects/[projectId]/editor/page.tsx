import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { EditorClientView } from "@/src/features/editor/components/EditorClientView";

export const instant = false;

interface EditorPageProps {
  params: Promise<{ projectId: string }>;
}

export default async function EditorPage({ params }: EditorPageProps) {
  const { projectId } = await params;

  return (
    <Suspense
      fallback={
        <div className="flex h-64 items-center justify-center text-zinc-400">
          <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
        </div>
      }
    >
      <EditorClientView key={projectId} projectId={projectId} />
    </Suspense>
  );
}
