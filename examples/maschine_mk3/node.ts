import { promises as fsPromises } from "fs";
import * as path from "path";

import { MaschineMk3 } from "../../lib/maschine_mk3";
import { createNodeHidAdapter, createNodeUsbAdapter } from "../../lib/usb/node";
import { runDemo } from "./runDemo";

fsPromises
  .readFile(path.join(__dirname, "placeholder.jpeg"))
  .then((jpegData) =>
    runDemo(
      new MaschineMk3(createNodeHidAdapter, createNodeUsbAdapter),
      jpegData
    )
  )
  .catch(console.error);
