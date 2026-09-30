import { MapPin, Check } from "lucide-react";
import { Modal } from "./ui";
import { useCity } from "@/lib/city";

export function CityPicker({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { cities, city, setCity } = useCity();
  return (
    <Modal open={open} onClose={onClose} title="Choose your city" size="sm">
      <p className="-mt-2 mb-4 text-sm text-sub">
        Government procedures differ by city and state. Pick yours to see the
        right path.
      </p>
      <div className="flex flex-col gap-2">
        {cities.map((c) => {
          const active = c.id === city?.id;
          return (
            <button
              key={c.id}
              onClick={() => {
                setCity(c);
                onClose();
              }}
              className={`flex items-center justify-between rounded-DEFAULT border px-4 py-3 text-left transition-all ${
                active
                  ? "border-primary bg-primary-light"
                  : "border-border hover:border-primary/50"
              }`}
            >
              <span className="flex items-center gap-3">
                <MapPin
                  size={18}
                  className={active ? "text-primary" : "text-sub"}
                />
                <span>
                  <span className="block font-semibold">{c.name}</span>
                  <span className="block text-xs text-sub">
                    {c.states?.name}
                  </span>
                </span>
              </span>
              {active && <Check size={18} className="text-primary" />}
            </button>
          );
        })}
      </div>
    </Modal>
  );
}
