import { defineManifest } from "@eulerstream/overlay-sdk";

export default defineManifest({
  config: {
    timing: {
      label: "Timing",
      options: [
        {
          key: "fadeIn",
          type: "number",
          label: "Fade In (ms)",
          default: 500,
          min: 100,
          max: 2000,
        },
        {
          key: "fadeOut",
          type: "number",
          label: "Fade Out (ms)",
          default: 500,
          min: 100,
          max: 2000,
        },
        {
          key: "displayTime",
          type: "number",
          label: "Display Time (ms)",
          default: 3000,
          min: 1000,
          max: 10000,
        },
      ],
    },
    appearance: {
      label: "Appearance",
      options: [
        {
          key: "fontSize",
          type: "number",
          label: "Font Size",
          default: 48,
          min: 24,
          max: 96,
        },
        {
          key: "imageSize",
          type: "number",
          label: "Profile Image Size",
          default: 200,
          min: 100,
          max: 400,
        },
      ],
    },
  },
});
