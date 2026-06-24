/**
 * Config plugin local para que WatermelonDB compile en Android (modo bridge, sin JSI).
 *
 * El autolinking de Expo ya hace casi todo solo: incluye el módulo gradle
 * (`:nozbe_watermelondb`) Y registra el `WatermelonDBPackage` en el PackageList
 * generado. Por eso NO hay que registrar el paquete a mano (sería un duplicado y
 * crashearía con "tried to override existing native module").
 *
 * Lo único que falta es que el build.gradle del módulo
 * (@nozbe/watermelondb/native/android) pueda resolver las versiones de
 * kotlin/SDK: las lee de `rootProject.ext`, pero Expo SDK 56 usa version catalogs
 * en lugar de `ext`. Sin esto el módulo cae a sus defaults antiguos
 * (kotlin 1.3.50, compileSdk 31) y la compilación falla.
 *
 * Nota: el plugin de la comunidad (@morrowdigital/watermelondb-expo-plugin) no
 * sirve acá porque cablea JSI contra la estructura vieja de MainApplication
 * (getJSIModulePackage), que ya no existe en la arquitectura bridgeless de RN 0.85.
 */
const { withProjectBuildGradle } = require('@expo/config-plugins');

const ROOT_EXT_MARKER = 'ReactNativeWatermelonDB versions';
const ROOT_EXT_SNIPPET = `
// ${ROOT_EXT_MARKER}
ext {
    kotlinVersion = "2.1.20"
    buildToolsVersion = "36.0.0"
    compileSdkVersion = 36
    minSdkVersion = 24
    targetSdkVersion = 36
}
`;

function withWatermelonRootExt(config) {
  return withProjectBuildGradle(config, (cfg) => {
    if (!cfg.modResults.contents.includes(ROOT_EXT_MARKER)) {
      cfg.modResults.contents += ROOT_EXT_SNIPPET;
    }
    return cfg;
  });
}

module.exports = function withWatermelondb(config) {
  return withWatermelonRootExt(config);
};
