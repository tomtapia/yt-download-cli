import { Script, createContext } from "node:vm";
import { Platform } from "youtubei.js";

type BuildScriptResult = {
  output: string;
};

type EvalEnvironment = Record<string, string | number | boolean | null | undefined>;
type EvalResult = Record<string, unknown> | void;

let evaluatorInstalled = false;

export function ensureYouTubeJsEvaluator(): void {
  if (evaluatorInstalled) {
    return;
  }

  Platform.load({
    ...Platform.shim,
    eval: (data: BuildScriptResult, env: EvalEnvironment) => evaluatePlayerScript(data, env)
  });

  evaluatorInstalled = true;
}

function evaluatePlayerScript(data: BuildScriptResult, env: EvalEnvironment): EvalResult {
  const sandbox = {
    URL,
    URLSearchParams,
    console,
    globalThis: undefined as unknown,
    self: undefined as unknown,
    window: undefined as unknown,
    global: undefined as unknown,
    atob,
    btoa,
    encodeURIComponent,
    decodeURIComponent,
    ...env
  };

  sandbox.globalThis = sandbox;
  sandbox.self = sandbox;
  sandbox.window = sandbox;
  sandbox.global = sandbox;

  const context = createContext(sandbox);
  const wrappedSource = `(function () {\n${data.output}\n})()`;
  const script = new Script(wrappedSource, {
    filename: "youtubei-player-eval.js"
  });

  return script.runInContext(context, {
    timeout: 1000
  });
}
