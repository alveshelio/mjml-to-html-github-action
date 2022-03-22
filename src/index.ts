import { getInput } from "@actions/core";

const input = getInput("input", { required: true });
const output = getInput("output", { required: true });

console.log(`Input, ${input}!`);
console.log(`Output, ${output}!`);
