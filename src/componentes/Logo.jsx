/** Logo de QuizArena (incluye el wordmark). */
export default function Logo({ size = 40, className = "" }) {
  return (
    <img
      src="/logo-quizarena.png"
      alt="QuizArena"
      className={className}
      style={{ height: size, width: "auto", display: "block" }}
    />
  );
}
