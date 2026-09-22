import { z } from "zod";

export const cvExperienceEntrySchema = z.object({
  company: z.string(),
  role: z.string(),
  period: z.string(),
  bullets: z.array(z.string()).max(6),
});

export const cvEducationEntrySchema = z.object({
  institution: z.string(),
  degree: z.string(),
  period: z.string(),
});

export const generatedCvSchema = z.object({
  fullName: z.string(),
  headerLine: z.string(),
  profile: z.string(),
  experience: z.array(cvExperienceEntrySchema).max(8),
  education: z.array(cvEducationEntrySchema).max(5),
  skills: z.array(z.string()).max(20),
});

export type GeneratedCv = z.infer<typeof generatedCvSchema>;

export type GeneradorCvInput = {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  targetRole: string;
  profileNotes: string;
  experienceNotes: string;
  educationNotes: string;
  skillsNotes: string;
};

const MAX_CHARS = 6000;

function truncate(text: string): string {
  return text.length > MAX_CHARS ? `${text.slice(0, MAX_CHARS)}\n[...truncado...]` : text;
}

export function buildGeneradorCvPrompt(input: GeneradorCvInput): string {
  return `Eres un asistente experto en redactar CVs profesionales en español a partir de información en bruto que da el usuario (notas sueltas, no necesariamente bien redactadas).

No inventes empresas, cargos, fechas, títulos ni logros que no estén implícitos en las notas del usuario — estructura y redacta profesionalmente lo que el usuario dio, sin fabricar datos nuevos. Si una sección de notas está vacía, deja el arreglo correspondiente vacío (no inventes contenido de relleno).

Datos personales:
Nombre: ${input.fullName}
Correo: ${input.email}
Teléfono: ${input.phone}
Ubicación: ${input.location || "(no especificada)"}
Puesto objetivo (opcional, para enfocar el perfil): ${input.targetRole || "(no especificado)"}

Notas de perfil profesional (puede estar vacío; si lo está, redacta un perfil breve basado en la experiencia y habilidades dadas):
"""
${truncate(input.profileNotes)}
"""

Notas de experiencia laboral (formato libre del usuario, estructura en entradas):
"""
${truncate(input.experienceNotes)}
"""

Notas de educación (formato libre del usuario, estructura en entradas):
"""
${truncate(input.educationNotes)}
"""

Notas de habilidades:
"""
${truncate(input.skillsNotes)}
"""

Para cada experiencia, redacta hasta 6 bullets orientados a logros (no solo responsabilidades), basados únicamente en lo que el usuario escribió.

Responde ÚNICAMENTE con JSON válido, sin texto adicional, con esta forma exacta:
{
  "fullName": "string",
  "headerLine": "string (correo · teléfono · ubicación, omitiendo lo que no aplique)",
  "profile": "string",
  "experience": [{ "company": "string", "role": "string", "period": "string", "bullets": ["string", ...] }],
  "education": [{ "institution": "string", "degree": "string", "period": "string" }],
  "skills": ["string", ...]
}`;
}
