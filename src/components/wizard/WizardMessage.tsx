export function WizardMessage({
  sender,
  text,
}: {
  sender: "bot" | "user";
  text: string;
}) {
  return (
    <div
      className={`flex ${sender === "user" ? "justify-end" : "justify-start"}`}
    >
      <div
        className={`wizard-message max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
          sender === "bot"
            ? "rounded-bl-md bg-surface-bright/80 text-text-primary backdrop-blur-sm"
            : "rounded-br-md border border-border bg-surface text-text-primary"
        }`}
      >
        {text}
      </div>
    </div>
  );
}
