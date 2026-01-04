"use client";

import { useMemo } from "react";
import { useForm, type FieldErrors } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import {
  createMemberSchema,
  memberInfoSchema,
  type CreateMemberInput,
} from "@/lib/validations/members";
import { MEMBER_STATUS_OPTIONS } from "@/constants/member";
import type { MemberDTO } from "@/types/member";

const editFormSchema = memberInfoSchema.extend({
  password: z
    .string()
    .min(8, "La contraseña debe tener al menos 8 caracteres.")
    .max(64, "La contraseña no puede superar 64 caracteres.")
    .optional()
    .nullable(),
});

type EditMemberFormValues = z.infer<typeof editFormSchema>;

type MemberFormProps =
  | {
      mode: "create";
      initialData?: undefined;
      onSubmit: (values: CreateMemberInput) => Promise<void> | void;
      isSubmitting?: boolean;
      serverError?: string | null;
    }
  | {
      mode: "edit";
      initialData: MemberDTO;
      onSubmit: (values: EditMemberFormValues) => Promise<void> | void;
      isSubmitting?: boolean;
      serverError?: string | null;
    };

function getDateInputValue(value?: string | null) {
  if (!value) return "";
  return value.split("T")[0];
}

export function MemberForm(props: MemberFormProps) {
  const { mode, isSubmitting, serverError } = props;
  const isEditMode = mode === "edit";
  const schema = isEditMode ? editFormSchema : createMemberSchema;

  const defaultValues = useMemo(() => {
    if (!isEditMode) {
      return {
        name: "",
        email: "",
        documentNumber: "",
        phone: "",
        address: "",
        birthDate: "",
        password: "",
      } satisfies CreateMemberInput;
    }

    const member = props.initialData;
    return {
      name: member.name ?? "",
      email: member.email,
      documentNumber: member.documentNumber,
      phone: member.phone ?? "",
      address: member.address ?? "",
      birthDate: getDateInputValue(member.birthDate),
      status: member.status,
      notes: member.notes ?? "",
      password: "",
    } satisfies EditMemberFormValues;
  }, [isEditMode, props.initialData]);

  const { register, handleSubmit, formState } = useForm<CreateMemberInput | EditMemberFormValues>({
    resolver: zodResolver(schema),
    defaultValues,
  });
  const errors = formState.errors;
  const editErrors = formState.errors as FieldErrors<EditMemberFormValues>;

  const submitHandler = handleSubmit(async (values) => {
    if (mode === "create") {
      await props.onSubmit(values as CreateMemberInput);
    } else {
      await props.onSubmit(values as EditMemberFormValues);
    }
  });

  return (
    <form onSubmit={submitHandler} className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1">
          <label className="text-sm text-base-muted">Nombre completo</label>
          <input
            {...register("name")}
            placeholder="Ej. Juan Pérez"
            className="w-full rounded-lg border border-base-border bg-transparent px-4 py-2 text-base-foreground placeholder:text-base-muted focus:border-accent-primary focus:outline-none"
          />
          {errors.name && <p className="text-sm text-accent-critical">{errors.name.message}</p>}
        </div>
        <div className="space-y-1">
          <label className="text-sm text-base-muted">Correo</label>
          <input
            type="email"
            {...register("email")}
            placeholder="correo@club.com"
            className="w-full rounded-lg border border-base-border bg-transparent px-4 py-2 text-base-foreground placeholder:text-base-muted focus:border-accent-primary focus:outline-none"
          />
          {errors.email && <p className="text-sm text-accent-critical">{errors.email.message}</p>}
        </div>
        <div className="space-y-1">
          <label className="text-sm text-base-muted">Documento</label>
          <input
            {...register("documentNumber")}
            placeholder="DNI / Pasaporte"
            className="w-full rounded-lg border border-base-border bg-transparent px-4 py-2 focus:border-accent-primary focus:outline-none"
          />
          {errors.documentNumber && (
            <p className="text-sm text-accent-critical">{errors.documentNumber.message}</p>
          )}
        </div>
        <div className="space-y-1">
          <label className="text-sm text-base-muted">Teléfono</label>
          <input
            {...register("phone")}
            placeholder="+54 9 ..."
            className="w-full rounded-lg border border-base-border bg-transparent px-4 py-2 focus:border-accent-primary focus:outline-none"
          />
          {errors.phone && <p className="text-sm text-accent-critical">{errors.phone.message}</p>}
        </div>
        <div className="space-y-1">
          <label className="text-sm text-base-muted">Dirección</label>
          <input
            {...register("address")}
            placeholder="Calle y número"
            className="w-full rounded-lg border border-base-border bg-transparent px-4 py-2 focus:border-accent-primary focus:outline-none"
          />
          {errors.address && (
            <p className="text-sm text-accent-critical">{errors.address.message}</p>
          )}
        </div>
        <div className="space-y-1">
          <label className="text-sm text-base-muted">Fecha de nacimiento</label>
          <input
            type="date"
            {...register("birthDate")}
            className="w-full rounded-lg border border-base-border bg-transparent px-4 py-2 focus:border-accent-primary focus:outline-none"
          />
          {errors.birthDate && (
            <p className="text-sm text-accent-critical">{errors.birthDate.message as string}</p>
          )}
        </div>
        {isEditMode ? (
          <div className="space-y-1">
            <label className="text-sm text-base-muted">Estado</label>
            <select {...register("status")} className="select-base">
              {MEMBER_STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {editErrors.status && (
              <p className="text-sm text-accent-critical">{editErrors.status.message}</p>
            )}
          </div>
        ) : (
          <div className="space-y-1">
            <label className="text-sm text-base-muted">Estado inicial</label>
            <input
              value="Pendiente"
              readOnly
              disabled
              className="w-full rounded-lg border border-base-border bg-base-secondary px-4 py-2 text-base-muted"
            />
            <p className="text-xs text-base-muted">
              Se activará automáticamente al inscribir al socio.
            </p>
          </div>
        )}
        <div className="space-y-1">
          <label className="text-sm text-base-muted">
            Contraseña {mode === "edit" ? "(opcional)" : ""}
          </label>
          <input
            type="password"
            {...register("password")}
            placeholder={mode === "edit" ? "Dejar vacío para no cambiar" : "********"}
            autoComplete="new-password"
            className="w-full rounded-lg border border-base-border bg-transparent px-4 py-2 focus:border-accent-primary focus:outline-none"
          />
          {errors.password && (
            <p className="text-sm text-accent-critical">{errors.password.message as string}</p>
          )}
        </div>
      </div>

      {isEditMode && (
        <div className="space-y-1">
          <label className="text-sm text-base-muted">Notas</label>
          <textarea
            {...register("notes")}
            rows={4}
            className="w-full rounded-lg border border-base-border bg-transparent px-4 py-2 focus:border-accent-primary focus:outline-none"
            placeholder="Información adicional del socio"
          />
          {editErrors.notes && (
            <p className="text-sm text-accent-critical">{editErrors.notes.message}</p>
          )}
        </div>
      )}

      <div className="flex justify-end gap-3">
        <button type="submit" className="btn-primary" disabled={isSubmitting}>
          {isSubmitting
            ? mode === "create"
              ? "Creando..."
              : "Guardando..."
            : mode === "create"
              ? "Crear socio"
              : "Guardar cambios"}
        </button>
      </div>
      {serverError && <p className="text-sm text-accent-critical text-right">{serverError}</p>}
    </form>
  );
}
