import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import CreateProjectPage from "./CreateClient";


export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="flex h-full items-center justify-center text-zinc-400">
          <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
        </div>
      }
    >
      <CreateProjectPage />
    </Suspense>
  );
}
