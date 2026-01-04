"use client";

import { useEffect, useMemo, useRef } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  createEnrollmentSchema,
  updateEnrollmentSchema,
  type CreateEnrollmentInput,
  type UpdateEnrollmentInput,
} from "@/lib/validations/enrollments";
import { useMembersOptions } from "@/hooks/use-enrollments";
import type { EnrollmentDTO } from "@/types/enrollment";
import { useEconomicConfig } from "@/hooks/use-economic-config";

function getDateValue(value?: string | null) {
  if (!value) return "";
  return value.split("T")[0] ?? "";
}

export function EnrollmentCreateForm({
  onSubmit,
  isSubmitting,
  serverError,
}: {
  onSubmit: (values: CreateEnrollmentInput) => Promise<void> | void;
  isSubmitting?: boolean;
  serverError?: string | null;
}) {
  const { data: membersOptions, isLoading: membersLoading } = useMembersOptions();
  const { data: economicConfig } = useEconomicConfig();
  const hasAppliedDefaults = useRef(false);

  const defaultValues = useMemo<CreateEnrollmentInput>(() => {
    const today = new Date().toISOString().split("T")[0] ?? "";
    return {
      memberId: "",
      startDate: today,
      planName: "",
      monthlyAmount: undefined,
      monthsToGenerate: undefined,
      notes: "",
    };
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    getValues,
  } = useForm<CreateEnrollmentInput>({
    resolver: zodResolver(createEnrollmentSchema) as Resolver<CreateEnrollmentInput>,
    defaultValues,
  });

  useEffect(() => {
    if (
      economicConfig &&
      !hasAppliedDefaults.current &&
      (() => {
        const values = getValues();
        return (
          (values.monthlyAmount == null || values.monthlyAmount === 0) &&
          (values.monthsToGenerate == null || values.monthsToGenerate === 0)
        );
      })()
    ) {
      setValue("monthlyAmount", economicConfig.defaultMonthlyAmount);
      setValue("monthsToGenerate", economicConfig.defaultMonthsToGenerate);
      hasAppliedDefaults.current = true;
    }
  }, [economicConfig, setValue, getValues]);

  const submitHandler = handleSubmit(async (values) => {
    await onSubmit(values);
  });

  return (
    <form onSubmit={submitHandler} className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1">
          <label className="text-sm text-base-muted">Socio</label>
          <select {...register("memberId")} className="select-base" disabled={membersLoading}>
            <option value="">Seleccionar socio...</option>
            {membersOptions?.map((member) => (
              <option key={member.id} value={member.id}>
                {member.name ?? "Sin nombre"} · {member.documentNumber}
              </option>
            ))}
          </select>
          {errors.memberId && (
            <p className="text-sm text-accent-critical">{errors.memberId.message as string}</p>
          )}
        </div>
        <div className="space-y-1">
          <label className="text-sm text-base-muted">Fecha de inicio</label>
          <input
            type="date"
            {...register("startDate")}
            className="w-full rounded-lg border border-base-border bg-transparent px-4 py-2 focus:border-accent-primary focus:outline-none"
            defaultValue={getDateValue(defaultValues.startDate)}
          />
          {errors.startDate && (
            <p className="text-sm text-accent-critical">{errors.startDate.message as string}</p>
          )}
        </div>
        <div className="space-y-1">
          <label className="text-sm text-base-muted">Monto mensual</label>
          <input
            type="number"
            {...register("monthlyAmount", { valueAsNumber: true })}
            className="w-full rounded-lg border border-base-border bg-transparent px-4 py-2 focus:border-accent-primary focus:outline-none"
          />
          {economicConfig && (
            <p className="text-xs text-base-muted">
              Sugerido: ARS {economicConfig.defaultMonthlyAmount.toLocaleString()} · vencimiento día{" "}
              {economicConfig.dueDay}
            </p>
          )}
          {errors.monthlyAmount && (
            <p className="text-sm text-accent-critical">{errors.monthlyAmount.message as string}</p>
          )}
        </div>
      </div>

      <div className="rounded-md border border-base-border/60 bg-base-secondary/30 px-4 py-3 text-sm text-base-muted">
        El socio debe abonar previamente la inscripción para ser dado de alta.
      </div>

      <div className="flex justify-end">
        <button type="submit" className="btn-primary" disabled={isSubmitting}>
          {isSubmitting ? "Creando..." : "Crear inscripción"}
        </button>
      </div>
      {serverError && <p className="text-right text-sm text-accent-critical">{serverError}</p>}
    </form>
  );
}

export function EnrollmentEditForm({
  initialData,
  onSubmit,
  isSubmitting,
  serverError,
}: {
  initialData: EnrollmentDTO;
  onSubmit: (values: UpdateEnrollmentInput) => Promise<void> | void;
  isSubmitting?: boolean;
  serverError?: string | null;
}) {
  const defaultValues = useMemo<UpdateEnrollmentInput>(
    () => ({
      status: initialData.status,
      notes: initialData.notes ?? "",
    }),
    [initialData]
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UpdateEnrollmentInput>({
    resolver: zodResolver(updateEnrollmentSchema) as Resolver<UpdateEnrollmentInput>,
    defaultValues,
  });

  const submitHandler = handleSubmit(async (values) => {
    await onSubmit(values);
  });

  return (
    <form onSubmit={submitHandler} className="space-y-5">
      <div className="rounded-lg border border-base-border px-4 py-3">
        <p className="text-sm text-base-muted">Socio asignado</p>
        <p className="text-lg font-semibold">
          {initialData.member.name ?? "Sin nombre"} · {initialData.member.documentNumber}
        </p>
        <p className="text-sm text-base-muted">{initialData.member.email}</p>
      </div>

      <div className="space-y-1">
        <label className="text-sm text-base-muted">Estado</label>
        <select {...register("status")} className="select-base">
          <option value="ACTIVE">Activa</option>
          <option value="CANCELLED">Cancelada</option>
        </select>
        {errors.status && (
          <p className="text-sm text-accent-critical">{errors.status.message as string}</p>
        )}
      </div>

      <div className="space-y-1">
        <label className="text-sm text-base-muted">Notas</label>
        <textarea
          {...register("notes")}
          rows={4}
          className="w-full rounded-lg border border-base-border bg-transparent px-4 py-2 focus:border-accent-primary focus:outline-none"
          placeholder="Detalle adicional de la inscripción"
        />
        {errors.notes && (
          <p className="text-sm text-accent-critical">{errors.notes.message as string}</p>
        )}
      </div>

      <div className="flex justify-end gap-3">
        <button type="submit" className="btn-primary" disabled={isSubmitting}>
          {isSubmitting ? "Guardando..." : "Guardar cambios"}
        </button>
      </div>
      {serverError && <p className="text-right text-sm text-accent-critical">{serverError}</p>}
    </form>
  );
}
