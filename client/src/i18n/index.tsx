import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import translations from "./index";

const savedLang = localStorage.getItem("language") || "es";

i18n
  .use(initReactI18next)
  .init({
    resources: {
      es: { translation: translations.es },
      en: { translation: translations.en },
    },
    lng: savedLang,
    fallbackLng: "es",
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;