import { useNavigate } from "react-router-dom";
import {
  Badge,
  Button,
  IconButton,
  Menu,
  MenuHandler,
  MenuItem,
  MenuList,
  Typography,
} from "@material-tailwind/react";
import {
  BellIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  DocumentTextIcon,
  ArchiveBoxXMarkIcon,
  CubeIcon,
} from "@heroicons/react/24/solid";
import useNotifications from "@/hooks/useNotifications";
import { relativeTime } from "@/utils/relativeTime";

const TYPE_META = {
  STOCK_BAJO: { icon: ExclamationTriangleIcon, tone: "bg-amber-50 text-amber-700", path: "/dashboard/alerts" },
  AGOTADO: { icon: ArchiveBoxXMarkIcon, tone: "bg-red-50 text-red-700", path: "/dashboard/products" },
  PRODUCTO_ESTADO: { icon: CubeIcon, tone: "bg-blue-50 text-blue-700", path: "/dashboard/products" },
  DOCUMENTO_GENERADO: { icon: DocumentTextIcon, tone: "bg-blue-gray-50 text-blue-gray-700", path: "/dashboard/documents/dpi" },
};

export function NotificationBell() {
  const navigate = useNavigate();
  const { notifications, markAsRead, markAllAsRead } = useNotifications();
  const count = notifications.length;

  const open = (notification) => {
    markAsRead(notification.notificationId);
    const target = TYPE_META[notification.type]?.path;
    if (target) navigate(target);
  };

  const handler = (
    <IconButton variant="text" color="blue-gray" aria-label="Notificaciones">
      <BellIcon className="h-5 w-5 text-blue-gray-500" />
    </IconButton>
  );

  return (
    <Menu placement="bottom-end">
      <MenuHandler>
        <span className="inline-flex">
          {count > 0 ? (
            <Badge content={count > 9 ? "9+" : count} color="red" overlap="circular">
              {handler}
            </Badge>
          ) : (
            handler
          )}
        </span>
      </MenuHandler>
      <MenuList className="w-[calc(100vw-2rem)] max-w-sm border-0 p-0 sm:w-96">
        <div className="flex items-center justify-between px-4 py-3">
          <Typography variant="h6" color="blue-gray">
            Notificaciones
          </Typography>
          {count > 0 && (
            <Button variant="text" size="sm" className="normal-case" onClick={markAllAsRead}>
              Marcar todas como leídas
            </Button>
          )}
        </div>
        <div className="max-h-96 overflow-y-auto border-t border-blue-gray-50 p-1">
          {count === 0 ? (
            <Typography variant="small" className="px-4 py-6 text-center font-normal text-blue-gray-500">
              Sin notificaciones nuevas
            </Typography>
          ) : (
            notifications.map((notification) => {
              const meta = TYPE_META[notification.type] ?? TYPE_META.DOCUMENTO_GENERADO;
              const Icon = meta.icon;
              return (
                <MenuItem
                  key={notification.notificationId}
                  className="flex items-start gap-3"
                  onClick={() => open(notification)}
                >
                  <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${meta.tone}`}>
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <Typography variant="small" color="blue-gray" className="mb-1 whitespace-normal font-normal">
                      {notification.message}
                    </Typography>
                    <Typography
                      variant="small"
                      color="blue-gray"
                      className="flex items-center gap-1 text-xs font-normal opacity-60"
                    >
                      <ClockIcon className="h-3.5 w-3.5" /> {relativeTime(notification.createdAt)}
                    </Typography>
                  </div>
                </MenuItem>
              );
            })
          )}
        </div>
      </MenuList>
    </Menu>
  );
}

export default NotificationBell;
