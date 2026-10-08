
import { ZLoader } from "@quiz/ui";

export default function Loading() {
    return (
        <div className="flex h-screen w-full items-center justify-center bg-white">
            <ZLoader size="xl" text="Initializing System..." color="#FF2D55" />
        </div>
    );
}
