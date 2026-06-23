export function normalizeMultilineText(text: string): string {
  return text.replace(/\r\n/g, "\n");
}

export function FormattedMultilineText({
  text,
  className = "",
}: {
  text: string;
  className?: string;
}) {
  return (
    <div
      className={`whitespace-pre-wrap break-words leading-relaxed ${className}`.trim()}
    >
      {normalizeMultilineText(text)}
    </div>
  );
}
