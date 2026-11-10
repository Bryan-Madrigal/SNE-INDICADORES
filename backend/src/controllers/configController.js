const fs = require('fs');
const path = require('path');

const configFilePath = path.join(__dirname, '../../config.json');

// Default config si el archivo no existe
const defaultConfig = {
  appName: "Indicadores SNE",
  dependencyName: "Secretaría de Economía y del Trabajo",
  logo1: "", // Base64
  logo2: "",  // Base64
  fontFamily: "Patria",
  titleFontSize: "text-2xl",
  bodyFontSize: "text-base"
};

const getConfig = (req, res) => {
  try {
    if (!fs.existsSync(configFilePath)) {
      fs.writeFileSync(configFilePath, JSON.stringify(defaultConfig, null, 2));
      return res.json(defaultConfig);
    }
    const rawData = fs.readFileSync(configFilePath);
    const config = JSON.parse(rawData);
    res.json(config);
  } catch (error) {
    console.error("Error al leer la configuración:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};

const updateConfig = (req, res) => {
  try {
    const { appName, dependencyName, logo1, logo2, fontFamily, titleFontSize, bodyFontSize } = req.body;
    
    // Leer actual
    let currentConfig = defaultConfig;
    if (fs.existsSync(configFilePath)) {
      currentConfig = JSON.parse(fs.readFileSync(configFilePath));
    }

    // Actualizar campos
    currentConfig.appName = appName || currentConfig.appName;
    currentConfig.dependencyName = dependencyName || currentConfig.dependencyName;
    if (logo1 !== undefined) currentConfig.logo1 = logo1; 
    if (logo2 !== undefined) currentConfig.logo2 = logo2;
    if (fontFamily !== undefined) currentConfig.fontFamily = fontFamily;
    if (titleFontSize !== undefined) currentConfig.titleFontSize = titleFontSize;
    if (bodyFontSize !== undefined) currentConfig.bodyFontSize = bodyFontSize;

    fs.writeFileSync(configFilePath, JSON.stringify(currentConfig, null, 2));
    res.json({ message: "Configuración actualizada correctamente", config: currentConfig });
  } catch (error) {
    console.error("Error al guardar la configuración:", error);
    res.status(500).json({ message: "Error interno al guardar" });
  }
};

module.exports = {
  getConfig,
  updateConfig
};