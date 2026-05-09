import { useCallback, useEffect, useState } from "react";

import {
  ArrowDown,
  ArrowUp,
  ChevronDown,
  ChevronUp,
  GripVertical,
  Plus,
  Trash2,
} from "lucide-react";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

// ── Types ───────────────────────────────────────────────────────────────

interface FormField {
  label: string;
  name: string;
  options?: string[];
  placeholder?: string;
  required?: boolean;
  type: "checkbox" | "number" | "select" | "text" | "textarea";
}

const FIELD_TYPES: { label: string; value: FormField["type"] }[] = [
  { label: "Text", value: "text" },
  { label: "Number", value: "number" },
  { label: "Textarea", value: "textarea" },
  { label: "Select (dropdown)", value: "select" },
  { label: "Checkbox", value: "checkbox" },
];

const createEmptyField = (order: number): FormField => ({
  label: `Field ${order}`,
  name: `field_${order}`,
  placeholder: "",
  required: false,
  type: "text",
});

// ── Helpers ─────────────────────────────────────────────────────────────

const definitionToFields = (definition: Record<string, unknown>): FormField[] => {
  const raw = definition.fields;

  if (Array.isArray(raw)) {
    return raw.map((f) => {
      if (f && typeof f === "object" && !Array.isArray(f)) {
        const d = f as Record<string, unknown>;

        return {
          label: typeof d.label === "string" ? d.label : typeof d.name === "string" ? d.name : "Field",
          name: typeof d.name === "string" ? d.name : "unknown",
          options: Array.isArray(d.options) ? (d.options as string[]) : undefined,
          placeholder: typeof d.placeholder === "string" ? d.placeholder : "",
          required: typeof d.required === "boolean" ? d.required : false,
          type: typeof d.type === "string" ? (d.type as FormField["type"]) : "text",
        };
      }

      return createEmptyField(1);
    });
  }

  if (Object.keys(definition).length > 0) {
    return Object.entries(definition).map(([key, fieldDef]) => {
      if (fieldDef && typeof fieldDef === "object" && !Array.isArray(fieldDef)) {
        const def = fieldDef as Record<string, unknown>;

        return {
          label: typeof def.label === "string" ? def.label : key,
          name: key,
          options: Array.isArray(def.options) ? (def.options as string[]) : undefined,
          placeholder: typeof def.placeholder === "string" ? def.placeholder : "",
          required: typeof def.required === "boolean" ? def.required : false,
          type: typeof def.type === "string" ? (def.type as FormField["type"]) : "text",
        };
      }

      return { label: key, name: key, placeholder: "", required: false, type: "text" as const };
    });
  }

  return [];
};

const fieldsToDefinition = (fields: FormField[]): Record<string, unknown> => ({
  fields: fields.map((f) => ({
    label: f.label,
    name: f.name,
    ...(f.options && f.options.length > 0 ? { options: f.options } : {}),
    ...(f.placeholder ? { placeholder: f.placeholder } : {}),
    required: f.required ?? false,
    type: f.type,
  })),
});

// ── Field Editor Row ────────────────────────────────────────────────────

