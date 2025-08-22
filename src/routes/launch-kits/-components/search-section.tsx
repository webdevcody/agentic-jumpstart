import { Input } from "~/components/ui/input";
import { Search } from "lucide-react";

interface SearchSectionProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
}

export function SearchSection({ searchTerm, onSearchChange }: SearchSectionProps) {
  return (
    <div className="bg-card rounded-lg border p-4">
      <h3 className="font-semibold mb-3 text-sm uppercase tracking-wide text-muted-foreground">
        Search
      </h3>
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search launch kits..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9 pr-4 py-2 text-sm"
        />
      </div>
    </div>
  );
}