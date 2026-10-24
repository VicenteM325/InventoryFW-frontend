import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Input, Button, Typography } from "@material-tailwind/react";
import { resetPassword } from "@/services/authService";
import { validatePassword, validatePasswordConfirmation } from "@/utils/validators";

// Página a la que lleva el enlace del correo: /auth/reset?token=...
export function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const validationError =
      validatePassword(password) || validatePasswordConfirmation(password, confirmation);
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    try {
      await resetPassword(token, password);
      setDone(true);
      setTimeout(() => navigate("/auth/sign-in", { replace: true }), 2500);
    } catch (err) {
      setError(err.response?.data?.message || "No se pudo actualizar la contraseña");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="m-8 flex gap-4">
      <div className="w-full lg:w-3/5 mt-24">
        <div className="text-center">
          <Typography variant="h2" className="font-bold mb-4">
            Nueva contraseña
          </Typography>
          <Typography variant="paragraph" color="blue-gray" className="text-lg font-normal">
            Elige una contraseña de 8 a 72 caracteres con al menos una letra y un número.
          </Typography>
        </div>

        {!token ? (
          <div className="mt-8 text-center">
            <Typography color="red" className="text-sm">
              El enlace no es válido. Solicita uno nuevo.
            </Typography>
            <Link to="/auth/forgot" className="text-gray-900 font-medium">
              Solicitar un enlace nuevo
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-8 mb-2 mx-auto w-80 max-w-screen-lg lg:w-1/2">
            <div className="flex flex-col gap-6">
              <Input
                size="lg"
                type="password"
                label="Nueva contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading || done}
              />
              <Input
                size="lg"
                type="password"
                label="Confirmar contraseña"
                value={confirmation}
                onChange={(e) => setConfirmation(e.target.value)}
                disabled={loading || done}
              />
            </div>

            {error && (
              <Typography color="red" className="text-center text-sm mt-2">
                {error}
              </Typography>
            )}
            {done && (
              <Typography color="green" className="text-center text-sm mt-2">
                Contraseña actualizada. Te llevamos al inicio de sesión...
              </Typography>
            )}

            <Button type="submit" className="mt-6" fullWidth disabled={loading || done}>
              {loading ? "Guardando..." : "Cambiar contraseña"}
            </Button>

            {error && (
              <Typography variant="paragraph" className="text-center text-blue-gray-500 font-medium mt-4">
                <Link to="/auth/forgot" className="text-gray-900 ml-1">
                  Solicitar un enlace nuevo
                </Link>
              </Typography>
            )}
          </form>
        )}
      </div>

      <div className="w-2/5 h-full hidden lg:block">
        <img src="/img/pattern.png" className="h-full w-full object-cover rounded-3xl" />
      </div>
    </section>
  );
}

export default ResetPassword;
