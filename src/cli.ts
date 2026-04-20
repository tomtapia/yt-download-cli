#!/usr/bin/env node

import { runCli } from "./app";

void runCli(process.argv).then((exitCode) => {
  process.exitCode = exitCode;
});
