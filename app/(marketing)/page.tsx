import Link from "next/link";
import {
  GraduationCap,
  Briefcase,
  FileCheck2,
  Sparkles,
  MessagesSquare,
  ShieldCheck,
  UploadCloud,
  Wand2,
  FileOutput,
  ArrowRight,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const studentTools = [
  "Corrector APA 7",
  "Analizador de escritura",
  "Corrector de redacción",
  "Chat con documentos",
  "Generador de referencias",
  "Preparador de exposiciones",
];

const professionalTools = [
  "Analizador y generador de CV",
  "Asistente de correos",
  "Analizador de Excel/CSV",
  "Generador de informes",
  "Resumen de reuniones",
  "Generador de documentos",
];

const steps = [
  {
    icon: UploadCloud,
    title: "Sube tu documento",
    description:
      "DOCX, PDF, Excel o CSV. Validamos el formato antes de procesar cualquier cosa.",
  },
  {
    icon: Wand2,
    title: "Analizamos con reglas + IA",
    description:
      "Reglas programadas verifican formato y estructura; la IA evalúa redacción y contenido.",
  },
  {
    icon: FileOutput,
    title: "Recibes resultados claros",
    description:
      "Diagnóstico detallado, recomendaciones y, cuando aplica, el documento corregido.",
  },
];

export default function LandingPage() {
  return (
    <div className="flex flex-1 flex-col bg-background">
      <header className="win98-titlebar sticky top-0 z-10">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-1.5">
          <div className="flex items-center gap-2 text-sm font-bold">
            <Sparkles className="h-4 w-4" />
            NEXA AI
          </div>
          <nav className="hidden items-center gap-6 text-sm text-white/90 sm:flex">
            <a href="#caracteristicas" className="hover:text-white">
              Características
            </a>
            <a href="#herramientas" className="hover:text-white">
              Herramientas
            </a>
            <a href="#privacidad" className="hover:text-white">
              Privacidad
            </a>
          </nav>
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className={buttonVariants({
                variant: "secondary",
                size: "sm",
                className: "hidden sm:inline-flex",
              })}
            >
              Iniciar sesión
            </Link>
            <Link
              href="/signup"
              className={buttonVariants({
                variant: "secondary",
                size: "sm",
              })}
            >
              Comenzar gratis
            </Link>
          </div>
        </div>
      </header>

      <main className="flex flex-1 flex-col">
        {/* Hero */}
        <section className="mx-auto flex w-full max-w-6xl flex-col items-center gap-6 px-6 py-24 text-center">
          <Badge
            variant="secondary"
            className="gap-1.5 animate-in fade-in-0 slide-in-from-bottom-2 duration-500"
          >
            <Sparkles className="h-3.5 w-3.5" />
            En desarrollo activo
          </Badge>
          <h1
            className="max-w-3xl text-balance text-4xl font-semibold tracking-tight animate-in fade-in-0 slide-in-from-bottom-3 duration-700 sm:text-5xl"
            style={{ animationDelay: "80ms", animationFillMode: "backwards" }}
          >
            Una plataforma inteligente para estudiar, crear y trabajar.
          </h1>
          <p
            className="max-w-xl text-balance text-lg text-muted-foreground animate-in fade-in-0 slide-in-from-bottom-3 duration-700"
            style={{ animationDelay: "160ms", animationFillMode: "backwards" }}
          >
            NEXA AI combina reglas programadas y modelos de IA para ayudarte a
            revisar, analizar y generar documentos académicos y profesionales,
            sin sustituir tu criterio.
          </p>
          <div
            className="flex flex-col gap-3 animate-in fade-in-0 slide-in-from-bottom-3 duration-700 sm:flex-row"
            style={{ animationDelay: "240ms", animationFillMode: "backwards" }}
          >
            <Link
              href="/signup"
              className={buttonVariants({
                size: "lg",
                className: "transition-transform hover:-translate-y-0.5 active:scale-[0.98]",
              })}
            >
              Comenzar gratis
              <ArrowRight className="h-4 w-4 transition-transform group-hover/button:translate-x-0.5" />
            </Link>
            <a
              href="#como-funciona"
              className={buttonVariants({
                size: "lg",
                variant: "outline",
                className: "transition-transform hover:-translate-y-0.5",
              })}
            >
              Ver cómo funciona
            </a>
          </div>
        </section>

        {/* Características */}
        <section id="caracteristicas" className="border-t bg-muted/30">
          <div className="mx-auto grid w-full max-w-6xl gap-6 px-6 py-20 sm:grid-cols-3">
            <Card className="border-none bg-transparent shadow-none transition-transform duration-200 hover:-translate-y-1">
              <CardHeader>
                <FileCheck2 className="h-6 w-6" />
                <CardTitle className="mt-2">Reglas + IA</CardTitle>
                <CardDescription>
                  El formato se verifica con reglas programadas; la IA se
                  reserva para redacción, coherencia y recomendaciones.
                </CardDescription>
              </CardHeader>
            </Card>
            <Card className="border-none bg-transparent shadow-none transition-transform duration-200 hover:-translate-y-1">
              <CardHeader>
                <MessagesSquare className="h-6 w-6" />
                <CardTitle className="mt-2">Conversa con tus documentos</CardTitle>
                <CardDescription>
                  Pregunta sobre el contenido de tus archivos y obtén
                  respuestas basadas en lo que realmente contienen.
                </CardDescription>
              </CardHeader>
            </Card>
            <Card className="border-none bg-transparent shadow-none transition-transform duration-200 hover:-translate-y-1">
              <CardHeader>
                <ShieldCheck className="h-6 w-6" />
                <CardTitle className="mt-2">Tus datos, protegidos</CardTitle>
                <CardDescription>
                  Cada usuario accede únicamente a sus propios documentos e
                  historial mediante seguridad a nivel de fila.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </section>

        {/* Para estudiantes / profesionales */}
        <section id="herramientas" className="mx-auto w-full max-w-6xl px-6 py-20">
          <div className="grid gap-6 sm:grid-cols-2">
            <Card>
              <CardHeader>
                <GraduationCap className="h-6 w-6" />
                <CardTitle className="mt-2">Para estudiantes</CardTitle>
                <CardDescription>
                  Herramientas para revisar, entender y preparar tus trabajos
                  académicos.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="grid gap-2 text-sm text-muted-foreground">
                  {studentTools.map((tool) => (
                    <li key={tool} className="flex items-center gap-2">
                      <span className="h-1 w-1 rounded-full bg-foreground/50" />
                      {tool}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <Briefcase className="h-6 w-6" />
                <CardTitle className="mt-2">Para profesionales</CardTitle>
                <CardDescription>
                  Herramientas para redactar, analizar y comunicar con más
                  eficiencia en el trabajo.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="grid gap-2 text-sm text-muted-foreground">
                  {professionalTools.map((tool) => (
                    <li key={tool} className="flex items-center gap-2">
                      <span className="h-1 w-1 rounded-full bg-foreground/50" />
                      {tool}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Cómo funciona */}
        <section id="como-funciona" className="border-t bg-muted/30">
          <div className="mx-auto w-full max-w-6xl px-6 py-20">
            <h2 className="text-center text-2xl font-semibold tracking-tight">
              Cómo funciona
            </h2>
            <div className="mt-12 grid gap-8 sm:grid-cols-3">
              {steps.map((step, index) => (
                <div
                  key={step.title}
                  className="flex flex-col items-start gap-3 transition-transform duration-200 hover:-translate-y-1"
                >
                  <div className="win98-panel flex h-8 w-8 items-center justify-center bg-secondary text-sm font-bold">
                    {index + 1}
                  </div>
                  <step.icon className="h-5 w-5 text-muted-foreground" />
                  <h3 className="font-medium">{step.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {step.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Privacidad */}
        <section id="privacidad" className="mx-auto w-full max-w-6xl px-6 py-20">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-semibold tracking-tight">
              Privacidad por diseño
            </h2>
            <p className="mt-4 text-muted-foreground">
              Tus documentos y resultados son visibles únicamente para ti.
              NEXA AI utiliza reglas de acceso a nivel de fila para que ningún
              otro usuario pueda ver tu información, y procesa tus archivos
              solo con lo necesario para cada herramienta.
            </p>
          </div>
        </section>

        {/* CTA final */}
        <section className="border-t">
          <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-6 px-6 py-20 text-center">
            <h2 className="text-2xl font-semibold tracking-tight">
              Empieza a usar NEXA AI
            </h2>
            <p className="max-w-md text-muted-foreground">
              Crea una cuenta con tu correo y elige tu perfil para empezar.
            </p>
            <Link
              href="/signup"
              className={buttonVariants({
                size: "lg",
                className: "transition-transform hover:-translate-y-0.5 active:scale-[0.98]",
              })}
            >
              Comenzar gratis
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-4 px-6 py-8 text-sm text-muted-foreground sm:flex-row">
          <span>© {new Date().getFullYear()} NEXA AI</span>
          <span>Proyecto en desarrollo. Sin garantías de disponibilidad.</span>
        </div>
      </footer>
    </div>
  );
}
