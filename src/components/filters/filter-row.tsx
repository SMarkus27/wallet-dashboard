"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type FilterOption = { value: string; label: string };

export function FilterRow({
  fields,
}: {
  fields: {
    id: string;
    label: string;
    value: string;
    options: FilterOption[];
    onChange: (value: string) => void;
  }[];
}) {
  return (
    <div className="flex flex-wrap items-end gap-3">
      {fields.map((field) => (
        <div key={field.id} className="flex min-w-44 flex-col gap-1.5">
          <label
            htmlFor={field.id}
            className="text-xs font-medium text-muted-foreground"
          >
            {field.label}
          </label>
          <Select value={field.value} onValueChange={field.onChange}>
            <SelectTrigger id={field.id}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {field.options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ))}
    </div>
  );
}
