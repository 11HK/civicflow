import { Link } from "react-router-dom";
import { Compass } from "lucide-react";

export function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-light text-primary">
        <Compass size={30} />
      </span>
      <h1 className="text-2xl font-black">Page not found</h1>
      <p className="max-w-sm text-sm text-sub">
        This path doesn't lead anywhere. Let's get you back on track.
      </p>
      <Link to="/" className="btn-primary">
        Back to home
      </Link>
    </div>
  );
}
