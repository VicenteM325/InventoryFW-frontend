import { useState } from "react";
import PropTypes from "prop-types";
import { Card, CardBody, Typography, Button, Input, Chip } from "@material-tailwind/react";
import { accountService } from "@/services/accountService";
import {
  collectErrors,
  validateCode,
  validateEmail,
  validatePassword,
  validatePasswordConfirmation,
  validateRequired,
} from "@/utils/validators";

function Feedback({ error, success }) {
  if (error) {
    return (
      <Typography variant="small" color="red" className="mt-2">
        {error}
      </Typography>
    );
  }
  if (success) {
    return (
      <Typography variant="small" color="green" className="mt-2">
        {success}
      </Typography>
    );
  }
  return null;
}

Feedback.propTypes = { error: PropTypes.string, success: PropTypes.string };

const messageOf = (err, fallback) => err.response?.data?.message || fallback;

// Seguridad de la cuenta propia: correo, verificación en dos pasos y contraseña.
// Todas las acciones sensibles piden la contraseña actual.
export function SecuritySettings({ email, twoFactorEnabled, onChanged }) {
  const [emailForm, setEmailForm] = useState({ email: email || "", currentPassword: "" });
  const [emailFeedback, setEmailFeedback] = useState({});

  const [codeSent, setCodeSent] = useState(false);
  const [code, setCode] = useState("");
  const [disablePassword, setDisablePassword] = useState("");
  const [twoFactorFeedback, setTwoFactorFeedback] = useState({});

  const [passwordForm, setPasswordForm] = useState({ current: "", next: "", confirm: "" });
  const [passwordFeedback, setPasswordFeedback] = useState({});

  const [busy, setBusy] = useState(false);

  const run = async (action, setFeedback, fallback) => {
    setBusy(true);
    setFeedback({});
    try {
      const success = await action();
      setFeedback({ success });
    } catch (err) {
      setFeedback({ error: messageOf(err, fallback) });
    } finally {
      setBusy(false);
    }
  };

  const handleEmail = (e) => {
    e.preventDefault();
    const error =
      validateEmail(emailForm.email) || validateRequired(emailForm.currentPassword, "La contraseña actual");
    if (error) return setEmailFeedback({ error });

    run(async () => {
      await accountService.updateEmail(emailForm.email.trim(), emailForm.currentPassword);
      setEmailForm((f) => ({ ...f, currentPassword: "" }));
      setCodeSent(false);
      await onChanged();
      return "Correo actualizado. Si tenías la verificación en dos pasos, vuelve a activarla.";
    }, setEmailFeedback, "No se pudo actualizar el correo");
  };

  const handleRequestCode = () =>
    run(async () => {
      const data = await accountService.requestEnableTwoFactor();
      setCodeSent(true);
      return data.message;
    }, setTwoFactorFeedback, "No se pudo enviar el código");

  const handleConfirm = (e) => {
    e.preventDefault();
    const error = validateCode(code);
    if (error) return setTwoFactorFeedback({ error });

    run(async () => {
      await accountService.confirmEnableTwoFactor(code.trim());
      setCode("");
      setCodeSent(false);
      await onChanged();
      return "Verificación en dos pasos activada";
    }, setTwoFactorFeedback, "No se pudo activar la verificación en dos pasos");
  };

  const handleDisable = (e) => {
    e.preventDefault();
    const error = validateRequired(disablePassword, "La contraseña actual");
    if (error) return setTwoFactorFeedback({ error });

    run(async () => {
      await accountService.disableTwoFactor(disablePassword);
      setDisablePassword("");
      await onChanged();
      return "Verificación en dos pasos desactivada";
    }, setTwoFactorFeedback, "No se pudo desactivar la verificación en dos pasos");
  };

  const handlePassword = (e) => {
    e.preventDefault();
    const errors = collectErrors({
      current: validateRequired(passwordForm.current, "La contraseña actual"),
      next: validatePassword(passwordForm.next),
      confirm: validatePasswordConfirmation(passwordForm.next, passwordForm.confirm),
    });
    const firstError = Object.values(errors)[0];
    if (firstError) return setPasswordFeedback({ error: firstError });

    run(async () => {
      await accountService.changePassword(passwordForm.current, passwordForm.next);
      setPasswordForm({ current: "", next: "", confirm: "" });
      return "Contraseña actualizada";
    }, setPasswordFeedback, "No se pudo cambiar la contraseña");
  };

  return (
    <Card className="border border-blue-gray-100 shadow-none">
      <CardBody className="p-4 space-y-8">
        <Typography variant="h6" color="blue-gray">
          Seguridad de la cuenta
        </Typography>

        <form noValidate onSubmit={handleEmail} className="space-y-3">
          <Typography variant="small" className="font-semibold text-blue-gray-700">
            Correo electrónico
          </Typography>
          <Input
            label="Correo"
            aria-label="Correo"
            type="email"
            value={emailForm.email}
            onChange={(e) => setEmailForm({ ...emailForm, email: e.target.value })}
          />
          <Input
            label="Contraseña actual"
            aria-label="Contraseña actual"
            type="password"
            value={emailForm.currentPassword}
            onChange={(e) => setEmailForm({ ...emailForm, currentPassword: e.target.value })}
          />
          <Button type="submit" size="sm" disabled={busy}>
            Guardar correo
          </Button>
          <Feedback {...emailFeedback} />
        </form>

        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Typography variant="small" className="font-semibold text-blue-gray-700">
              Verificación en dos pasos
            </Typography>
            <Chip
              size="sm"
              variant="ghost"
              value={twoFactorEnabled ? "Activa" : "Desactivada"}
              color={twoFactorEnabled ? "green" : "blue-gray"}
            />
          </div>

          {twoFactorEnabled ? (
            <form noValidate onSubmit={handleDisable} className="space-y-3">
              <Typography variant="small" className="text-blue-gray-500">
                Al iniciar sesión se pedirá un código enviado a {email}.
              </Typography>
              <Input
                label="Contraseña actual"
                aria-label="Contraseña actual"
                type="password"
                value={disablePassword}
                onChange={(e) => setDisablePassword(e.target.value)}
              />
              <Button type="submit" size="sm" color="red" variant="outlined" disabled={busy}>
                Desactivar
              </Button>
            </form>
          ) : codeSent ? (
            <form noValidate onSubmit={handleConfirm} className="space-y-3">
              <Input
                label="Código recibido por correo"
                aria-label="Código recibido por correo"
                inputMode="numeric"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              />
              <div className="flex gap-2">
                <Button type="submit" size="sm" color="green" disabled={busy}>
                  Confirmar y activar
                </Button>
                <Button type="button" size="sm" variant="text" onClick={handleRequestCode} disabled={busy}>
                  Reenviar código
                </Button>
              </div>
            </form>
          ) : (
            <>
              <Typography variant="small" className="text-blue-gray-500">
                {email
                  ? `Te enviaremos un código a ${email} para confirmar la activación.`
                  : "Registra primero tu correo electrónico."}
              </Typography>
              <Button size="sm" onClick={handleRequestCode} disabled={busy || !email}>
                Activar
              </Button>
            </>
          )}
          <Feedback {...twoFactorFeedback} />
        </div>

        <form noValidate onSubmit={handlePassword} className="space-y-3">
          <Typography variant="small" className="font-semibold text-blue-gray-700">
            Cambiar contraseña
          </Typography>
          <Input
            label="Contraseña actual"
            aria-label="Contraseña actual"
            type="password"
            value={passwordForm.current}
            onChange={(e) => setPasswordForm({ ...passwordForm, current: e.target.value })}
          />
          <Input
            label="Nueva contraseña"
            aria-label="Nueva contraseña"
            type="password"
            value={passwordForm.next}
            onChange={(e) => setPasswordForm({ ...passwordForm, next: e.target.value })}
          />
          <Input
            label="Confirmar nueva contraseña"
            aria-label="Confirmar nueva contraseña"
            type="password"
            value={passwordForm.confirm}
            onChange={(e) => setPasswordForm({ ...passwordForm, confirm: e.target.value })}
          />
          <Button type="submit" size="sm" disabled={busy}>
            Cambiar contraseña
          </Button>
          <Feedback {...passwordFeedback} />
        </form>
      </CardBody>
    </Card>
  );
}

SecuritySettings.propTypes = {
  email: PropTypes.string,
  twoFactorEnabled: PropTypes.bool,
  onChanged: PropTypes.func.isRequired,
};

export default SecuritySettings;
