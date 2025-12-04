import devConfig from "./development";
import prodConfig from "./production";

let config: any;

switch (process.env.NODE_ENV) {
    case "development":
        config = devConfig;
        break;
    case "production":
        config = prodConfig
        break;
    default:
        config = devConfig;
}
export default config;