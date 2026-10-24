import { useState } from "react";
import { Link } from "react-router-dom";
import { Input, Button, Typography } from "@material-tailwind/react";
import { forgotPassword } from "@/services/authService";
import { validateEmail } from "@/utils/validators";

export function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    const validationError = validateEmail(email);
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    try {
      const data = await forgotPassword(email.trim());
      setMessage(data.message);
    } catch (err) {
      setError(err.response?.data?.message || "No se pudo procesar la solicitud");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="m-8 flex gap-4">
      <div className="w-full lg:w-3/5 mt-24">
        <div className="text-center">
          <Typography variant="h2" className="font-bold mb-4">
            Recuperar contraseña
          </Typography>
          <Typography variant="paragraph" color="blue-gray" className="text-lg font-normal">
            Escribe el correo de tu cuenta y te enviaremos un enlace para crear una nueva contraseña.
          </Typography>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 mb-2 mx-auto w-80 max-w-screen-lg lg:w-1/2">
          <Input
            size="lg"
            type="email"
            label="Correo electrónico"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading || Boolean(message)}
            error={Boolean(error)}
          />

          {error && (
            <Typography color="red" className="text-center text-sm mt-2">
              {error}
            </Typography>
          )}
          {message && (
            <Typography color="green" className="text-center text-sm mt-2">
              {message}
            </Typography>
          )}

          <Button type="submit" className="mt-6" fullWidth disabled={loading || Boolean(message)}>
            {loading ? "Enviando..." : "Enviar enlace"}
          </Button>

          <Typography variant="paragraph" className="text-center text-blue-gray-500 font-medium mt-4">
            <Link to="/auth/sign-in" className="text-gray-900 ml-1">
              Volver a iniciar sesión
            </Link>
          </Typography>
        </form>
      </div>

      <div className="w-2/5 h-full hidden lg:block">
        <img src="/img/pattern.png" className="h-full w-full object-cover rounded-3xl" />
      </div>
    </section>
  );
}

export default ForgotPassword;
