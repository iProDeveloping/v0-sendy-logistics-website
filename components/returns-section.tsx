import { PackageOpen, MapPinned, Printer } from "lucide-react"

const returnsSteps = [
  {
    icon: PackageOpen,
    title: "Pick-up",
    description: "We come to you. Schedule a pickup and we'll collect your return package from your door.",
  },
  {
    icon: MapPinned,
    title: "Drop-off",
    description: "To the return center. We handle the logistics of getting your package where it needs to go.",
  },
  {
    icon: Printer,
    title: "Label Printing",
    description: "Don't worry, It's on us! We'll print and attach the return label for you.",
  },
]

export function ReturnsSection() {
  return (
    <section className="py-24 bg-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="font-serif text-4xl sm:text-5xl font-bold mb-6 text-balance">
            <span className="text-foreground">Sendy</span>{" "}
            <span className="text-primary">makes</span>
            <br />
            <span className="text-foreground">shopping returns</span>{" "}
            <span className="text-primary">fun.</span>
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Say goodbye to the stress of returning packages! With Sendy, it's easy.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {returnsSteps.map((step, index) => (
            <div
              key={step.title}
              className="relative p-8 rounded-2xl bg-card border border-primary/20 text-center"
            >
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-sm">
                {index + 1}
              </div>
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary mx-auto mb-6">
                <step.icon className="h-8 w-8" />
              </div>
              <h3 className="font-serif text-xl font-bold text-foreground mb-3">{step.title}</h3>
              <p className="text-muted-foreground">{step.description}</p>
            </div>
          ))}
        </div>

        <p className="text-center text-lg font-semibold text-foreground mt-12">
          Sendy makes returns smooth and simple.
        </p>
      </div>
    </section>
  )
}
