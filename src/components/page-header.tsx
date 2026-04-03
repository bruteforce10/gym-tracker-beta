interface PageHeaderProps {
  title: string;
  subtitle?: string;
  rightContent?: React.ReactNode;
}

export default function PageHeader({ title, subtitle, rightContent }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between px-1 mb-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight" style={{ fontFamily: "Outfit, sans-serif" }}>
          {title}
        </h1>
        {subtitle && (
          <p className="text-sm text-text-muted mt-0.5">{subtitle}</p>
        )}
      </div>
      {rightContent && <div>{rightContent}</div>}
    </div>
  );
}
