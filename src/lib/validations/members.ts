import { z } from "zod";

const baseMemberInfoSchema = z.object({
  name: z
    .string()
    .min(3, "El nombre debe tener al menos 3 caracteres.")
    .max(120, "El nombre no puede superar 120 caracteres."),
  email: z
    .string()
    .email("Debes ingresar un correo válido.")
    .max(160, "El correo no puede superar 160 caracteres."),
  documentNumber: z
    .string()
    .min(5, "El número de documento es demasiado corto.")
    .max(40, "El número de documento es demasiado largo."),
  phone: z
    .string()
    .min(6, "El teléfono debe tener al menos 6 caracteres.")
    .max(30, "El teléfono no puede superar 30 caracteres.")
    .optional()
    .nullable(),
  address: z
    .string()
    .min(5, "La dirección debe tener al menos 5 caracteres.")
    .max(160, "La dirección no puede superar 160 caracteres.")
    .optional()
    .nullable(),
  birthDate: z
    .string()
    .refine(
      (value) => {
        if (!value) return true;
        const date = new Date(value);
        return !Number.isNaN(date.getTime());
      },
      { message: "La fecha de nacimiento no es válida." }
    )
    .optional()
    .nullable(),
});

export const memberInfoSchema = baseMemberInfoSchema.extend({
  status: z.enum(["ACTIVE", "INACTIVE", "PENDING", "VITALICIO"]).optional(),
  notes: z.string().max(400, "Las notas no pueden superar 400 caracteres.").optional().nullable(),
});

export const createMemberSchema = baseMemberInfoSchema.extend({
  password: z
    .string()
    .min(8, "La contraseña debe tener al menos 8 caracteres.")
    .max(64, "La contraseña no puede superar 64 caracteres."),
});

export const updateMemberSchema = memberInfoSchema.partial().extend({
  password: z
    .string()
    .min(8, "La contraseña debe tener al menos 8 caracteres.")
    .max(64, "La contraseña no puede superar 64 caracteres.")
    .optional()
    .nullable(),
});

export const listMembersSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(5).max(50).default(10),
  status: z.enum(["ACTIVE", "INACTIVE", "PENDING"]).optional(),
  search: z.string().max(120).optional(),
});

export const memberIdSchema = z.object({
  memberId: z.string().uuid("El identificador es inválido."),
});

export type MemberInfoInput = z.infer<typeof memberInfoSchema>;
export type CreateMemberInput = z.infer<typeof createMemberSchema>;
export type UpdateMemberInput = z.infer<typeof updateMemberSchema>;
export type ListMembersInput = z.infer<typeof listMembersSchema>;
export type MemberIdInput = z.infer<typeof memberIdSchema>;
