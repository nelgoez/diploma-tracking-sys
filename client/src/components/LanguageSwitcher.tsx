import { useState } from "react";
import { Button, Menu, MenuItem } from "@mui/material";
import { useTranslation } from "react-i18next";
import { setLanguage, getAvailableLanguages, type Language } from "../i18n";

export function LanguageSwitcher() {
  const { i18n, t } = useTranslation();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const languages = getAvailableLanguages();

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang);
    i18n.changeLanguage(lang);
    handleClose();
  };

  return (
    <div style={{ position: "fixed", top: 16, right: 16, zIndex: 9999 }}>
      <Button
        onClick={handleClick}
        variant="outlined"
        size="small"
        sx={{ textTransform: "none" }}
      >
        {t("language.switch")}: {i18n.language.toUpperCase()}
      </Button>
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleClose}>
        {languages.map((lang) => (
          <MenuItem
            key={lang.code}
            onClick={() => handleLanguageChange(lang.code)}
            selected={i18n.language === lang.code}
          >
            {lang.name}
          </MenuItem>
        ))}
      </Menu>
    </div>
  );
}