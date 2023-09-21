import unplugin from ".";
import { Options } from "./core/options";

// If no type assertion is used tsup throws:
// The type of this expression cannot be named without a 'resolution-mode' assertion,
// which is an unstable feature.s
export default unplugin.vite as (options: Options) => any;
