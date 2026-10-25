import React, { useState, useEffect } from 'react';
import {
  Card,
  Typography,
  Button,
  Input,
  Select,
  Option,
  Chip,
  IconButton,
  Tooltip,
  Spinner,
} from "@material-tailwind/react";
import { PencilIcon, PlusIcon } from "@heroicons/react/24/outline";
import { userService } from "@/services/userService";
import {
  collectErrors,
  validateEmail,
  validatePassword,
  validatePasswordConfirmation,
  validateRequired,
  validateUserName,
} from "@/utils/validators";

const TABLE_HEAD = ['Nombre', 'Usuario', 'Correo', 'Rol', '2FA', 'Estado', 'Acciones'];

const EMPTY_CREATE_FORM = {
  name: '',
  userName: '',
  email: '',
  password: '',
  confirmPassword: '',
  roleName: 'ROLE_EMPLOYEE',
};

export function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createForm, setCreateForm] = useState(EMPTY_CREATE_FORM);
  const [saving, setSaving] = useState(false);

  const [editingUserId, setEditingUserId] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', email: '', roleName: '' });
  const [createErrors, setCreateErrors] = useState({});
  const [editError, setEditError] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await userService.getAll();
      setUsers(data);
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudieron cargar los usuarios');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    const errors = collectErrors({
      name: validateRequired(createForm.name, 'El nombre'),
      userName: validateUserName(createForm.userName),
      email: validateEmail(createForm.email, { optional: true }),
      password: validatePassword(createForm.password),
      confirmPassword: validatePasswordConfirmation(createForm.password, createForm.confirmPassword),
    });
    setCreateErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSaving(true);
    setError('');
    try {
      const { confirmPassword, ...payload } = createForm;
      await userService.create({ ...payload, email: payload.email.trim() || null });
      setCreateForm(EMPTY_CREATE_FORM);
      setShowCreateForm(false);
      await fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al crear el usuario');
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (user) => {
    setEditingUserId(user.userId);
    setEditForm({ name: user.name, email: user.email || '', roleName: user.roleName });
    setEditError('');
  };

  const handleUpdate = async (userId) => {
    const message =
      validateRequired(editForm.name, 'El nombre') || validateEmail(editForm.email, { optional: true });
    setEditError(message);
    if (message) return;

    setSaving(true);
    setError('');
    try {
      await userService.update(userId, { ...editForm, email: editForm.email.trim() || null });
      setEditingUserId(null);
      await fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al actualizar el usuario');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (user) => {
    try {
      if (user.active) {
        await userService.deactivate(user.userId);
      } else {
        await userService.activate(user.userId);
      }
      await fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al cambiar el estado del usuario');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  return (
    <div className="mt-12">
      <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <Typography variant="h5" color="blue-gray">
            Usuarios
          </Typography>
          <Typography color="gray" className="mt-1 font-normal">
            {users.length} cuentas registradas
          </Typography>
        </div>
        <Button
          color="blue"
          className="flex items-center gap-2 w-fit"
          onClick={() => setShowCreateForm((prev) => !prev)}
        >
          <PlusIcon className="h-4 w-4" />
          Nuevo usuario
        </Button>
      </div>

      {(error || editError) && (
        <Typography variant="small" color="red" className="mb-4">
          {error || editError}
        </Typography>
      )}

      {showCreateForm && (
        <Card className="mb-6 p-6">
          <Typography variant="h6" color="blue-gray" className="mb-4">
            Nuevo usuario
          </Typography>
          <form noValidate onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Input
                label="Nombre completo"
                aria-label="Nombre completo"
                value={createForm.name}
                onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                error={Boolean(createErrors.name)}
              />
              <Input
                label="Nombre de usuario"
                aria-label="Nombre de usuario"
                value={createForm.userName}
                onChange={(e) => setCreateForm({ ...createForm, userName: e.target.value })}
                error={Boolean(createErrors.userName)}
              />
              <Input
                label="Correo (opcional; activa la verificación en dos pasos)"
                aria-label="Correo (opcional; activa la verificación en dos pasos)"
                type="email"
                value={createForm.email}
                onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                error={Boolean(createErrors.email)}
              />
              <Input
                label="Contraseña"
                aria-label="Contraseña"
                type="password"
                value={createForm.password}
                onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                error={Boolean(createErrors.password)}
              />
              <Input
                label="Confirmar contraseña"
                aria-label="Confirmar contraseña"
                type="password"
                value={createForm.confirmPassword}
                onChange={(e) => setCreateForm({ ...createForm, confirmPassword: e.target.value })}
                error={Boolean(createErrors.confirmPassword)}
              />
              <Select
                label="Rol"
                value={createForm.roleName}
                onChange={(value) => setCreateForm({ ...createForm, roleName: value })}
              >
                <Option value="ROLE_EMPLOYEE">Encargado</Option>
                <Option value="ROLE_ADMIN">Administrador</Option>
              </Select>
            </div>
            {Object.values(createErrors).map((message) => (
              <Typography key={message} variant="small" color="red">
                {message}
              </Typography>
            ))}
            <div className="flex justify-end gap-4">
              <Button type="button" variant="text" color="blue-gray" onClick={() => setShowCreateForm(false)}>
                Cancelar
              </Button>
              <Button type="submit" color="green" disabled={saving}>
                {saving ? 'Guardando...' : 'Crear usuario'}
              </Button>
            </div>
          </form>
        </Card>
      )}

      <Card className="h-full w-full overflow-scroll p-6">
        <table className="w-full min-w-max table-auto">
          <thead>
            <tr>
              {TABLE_HEAD.map((head) => (
                <th key={head} className="border-b border-blue-gray-100 bg-blue-gray-50 p-4">
                  <Typography variant="small" color="blue-gray" className="font-bold">
                    {head}
                  </Typography>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map((user) => {
              const isEditing = editingUserId === user.userId;
              return (
                <tr key={user.userId}>
                  <td className="p-4">
                    {isEditing ? (
                      <Input
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      />
                    ) : (
                      <Typography variant="small" color="blue-gray" className="font-semibold">
                        {user.name}
                      </Typography>
                    )}
                  </td>
                  <td className="p-4">
                    <Typography variant="small" color="blue-gray">
                      {user.userName}
                    </Typography>
                  </td>
                  <td className="p-4">
                    {isEditing ? (
                      <Input
                        type="email"
                        value={editForm.email}
                        onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                        error={Boolean(editError)}
                      />
                    ) : (
                      <Typography variant="small" color="blue-gray">
                        {user.email || '—'}
                      </Typography>
                    )}
                  </td>
                  <td className="p-4">
                    {isEditing ? (
                      <Select
                        value={editForm.roleName}
                        onChange={(value) => setEditForm({ ...editForm, roleName: value })}
                      >
                        <Option value="ROLE_EMPLOYEE">Encargado</Option>
                        <Option value="ROLE_ADMIN">Administrador</Option>
                      </Select>
                    ) : (
                      <Typography variant="small" color="blue-gray">
                        {user.roleName === 'ROLE_ADMIN' ? 'Administrador' : 'Encargado'}
                      </Typography>
                    )}
                  </td>
                  <td className="p-4">
                    <Chip
                      value={user.twoFactorEnabled ? 'Activa' : 'No'}
                      color={user.twoFactorEnabled ? 'green' : 'blue-gray'}
                      size="sm"
                      variant="ghost"
                      className="w-fit"
                    />
                  </td>
                  <td className="p-4">
                    <Chip
                      value={user.active ? 'Activo' : 'Desactivado'}
                      color={user.active ? 'green' : 'red'}
                      size="sm"
                      className="w-fit"
                    />
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      {isEditing ? (
                        <>
                          <Button size="sm" color="green" onClick={() => handleUpdate(user.userId)} disabled={saving}>
                            Guardar
                          </Button>
                          <Button size="sm" variant="text" color="blue-gray" onClick={() => setEditingUserId(null)}>
                            Cancelar
                          </Button>
                        </>
                      ) : (
                        <>
                          <Tooltip content="Editar">
                            <IconButton variant="text" color="blue-gray" onClick={() => startEdit(user)}>
                              <PencilIcon className="h-4 w-4" />
                            </IconButton>
                          </Tooltip>
                          <Button
                            size="sm"
                            variant="outlined"
                            color={user.active ? 'red' : 'green'}
                            onClick={() => toggleActive(user)}
                          >
                            {user.active ? 'Desactivar' : 'Activar'}
                          </Button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

export default Users;
