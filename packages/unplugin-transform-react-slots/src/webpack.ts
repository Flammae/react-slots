import unplugin from ".";
import { Options } from "./core/options";

/*
If no type assertion is used tsup throws:

The inferred type of 'default' cannot be named without a reference to
'.pnpm/webpack@5.89.0_esbuild@0.19.3/node_modules/webpack'.
This is likely not portable. A type annotation is necessary.
*/
export default unplugin.webpack as (options: Options) => any;
