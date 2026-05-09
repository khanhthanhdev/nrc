import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";

interface FormFieldDefinition {
  label?: string;
  name: string;
  options?: string[];
  placeholder?: string;
  required?: boolean;
  type?: "checkbox" | "number" | "select" | "text" | "textarea";
}

interface DynamicFormRendererProps {
  definition: Record<string, unknown>;
  onChange: (value: Record<string, unknown>) => void;
  readOnly?: boolean;
  value: Record<string, unknown>;
}

const parseFields = (definition: Record<string, unknown>): FormFieldDefinition[] => {
  const fields = definition.fields;

  if (!Array.isArray(fields)) {
    return Object.entries(definition).map(([key, fieldDef]) => {
      if (fieldDef && typeof fieldDef === "object" && !Array.isArray(fieldDef)) {
        const def = fieldDef as Record<string, unknown>;

        return {
          label: typeof def.label === "string" ? def.label : key,
          name: key,
          options: Array.isArray(def.options) ? (def.options as string[]) : undefined,
          placeholder: typeof def.placeholder === "string" ? def.placeholder : undefined,
          required: typeof def.required === "boolean" ? def.required : false,
          type: typeof def.type === "string" ? (def.type as FormFieldDefinition["type"]) : "text",
        };
      }

      return { label: key, name: key, type: "text" as const };
    });
  }

  return fields.map((field) => {
    if (field && typeof field === "object" && !Array.isArray(field)) {
      const f = field as Record<string, unknown>;

      return {
        label: typeof f.label === "string" ? f.label : typeof f.name === "string" ? f.name : "Field",
        name: typeof f.name === "string" ? f.name : "unknown",
        options: Array.isArray(f.options) ? (f.options as string[]) : undefined,
        placeholder: typeof f.placeholder === "string" ? f.placeholder : undefined,
        required: typeof f.required === "boolean" ? f.required : false,
        type: typeof f.type === "string" ? (f.type as FormFieldDefinition["type"]) : "text",
      };
    }

    return { label: "Field", name: "unknown", type: "text" as const };
  });
};

export function DynamicFormRenderer({
  definition,
  onChange,
  readOnly = false,
  value,
}: DynamicFormRendererProps) {
  const fields = parseFields(definition);

  if (fields.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
        No form fields defined. Contact the event organizer.
      </div>
    );
  }

  const handleFieldChange = (fieldName: string, fieldValue: unknown) => {
    onChange({ ...value, [fieldName]: fieldValue });
  };

  return (
    <div className="space-y-5">
      {fields.map((field) => (
        <div className="space-y-2" key={field.name}>
          <Label htmlFor={`field-${field.name}`}>
            {field.label ?? field.name}
            {field.required ? <span className="ml-0.5 text-destructive">*</span> : null}
          </Label>

          {field.type === "textarea" ? (
            <Textarea
              disabled={readOnly}
              id={`field-${field.name}`}
              onChange={(event) => handleFieldChange(field.name, event.target.value)}
              placeholder={field.placeholder}
              rows={4}
              value={typeof value[field.name] === "string" ? (value[field.name] as string) : ""}
            />
          ) : field.type === "number" ? (
            <Input
              disabled={readOnly}
              id={`field-${field.name}`}
              inputMode="numeric"
              onChange={(event) => handleFieldChange(field.name, Number(event.target.value))}
              placeholder={field.placeholder}
              type="number"
              value={typeof value[field.name] === "number" ? (value[field.name] as number) : ""}
            />
          ) : field.type === "checkbox" ? (
            <div className="flex items-center gap-2">
              <Checkbox
                checked={Boolean(value[field.name])}
                disabled={readOnly}
                id={`field-${field.name}`}
                onCheckedChange={(checked) => handleFieldChange(field.name, checked)}
              />
              <label className="text-sm" htmlFor={`field-${field.name}`}>
                {field.placeholder ?? field.label ?? field.name}
              </label>
            </div>
          ) : field.type === "select" && field.options ? (
            <NativeSelect
              disabled={readOnly}
              id={`field-${field.name}`}
              onChange={(event) => handleFieldChange(field.name, event.target.value)}
              value={typeof value[field.name] === "string" ? (value[field.name] as string) : ""}
            >
              <option value="">Select...</option>
              {field.options.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </NativeSelect>
          ) : (
            <Input
              disabled={readOnly}
              id={`field-${field.name}`}
              onChange={(event) => handleFieldChange(field.name, event.target.value)}
              placeholder={field.placeholder}
              type="text"
              value={typeof value[field.name] === "string" ? (value[field.name] as string) : ""}
            />
          )}
        </div>
      ))}
    </div>
  );
}

export function ReadOnlyFormRenderer({
  definition,
  value,
}: {
  definition: Record<string, unknown>;
  value: Record<string, unknown>;
}) {
  const fields = parseFields(definition);

  if (fields.length === 0) {
    return (
      <div className="rounded-lg border bg-muted/50 p-4">
        <pre className="whitespace-pre-wrap break-words text-sm">
          {JSON.stringify(value, null, 2)}
        </pre>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {fields.map((field) => (
        <div className="flex flex-col gap-0.5" key={field.name}>
          <span className="text-xs font-medium text-muted-foreground">
            {field.label ?? field.name}
          </span>
          <span className="text-sm">
            {field.type === "checkbox"
              ? (value[field.name] ? "Yes" : "No")
              : (String(value[field.name] ?? "—"))}
          </span>
        </div>
      ))}
    </div>
  );
}
