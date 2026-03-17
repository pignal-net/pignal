interface FlashProps {
  type: 'success' | 'error';
  message: string;
}

export function Flash({ type, message }: FlashProps) {
  return (
    <div class={`flash flash-${type}`} role="alert">
      {message}
    </div>
  );
}
