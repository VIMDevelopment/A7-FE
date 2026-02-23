export type CameraSetupStep = {
  id: number;
  section: "naming" | "ftp";
  description: string;
  imagePath?: string;
  dynamicValues?: {
    cameraId?: string;
    ftpUsername?: string;
    ftpPassword?: string;
    ftpServerIp?: string;
  };
};

export const getCameraSetupSteps = (
  cameraId?: string,
  ftpUsername?: string,
  ftpPassword?: string,
  ftpServerIp?: string
): CameraSetupStep[] => {
  const dynamicValues = {
    cameraId: cameraId || "",
    ftpUsername: ftpUsername || "",
    ftpPassword: ftpPassword || "",
    ftpServerIp: ftpServerIp || "",
  };

  return [
    // Часть 1: Настройка именования файлов
    {
      id: 1,
      section: "naming",
      description:
        'Нажмите кнопку MENU на фотоаппарате, затем выберите пункт "Настройка: Имя файла".',
      imagePath: "/images/instructions/canon-r6/naming-step-1.jpg",
    },
    {
      id: 2,
      section: "naming",
      description:
        'Выберите пункт "Изменить Пользоват. настройки 1" для настройки префикса имени файла.',
      imagePath: "/images/instructions/canon-r6/naming-step-2.jpg",
    },
    {
      id: 3,
      section: "naming",
      description: `Введите префикс для имен файлов: ${dynamicValues.cameraId}\n\nИспользуйте диск быстрого управления или джойстик для выбора символов, затем нажмите SET для ввода. Введите ровно 4 символа.\n\nНажмите кнопку MENU, затем нажмите "OK" для сохранения настроек.`,
      imagePath: "/images/instructions/canon-r6/naming-step-3.jpg",
      dynamicValues: { cameraId: dynamicValues.cameraId },
    },
    {
      id: 4,
      section: "naming",
      description:
        'Вернитесь в пункт "Имя файла" и выберите зарегистрированное имя файла (Польз. настр.1).',
      imagePath: "/images/instructions/canon-r6/naming-step-5.jpg",
    },
    // Часть 2: Настройка FTP подключения
    {
      id: 5,
      section: "ftp",
      description:
        'Задайте для параметров Wi-Fi значение "Вкл." в настройках камеры.',
      imagePath: "/images/instructions/canon-r6/ftp-step-1.jpg",
    },
    {
      id: 6,
      section: "ftp",
      description:
        'Выберите "Беспроводные функции: Подключение Wi-Fi/Bluetooth" в меню.',
      imagePath: "/images/instructions/canon-r6/ftp-step-2.jpg",
    },
    {
      id: 7,
      section: "ftp",
      description:
        'Выберите "Передать изобр. на FTP-сервер".',
      imagePath: "/images/instructions/canon-r6/ftp-step-3.jpg",
    },
    {
      id: 8,
      section: "ftp",
      description:
        'Выберите "Добавить уст-во для подключения" для создания нового подключения.',
      imagePath: "/images/instructions/canon-r6/ftp-step-4.jpg",
    },
    {
      id: 9,
      section: "ftp",
      description:
        'Выберите "Метод настройки". Рекомендуется выбрать "Настройка онлайн" для автоматической настройки соединения.\n\nВыберите нужную Wi-Fi сеть и подключите её, введя пароль.',
      imagePath: "/images/instructions/canon-r6/ftp-step-5.jpg",
    },
    {
      id: 10,
      section: "ftp",
      description:
        'Если у вас появился этот экран, выберите "Автоматический выбор"',
      imagePath: "/images/instructions/canon-r6/ftp-step-7.jpg",
    },
    {
      id: 11,
      section: "ftp",
      description:
        'Если у вас появился этот экран, выберите "Откл."',
      imagePath: "/images/instructions/canon-r6/ftp-step-8.jpg",
    },
    {
      id: 12,
      section: "ftp",
      description:
        'Выберите режим FTP.',
      imagePath: "/images/instructions/canon-r6/ftp-step-9.jpg",
    },
    {
      id: 13,
      section: "ftp",
      description:
        'Выберите "Настройка адреса" для ввода параметров сервера.',
      imagePath: "/images/instructions/canon-r6/ftp-step-10.jpg",
    },
    {
      id: 14,
      section: "ftp",
      description: `Введите IP-адрес FTP-сервера: ${dynamicValues.ftpServerIp}`,
      imagePath: "/images/instructions/canon-r6/ftp-step-11.jpg",
      dynamicValues: { ftpServerIp: dynamicValues.ftpServerIp },
    },
    {
      id: 15,
      section: "ftp",
      description:
        'Выберите "Номер порта". Введите номер порта: 02121.\n\nНажмите ОК',
      imagePath: "/images/instructions/canon-r6/ftp-step-12.jpg",
    },
    {
      id: 16,
      section: "ftp",
      description:
        'Выберите пассивный режим "Вкл."',
      imagePath: "/images/instructions/canon-r6/ftp-step-13.jpg",
    },
    {
      id: 17,
      section: "ftp",
      description:
        'В настройке прокси-сервера выберите значение "Откл." и нажмите ОК',
      imagePath: "/images/instructions/canon-r6/ftp-step-14.jpg",
    },
    {
      id: 18,
      section: "ftp",
      description:
        `В настройке способа аутентификации выберите значение "Пароль", нажмите ОК\n\nВведите имя пользователя: ${dynamicValues.ftpUsername}\n\nВведите пароль: ${dynamicValues.ftpPassword}`,
      imagePath: "/images/instructions/canon-r6/ftp-step-15.jpg",
    },
    {
      id: 19,
      section: "ftp",
      description:
        'Настройте папку назначения на FTP-сервере, куда будут сохраняться изображения. Выберите "Корневой каталог".',
      imagePath: "/images/instructions/canon-r6/ftp-step-16.jpg",
    },

    {
      id: 20,
      section: "ftp",
      description:
        'Если всё было указано верно, камера должна подключиться к FTP-серверу. Теперь можно делать фотографии и они будут автоматически появляться в папке сегодняшнего дня -> AUTO.',
      imagePath: "/images/instructions/canon-r6/ftp-step-17.jpg",
    },
  ];
};

