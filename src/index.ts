import variant from "@jitl/quickjs-singlefile-browser-release-sync";
import { newQuickJSWASMModuleFromVariant } from "quickjs-emscripten-core";
import {
  newQuickJSWASMModule,
  DEBUG_SYNC,
  RELEASE_SYNC,
  ContextEvalOptions,
  VmCallResult,
  QuickJSHandle,
  QuickJSContext,
  DEBUG_ASYNC,
  newQuickJSAsyncWASMModule,
  RELEASE_ASYNC,
} from "quickjs-emscripten";

import { Arena } from "quickjs-emscripten-sync";

declare global {
  interface Window {
    executeAction: (trigger: unknown) => void;
    evalCode: (code: string) => void;
    ctx: QuickJSContext;
  }
}

(async function () {
  //const QuickJS = await newQuickJSAsyncWASMModule(variant);
  // const QuickJS = await newQuickJSWASMModule(RELEASE_SYNC);
  const QuickJS = await newQuickJSWASMModuleFromVariant(variant);
  const ctx = QuickJS.newContext();

  window.ctx = ctx;

  const arena = new Arena(ctx, { isMarshalable: true });

  arena.expose({
    console: {
      log: console.log,
    },
  });

  const wrapper = (script: string) => {
    return `(function(triggers) {
      (function(triggers, studio) {
        (function(triggers, studio, globalThis) { 
          "use strict"
          ${script}
        })(triggers, studio, {});
      })(triggers, studio);
    })`;
  };

  const generateVariables = (numVars: number) => {
    const variables = [];
    for (let i = 1; i <= numVars; i++) {
      variables.push({
        id: i,
        name: `Variable ${i}`,
        value: generateRandomText(),
      });
    }
    return variables;
  };

  const generateFrames = (numFrames: number) => {
    const frames = [];
    for (let i = 1; i <= numFrames; i++) {
      frames.push({
        id: i,
        name: `Frame ${i}`,
        x: getRandomNumber(-50, 50), // Random number between -50 and 50 for x
        y: getRandomNumber(-50, 50), // Random number between -50 and 50 for y
        width: getRandomNumber(80, 200), // Random number between 80 and 200 for width
        height: getRandomNumber(100, 250), // Random number between 100 and 250 for height
      });
    }
    return frames;
  };

  const getRandomNumber = (min: number, max: number) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  };

  const generateRandomText = () => {
    const characters =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let randomText = "";
    const textLength = getRandomNumber(5, 15); // Adjust the range for text length as needed
    for (let i = 0; i < textLength; i++) {
      randomText += characters.charAt(
        Math.floor(Math.random() * characters.length)
      );
    }
    return randomText;
  };

  let frames = generateFrames(10);
  let variables = generateVariables(10);

  const getVariable = (id: number) => {
    return variables.find((variable) => variable.id === id);
  };

  const getFrame = (id: number) => {
    return frames.find((frame) => frame.id === id);
  };

  const setFrame = (
    id: number,
    key: "x" | "y" | "width" | "height",
    value: any
  ) => {
    console.log(`setting Frame ${id} ${key} to ${value}`);
    const frame = getFrame(id);
    if (frame) {
      frame[key] = value;
    }
  };

  let studio = {
    frames: {
      get: () => frames,
      byId: (id: number) => getFrame(id),
      setX: (id: number, x: number) => setFrame(id, "x", x),
      setY: (id: number, x: number) => setFrame(id, "y", x),
      setWidth: (id: number, x: number) => setFrame(id, "width", x),
      setHeight: (id: number, x: number) => setFrame(id, "height", x),
    },
    variables: {
      get: () => variables,
      byId: (id: number) => getVariable(id),
      setValue: (id: number, value: string) => {
        const variable = getVariable(id);

        if (variable) {
          variable.value = value;
          console.log(`setting ${id} value to ${value}`);
        }
      },
    },
  };

  arena.expose({
    studio: studio,
  });

  let action = wrapper("console.log(this)");

  ctx.evalCode(`action = ${action}`);

  window.evalCode = (code) => ctx.evalCode(code);

  window.executeAction = (trigger: unknown) => {
    ctx.evalCode(`action(${JSON.stringify(trigger)})`);
  };
})();

document.getElementById("btnClick")?.addEventListener("click", function () {
  // for (let i = 0; i < 1000; i++) {
  //   console.log(`iteration ${i}`);
    window.executeAction({
      type: "move",
      frameMoved: {
        name: "Rectangle 1",
        x: -142,
        y: 35,
        width: 189,
        height: 154,
      },
    });
  // }
});
