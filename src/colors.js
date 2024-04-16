import chalk from "chalk";

const hexNotice = "#F7F05A";
const hexAttention = "#FC6C85";
const hexHighlight = "#6EFFBF";
const hexMuted = "#AAA";
const hexDefault = "#FFF";

const colourNotice = (text) => chalk.hex(hexNotice).bold(text);
const colourAttention = (text) => chalk.hex(hexAttention).bold(text);
const colourHighlight = (text) => chalk.hex(hexHighlight).bold(text);
const colourMuted = (text) => chalk.hex(hexMuted)(text);
const colourDefault = (text) => chalk.hex(hexDefault)(text);

export {
  colourNotice,
  colourAttention,
  colourHighlight,
  colourMuted,
  colourDefault,
  hexNotice,
  hexAttention,
  hexHighlight,
  hexMuted,
  hexDefault,
};
