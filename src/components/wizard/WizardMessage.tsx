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
            ? "rounded-bl-md bg-surface-bright text-text-primary"
            : "rounded-br-md bg-accent/15 text-accent"
        }`}
      >
        {text}
      </div>
    </div>
  );
}
