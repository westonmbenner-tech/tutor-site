import { Fragment } from "react";

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
  const lines = normalizeMultilineText(text).split("\n");

  return (
    <div className={`whitespace-pre-wrap break-words ${className}`.trim()}>
      {lines.map((line, index) => (
        <Fragment key={index}>
          {line}
          {index < lines.length - 1 ? <br /> : null}
        </Fragment>
      ))}
    </div>
  );
}
