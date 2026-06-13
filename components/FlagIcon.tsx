type FlagIconProps = {
  src?: string | null;
  alt?: string | null;
  fallback: string;
  size?: "sm" | "md" | "lg";
};

const sizeClass = {
  sm: "h-4 w-6",
  md: "h-5 w-7",
  lg: "h-7 w-10"
};

export default function FlagIcon({ src, alt, fallback, size = "md" }: FlagIconProps) {
  if (!src) {
    return <span className="inline-flex shrink-0 text-lg leading-none">{fallback}</span>;
  }

  return (
    <span
      role="img"
      aria-label={alt ?? "국기"}
      className={`inline-flex shrink-0 rounded-sm border border-white/20 bg-cover bg-center bg-no-repeat shadow-sm ${sizeClass[size]}`}
      style={{ backgroundImage: `url(${src})` }}
    />
  );
}
