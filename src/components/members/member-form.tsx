"use client";

import { useMemo, useState } from "react";
import { useForm, type FieldErrors, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import {
  createMemberSchema,
  memberInfoSchema,
  type CreateMemberInput,
} from "@/lib/validations/members";
import { MEMBER_STATUS_OPTIONS } from "@/constants/member";
import type { MemberDTO, MemberStatus } from "@/types/member";

type StatusOption = {
  value: MemberStatus;
  label: string;
  disabled?: boolean;
  hidden?: boolean;
};

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
  const [isPasswordModified, setIsPasswordModified] = useState(false);

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
      password: member.password ?? "••••••••",
    } satisfies EditMemberFormValues;
  }, [isEditMode, props.initialData]);

  const { register, handleSubmit, formState, control, setValue } = useForm<
    CreateMemberInput | EditMemberFormValues
  >({
    resolver: zodResolver(schema),
    defaultValues,
  });
  const errors = formState.errors;
  const editErrors = formState.errors as FieldErrors<EditMemberFormValues>;
  const statusValue = useWatch({
    control,
    name: "status",
  }) as MemberStatus | undefined;
  const requiresNotes =
    isEditMode && statusValue === "INACTIVE" && props.initialData?.status !== "INACTIVE";
  const allowedStatuses: MemberStatus[] = ["PENDING", "INACTIVE"];
  const selectableStatusOptions: StatusOption[] = MEMBER_STATUS_OPTIONS.filter((option) =>
    allowedStatuses.includes(option.value)
  ).map((option) => ({ ...option }));
  const readonlyStatusOption: StatusOption[] =
    isEditMode &&
    props.initialData &&
    props.initialData.status &&
    !allowedStatuses.includes(props.initialData.status)
      ? [
          {
            value: props.initialData.status,
            label: `${
              MEMBER_STATUS_OPTIONS.find((option) => option.value === props.initialData.status)
                ?.label ?? props.initialData.status
            } (actual)`,
            disabled: true,
            hidden: true,
          },
        ]
      : [];
  const statusOptions: StatusOption[] = [...readonlyStatusOption, ...selectableStatusOptions];

  const submitHandler = handleSubmit(async (values) => {
    // En modo edición, si la contraseña no fue modificada, la eliminamos del payload
    if (mode === "edit" && !isPasswordModified) {
      values.password = null;
    }

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
              {statusOptions.map((option) => (
                <option
                  key={option.value}
                  value={option.value}
                  disabled={"disabled" in option && option.disabled}
                >
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
          <label className="text-sm text-base-muted">Contraseña {mode === "edit" ? "" : ""}</label>
          <div>
            <input
              type="text"
              {...register("password", {
                onChange: (e) => {
                  if (isEditMode && !isPasswordModified) {
                    setIsPasswordModified(true);
                    setValue("password", e.target.value);
                  }
                },
              })}
              placeholder={
                mode === "edit" ? (props.initialData?.password ?? "••••••••") : "********"
              }
              autoComplete="new-password"
              className="w-full rounded-lg border border-base-border bg-transparent px-4 py-2 focus:border-accent-primary focus:outline-none"
            />
          </div>
          {errors.password && (
            <p className="text-sm text-accent-critical">{errors.password.message as string}</p>
          )}
          {mode === "edit" && !isPasswordModified && (
            <p className="text-xs text-base-muted">
              La contraseña actual es visible. Editá para cambiarla.
            </p>
          )}
        </div>
      </div>

      {isEditMode && (
        <div className="space-y-1">
          <label className="text-sm text-base-muted">Notas</label>
          <textarea
            {...register("notes", {
              validate: (value) => {
                if (!requiresNotes) return true;
                return value && value.trim().length
                  ? true
                  : "Debes ingresar una nota para dar de baja al socio.";
              },
            })}
            rows={4}
            className="w-full rounded-lg border border-base-border bg-transparent px-4 py-2 focus:border-accent-primary focus:outline-none"
            placeholder="Información adicional del socio"
          />
          {editErrors.notes && (
            <p className="text-sm text-accent-critical">{editErrors.notes.message}</p>
          )}
          {requiresNotes && !editErrors.notes && (
            <p className="text-xs text-base-muted">
              Detallá el motivo antes de cambiar el estado a inactivo.
            </p>
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
