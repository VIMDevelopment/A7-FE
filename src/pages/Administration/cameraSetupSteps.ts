export type CameraSetupStep = {
  id: number;
  section: "naming" | "ftp";
  description: string;
  imagePath: string;
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
    cameraId: cameraId || "XXXX",
    ftpUsername: ftpUsername || "username",
    ftpPassword: ftpPassword || "password",
    ftpServerIp: ftpServerIp || "0.0.0.0",
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
    // {
    //   id: 6,
    //   section: "ftp",
    //   description:
    //     'Задайте для параметров Wi-Fi значение "Вкл." в настройках камеры.',
    //   imagePath: "/images/instructions/canon-r6/ftp-step-1.jpg",
    // },
    // {
    //   id: 7,
    //   section: "ftp",
    //   description:
    //     'Выберите "Беспроводные функции: Подключение Wi-Fi/Bluetooth" в меню.',
    //   imagePath: "/images/instructions/canon-r6/ftp-step-2.jpg",
    // },
    // {
    //   id: 8,
    //   section: "ftp",
    //   description:
    //     'Выберите "Передача изображений на сервер FTP" или "Передать изобр. на FTP-сервер".',
    //   imagePath: "/images/instructions/canon-r6/ftp-step-3.jpg",
    // },
    // {
    //   id: 9,
    //   section: "ftp",
    //   description:
    //     'Выберите "Добавить уст-во для подключения" для создания нового подключения.',
    //   imagePath: "/images/instructions/canon-r6/ftp-step-4.jpg",
    // },
    // {
    //   id: 10,
    //   section: "ftp",
    //   description:
    //     'Выберите "Метод настройки". Рекомендуется выбрать "Настройка онлайн" для автоматической настройки соединения.',
    //   imagePath: "/images/instructions/canon-r6/ftp-step-5.jpg",
    // },
    // {
    //   id: 11,
    //   section: "ftp",
    //   description:
    //     'Выберите "Автоматически, WPS", затем "WPS-PBC". Нажмите кнопку WPS на точке доступа для подключения.',
    //   imagePath: "/images/instructions/canon-r6/ftp-step-6.jpg",
    // },
    // {
    //   id: 12,
    //   section: "ftp",
    //   description:
    //     'Настройте IP-адрес камеры. Обычно используется автоматическое получение (DHCP).',
    //   imagePath: "/images/instructions/canon-r6/ftp-step-7.jpg",
    // },
    // {
    //   id: 13,
    //   section: "ftp",
    //   description:
    //     'Настройте IPv6. Для большинства случаев можно выбрать "Откл." если IPv6 не используется.',
    //   imagePath: "/images/instructions/canon-r6/ftp-step-8.jpg",
    // },
    // {
    //   id: 14,
    //   section: "ftp",
    //   description:
    //     'Выберите режим FTP. Рекомендуется "FTP" для стандартного подключения или "FTPS" для защищенного.',
    //   imagePath: "/images/instructions/canon-r6/ftp-step-9.jpg",
    // },
    // {
    //   id: 15,
    //   section: "ftp",
    //   description:
    //     'Выберите "Настройка адреса сервера FTP" для ввода параметров сервера.',
    //   imagePath: "/images/instructions/canon-r6/ftp-step-10.jpg",
    // },
    // {
    //   id: 16,
    //   section: "ftp",
    //   description: `Введите IP-адрес FTP-сервера: ${dynamicValues.ftpServerIp}\n\nЭто адрес сервера, на который будут передаваться фотографии.`,
    //   imagePath: "/images/instructions/canon-r6/ftp-step-11.jpg",
    //   dynamicValues: { ftpServerIp: dynamicValues.ftpServerIp },
    // },
    // {
    //   id: 17,
    //   section: "ftp",
    //   description:
    //     'Настройте номер порта. Обычно используется порт 21 для FTP или 990 для FTPS.',
    //   imagePath: "/images/instructions/canon-r6/ftp-step-12.jpg",
    // },
    // {
    //   id: 18,
    //   section: "ftp",
    //   description: `Введите имя пользователя FTP: ${dynamicValues.ftpUsername}\n\nЭто имя пользователя для доступа к FTP-серверу.`,
    //   imagePath: "/images/instructions/canon-r6/ftp-step-13.jpg",
    //   dynamicValues: { ftpUsername: dynamicValues.ftpUsername },
    // },
    // {
    //   id: 19,
    //   section: "ftp",
    //   description: `Введите пароль FTP: ${dynamicValues.ftpPassword}\n\nЭто пароль для доступа к FTP-серверу. Будьте внимательны при вводе.`,
    //   imagePath: "/images/instructions/canon-r6/ftp-step-14.jpg",
    //   dynamicValues: { ftpPassword: dynamicValues.ftpPassword },
    // },
    // {
    //   id: 20,
    //   section: "ftp",
    //   description:
    //     'Настройте папку назначения на FTP-сервере, куда будут сохраняться изображения. Обычно это корневая папка или указанная в настройках сервера.',
    //   imagePath: "/images/instructions/canon-r6/ftp-step-15.jpg",
    // },
    // {
    //   id: 21,
    //   section: "ftp",
    //   description:
    //     'Настройте дополнительные параметры передачи: автоматическая передача, энергосбережение и другие опции по необходимости.',
    //   imagePath: "/images/instructions/canon-r6/ftp-step-16.jpg",
    // },
  ];
};