function FieldEditorRow({
  canMoveDown,
  canMoveUp,
  field,
  index,
  onChange,
  onMoveDown,
  onMoveUp,
  onRemove,
}: {
  canMoveDown: boolean;
  canMoveUp: boolean;
  field: FormField;
  index: number;
  onChange: (updated: FormField) => void;
  onMoveDown: () => void;
  onMoveUp: () => void;
  onRemove: () => void;
}) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);

  const updateField = (patch: Partial<FormField>) => {
    onChange({ ...field, ...patch });
  };

  return (
    <div
      className={cn(
        "rounded-lg border bg-card transition-colors",
        expanded ? "border-primary/30" : "",
      )}
    >
      <div className="flex items-center gap-2 px-3 py-2.5">
        <GripVertical className="h-4 w-4 shrink-0 text-muted-foreground" />

        <Badge className="shrink-0 tabular-nums" variant="secondary">
          {index + 1}
        </Badge>

        <button
          className="min-w-0 flex-1 text-left text-sm font-medium"
          onClick={() => setExpanded(!expanded)}
          type="button"
        >
          {field.label || field.name}
          <span className="ml-2 text-xs text-muted-foreground">
            ({field.type}){field.required ? " *" : ""}
          </span>
        </button>

        <div className="flex shrink-0 items-center gap-0.5">
          <Button
            disabled={!canMoveUp}
            onClick={onMoveUp}
            size="icon"
            title={t("formBuilder.moveUp", "Move up")}
            variant="ghost"
          >
            <ArrowUp className="h-3.5 w-3.5" />
          </Button>
          <Button
            disabled={!canMoveDown}
            onClick={onMoveDown}
            size="icon"
            title={t("formBuilder.moveDown", "Move down")}
            variant="ghost"
          >
            <ArrowDown className="h-3.5 w-3.5" />
          </Button>
          <Button
            onClick={onRemove}
            size="icon"
            title={t("formBuilder.removeField", "Remove field")}
            variant="ghost"
          >
            <Trash2 className="h-3.5 w-3.5 text-destructive" />
          </Button>
          <Button
            onClick={() => setExpanded(!expanded)}
            size="icon"
            variant="ghost"
          >
            {expanded ? (
              <ChevronUp className="h-3.5 w-3.5" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5" />
            )}
          </Button>
        </div>
      </div>

      {expanded ? (
        <div className="space-y-4 border-t px-4 py-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor={`field-label-${index}`}>
                {t("formBuilder.fieldLabel", "Label")}
              </Label>
              <Input
                id={`field-label-${index}`}
                onChange={(e) => updateField({ label: e.target.value })}
                placeholder="e.g. Team Name"
                value={field.label}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`field-name-${index}`}>
                {t("formBuilder.fieldName", "Field key")}
              </Label>
              <Input
                id={`field-name-${index}`}
                onChange={(e) =>
                  updateField({
                    name: e.target.value.replaceAll(/[^\w-]/g, "_").toLowerCase(),
                  })
                }
                placeholder="e.g. team_name"
                value={field.name}
              />
              <p className="text-xs text-muted-foreground">
                {t("formBuilder.fieldNameHint", "Unique key used in data. Letters, numbers, underscores.")}
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor={`field-type-${index}`}>
                {t("formBuilder.fieldType", "Type")}
              </Label>
              <NativeSelect
                id={`field-type-${index}`}
                onChange={(e) => updateField({ type: e.target.value as FormField["type"] })}
                value={field.type}
              >
                {FIELD_TYPES.map((ft) => (
                  <option key={ft.value} value={ft.value}>
                    {ft.label}
                  </option>
                ))}
              </NativeSelect>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`field-placeholder-${index}`}>
                {t("formBuilder.placeholder", "Placeholder")}
              </Label>
              <Input
                id={`field-placeholder-${index}`}
                onChange={(e) => updateField({ placeholder: e.target.value })}
                placeholder="Optional hint text"
                value={field.placeholder ?? ""}
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              checked={field.required ?? false}
              id={`field-required-${index}`}
              onCheckedChange={(checked) =>
                updateField({ required: checked === true })
              }
            />
            <Label className="cursor-pointer" htmlFor={`field-required-${index}`}>
              {t("formBuilder.required", "Required")}
            </Label>
          </div>

          {field.type === "select" ? (
            <div className="space-y-1.5">
              <Label htmlFor={`field-options-${index}`}>
                {t("formBuilder.options", "Options")}
              </Label>
              <Textarea
                id={`field-options-${index}`}
                onChange={(e) =>
                  updateField({
                    options: e.target.value
                      .split("\n")
                      .map((o) => o.trim())
                      .filter(Boolean),
                  })
                }
                placeholder={"Option A\nOption B\nOption C"}
                rows={3}
                value={(field.options ?? []).join("\n")}
              />
              <p className="text-xs text-muted-foreground">
                {t("formBuilder.optionsHint", "One option per line.")}
              </p>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

// ── Form Preview ────────────────────────────────────────────────────────

function FormPreview({ fields }: { fields: FormField[] }) {
  const { t } = useTranslation();

  if (fields.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
        {t("formBuilder.previewEmpty", "Add fields to see a preview of the form.")}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {fields.map((field, idx) => (
        <div className="space-y-1.5" key={`preview-${idx}-${field.name}`}>
          <Label>
            {field.label}
            {field.required ? <span className="ml-0.5 text-destructive">*</span> : null}
          </Label>
          {field.type === "textarea" ? (
            <Textarea disabled placeholder={field.placeholder} rows={3} />
          ) : field.type === "checkbox" ? (
            <div className="flex items-center gap-2">
              <Checkbox disabled />
              <span className="text-sm text-muted-foreground">
                {field.placeholder || field.label}
              </span>
            </div>
          ) : field.type === "select" ? (
            <NativeSelect disabled>
              <option value="">Select...</option>
              {(field.options ?? []).map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </NativeSelect>
          ) : (
            <Input
              disabled
              placeholder={field.placeholder}
              type={field.type === "number" ? "number" : "text"}
            />
          )}
        </div>
      ))}
    </div>
  );
}

// ── Main Builder Component ──────────────────────────────────────────────

export interface RegistrationFormBuilderProps {
  definition: Record<string, unknown>;
  onChange: (definition: Record<string, unknown>) => void;
}

export function RegistrationFormBuilder({
  definition,
  onChange,
}: RegistrationFormBuilderProps) {
  const { t } = useTranslation();
  const [fields, setFields] = useState<FormField[]>(() =>
    definitionToFields(definition),
  );
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    onChange(fieldsToDefinition(definitionToFields(definition)));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sync parent on mount only
  }, []);

  const syncFields = useCallback(
    (updated: FormField[]) => {
      setFields(updated);
      onChange(fieldsToDefinition(updated));
    },
    [onChange],
  );

  const addField = () => {
    syncFields([...fields, createEmptyField(fields.length + 1)]);
  };

  const removeField = (index: number) => {
    syncFields(fields.filter((_, i) => i !== index));
  };

  const updateField = (index: number, updated: FormField) => {
    const next = [...fields];
    next[index] = updated;
    syncFields(next);
  };

  const moveField = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= fields.length) return;
    const next = [...fields];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);
    syncFields(next);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted-foreground">
          {t("formBuilder.fieldCount", "{{count}} field(s)", { count: fields.length })}
        </p>
        <div className="flex gap-2">
          <Button
            onClick={() => setShowPreview(!showPreview)}
            size="sm"
            variant="outline"
          >
            {showPreview
              ? t("formBuilder.hidePreview", "Hide preview")
              : t("formBuilder.showPreview", "Show preview")}
          </Button>
          <Button onClick={addField} size="sm">
            <Plus className="h-4 w-4" />
            {t("formBuilder.addField", "Add field")}
          </Button>
        </div>
      </div>

      {fields.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <p className="text-sm text-muted-foreground">
            {t("formBuilder.empty", "No fields yet. Click \"Add field\" to start building your registration form.")}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {fields.map((field, idx) => (
            <FieldEditorRow
              canMoveDown={idx < fields.length - 1}
              canMoveUp={idx > 0}
              field={field}
              index={idx}
              key={`field-${idx}-${field.name}`}
              onChange={(updated) => updateField(idx, updated)}
              onMoveDown={() => moveField(idx, idx + 1)}
              onMoveUp={() => moveField(idx, idx - 1)}
              onRemove={() => removeField(idx)}
            />
          ))}
        </div>
      )}

      {showPreview && fields.length > 0 ? (
        <Card>
          <CardHeader className="border-b border-border">
            <CardTitle>{t("formBuilder.previewTitle", "Form Preview")}</CardTitle>
            <CardDescription>
              {t("formBuilder.previewDescription", "This is how the form will appear to teams.")}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <FormPreview fields={fields} />
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
