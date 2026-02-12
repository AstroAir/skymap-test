interface SectionHeaderProps {
  title: string;
  subtitle: string;
  id?: string;
}

export function SectionHeader({ title, subtitle, id }: SectionHeaderProps) {
  return (
    <div className="text-center mb-16">
      <h2 id={id} className="text-3xl sm:text-4xl font-serif font-bold text-foreground mb-4">
        {title}
      </h2>
      <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
        {subtitle}
      </p>
    </div>
  );
}
