export function FieldError({
  id,
  message,
}: {
  id: string;
  message: string | undefined;
}): React.JSX.Element | null {
  if (message === undefined) {
    return null;
  }
  return (
    <p className="text-[13px] text-destructive" id={id}>
      {message}
    </p>
  );
}
