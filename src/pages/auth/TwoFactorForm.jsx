import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { Input, Button, Typography } from "@material-tailwind/react";
import { verifyTwoFactor, resendTwoFactor } from "@/services/authService";
import { validateCode } from "@/utils/validators";

// Segundos que el backend exige entre envíos; el botón espera lo mismo para no
// provocar un 429 evitable.
const RESEND_SECONDS = 60;

// Segundo paso del login: el usuario escribe el código de 6 dígitos que llegó
// a su correo. onVerified se llama cuando la sesión ya quedó abierta.
export function TwoFactorForm({ challengeToken, emailHint, onVerified, onCancel }) {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS);

  useEffect(() => {
    if (secondsLeft <= 0) return undefined;
    const timer = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [secondsLeft]);

  // Errores tras los que el código ya no puede reintentarse con este challenge.
  const isTerminal = (status) => status === 401 || status === 429;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setInfo("");
    const validationError = validateCode(code);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError("");
    setLoading(true);
    try {
      await verifyTwoFactor(challengeToken, code.trim());
      await onVerified();
    } catch (err) {
      setError(err.response?.data?.message || "No se pudo verificar el código");
      if (isTerminal(err.response?.status)) {
        // Sesión de verificación vencida o intentos agotados: hay que volver a iniciar sesión.
        setTimeout(onCancel, 2500);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError("");
    setInfo("");
    try {
      const data = await resendTwoFactor(challengeToken);
      setInfo(data.message);
      setSecondsLeft(RESEND_SECONDS);
    } catch (err) {
      setError(err.response?.data?.message || "No se pudo reenviar el código");
      if (err.response?.status === 401) setTimeout(onCancel, 2500);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-8 mb-2 mx-auto w-80 max-w-screen-lg lg:w-1/2">
      <Typography variant="paragraph" color="blue-gray" className="mb-6 text-center">
        Enviamos un código de 6 dígitos a <strong>{emailHint}</strong>. Escríbelo para continuar.
      </Typography>

      <Input
        size="lg"
        label="Código de verificación"
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={6}
        autoFocus
        value={code}
        onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
        disabled={loading}
        error={Boolean(error)}
      />

      {error && (
        <Typography color="red" className="text-center text-sm mt-2">
          {error}
        </Typography>
      )}
      {info && (
        <Typography color="green" className="text-center text-sm mt-2">
          {info}
        </Typography>
      )}

      <Button type="submit" className="mt-6" fullWidth disabled={loading}>
        {loading ? "Verificando..." : "Verificar"}
      </Button>

      <div className="mt-4 flex items-center justify-between">
        <Button type="button" variant="text" size="sm" onClick={onCancel} disabled={loading}>
          Volver
        </Button>
        <Button
          type="button"
          variant="text"
          size="sm"
          onClick={handleResend}
          disabled={loading || secondsLeft > 0}
        >
          {secondsLeft > 0 ? `Reenviar código (${secondsLeft}s)` : "Reenviar código"}
        </Button>
      </div>
    </form>
  );
}

TwoFactorForm.propTypes = {
  challengeToken: PropTypes.string.isRequired,
  emailHint: PropTypes.string,
  onVerified: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
};

export default TwoFactorForm;
